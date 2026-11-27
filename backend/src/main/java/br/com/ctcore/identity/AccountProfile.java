package br.com.ctcore.identity;

import br.com.ctcore.api.error.ApiError;
import br.com.ctcore.api.error.ApiStatusException;
import br.com.ctcore.api.error.ApiValidationException;
import br.com.ctcore.api.error.ErrorCode;
import br.com.ctcore.audit.AuditActor;
import br.com.ctcore.audit.AuditEntry;
import br.com.ctcore.audit.AuditService;
import br.com.ctcore.isolation.OrganizationContext;
import br.com.ctcore.isolation.OrganizationTransactions;
import br.com.ctcore.organization.LogoImage;
import br.com.ctcore.organization.NewUnit;
import br.com.ctcore.storage.FileStorage;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * RF-ACE-04: name, phone and photo of the session's own account, only with an active management link. {@code account} has
 * no row-level security: the barrier is the filter by the account of the session. The audit goes to the active organization,
 * the only one the request may write (RN-ORG-01).
 */
@Service
public class AccountProfile {
    private static final Logger LOG = LoggerFactory.getLogger(AccountProfile.class);
    private static final int MAX_NAME = 120;

    private record Current(String name, String phone, String photo) {}

    private final JdbcClient jdbc;
    private final OrganizationTransactions transactions;
    private final AuditService audit;
    private final FileStorage storage;

    public AccountProfile(@Lazy JdbcClient jdbc, @Lazy OrganizationTransactions transactions, AuditService audit,
            FileStorage storage) {
        this.jdbc = jdbc;
        this.transactions = transactions;
        this.audit = audit;
        this.storage = storage;
    }

    public void requireAccess(AccountPrincipal who) {
        if (who == null || who.role() == null || !who.role().management()) {
            throw new AccessDeniedException("Management link required");
        }
    }

    private static ApiStatusException unprocessable(String field, String message) {
        return new ApiStatusException(ErrorCode.UNPROCESSABLE, List.of(new ApiError.Field(field, message)));
    }

    public void update(AccountPrincipal who, String name, String phone, String ip) {
        requireAccess(who);
        String clean = name == null ? "" : name.strip();
        if (clean.isEmpty() || clean.codePointCount(0, clean.length()) > MAX_NAME) {
            throw unprocessable("name", "de 1 a " + MAX_NAME + " caracteres");
        }
        String digits;
        try {
            digits = NewUnit.phone("phone", phone);
        } catch (ApiValidationException e) {
            throw new ApiStatusException(ErrorCode.UNPROCESSABLE, e.fields);
        }
        inScope(who, () -> {
            Current old = lock(who);
            boolean samePhone = Objects.equals(old.phone(), digits);
            if (samePhone && Objects.equals(old.name(), clean)) return null;
            jdbc.sql("update account set name = :name, phone = :phone where id = :a").param("name", clean).param("phone", digits)
                    .param("a", who.accountId()).update();
            Map<String, Object> before = new LinkedHashMap<>(), after = new LinkedHashMap<>();
            before.put("name", old.name());
            after.put("name", clean);
            if (!samePhone) after.put("phone", "alterado");
            record(who, "account.profile_updated", before, after, ip);
            return null;
        });
    }

    public void replacePhoto(AccountPrincipal who, byte[] content, String ip) {
        requireAccess(who);
        LogoImage image;
        try {
            image = LogoImage.parse(content);
        } catch (IllegalArgumentException e) {
            throw unprocessable("file", e.getMessage());
        }
        String name = "photo-" + UUID.randomUUID() + "." + image.extension();
        storage.putAccountFile(who.accountId(), name, image.bytes(), image.contentType());
        String previous;
        try {
            previous = inScope(who, () -> setPhoto(who, name, ip));
        } catch (RuntimeException e) {
            discard(who.accountId(), name);
            throw e;
        }
        if (previous != null) discard(who.accountId(), previous);
    }

    public void removePhoto(AccountPrincipal who, String ip) {
        requireAccess(who);
        String previous = inScope(who, () -> setPhoto(who, null, ip));
        if (previous != null) discard(who.accountId(), previous);
    }

    /** Inside the transaction: changes the column and audits; returns the previous file. */
    private String setPhoto(AccountPrincipal who, String name, String ip) {
        String previous = lock(who).photo();
        if (Objects.equals(previous, name)) return null;
        jdbc.sql("update account set photo = :photo where id = :a").param("photo", name).param("a", who.accountId()).update();
        Map<String, Object> before = new LinkedHashMap<>(), after = new LinkedHashMap<>();
        before.put("photo", previous == null ? null : "informada");
        after.put("photo", name == null ? null : "informada");
        record(who, name == null ? "account.photo_removed" : "account.photo_updated", before, after, ip);
        return previous;
    }

    private Current lock(AccountPrincipal who) {
        return jdbc.sql("select name, phone, photo from account where id = :a for update").param("a", who.accountId())
                .query((rs, n) -> new Current(rs.getString(1), rs.getString(2), rs.getString(3))).single();
    }

    private void record(AccountPrincipal who, String action, Map<String, Object> before, Map<String, Object> after, String ip) {
        audit.record(new AuditEntry(new AuditActor(AuditActor.Type.ACCOUNT, who.accountId(), who.role().name()), action, "account",
                who.accountId().toString(), null, before, after, null, ip));
    }

    /** The /auth routes do not open the organization scope; this opens the one of the active link. */
    private <T> T inScope(AccountPrincipal who, Supplier<T> work) {
        try (var ignored = OrganizationContext.open(who)) {
            return transactions.execute(work);
        }
    }

    // Old file (or the new one, if the transaction failed): failing to delete goes to the log and does not undo the change.
    private void discard(UUID accountId, String name) {
        try {
            storage.deleteAccountFile(accountId, name);
        } catch (RuntimeException e) {
            LOG.warn("Could not delete account file {}: {}", name, e.getClass().getSimpleName());
        }
    }
}
