package br.com.ctcore.identity;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.Cookie;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MvcResult;

/** RN-ACE-23: one management session per account; the portal and other accounts are not touched. */
@Import({AuthBase.Config.class, AuthBase.OrgProbe.class})
class SingleManagementSessionIT extends AuthBase {
    static final String SESSION = "/api/v1/auth/session";
    static final String SESSIONS = "/api/v1/auth/sessions";

    String code(Cookie c) throws Exception {
        MvcResult r = get(SESSION, c).andReturn();
        return r.getResponse().getStatus() == 200 ? "200" : shape(r).split("\\|")[0] + "|" + body(r).path("code").asText();
    }

    void choose(Cookie c, UUID link) throws Exception {
        assertThat(put(SESSION + "/link", Map.of("linkId", link), c).andReturn().getResponse().getStatus()).isEqualTo(200);
    }

    UUID idOf(Cookie c) {
        return admin.queryForObject("select id from account_session where token_hash = ?", UUID.class, Codes.hash(c.getValue()));
    }

    @Test
    @DisplayName("RN-ACE-23: CA1, CA5, CA7, CA8, CA10: entrar em outro aparelho encerra a sessão de gestão anterior, com 401 SESSION_REPLACED e auditoria")
    void replacesPreviousManagementSession() throws Exception {
        UUID org = org();
        link(account("ana@x.com"), org, "ADMINISTRATOR", "ACTIVE");
        link(account("bia@x.com"), org, "ADMINISTRATOR", "ACTIVE");
        Cookie bia = sessionOf("bia@x.com");
        Cookie a1 = sessionOf("ana@x.com");
        assertThat(code(a1)).isEqualTo("200");

        Cookie a2 = sessionOf("ana@x.com");

        assertThat(code(a1)).isEqualTo("401|SESSION_REPLACED");
        assertThat(code(a2)).isEqualTo("200");
        assertThat(code(bia)).isEqualTo("200");
        assertThat(get(SESSIONS, a1).andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(body(get(SESSIONS, a2).andReturn())).hasSize(1);
        assertThat(delete(SESSIONS + "/" + idOf(a1), a2).andReturn().getResponse().getStatus()).isEqualTo(404);
        assertThat(count("select count(*) from audit_log where organization_id = ? and action = 'account.session_replaced'", org)).isEqualTo(1);
        assertThat(count("select count(*) from audit_log where action = 'account.session_replaced' and (ip like '%' || ? || '%' or ip like '%' || ? || '%')",
                a1.getValue(), a2.getValue())).isZero();
    }

    @Test
    @DisplayName("RN-ACE-23: CA5: sessão apagada ou vencida continua 401 UNAUTHENTICATED")
    void otherEndsStayUnauthenticated() throws Exception {
        link(account("ana@x.com"), org(), "ADMINISTRATOR", "ACTIVE");
        Cookie a1 = sessionOf("ana@x.com");
        admin.update("delete from account_session");
        assertThat(code(a1)).isEqualTo("401|UNAUTHENTICATED");
        assertThat(code(new Cookie("SESSION", "desconhecida"))).isEqualTo("401|UNAUTHENTICATED");
    }

    @Test
    @DisplayName("RN-ACE-23: CA2: com dois vínculos de gestão, a sessão anterior cai ao escolher o vínculo, não antes")
    void replacesOnLinkChoice() throws Exception {
        UUID orgA = org(), orgB = org();
        UUID ana = account("ana@x.com");
        UUID linkA = link(ana, orgA, "ADMINISTRATOR", "ACTIVE");
        UUID linkB = link(ana, orgB, "TEACHER", "ACTIVE");
        Cookie a1 = sessionOf("ana@x.com");
        choose(a1, linkA);

        Cookie a2 = sessionOf("ana@x.com");
        assertThat(code(a1)).isEqualTo("200");
        choose(a2, linkB);

        assertThat(code(a1)).isEqualTo("401|SESSION_REPLACED");
        assertThat(code(a2)).isEqualTo("200");
        assertThat(count("select count(*) from audit_log where action = 'account.session_replaced'")).isEqualTo(2);
    }

    @Test
    @DisplayName("RN-ACE-23: CA3, CA4: a sessão do portal não é tocada, nem ao entrar na gestão nem ao entrar no portal")
    void portalIsUntouched() throws Exception {
        UUID orgA = org(), orgB = org();
        UUID ana = account("ana@x.com");
        UUID admin1 = link(ana, orgA, "ADMINISTRATOR", "ACTIVE");
        UUID student = link(ana, orgB, "STUDENT", "ACTIVE");
        Cookie m1 = sessionOf("ana@x.com");
        choose(m1, admin1);
        Cookie p = sessionOf("ana@x.com");
        choose(p, student);
        assertThat(code(m1)).isEqualTo("200");

        Cookie m2 = sessionOf("ana@x.com");
        choose(m2, admin1);

        assertThat(code(m1)).isEqualTo("401|SESSION_REPLACED");
        assertThat(code(p)).isEqualTo("200");
        Cookie p2 = sessionOf("ana@x.com");
        choose(p2, student);
        assertThat(code(m2)).isEqualTo("200");
        assertThat(body(get(SESSIONS, m2).andReturn())).hasSize(3);
    }

    @Test
    @DisplayName("RN-ACE-23: CA11: o login com segundo fator também encerra a sessão de gestão anterior")
    void twoFactorLogin() throws Exception {
        link(account("ana@x.com"), org(), "COORDINATOR", "ACTIVE");
        enableTwoFactor(admin.queryForObject("select id from account where email = 'ana@x.com'", UUID.class), "ana@x.com");
        Cookie a1 = sessionOf("ana@x.com");
        Cookie a2 = sessionOf("ana@x.com");
        assertThat(code(a1)).isEqualTo("401|SESSION_REPLACED");
        assertThat(code(a2)).isEqualTo("200");
    }
}
