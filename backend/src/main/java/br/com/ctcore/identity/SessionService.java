package br.com.ctcore.identity;

import br.com.ctcore.identity.IdentityException.Code;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import br.com.ctcore.audit.AuditActor;
import br.com.ctcore.storage.FileStorage;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** RN-ACE-19 and RN-ACE-20: server-side sessions. Only the SHA-256 of the cookie value is stored. */
@Service
public class SessionService {
    static final Duration PORTAL_IDLE = Duration.ofDays(30);
    static final Duration MANAGEMENT_IDLE = Duration.ofHours(12);
    static final Duration WRITE_EVERY = Duration.ofMinutes(1);

    public record Created(UUID accountId, String token, UUID activeLinkId) {}
    public record AccountView(UUID id, String email, String name, OffsetDateTime passwordChangedAt, String phone, String photoUrl) {}
    public record LinkView(UUID id, UUID organizationId, String organizationName, String role, Set<UUID> unitIds,
            List<String> unitNames, OffsetDateTime lastAccessAt, LocalDate startsOn, List<String> studentNames) {}
    public record TwoFactorView(boolean enabled, boolean required, OffsetDateTime enabledAt) {}
    public record SessionView(AccountView account, List<LinkView> links, UUID activeLinkId, TwoFactorView twoFactor) {}

    record Link(UUID id, UUID organizationId, Role role) {}

    private record Row(UUID id, UUID accountId, UUID activeLinkId, OffsetDateTime lastUsedAt, OffsetDateTime expiresAt, String status,
            String endedReason) {}

    /** Request attribute set when the cookie belongs to a session ended by another device (401 SESSION_REPLACED). */
    public static final String REPLACED_ATTRIBUTE = SessionService.class.getName() + ".replaced";

    private final JdbcClient jdbc;
    private final AccountTransactions accountTx;
    private final Clock clock;
    private final NewAccessNotifier newAccess;
    private final TwoFactorService twoFactor;
    private final IpLocator locator;
    private final AccountAudit audit;
    private final FileStorage storage;

    public SessionService(@Lazy JdbcClient jdbc, @Lazy AccountTransactions accountTx, Clock clock, NewAccessNotifier newAccess,
            IpLocator locator, AccountAudit audit,
            TwoFactorService twoFactor, FileStorage storage) {
        this.storage = storage;
        this.twoFactor = twoFactor;
        this.locator = locator;
        this.audit = audit;
        this.newAccess = newAccess;
        this.jdbc = jdbc;
        this.accountTx = accountTx;
        this.clock = clock;
    }

    private OffsetDateTime now() {
        return OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
    }

    private List<Link> activeLinks(UUID accountId) {
        return jdbc.sql("select id, organization_id, role from account_link where account_id = :a and status = 'ACTIVE' order by id")
                .param("a", accountId)
                .query((rs, n) -> new Link(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), Role.valueOf(rs.getString(3))))
                .list();
    }

    /** D3: 30 days idle only when every active link is portal (Student/Guardian); any management link means 12 hours. */
    static Duration idle(List<Link> links) {
        return !links.isEmpty() && links.stream().noneMatch(l -> l.role().management()) ? PORTAL_IDLE : MANAGEMENT_IDLE;
    }

    /** Starts a session; a single active link becomes the active one (RN-ACE-03), several leave it empty. */
    public Created create(UUID accountId, String ip, String device) {
        int[] replaced = {0};
        Created created = accountTx.forAccount(accountId, () -> {
            List<Link> links = activeLinks(accountId);
            String token = Codes.random();
            UUID active = links.size() == 1 ? links.get(0).id() : null;
            Role activeRole = links.size() == 1 ? links.get(0).role() : null;
            OffsetDateTime now = now();
            UUID sessionId = jdbc.sql("insert into account_session (account_id, token_hash, active_link_id, device, ip, created_at, last_used_at, expires_at, area) "
                    + "values (:a, :h, :l, :d, :ip, :now, :now, :exp, :area) returning id")
                    .param("a", accountId).param("h", Codes.hash(token)).param("l", active).param("d", device)
                    .param("ip", ip).param("now", now).param("exp", now.plus(idle(links))).param("area", areaOf(activeRole))
                    .query(UUID.class).single();
            replaced[0] = activeRole != null && activeRole.management() ? replaceManagement(accountId, sessionId, now) : 0;
            jdbc.sql("update account set last_access_at = :now where id = :a").param("now", now).param("a", accountId).update();
            return new Created(accountId, token, active);
        });
        auditReplaced(accountId, replaced[0], ip);
        newAccess.loggedIn(accountId, ip, device);
        return created;
    }

    private static String areaOf(Role role) {
        return role == null ? null : role.management() ? "MANAGEMENT" : "PORTAL";
    }

    /** RN-ACE-23 (D1): ends, on the spot, the other management sessions of the account; portal and undecided ones stay. */
    private int replaceManagement(UUID accountId, UUID keepSessionId, OffsetDateTime now) {
        return jdbc.sql("update account_session set ended_at = :now, ended_reason = 'REPLACED' "
                + "where account_id = :a and id <> :k and area = 'MANAGEMENT' and ended_at is null")
                .param("now", now).param("a", accountId).param("k", keepSessionId).update();
    }

    private void auditReplaced(UUID accountId, int replaced, String ip) {
        for (int i = 0; i < replaced; i++) {
            audit.record(accountId, new AuditActor(AuditActor.Type.ACCOUNT, accountId, null), ip, "account.session_replaced");
        }
    }

    /** The principal of a valid session, renewing it (write at most once a minute); empty when unknown, expired or inactive. */
    public Optional<AccountPrincipal> authenticate(String token) {
        return authenticate(token, null);
    }

    /** Same, flagging {@code request} when the session was ended by another device, so the 401 can say so. */
    public Optional<AccountPrincipal> authenticate(String token, jakarta.servlet.http.HttpServletRequest request) {
        Row s = jdbc.sql("select s.id, s.account_id, s.active_link_id, s.last_used_at, s.expires_at, a.status, s.ended_reason "
                + "from account_session s join account a on a.id = s.account_id where s.token_hash = :h")
                .param("h", Codes.hash(token))
                .query((rs, n) -> new Row(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getObject(3, UUID.class),
                        rs.getObject(4, OffsetDateTime.class), rs.getObject(5, OffsetDateTime.class), rs.getString(6), rs.getString(7)))
                .optional().orElse(null);
        if (s == null) {
            return Optional.empty();
        }
        if (s.endedReason() != null) {
            if (request != null) {
                request.setAttribute(REPLACED_ATTRIBUTE, true);
            }
            return Optional.empty();
        }
        OffsetDateTime now = now();
        if (!s.expiresAt().isAfter(now) || !s.status().equals("ACTIVE")) {
            jdbc.sql("delete from account_session where id = :id").param("id", s.id()).update();
            return Optional.empty();
        }
        return Optional.of(accountTx.forAccount(s.accountId(), () -> {
            List<Link> links = activeLinks(s.accountId());
            if (!s.lastUsedAt().plus(WRITE_EVERY).isAfter(now)) {
                jdbc.sql("update account_session set last_used_at = :now, expires_at = :exp where id = :id")
                        .param("now", now).param("exp", now.plus(idle(links))).param("id", s.id()).update();
            }
            Link active = links.stream().filter(l -> l.id().equals(s.activeLinkId())).findFirst().orElse(null);
            Set<UUID> units = active == null ? Set.of() : unitsOf(active.id());
            return new AccountPrincipal(s.accountId(), s.id(), active == null ? null : active.id(),
                    active == null ? null : active.organizationId(), active == null ? null : active.role(), units);
        }));
    }

    private Set<UUID> unitsOf(UUID linkId) {
        return new HashSet<>(jdbc.sql("select unit_id from account_link_unit where link_id = :l").param("l", linkId)
                .query(UUID.class).list());
    }

    private List<String> unitNames(UUID linkId) {
        return jdbc.sql("select u.name from account_link_unit lu join unit u on u.id = lu.unit_id where lu.link_id = :l order by u.name")
                .param("l", linkId).query(String.class).list();
    }

    private OffsetDateTime lastAccessAt(UUID linkId) {
        return jdbc.sql("select last_access_at from account_link where id = :l").param("l", linkId)
                .query(OffsetDateTime.class).optional().orElse(null);
    }

    private LocalDate startsOn(UUID linkId) {
        return jdbc.sql("select starts_on from account_link where id = :l").param("l", linkId)
                .query(LocalDate.class).optional().orElse(null);
    }

    /** RF-ACE-05: only the names of the students this account is guardian of, through its own link (RLS of V61). */
    private List<String> studentNames(UUID accountId, UUID linkId) {
        return jdbc.sql("select s.name from account_link l "
                + "join guardian g on g.organization_id = l.organization_id and g.account_id = l.account_id "
                + "join student_guardian sg on sg.organization_id = g.organization_id and sg.guardian_id = g.id "
                + "join student s on s.organization_id = sg.organization_id and s.id = sg.student_id "
                + "where l.id = :l and l.account_id = :a order by s.name_key, s.id")
                .param("l", linkId).param("a", accountId).query(String.class).list();
    }

    private String organizationName(UUID organizationId) {
        return jdbc.sql("select name from organization where id = :o").param("o", organizationId).query(String.class).single();
    }

    /** Account, active links and the active one, for the front to decide where to go (RN-ACE-16). */
    public SessionView view(UUID accountId, UUID activeLinkId) {
        return accountTx.forAccount(accountId, () -> {
            AccountView account = jdbc.sql("select id, email, name, password_changed_at, phone, photo from account where id = :a").param("a", accountId)
                    .query((rs, n) -> {
                        String photo = rs.getString(6);
                        return new AccountView(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3), rs.getObject(4, OffsetDateTime.class),
                                rs.getString(5), photo == null ? null : storage.accountFileUrl(accountId, photo));
                    }).single();
            OffsetDateTime enabledAt = twoFactor.enabledAt(accountId);
            List<LinkView> links = activeLinks(accountId).stream()
                    .map(l -> new LinkView(l.id(), l.organizationId(), organizationName(l.organizationId()), l.role().name(), unitsOf(l.id()),
                            unitNames(l.id()), lastAccessAt(l.id()), startsOn(l.id()),
                            l.role() == Role.GUARDIAN ? studentNames(accountId, l.id()) : List.of())).toList();
            return new SessionView(account, links, activeLinkId,
                    new TwoFactorView(enabledAt != null, twoFactor.requiredFor(accountId), enabledAt));
        });
    }

    /** PUT /session/link: only an active link of the same account; anything else is a 404 and nothing changes. */
    public void selectLink(UUID accountId, UUID sessionId, UUID linkId, String ip) {
        int replaced = accountTx.forAccount(accountId, () -> {
            Role role = activeLinks(accountId).stream().filter(l -> l.id().equals(linkId)).map(Link::role).findFirst()
                    .orElseThrow(() -> new IdentityException(Code.LINK_NOT_FOUND, null));
            jdbc.sql("update account_session set active_link_id = :l, area = :area where id = :s and account_id = :a")
                    .param("l", linkId).param("area", areaOf(role)).param("s", sessionId).param("a", accountId).update();
            jdbc.sql("update account_link set last_access_at = :now where id = :l and account_id = :a")
                    .param("now", now()).param("l", linkId).param("a", accountId).update();
            return role.management() ? replaceManagement(accountId, sessionId, now()) : 0;
        });
        auditReplaced(accountId, replaced, ip);
    }

    public void end(UUID sessionId) {
        jdbc.sql("delete from account_session where id = :id").param("id", sessionId).update();
    }

    /** Ends the sessions of the account, all of them or all but {@code except}; the caller audits it. */
    public void endAll(UUID accountId, UUID except) {
        jdbc.sql("delete from account_session where account_id = :a and (cast(:x as uuid) is null or id <> cast(:x as uuid))")
                .param("a", accountId).param("x", except).update();
    }


    /** RF-ACE-04: what a person may see of a session; never the token, its hash or the IP (D9). */
    public record SessionItem(UUID id, String device, String city, OffsetDateTime createdAt, OffsetDateTime lastUsedAt, boolean current) {}

    /** Live sessions of the account only (account_session has no RLS: the filter by account is the barrier). */
    public List<SessionItem> list(UUID accountId, UUID currentId) {
        return jdbc.sql("select id, device, ip, created_at, last_used_at from account_session "
                + "where account_id = :a and expires_at > :now and ended_at is null order by last_used_at desc, id")
                .param("a", accountId).param("now", now())
                .query((rs, n) -> {
                    String ip = rs.getString(3);
                    UUID id = rs.getObject(1, UUID.class);
                    return new SessionItem(id, DeviceLabel.of(rs.getString(2)),
                            ip == null ? null : locator.city(ip).orElse(null),
                            rs.getObject(4, OffsetDateTime.class), rs.getObject(5, OffsetDateTime.class), id.equals(currentId));
                }).list();
    }

    /** Ends another session of the account: 409 for the current one (D7), 404 for anything that is not the account's. */
    public void endOne(UUID accountId, UUID id, UUID currentId, String ip) {
        if (id.equals(currentId)) {
            throw new IdentityException(Code.SESSION_CURRENT, null);
        }
        int ended = jdbc.sql("delete from account_session where id = :id and account_id = :a and expires_at > :now and ended_at is null")
                .param("id", id).param("a", accountId).param("now", now()).update();
        if (ended == 0) {
            throw new IdentityException(Code.SESSION_NOT_FOUND, null);
        }
        audit.record(accountId, new AuditActor(AuditActor.Type.ACCOUNT, accountId, null), ip, "account.session_ended");
    }

    /** Ends every other session of the account and keeps the current one. */
    public void endOthers(UUID accountId, UUID currentId, String ip) {
        endAll(accountId, currentId);
        audit.record(accountId, new AuditActor(AuditActor.Type.ACCOUNT, accountId, null), ip, "account.sessions_ended");
    }

    /** RN-ACE-20: after a management link ends, the account without any other one loses every session. */
    public boolean endAllIfNoManagement(UUID accountId) {
        return accountTx.forAccount(accountId, () -> {
            if (activeLinks(accountId).stream().anyMatch(l -> l.role().management())) {
                return false;
            }
            endAll(accountId, null);
            return true;
        });
    }
}
