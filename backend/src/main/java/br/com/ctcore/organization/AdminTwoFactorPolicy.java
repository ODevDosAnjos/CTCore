package br.com.ctcore.organization;

import br.com.ctcore.audit.AuditActor;
import br.com.ctcore.audit.AuditEntry;
import br.com.ctcore.audit.AuditService;
import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.SessionService;
import br.com.ctcore.identity.TwoFactorService;
import br.com.ctcore.isolation.OrganizationTransactions;
import br.com.ctcore.permission.Permission;
import br.com.ctcore.permission.Permissions;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** RN-ACE-24: o Coordenador exige duas etapas dos Administradores. Quem aplica a exigência é {@code TwoFactorService.requiredFor}. */
@Service
public class AdminTwoFactorPolicy {
    private static final String ACTION = "organization.admin_two_factor.update";

    public record View(boolean required, LastChange lastChange) {}

    private record Saved(View view, List<UUID> administrators) {}

    private final JdbcClient jdbc;
    private final OrganizationTransactions transactions;
    private final Permissions permissions;
    private final AuditService audit;
    private final TwoFactorService twoFactor;
    private final SessionService sessions;

    public AdminTwoFactorPolicy(@Lazy JdbcClient jdbc, @Lazy OrganizationTransactions transactions, Permissions permissions,
            AuditService audit, TwoFactorService twoFactor, SessionService sessions) {
        this.jdbc = jdbc;
        this.transactions = transactions;
        this.permissions = permissions;
        this.audit = audit;
        this.twoFactor = twoFactor;
        this.sessions = sessions;
    }

    public View read(AccountPrincipal who) {
        permissions.require(who, Permission.REQUIRE_ADMIN_TWO_FACTOR, null);
        return transactions.execute(() -> view(who.organizationId()));
    }

    /** Gravar o valor que já está não audita nem encerra sessão. */
    public View update(AccountPrincipal who, boolean required, String ip) {
        permissions.require(who, Permission.REQUIRE_ADMIN_TWO_FACTOR, null);
        UUID org = who.organizationId();
        Saved saved = transactions.execute(() -> {
            int changed = jdbc.sql("update organization_settings set require_admin_two_factor = :v "
                    + "where organization_id = :org and require_admin_two_factor <> :v").param("v", required).param("org", org).update();
            List<UUID> administrators = List.of();
            if (changed == 1) {
                audit.record(new AuditEntry(new AuditActor(AuditActor.Type.ACCOUNT, who.accountId(), who.role().name()), ACTION,
                        "organization", org.toString(), null, Map.of("required", !required), Map.of("required", required), null, ip));
                if (required) {
                    administrators = jdbc.sql("select distinct account_id from account_link "
                            + "where organization_id = :org and role = 'ADMINISTRATOR' and status = 'ACTIVE'")
                            .param("org", org).query(UUID.class).list();
                }
            }
            return new Saved(view(org), administrators);
        });
        // D1: fora da transação da organização, porque as duas etapas ficam no escopo da conta. Se falhar no meio,
        // o TwoFactorGateFilter continua barrando a sessão que sobrou.
        for (UUID account : saved.administrators()) {
            if (!twoFactor.enabled(account)) {
                sessions.endAll(account, null);
            }
        }
        return saved.view();
    }

    private View view(UUID org) {
        boolean required = jdbc.sql("select require_admin_two_factor from organization_settings where organization_id = :org")
                .param("org", org).query(Boolean.class).single();
        return new View(required, LastChange.find(jdbc, org, "organization", org, List.of(ACTION)));
    }
}
