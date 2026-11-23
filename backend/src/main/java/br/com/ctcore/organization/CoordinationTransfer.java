package br.com.ctcore.organization;

import br.com.ctcore.api.error.ApiError;
import br.com.ctcore.api.error.ApiStatusException;
import br.com.ctcore.api.error.ApiValidationException;
import br.com.ctcore.api.error.ErrorCode;
import br.com.ctcore.audit.AuditActor;
import br.com.ctcore.audit.AuditEntry;
import br.com.ctcore.audit.AuditService;
import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.CriticalAction;
import br.com.ctcore.identity.CriticalActionGuard;
import br.com.ctcore.isolation.OrganizationTransactions;
import br.com.ctcore.mail.EmailService;
import br.com.ctcore.mail.EmailTemplate;
import br.com.ctcore.permission.Access;
import br.com.ctcore.permission.Permission;
import br.com.ctcore.permission.Permissions;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/** RF-ORG-06 (D1..D5): o Coordenador passa a coordenação a um Administrador ativo; tudo ou nada, e-mail só depois do commit. */
@Service
public class CoordinationTransfer {
    static final String WORD = "TRANSFERIR";

    private final JdbcClient jdbc;
    private final OrganizationTransactions transactions;
    private final Permissions permissions;
    private final CriticalActionGuard guard;
    private final AuditService audit;
    private final EmailService email;

    public CoordinationTransfer(@Lazy JdbcClient jdbc, @Lazy OrganizationTransactions transactions, Permissions permissions,
            CriticalActionGuard guard, AuditService audit, EmailService email) {
        this.jdbc = jdbc;
        this.transactions = transactions;
        this.permissions = permissions;
        this.guard = guard;
        this.audit = audit;
        this.email = email;
    }

    /** D3: a palavra, sem diferenciar maiúsculas nem espaços nas pontas. */
    static void requireConfirmation(String confirmation) {
        if (confirmation == null || !WORD.equals(confirmation.strip().toUpperCase(Locale.ROOT))) {
            throw new ApiValidationException("confirmation", "digite " + WORD);
        }
    }

    private record Target(UUID linkId, UUID accountId, String email) {}

    /** RN-ORG-06: sem unidades marcadas o antigo Coordenador sai da gestão; cada unidade marcada é uma vaga de Administrador. */
    public void transfer(AccountPrincipal who, String targetEmail, String confirmation, List<UUID> keepUnitIds, String reauthToken, String ip) {
        if (permissions.grant(who, Permission.ORGANIZATION_SETTINGS, null) != Access.FULL) throw new AccessDeniedException("Permission denied");
        requireConfirmation(confirmation);
        String wanted = targetEmail == null ? "" : targetEmail.strip().toLowerCase(Locale.ROOT);
        Set<UUID> keep = keepSet(keepUnitIds);
        Target target = transactions.execute(() -> {
            Target found = find(who, wanted);
            if (found != null) checkUnits(who, found, keep);
            return found;
        });
        if (target == null) throw new ApiValidationException("email", "informe um Administrador ativo da organização");
        guard.consume(who, CriticalAction.TRANSFER_COORDINATION, reauthToken);
        String organizationName = transactions.execute(() -> swap(who, target, keep, ip));
        email.send(target.email(), EmailTemplate.COORDINATION_TRANSFERRED, organizationName);
    }

    private static Set<UUID> keepSet(List<UUID> ids) {
        List<UUID> list = ids == null ? List.of() : ids;
        Set<UUID> keep = new LinkedHashSet<>(list);
        if (keep.size() != list.size() || keep.contains(null)) throw new ApiValidationException("keepUnitIds", "unidades repetidas ou inválidas");
        return keep;
    }

    /** R2 (só unidade ativa da organização) e R5/RN-ORG-07 (nenhuma unidade ativa fica sem Administrador ativo). */
    private void checkUnits(AccountPrincipal who, Target target, Set<UUID> keep) {
        UUID org = who.organizationId();
        if (!keep.isEmpty()) {
            int active = jdbc.sql("select count(*) from unit where organization_id = :org and active and id in (:u)")
                    .param("org", org).param("u", keep).query(Integer.class).single();
            if (active != keep.size()) throw new ApiValidationException("keepUnitIds", "informe unidades ativas da organização");
        }
        Set<UUID> left = new TreeSet<>(jdbc.sql("""
                select tu.unit_id from account_link_unit tu join unit u on u.id = tu.unit_id
                where tu.link_id = :t and u.organization_id = :org and u.active and not exists (
                    select 1 from account_link_unit lu join account_link l on l.id = lu.link_id
                    where lu.unit_id = tu.unit_id and l.organization_id = :org and l.role = 'ADMINISTRATOR' and l.status = 'ACTIVE'
                    and l.id <> :t and l.account_id <> :self)""")
                .param("t", target.linkId()).param("org", org).param("self", who.accountId()).query(UUID.class).list());
        left.removeAll(keep);
        if (!left.isEmpty()) {
            throw new ApiStatusException(ErrorCode.LAST_UNIT_ADMINISTRATOR,
                    List.of(new ApiError.Field("unitIds", String.join(",", left.stream().map(UUID::toString).toList()))));
        }
    }

    private Target find(AccountPrincipal who, String wanted) {
        List<Target> rows = jdbc.sql("""
                select l.id, a.id as account_id, a.email from account_link l join account a on a.id = l.account_id
                where l.organization_id = :org and l.role = 'ADMINISTRATOR' and l.status = 'ACTIVE' and a.status = 'ACTIVE'
                and lower(btrim(a.email)) = :email and a.id <> :self""")
                .param("org", who.organizationId()).param("email", wanted).param("self", who.accountId())
                .query((rs, n) -> new Target(rs.getObject("id", UUID.class), rs.getObject("account_id", UUID.class), rs.getString("email"))).list();
        return rows.isEmpty() ? null : rows.get(0);
    }

    private String swap(AccountPrincipal who, Target target, Set<UUID> keep, String ip) {
        UUID org = who.organizationId();
        String name = jdbc.sql("select name from organization where id = :org for update").param("org", org).query(String.class).single();
        UUID mine = jdbc.sql("select id from account_link where organization_id = :org and account_id = :self and role = 'COORDINATOR' and status = 'ACTIVE'")
                .param("org", org).param("self", who.accountId()).query(UUID.class).optional().orElseThrow(() -> new AccessDeniedException("Not the active coordinator"));
        checkUnits(who, target, keep);
        UUID demoted = keep.isEmpty() ? null : becomes(org, who.accountId(), mine, "ADMINISTRATOR");
        boolean targetStillAdministrator = jdbc.sql("select count(*) from account_link where id = :id and organization_id = :org and role = 'ADMINISTRATOR' and status = 'ACTIVE'")
                .param("id", target.linkId()).param("org", org).query(Integer.class).single() == 1;
        if (!targetStillAdministrator) throw new ApiValidationException("email", "informe um Administrador ativo da organização");
        if (keep.isEmpty()) endManagement(org, who.accountId());
        becomes(org, target.accountId(), target.linkId(), "COORDINATOR");
        for (UUID unit : keep) {
            jdbc.sql("insert into account_link_unit (link_id, organization_id, unit_id) values (:link, :org, :unit) on conflict do nothing")
                    .param("link", demoted).param("org", org).param("unit", unit).update();
        }
        audit.record(new AuditEntry(new AuditActor(AuditActor.Type.ACCOUNT, who.accountId(), who.role().name()),
                "organization.coordination_transferred", "organization", org.toString(), null,
                Map.of("coordinatorAccount", who.accountId().toString(), "administratorAccount", target.accountId().toString()),
                Map.of("coordinatorAccount", target.accountId().toString(), "administratorAccount", who.accountId().toString(),
                        "keptUnitIds", keep.stream().map(UUID::toString).sorted().toList(), "seats", keep.size()), null, ip));
        return name;
    }

    /** RN-ACE-20: encerra os vínculos de gestão da conta na organização e as sessões abertas neles (a de portal fica). */
    private void endManagement(UUID org, UUID account) {
        String links = "select id from account_link where organization_id = :org and account_id = :a and role in ('COORDINATOR', 'ADMINISTRATOR') and status = 'ACTIVE'";
        jdbc.sql("delete from account_session where active_link_id in (" + links + ")").param("org", org).param("a", account).update();
        jdbc.sql("delete from account_link_unit where link_id in (" + links + ")").param("org", org).param("a", account).update();
        jdbc.sql("update account_link set status = 'ENDED', ends_on = current_date where id in (" + links + ")").param("org", org).param("a", account).update();
    }

    /**
     * Passa o vínculo para o perfil de destino. Se a conta já tem uma linha desse perfil (unique conta, organização, perfil, mesmo encerrada),
     * reaproveita essa linha, encerra a antiga e leva as sessões; as unidades da antiga saem. Devolve o vínculo que vale agora.
     */
    private UUID becomes(UUID org, UUID account, UUID linkId, String role) {
        UUID existing = jdbc.sql("select id from account_link where organization_id = :org and account_id = :a and role = :role and id <> :id")
                .param("org", org).param("a", account).param("role", role).param("id", linkId).query(UUID.class).optional().orElse(null);
        if (existing == null) {
            jdbc.sql("update account_link set role = :role where id = :id").param("role", role).param("id", linkId).update();
            jdbc.sql("delete from account_link_unit where link_id = :id").param("id", linkId).update();
            return linkId;
        }
        jdbc.sql("update account_link set status = 'ENDED', ends_on = current_date where id = :id").param("id", linkId).update();
        jdbc.sql("update account_link set status = 'ACTIVE', ends_on = null where id = :id").param("id", existing).update();
        jdbc.sql("delete from account_link_unit where link_id in (:old, :new)").param("old", linkId).param("new", existing).update();
        jdbc.sql("update account_session set active_link_id = :new where active_link_id = :old").param("old", linkId).param("new", existing).update();
        return existing;
    }
}
