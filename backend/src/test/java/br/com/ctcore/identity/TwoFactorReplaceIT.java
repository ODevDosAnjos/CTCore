package br.com.ctcore.identity;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.db.PostgresIT;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** #764 (RF-ACE-04): replacing the two-step device without turning it off, and the backup codes left. */
@Import({AuthBase.Config.class, AuthBase.OrgProbe.class})
class TwoFactorReplaceIT extends AuthBase {
    static final String REPLACE = "/api/v1/auth/two-factor/replace", CONFIRM = "/api/v1/auth/two-factor/replace/confirm";
    static final String EMAIL = "ana@troca.example", OTHER = "bia@troca.example";

    @BeforeEach
    @AfterEach
    void cleanAll() {
        PostgresIT.truncateCascade(admin, "organization", "account", "login_attempt");
    }

    private static int status(MvcResult r) {
        return r.getResponse().getStatus();
    }

    private UUID person(String email, String role) {
        UUID id = account(email);
        link(id, org(), role, "ACTIVE");
        return id;
    }

    private MvcResult replace(Cookie s, String password, String code) throws Exception {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("password", password);
        if (code != null) body.put("code", code);
        return post(REPLACE, body, s).andReturn();
    }

    private MvcResult confirm(Cookie s, String code) throws Exception {
        return post(CONFIRM, Map.of("code", code), s).andReturn();
    }

    /** The secret of the new app, from a request that was accepted. */
    private byte[] requestReplace(Cookie s, String currentCode) throws Exception {
        MvcResult r = replace(s, PASSWORD, currentCode);
        assertThat(status(r)).isEqualTo(200);
        String secret = body(r).path("secret").asText();
        assertThat(body(r).path("otpauthUri").asText()).startsWith("otpauth://totp/CTCore").contains("secret=" + secret);
        return Base32.decode(secret);
    }

    /** The second login step with this code; a success is a new session. */
    private MvcResult loginWith(String email, String code) throws Exception {
        String ticket = body(login(email, PASSWORD)).path("ticket").asText();
        return post("/api/v1/auth/login/two-factor", Map.of("ticket", ticket, "code", code), null).andReturn();
    }

    private String stored(UUID account) {
        return admin.queryForObject("select secret_encrypted from account_two_factor where account_id = ?", String.class, account);
    }

    private List<String> backupRows(UUID account) {
        return admin.queryForList("select code_hash || '|' || coalesce(used_at::text, '') from account_backup_code "
                + "where account_id = ? order by code_hash", String.class, account);
    }

    private int remaining(Cookie s) throws Exception {
        return body(get("/api/v1/auth/session", s).andReturn()).path("twoFactor").path("backupCodesRemaining").asInt(-1);
    }

    private long unused(UUID account) {
        return count("select count(*) from account_backup_code where account_id = ? and used_at is null", account);
    }

    @Test
    @DisplayName("RF-ACE-04: CA1: o segredo anterior vale até a confirmação; depois só o novo, sem repetir o código, sem trocar os de reserva")
    void replacesOnlyAfterConfirmation() throws Exception {
        UUID a = person(EMAIL, "ADMINISTRATOR");
        Cookie s = sessionOf(EMAIL);
        var on = activate(s, EMAIL);
        List<String> backups = backupRows(a);
        String enabledAt = admin.queryForObject("select enabled_at::text from account_two_factor where account_id = ?", String.class, a);

        byte[] fresh = requestReplace(s, nextCode(on.secret()));
        assertThat(admin.queryForObject("select pending_secret_encrypted from account_two_factor where account_id = ?", String.class, a))
                .isNotBlank().doesNotContain(Base32.encode(fresh));
        assertThat(status(loginWith(EMAIL, nextCode(fresh)))).isEqualTo(401);
        MvcResult old = loginWith(EMAIL, nextCode(on.secret()));
        assertThat(status(old)).isEqualTo(200);
        s = old.getResponse().getCookie("SESSION"); // the new management session ends the previous one (RN-ACE-23)

        clock.now = clock.now.plusSeconds(8 * 60); // with the 30 s steps around it, 9,5 of the 10 minutes
        String confirmation = nextCode(fresh);
        assertThat(status(confirm(s, confirmation))).isEqualTo(204);

        assertThat(status(loginWith(EMAIL, confirmation))).isEqualTo(401);
        assertThat(status(loginWith(EMAIL, nextCode(on.secret())))).isEqualTo(401);
        MvcResult now = loginWith(EMAIL, nextCode(fresh));
        assertThat(status(now)).isEqualTo(200);
        s = now.getResponse().getCookie("SESSION");
        assertThat(backupRows(a)).isEqualTo(backups);
        assertThat(admin.queryForObject("select enabled_at::text from account_two_factor where account_id = ?", String.class, a))
                .isEqualTo(enabledAt);
        assertThat(count("select count(*) from account_two_factor where pending_secret_encrypted is not null or pending_expires_at is not null"))
                .isZero();
        assertThat(count("select count(*) from audit_log where action = 'account.two_factor_replaced' and entity_id = ? and ip is not null",
                a.toString())).isEqualTo(1);
        assertThat(admin.queryForObject("select string_agg(t::text, ' ') from audit_log t", String.class))
                .doesNotContain(Base32.encode(fresh), Base32.encode(on.secret()), PASSWORD, confirmation);
        assertThat(status(confirm(s, nextCode(fresh)))).isEqualTo(409); // nothing pending anymore
    }

    @Test
    @DisplayName("RN-ACE-10: CA2: senha ou código atual errado ou ausente dá 401, conta na trava e não muda nada; depois de 5, 429")
    void wrongCredentialsCountInTheLock() throws Exception {
        UUID a = person(EMAIL, "ADMINISTRATOR");
        Cookie s = sessionOf(EMAIL);
        var on = activate(s, EMAIL);
        String secret = stored(a);
        List<String> backups = backupRows(a);
        long before = count("select count(*) from login_attempt where email = ? and result in ('WRONG_PASSWORD', 'WRONG_CODE')", EMAIL);

        MvcResult password = replace(s, "SenhaErrada9", nextCode(on.secret()));
        assertThat(status(password)).isEqualTo(401);
        assertThat(body(password).path("code").asText()).isEqualTo("INVALID_CREDENTIALS");
        for (String code : new String[]{"000000", null, "000000", null}) {
            MvcResult r = replace(s, PASSWORD, code);
            assertThat(status(r)).isEqualTo(401);
            assertThat(body(r).path("code").asText()).isEqualTo("INVALID_TWO_FACTOR_CODE");
        }
        assertThat(status(replace(s, PASSWORD, nextCode(on.secret())))).isEqualTo(429);

        assertThat(count("select count(*) from login_attempt where email = ? and result in ('WRONG_PASSWORD', 'WRONG_CODE')", EMAIL) - before)
                .isEqualTo(5);
        assertThat(stored(a)).isEqualTo(secret);
        assertThat(backupRows(a)).isEqualTo(backups);
        assertThat(count("select count(*) from account_two_factor where pending_secret_encrypted is not null")).isZero();
        assertThat(count("select count(*) from audit_log where action = 'account.two_factor_replaced'")).isZero();
    }

    @Test
    @DisplayName("RF-ACE-04: CA3: sem sessão 401, sem CSRF 403, desligadas 409, sem pendente ou vencido 409, código errado 401; um pedido substitui o outro e só a própria conta muda")
    void statesAndIsolation() throws Exception {
        for (String url : List.of(REPLACE, CONFIRM)) {
            assertThat(status(post(url, Map.of("password", PASSWORD, "code", "123456"), null).andReturn())).isEqualTo(401);
        }
        UUID a = person(EMAIL, "ADMINISTRATOR");
        UUID b = person(OTHER, "ADMINISTRATOR");
        Cookie sb = sessionOf(OTHER);
        var onB = activate(sb, OTHER);
        String secretB = stored(b);
        Cookie s = sessionOf(EMAIL);
        for (String url : List.of(REPLACE, CONFIRM)) {
            assertThat(status(mvc.perform(MockMvcRequestBuilders.post(url).secure(true).cookie(s).contentType("application/json")
                    .content("{\"password\":\"x\",\"code\":\"123456\"}")).andReturn())).isEqualTo(403);
        }
        assertThat(status(replace(s, PASSWORD, "123456"))).isEqualTo(409);
        assertThat(status(confirm(s, "123456"))).isEqualTo(409);

        var on = activate(s, EMAIL);
        String secret = stored(a);
        assertThat(status(confirm(s, "123456"))).isEqualTo(409);

        byte[] expired = requestReplace(s, nextCode(on.secret()));
        clock.now = clock.now.plusSeconds(10 * 60);
        assertThat(status(confirm(s, nextCode(expired)))).isEqualTo(409);

        byte[] replaced = requestReplace(s, nextCode(on.secret()));
        byte[] latest = requestReplace(s, nextCode(on.secret()));
        MvcResult wrong = confirm(s, nextCode(replaced));
        assertThat(status(wrong)).isEqualTo(401);
        assertThat(body(wrong).path("code").asText()).isEqualTo("INVALID_TWO_FACTOR_CODE");
        assertThat(stored(a)).isEqualTo(secret);

        assertThat(status(confirm(s, nextCode(latest)))).isEqualTo(204);
        assertThat(stored(a)).isNotEqualTo(secret);
        assertThat(stored(b)).isEqualTo(secretB);
        assertThat(count("select count(*) from account_two_factor where account_id = ? and pending_secret_encrypted is not null", b)).isZero();
        assertThat(status(loginWith(OTHER, nextCode(onB.secret())))).isEqualTo(200);
    }

    @Test
    @DisplayName("RN-ACE-24: CA4: Coordenador, Administrador obrigado e conta de portal trocam de aparelho")
    void everyProfileReplaces() throws Exception {
        UUID strict = org();
        admin.update("insert into organization_settings (organization_id, require_admin_two_factor) values (?, true)", strict);
        link(account("c@troca.example"), org(), "COORDINATOR", "ACTIVE");
        link(account("adm@troca.example"), strict, "ADMINISTRATOR", "ACTIVE");
        link(account("aluno@troca.example"), org(), "STUDENT", "ACTIVE");
        for (String email : List.of("c@troca.example", "adm@troca.example", "aluno@troca.example")) {
            Cookie s = sessionOf(email);
            var on = activate(s, email);
            byte[] fresh = requestReplace(s, nextCode(on.secret()));
            assertThat(status(confirm(s, nextCode(fresh)))).as(email).isEqualTo(204);
        }
    }

    @Test
    @DisplayName("RN-ACE-18: CA5: a sessão traz os códigos de reserva não usados da própria conta; 0 com as duas etapas desligadas")
    void remainingBackupCodes() throws Exception {
        UUID a = person(EMAIL, "ADMINISTRATOR");
        person(OTHER, "ADMINISTRATOR");
        Cookie s = sessionOf(EMAIL);
        assertThat(remaining(s)).isZero();
        var on = activate(s, EMAIL);
        assertThat(remaining(s)).isEqualTo(10);

        MvcResult login = loginWith(EMAIL, on.codes().get(0));
        assertThat(status(login)).isEqualTo(200);
        s = login.getResponse().getCookie("SESSION");
        assertThat(remaining(s)).isEqualTo(9).isEqualTo((int) unused(a));

        byte[] fresh = requestReplace(s, on.codes().get(1)); // the current code may be a backup one, and it is spent (D2)
        assertThat(remaining(s)).isEqualTo(8).isEqualTo((int) unused(a));
        assertThat(status(confirm(s, nextCode(fresh)))).isEqualTo(204);
        assertThat(remaining(s)).isEqualTo(8);

        Cookie sb = sessionOf(OTHER);
        var onB = activate(sb, OTHER);
        assertThat(status(loginWith(OTHER, onB.codes().get(0)))).isEqualTo(200);
        assertThat(remaining(s)).isEqualTo(8);

        assertThat(status(post("/api/v1/auth/two-factor/backup-codes", null, s).andReturn())).isEqualTo(200);
        assertThat(remaining(s)).isEqualTo(10);
    }
}
