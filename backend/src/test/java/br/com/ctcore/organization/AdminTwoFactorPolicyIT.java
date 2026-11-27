package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import br.com.ctcore.identity.Codes;
import br.com.ctcore.identity.Role;
import br.com.ctcore.integration.ChallengeVerifier;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RN-ACE-24 com sessões reais (cookie), para o bloqueio, o encerramento de sessões e o isolamento passarem pelos filtros. */
class AdminTwoFactorPolicyIT extends OrganizationBase {
    private static final String ROUTE = "/api/v1/organization/admin-two-factor";
    /** Rota autenticada, fora da sessão, da saída e das duas etapas, que todo perfil alcança. */
    private static final String PROBE = "/api/v1/auth/sessions";
    private static final String PASSWORD = "Abcdefg1";
    /** Código de reserva conhecido: confirma senha e código sem calcular TOTP. */
    private static final String BACKUP = "ABCDEFGHJK";

    @MockitoBean ChallengeVerifier challenge;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder encoder;

    record Person(UUID account, String email) {}

    @BeforeEach
    void setUp() {
        clean();
        Mockito.when(challenge.verify(Mockito.any())).thenReturn(true);
    }

    @AfterEach
    void clean() {
        truncateCascade(adminJdbc(), "organization", "account", "login_attempt");
    }

    @Test
    @DisplayName("RN-ACE-24: CA1: começa desligada, sem última alteração; grava e devolve o valor")
    void defaultsOffAndSaves() throws Exception {
        Cookie c = coordinator(tenant());
        assertThat(body(send(read(), c)).toString()).isEqualTo("{\"required\":false,\"lastChange\":null}");
        for (boolean value : new boolean[] {true, false}) {
            assertThat(set(c, value).path("required").asBoolean()).isEqualTo(value);
            assertThat(body(send(read(), c)).path("required").asBoolean()).isEqualTo(value);
        }
    }

    @Test
    @DisplayName("RN-ACE-24: CA2: sem sessão 401; os demais perfis 403 e nada muda; sem booleano é erro de validação")
    void onlyTheCoordinator() throws Exception {
        var t = tenant();
        assertThat(status(read(), null)).isEqualTo(401);
        assertThat(status(put("{\"required\":true}"), null)).isEqualTo(401);
        for (Role role : new Role[] {Role.ADMINISTRATOR, Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            Person p = person(role.name());
            link(p, t, role, "ACTIVE");
            Cookie s = login(p);
            assertThat(status(read(), s)).as(role.name()).isEqualTo(403);
            assertThat(status(put("{\"required\":true}"), s)).as(role.name()).isEqualTo(403);
        }
        Cookie c = coordinator(t);
        for (String bad : new String[] {"{}", "{\"required\":null}", "{\"required\":\"true\"}", "{\"required\":1}"}) {
            MvcResult r = send(put(bad), c);
            assertThat(r.getResponse().getStatus()).as(bad).isEqualTo(400);
            assertThat(body(r).path("code").asText()).as(bad).isEqualTo("VALIDATION_ERROR");
        }
        assertThat(stored(t)).isFalse();
        assertThat(audits(t)).isZero();
    }

    @Test
    @DisplayName("RN-ACE-24: CA3: ligar em A não muda B nem as sessões e o acesso do Administrador de B")
    void isolation() throws Exception {
        var a = tenant();
        var b = tenant();
        Person adminB = person("b");
        link(adminB, b, Role.ADMINISTRATOR, "ACTIVE");
        Cookie sessionB = login(adminB);

        MvcResult forged = send(put("{\"required\":true,\"organizationId\":\"" + b.orgId() + "\"}")
                .header("X-Organization-Id", b.orgId().toString()).param("organizationId", b.orgId().toString()), coordinator(a));

        assertThat(forged.getResponse().getStatus()).isEqualTo(200);
        assertThat(stored(a)).isTrue();
        assertThat(stored(b)).isFalse();
        assertThat(audits(b)).isZero();
        assertThat(status(probe(), sessionB)).isEqualTo(200);
        assertThat(twoFactorOf(sessionB).path("required").asBoolean()).isFalse();
        assertThat(body(send(read(), coordinator(b))).path("required").asBoolean()).isFalse();
    }

    @Test
    @DisplayName("RN-ACE-24: CA4: ligar encerra só as sessões do Administrador sem duas etapas; no login seguinte ele é barrado até ativar")
    void endsSessionsAndGates() throws Exception {
        var t = tenant();
        Cookie c = coordinator(t);
        Person bare = person("bare");
        Person protectedAdmin = person("protected");
        Person teacher = person("teacher");
        link(bare, t, Role.ADMINISTRATOR, "ACTIVE");
        link(protectedAdmin, t, Role.ADMINISTRATOR, "ACTIVE");
        link(teacher, t, Role.TEACHER, "ACTIVE");
        Cookie old = login(bare);
        Cookie kept = login(protectedAdmin);
        enableTwoFactor(protectedAdmin);
        Cookie teacherSession = login(teacher);

        set(c, true);

        assertThat(status(sessionView(), old)).isEqualTo(401);
        for (Cookie s : new Cookie[] {kept, c, teacherSession}) {
            assertThat(status(probe(), s)).isEqualTo(200);
        }
        Cookie next = login(bare);
        assertThat(twoFactorOf(next).path("required").asBoolean()).isTrue();
        MvcResult gated = send(MockMvcRequestBuilders.get("/api/v1/organization"), next);
        assertThat(gated.getResponse().getStatus()).isEqualTo(403);
        assertThat(body(gated).path("code").asText()).isEqualTo("TWO_FACTOR_SETUP_REQUIRED");
        assertThat(status(MockMvcRequestBuilders.post("/api/v1/auth/two-factor/setup"), next)).isEqualTo(200);

        enableTwoFactor(bare);
        assertThat(status(MockMvcRequestBuilders.get("/api/v1/organization"), next)).isEqualTo(200);
    }

    @Test
    @DisplayName("RN-ACE-24: CA6: o vínculo de Administrador obriga com outro vínculo aberto; encerrado ou outro perfil não obriga")
    void whoIsRequired() throws Exception {
        var strict = tenant();
        var other = tenant();
        set(coordinator(strict), true);

        Person several = person("several");
        link(several, strict, Role.ADMINISTRATOR, "ACTIVE");
        link(several, other, Role.STUDENT, "ACTIVE");
        Cookie s = login(several);
        assertThat(status(probe(), s)).isEqualTo(403);
        assertThat(twoFactorOf(s).path("required").asBoolean()).isTrue();

        // vínculo encerrado na organização que exige, com Administrador ativo numa que não exige
        Person ended = person("ended");
        link(ended, strict, Role.ADMINISTRATOR, "ENDED");
        link(ended, other, Role.ADMINISTRATOR, "ACTIVE");
        assertThat(status(probe(), login(ended))).isEqualTo(200);

        for (Role role : new Role[] {Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            Person p = person(role.name());
            link(p, strict, role, "ACTIVE");
            Cookie free = login(p);
            assertThat(status(probe(), free)).as(role.name()).isEqualTo(200);
            assertThat(twoFactorOf(free).path("required").asBoolean()).as(role.name()).isFalse();
        }
    }

    @Test
    @DisplayName("RN-ACE-24: CA7 e CA8: exigido, não desliga (403); sem a exigência segue ligado, desliga, e quem não configurou entra")
    void disableAndSwitchOff() throws Exception {
        var t = tenant();
        Cookie c = coordinator(t);
        Person admin = person("admin");
        link(admin, t, Role.ADMINISTRATOR, "ACTIVE");
        Cookie s = login(admin);
        enableTwoFactor(admin);
        set(c, true);

        assertThat(status(disable(), s)).isEqualTo(403);
        assertThat(enabled(admin)).isTrue();
        assertThat(twoFactorOf(s).path("required").asBoolean()).isTrue();

        set(c, false);

        assertThat(enabled(admin)).isTrue();
        assertThat(body(attempt(admin)).path("ticket").asText()).isNotBlank();
        assertThat(twoFactorOf(s).path("required").asBoolean()).isFalse();
        Person bare = person("bare");
        link(bare, t, Role.ADMINISTRATOR, "ACTIVE");
        assertThat(status(probe(), login(bare))).isEqualTo(200);
        assertThat(status(disable(), s)).isEqualTo(204);
        assertThat(enabled(admin)).isFalse();
    }

    @Test
    @DisplayName("RN-ACE-24: CA9: cada mudança grava auditoria com antes e depois; repetir o valor não grava nem encerra sessão")
    void auditAndRepeat() throws Exception {
        var t = tenant();
        Cookie c = coordinator(t);
        Person bare = person("bare");
        link(bare, t, Role.ADMINISTRATOR, "ACTIVE");

        set(c, false);
        assertThat(audits(t)).isZero();

        JsonNode on = set(c, true);
        assertThat(on.path("lastChange").path("by").asText()).isEqualTo("Pessoa Sintética");
        assertThat(on.path("lastChange").path("at").asText()).isNotBlank();
        Cookie after = login(bare);
        set(c, true);
        assertThat(audits(t)).isEqualTo(1);
        assertThat(status(sessionView(), after)).isEqualTo(200);

        set(c, false);
        assertThat(adminJdbc().queryForList("select actor_profile || ' ' || entity_type || ' ' || (before_data ->> 'required') || '>' "
                + "|| (after_data ->> 'required') from audit_log where organization_id = ? and action = 'organization.admin_two_factor.update' "
                + "order by id", String.class, t.orgId()))
                .containsExactlyInAnyOrder("COORDINATOR organization false>true", "COORDINATOR organization true>false");
    }

    // ---- apoio ----
    private Person person(String prefix) {
        var p = new Person(UUID.randomUUID(), prefix.toLowerCase() + "-" + UUID.randomUUID() + "@synthetic.example");
        adminJdbc().update("insert into account (id, email, name, password_hash, status) values (?, ?, 'Pessoa Sintética', ?, 'ACTIVE')",
                p.account(), p.email(), encoder.encode(PASSWORD));
        return p;
    }

    private void link(Person p, Tenant t, Role role, String status) {
        adminJdbc().update("insert into account_link (account_id, organization_id, role, status) values (?, ?, ?, ?)",
                p.account(), t.orgId(), role.name(), status);
    }

    private void enableTwoFactor(Person p) {
        adminJdbc().update("insert into account_two_factor (account_id, secret_encrypted, enabled_at) values (?, 'x', now()) "
                + "on conflict (account_id) do update set enabled_at = now()", p.account());
        adminJdbc().update("insert into account_backup_code (account_id, code_hash, created_at) values (?, ?, now())",
                p.account(), Codes.hash(BACKUP));
    }

    private boolean enabled(Person p) {
        return adminJdbc().queryForObject("select exists (select 1 from account_two_factor where account_id = ? and enabled_at is not null)",
                Boolean.class, p.account());
    }

    /** Coordenador já com duas etapas; a sessão é aberta antes de ligá-las para o login não pedir o segundo passo. */
    private Cookie coordinator(Tenant t) throws Exception {
        Person p = person("coordinator");
        link(p, t, Role.COORDINATOR, "ACTIVE");
        Cookie s = login(p);
        enableTwoFactor(p);
        return s;
    }

    private MvcResult attempt(Person p) throws Exception {
        return send(MockMvcRequestBuilders.post("/api/v1/auth/login").contentType("application/json")
                .content("{\"email\":\"" + p.email() + "\",\"password\":\"" + PASSWORD + "\",\"challengeToken\":\"t\"}"), null);
    }

    private Cookie login(Person p) throws Exception {
        MvcResult r = attempt(p);
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        Cookie cookie = r.getResponse().getCookie("SESSION");
        assertThat(cookie).isNotNull();
        return cookie;
    }

    private MvcResult send(MockHttpServletRequestBuilder request, Cookie session) throws Exception {
        request.secure(true).with(csrf());
        if (session != null) request.cookie(session);
        return mvc.perform(request).andReturn();
    }

    private int status(MockHttpServletRequestBuilder request, Cookie session) throws Exception {
        return send(request, session).getResponse().getStatus();
    }

    private static MockHttpServletRequestBuilder read() {
        return MockMvcRequestBuilders.get(ROUTE);
    }

    private static MockHttpServletRequestBuilder put(String body) {
        return MockMvcRequestBuilders.put(ROUTE).contentType("application/json").content(body);
    }

    private static MockHttpServletRequestBuilder probe() {
        return MockMvcRequestBuilders.get(PROBE);
    }

    private static MockHttpServletRequestBuilder sessionView() {
        return MockMvcRequestBuilders.get("/api/v1/auth/session");
    }

    private static MockHttpServletRequestBuilder disable() {
        return MockMvcRequestBuilders.delete("/api/v1/auth/two-factor").contentType("application/json")
                .content("{\"password\":\"" + PASSWORD + "\",\"code\":\"" + BACKUP + "\"}");
    }

    private JsonNode set(Cookie coordinator, boolean required) throws Exception {
        MvcResult r = send(put("{\"required\":" + required + "}"), coordinator);
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        return body(r);
    }

    private JsonNode twoFactorOf(Cookie session) throws Exception {
        return body(send(sessionView(), session)).path("twoFactor");
    }

    private JsonNode body(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    private boolean stored(Tenant t) {
        return adminJdbc().queryForObject("select require_admin_two_factor from organization_settings where organization_id = ?",
                Boolean.class, t.orgId());
    }

    private int audits(Tenant t) {
        return adminJdbc().queryForObject("select count(*) from audit_log where organization_id = ? "
                + "and action = 'organization.admin_two_factor.update'", Integer.class, t.orgId());
    }
}
