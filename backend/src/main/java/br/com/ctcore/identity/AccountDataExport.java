package br.com.ctcore.identity;

import br.com.ctcore.audit.AuditActor;
import br.com.ctcore.audit.AuditEntry;
import br.com.ctcore.storage.FileStorage;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * RF-LGP-01 (issue 764): "Baixar meus dados" of the session's own account, from every organization of it. Every query lists
 * its columns and filters by the account: {@code account}, {@code account_session} and {@code login_attempt} have no
 * row-level security, so the filter is the barrier. No hash, secret, token, code, signed URL or full IP, and no student data.
 */
@Service
public class AccountDataExport {
    public record Photo(String contentType, String base64) {}
    public record Account(String name, String email, String phone, Photo photo) {}
    public record Link(String organization, String role, String status, LocalDate startsOn, LocalDate endsOn, List<String> units) {}
    public record TermAcceptance(String organization, String kind, String event, int version, OffsetDateTime at) {}
    public record ModalityConfirmation(String organization, OffsetDateTime at) {}
    public record EmailPreference(String organization, String role, boolean announcements) {}
    public record TeacherDirectory(String organization, boolean consent, boolean declaredByManagement) {}
    public record Consents(List<TermAcceptance> termAcceptances, List<ModalityConfirmation> modalityConfirmations,
            List<EmailPreference> emailPreferences, List<TeacherDirectory> teacherDirectory) {}
    public record Attempt(OffsetDateTime at, String result, String ip) {}
    public record Session(String device, OffsetDateTime createdAt, OffsetDateTime lastUsedAt, OffsetDateTime endedAt, String ip) {}
    public record Access(List<Attempt> attempts, List<Session> sessions) {}
    public record File(OffsetDateTime generatedAt, Account account, List<Link> links, Consents consents, Access access) {}

    private record Row(String name, String email, String phone, String photo, OffsetDateTime createdAt) {}
    private record Data(Row account, List<Link> links, Consents consents, Access access) {}

    private static final Pattern IPV4 = Pattern.compile("((25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1?\\d?\\d)");
    // Only text that can be an IPv6 literal reaches InetAddress, so nothing is ever looked up in DNS.
    private static final Pattern IPV6 = Pattern.compile("(?=[^:]*:)[0-9a-fA-F:][0-9a-fA-F:.]*");

    private final JdbcClient jdbc;
    private final AccountTransactions accountTx;
    private final AccountProfile profile;
    private final ScopedAudit audit;
    private final FileStorage storage;
    private final Clock clock;

    public AccountDataExport(@Lazy JdbcClient jdbc, @Lazy AccountTransactions accountTx, AccountProfile profile,
            ScopedAudit audit, FileStorage storage, Clock clock) {
        this.jdbc = jdbc;
        this.accountTx = accountTx;
        this.profile = profile;
        this.audit = audit;
        this.storage = storage;
        this.clock = clock;
    }

    public File export(AccountPrincipal who, String ip) {
        profile.requireAccess(who);
        UUID id = who.accountId();
        Data data = accountTx.forAccount(id, () -> {
            Row account = jdbc.sql("select name, email, phone, photo, created_at from account where id = :a").param("a", id)
                    .query((rs, n) -> new Row(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), time(rs, 5)))
                    .single();
            return new Data(account, links(id), consents(id), new Access(attempts(id, account), sessions(id)));
        });
        // The storage is read outside the transaction; a failure other than "not found" fails the whole download.
        Row a = data.account();
        File file = new File(OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC),
                new Account(a.name(), a.email(), a.phone(), photo(id, a.photo())), data.links(), data.consents(), data.access());
        // D8: only the active organization, and never the content of the file.
        audit.record(who.organizationId(), new AuditEntry(new AuditActor(AuditActor.Type.ACCOUNT, id, who.role().name()),
                "account.data_downloaded", "account", id.toString(), null, null, null, null, ip));
        return file;
    }

    private List<Link> links(UUID account) {
        return jdbc.sql("select l.id, o.name, l.role, l.status, l.starts_on, l.ends_on from account_link l "
                + "join organization o on o.id = l.organization_id where l.account_id = :a order by o.name, l.role, l.id")
                .param("a", account)
                .query((rs, n) -> {
                    UUID link = rs.getObject(1, UUID.class);
                    return new Link(rs.getString(2), rs.getString(3), rs.getString(4), rs.getObject(5, LocalDate.class),
                            rs.getObject(6, LocalDate.class), units(account, link));
                }).list();
    }

    private List<String> units(UUID account, UUID link) {
        return jdbc.sql("select u.name from account_link l join account_link_unit lu on lu.link_id = l.id "
                + "join unit u on u.id = lu.unit_id where l.id = :l and l.account_id = :a order by u.name, u.id")
                .param("l", link).param("a", account).query(String.class).list();
    }

    private Consents consents(UUID account) {
        return new Consents(
                jdbc.sql("select o.name, t.kind, t.event, t.version, t.accepted_at from term_acceptance t "
                        + "join organization o on o.id = t.organization_id where t.account_id = :a order by t.accepted_at, t.id")
                        .param("a", account).query((rs, n) -> new TermAcceptance(rs.getString(1), rs.getString(2),
                                rs.getString(3), rs.getInt(4), time(rs, 5))).list(),
                jdbc.sql("select o.name, m.confirmed_at from modality_confirmation m "
                        + "join organization o on o.id = m.organization_id where m.account_id = :a order by m.confirmed_at, m.id")
                        .param("a", account).query((rs, n) -> new ModalityConfirmation(rs.getString(1), time(rs, 2))).list(),
                jdbc.sql("select o.name, l.role, l.announcement_email from account_link l "
                        + "join organization o on o.id = l.organization_id "
                        + "where l.account_id = :a and l.role in ('STUDENT', 'GUARDIAN') order by o.name, l.role, l.id")
                        .param("a", account).query((rs, n) -> new EmailPreference(rs.getString(1), rs.getString(2),
                                rs.getBoolean(3))).list(),
                jdbc.sql("select o.name, t.directory_consent, t.consent_declared_by_management from teacher t "
                        + "join organization o on o.id = t.organization_id where t.account_id = :a order by o.name, t.id")
                        .param("a", account).query((rs, n) -> new TeacherDirectory(rs.getString(1), rs.getBoolean(2),
                                rs.getBoolean(3))).list());
    }

    /**
     * D7: {@code login_attempt} only keeps the e-mail, so the account sees the attempts of its current one, and only from the
     * moment it is its own: after the account exists and after the last confirmed change of e-mail.
     */
    private List<Attempt> attempts(UUID account, Row row) {
        OffsetDateTime changed = jdbc.sql("select max(used_at) from account_email_change where account_id = :a")
                .param("a", account).query((rs, n) -> time(rs, 1)).list().get(0);
        OffsetDateTime since = changed != null && changed.isAfter(row.createdAt()) ? changed : row.createdAt();
        return jdbc.sql("select occurred_at, result, ip from login_attempt where email = :e and occurred_at >= :since "
                + "order by occurred_at, id").param("e", LoginAttempts.normalize(row.email())).param("since", since)
                .query((rs, n) -> new Attempt(time(rs, 1), rs.getString(2), mask(rs.getString(3)))).list();
    }

    private List<Session> sessions(UUID account) {
        return jdbc.sql("select device, created_at, last_used_at, ended_at, ip from account_session "
                + "where account_id = :a order by created_at, id").param("a", account)
                .query((rs, n) -> new Session(DeviceLabel.of(rs.getString(1)), time(rs, 2), time(rs, 3), time(rs, 4),
                        mask(rs.getString(5)))).list();
    }

    private static OffsetDateTime time(ResultSet rs, int column) throws SQLException {
        return rs.getObject(column, OffsetDateTime.class);
    }

    private Photo photo(UUID account, String name) {
        if (name == null) {
            return null;
        }
        // The name is the one AccountProfile wrote: its extension is the type found in the content.
        String type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
        try {
            return new Photo(type, Base64.getEncoder().encodeToString(storage.getAccountFile(account, name)));
        } catch (FileStorage.NotFound e) {
            return null;
        }
    }

    /** RN-ACE-25: never the whole address. IPv4 loses the last number, IPv6 keeps the /48 prefix; anything else is null. */
    static String mask(String ip) {
        if (ip == null) {
            return null;
        }
        if (IPV4.matcher(ip).matches()) {
            return ip.substring(0, ip.lastIndexOf('.'));
        }
        String literal = ip.split("%", 2)[0]; // the zone names a network interface, never part of the address
        if (!IPV6.matcher(literal).matches()) {
            return null;
        }
        try {
            byte[] bytes = InetAddress.getByName(literal).getAddress();
            if (bytes.length == 4) { // IPv4 written as IPv6 (::ffff:a.b.c.d)
                return (bytes[0] & 0xFF) + "." + (bytes[1] & 0xFF) + "." + (bytes[2] & 0xFF);
            }
            ByteBuffer groups = ByteBuffer.wrap(bytes);
            return String.format("%x:%x:%x::/48", groups.getShort() & 0xFFFF, groups.getShort() & 0xFFFF,
                    groups.getShort() & 0xFFFF);
        } catch (UnknownHostException e) {
            return null;
        }
    }
}
