package br.com.ctcore.organization;

import br.com.ctcore.api.error.ApiStatusException;
import br.com.ctcore.api.error.ApiValidationException;
import br.com.ctcore.api.error.ErrorCode;
import br.com.ctcore.audit.AuditActor;
import br.com.ctcore.audit.AuditEntry;
import br.com.ctcore.audit.AuditService;
import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.TwoFactorService;
import br.com.ctcore.isolation.OrganizationTransactions;
import br.com.ctcore.permission.Access;
import br.com.ctcore.permission.Permission;
import br.com.ctcore.permission.Permissions;
import br.com.ctcore.storage.FileStorage;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/** RF-ORG-01: dados da organização do vínculo ativo. Leitura para Coordenador e Administrador; escrita só para o Coordenador (FULL). */
@Service
public class OrganizationProfile {
    private static final Logger LOG = LoggerFactory.getLogger(OrganizationProfile.class);
    static final int MAX_NAME = 120;
    static final int MAX_HOLDER_NAME = 160; // RN-MAT-21: o mesmo limite do check da V64

    /** Resposta de GET e das escritas; {@code logoUrl} é a URL temporária assinada, nunca o caminho no armazenamento. */
    public record OrganizationView(String name, String holderDocument, String holderName, String logoUrl, int version, LastChange lastChange,
            OrganizationRules rules, Coordinator coordinator) {}

    /** Coordenador ativo da organização (dado de conta visível à gestão); nulo se não houver vínculo ativo. */
    public record Coordinator(String name, String email, boolean twoFactorEnabled) {}

    public record Brand(String name, String logoUrl) {}

    private record Row(String name, String holder, String holderName, String logo, int version) {}

    private record CoordinatorRow(UUID accountId, String name, String email) {}

    private record Loaded(Row row, LastChange last, OrganizationRules rules, CoordinatorRow coordinator) {}

    private final JdbcClient jdbc;
    private final OrganizationTransactions transactions;
    private final Permissions permissions;
    private final AuditService audit;
    private final FileStorage storage;
    private final TwoFactorService twoFactor;

    public OrganizationProfile(@Lazy JdbcClient jdbc, @Lazy OrganizationTransactions transactions, Permissions permissions,
            AuditService audit, FileStorage storage, TwoFactorService twoFactor) {
        this.jdbc = jdbc;
        this.transactions = transactions;
        this.permissions = permissions;
        this.audit = audit;
        this.storage = storage;
        this.twoFactor = twoFactor;
    }

    public OrganizationView read(AccountPrincipal who) {
        if (permissions.grant(who, Permission.ORGANIZATION_SETTINGS, null) == Access.NONE) throw new AccessDeniedException("Permission denied");
        return view(transactions.execute(() -> loaded(row(who.organizationId()), who)));
    }

    /** RF-POR-01: só a marca (nome e logo) da organização do vínculo, sem exigir permissão de gestão; quem chama confere o perfil de portal antes. */
    public Brand brand(AccountPrincipal who) {
        return transactions.execute(() -> {
            Row row = row(who.organizationId());
            return new Brand(row.name(), logoUrl(row));
        });
    }

    public OrganizationView update(AccountPrincipal who, String ifMatch, String name, String holderDocument, String holderName,
            OrganizationRules.Request rulesRequest, String ip) {
        requireWrite(who);
        int expectedVersion = IfMatch.version(ifMatch);
        String newName = name == null ? "" : name.trim();
        if (newName.isEmpty()) throw new ApiValidationException("name", "obrigatório");
        if (newName.length() > MAX_NAME) throw new ApiValidationException("name", "no máximo 120 caracteres");
        String newHolder = field("holderDocument", () -> HolderDocument.normalize(holderDocument));
        String newHolderName = NewUnit.limited("holderName", holderName, MAX_HOLDER_NAME);
        OrganizationRules newRules = rulesRequest == null ? null : OrganizationRules.validate(rulesRequest);
        Loaded after = transactions.execute(() -> {
            Row before = lockedRow(who.organizationId());
            if (before.version() != expectedVersion) throw new ApiStatusException(ErrorCode.EDIT_CONFLICT);
            OrganizationRules oldRules = rules(who.organizationId());
            OrganizationRules nextRules = newRules == null ? oldRules : newRules;
            boolean rulesChanged = !nextRules.equals(oldRules);
            Row next = new Row(newName, newHolder, newHolderName, before.logo(), before.version());
            if (!next.equals(before) || rulesChanged) {
                next = new Row(newName, newHolder, newHolderName, before.logo(), before.version() + 1);
                jdbc.sql("update organization set name = :name, holder_document = :holder, holder_name = :holderName, version = version + 1 where id = :id")
                        .param("name", newName).param("holder", newHolder).param("holderName", newHolderName)
                        .param("id", who.organizationId()).update();
                Map<String, Object> oldAudit = auditValues(before);
                Map<String, Object> newAudit = auditValues(next);
                if (rulesChanged) {
                    jdbc.sql("update organization_settings set deactivation_days = :d, former_student_retention_months = :f, "
                            + "trial_retention_months = :t, cross_unit_training = :c where organization_id = :id")
                            .param("d", nextRules.deactivationDays()).param("f", nextRules.formerStudentRetentionMonths())
                            .param("t", nextRules.trialRetentionMonths())
                            .param("c", nextRules.crossUnitTraining()).param("id", who.organizationId()).update();
                    oldAudit.put("rules", oldRules.auditValues());
                    newAudit.put("rules", nextRules.auditValues());
                }
                audit.record(entry(who, "organization.update", ip, oldAudit, newAudit));
            }
            return loaded(next, who);
        });
        return view(after);
    }

    public OrganizationView replaceLogo(AccountPrincipal who, byte[] content, String ip) {
        requireWrite(who);
        LogoImage image = field("file", () -> LogoImage.parse(content));
        String name = "logo-" + UUID.randomUUID() + "." + image.extension();
        storage.put(name, image.bytes(), image.contentType());
        Row before;
        try {
            before = transactions.execute(() -> setLogo(who, name, ip));
        } catch (RuntimeException e) {
            discard(name);
            throw e;
        }
        if (before.logo() != null) discard(before.logo());
        return read(who);
    }

    public OrganizationView removeLogo(AccountPrincipal who, String ip) {
        requireWrite(who);
        Row before = transactions.execute(() -> setLogo(who, null, ip));
        if (before.logo() != null) discard(before.logo());
        return read(who);
    }

    /** Dentro da transação: troca a coluna e audita; devolve a linha anterior. */
    private Row setLogo(AccountPrincipal who, String name, String ip) {
        Row before = row(who.organizationId());
        if (java.util.Objects.equals(before.logo(), name)) return before;
        jdbc.sql("update organization set logo_url = :logo where id = :id").param("logo", name).param("id", who.organizationId()).update();
        Map<String, Object> old = new LinkedHashMap<>();
        old.put("logo", before.logo());
        Map<String, Object> next = new LinkedHashMap<>();
        next.put("logo", name);
        audit.record(entry(who, name == null ? "organization.logo.remove" : "organization.logo.update", ip, old, next));
        return before;
    }

    // Arquivo antigo (ou novo, se a transação falhou): falha ao apagar vai para o log e não desfaz a troca.
    private void discard(String name) {
        try {
            storage.delete(name);
        } catch (RuntimeException e) {
            LOG.warn("Could not delete organization file {}: {}", name, e.getClass().getSimpleName());
        }
    }

    private void requireWrite(AccountPrincipal who) {
        if (permissions.grant(who, Permission.ORGANIZATION_SETTINGS, null) != Access.FULL) throw new AccessDeniedException("Permission denied");
    }

    private Row row(UUID organizationId) {
        return row(organizationId, "");
    }

    // RNF-15: trava a linha até o fim da transação, para a checagem de versão e a gravação serem atômicas.
    private Row lockedRow(UUID organizationId) {
        return row(organizationId, " for update");
    }

    private Row row(UUID organizationId, String lock) {
        return jdbc.sql("select name, holder_document, holder_name, logo_url, version from organization where id = :id" + lock).param("id", organizationId)
                .query((rs, i) -> new Row(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getInt(5))).single();
    }

    private Loaded loaded(Row row, AccountPrincipal who) {
        return new Loaded(row, LastChange.find(jdbc, who.organizationId(), "organization", who.organizationId(), LastChange.ORGANIZATION_ACTIONS),
                rules(who.organizationId()), coordinator(who.organizationId()));
    }

    private OrganizationRules rules(UUID organizationId) {
        return jdbc.sql("select deactivation_days, former_student_retention_months, trial_retention_months, cross_unit_training "
                + "from organization_settings where organization_id = :id").param("id", organizationId)
                .query((rs, i) -> new OrganizationRules(rs.getInt(1), rs.getInt(2), rs.getInt(3), rs.getString(4))).single();
    }

    private CoordinatorRow coordinator(UUID organizationId) {
        return jdbc.sql("select a.id, a.name, a.email "
                + "from account_link l join account a on a.id = l.account_id "
                + "where l.organization_id = :id and l.role = 'COORDINATOR' and l.status = 'ACTIVE' limit 1").param("id", organizationId)
                .query((rs, i) -> new CoordinatorRow(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3))).optional().orElse(null);
    }

    private OrganizationView view(Loaded loaded) {
        Row row = loaded.row();
        return new OrganizationView(row.name(), row.holder(), row.holderName(), logoUrl(row), row.version(), loaded.last(), loaded.rules(), coordinator(loaded.coordinator()));
    }

    // Duas etapas ficam sob o escopo da conta (RLS), fora da transação da organização.
    private Coordinator coordinator(CoordinatorRow c) {
        return c == null ? null : new Coordinator(c.name(), c.email(), twoFactor.enabled(c.accountId()));
    }

    private String logoUrl(Row row) {
        if (row.logo() == null) return null;
        try {
            return storage.readUrl(row.logo());
        } catch (FileStorage.NotFound e) {
            LOG.warn("Organization logo file is missing from storage");
            return null;
        }
    }

    private static <T> T field(String field, Supplier<T> parse) {
        try {
            return parse.get();
        } catch (IllegalArgumentException e) {
            throw new ApiValidationException(field, e.getMessage());
        }
    }

    // O documento do titular entra na auditoria mascarado (só os dois últimos dígitos); o nome do titular, com o valor (RN-MAT-21).
    private static Map<String, Object> auditValues(Row r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", r.name());
        m.put("holderName", r.holderName());
        m.put("holderDocument", r.holder() == null ? null : "*".repeat(r.holder().length() - 2) + r.holder().substring(r.holder().length() - 2));
        return m;
    }

    private static AuditEntry entry(AccountPrincipal who, String action, String ip, Map<String, Object> before, Map<String, Object> after) {
        return new AuditEntry(new AuditActor(AuditActor.Type.ACCOUNT, who.accountId(), who.role().name()), action, "organization",
                who.organizationId().toString(), null, before, after, null, ip);
    }
}
