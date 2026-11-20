package br.com.ctcore.identity;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.db.SeedDataIT;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

/** #644: as 7 contas fáceis do seed entram pelas rotas reais de login, com o vínculo certo (RN-ACE-03). */
@org.springframework.context.annotation.Import({AuthBase.Config.class, AuthBase.OrgProbe.class})
class SeedLoginIT extends AuthBase {
    @BeforeEach
    void seed() throws Exception {
        SeedDataIT.cleanAll(admin);
        SeedDataIT.apply(admin, SeedDataIT.SEED_DIR);
    }

    // Roda antes do baseClean da superclasse, que apaga contas e organizações.
    @AfterEach
    void unseed() {
        SeedDataIT.cleanAll(admin);
    }

    private JsonNode loginOk(String email, String password) throws Exception {
        MvcResult r = login(email, password);
        assertThat(r.getResponse().getStatus()).as(email).isEqualTo(200);
        return body(r);
    }

    private List<String> roles(JsonNode login) {
        List<String> roles = new ArrayList<>();
        login.path("links").forEach(l -> roles.add(l.path("role").asText()));
        return roles;
    }

    @Test
    @DisplayName("CA1 e CA2: cada conta entra com a senha da tabela, no papel certo; só a múltipla pede a escolha")
    void everyAccountLogsIn() throws Exception {
        Map<String, String[]> accounts = Map.of(
                "admin@ctcore.test", new String[]{"admin123", "ADMINISTRATOR"},
                "admin2@ctcore.test", new String[]{"admin123", "ADMINISTRATOR"},
                "professor@ctcore.test", new String[]{"professor123", "TEACHER"},
                "aluno@ctcore.test", new String[]{"aluno123", "STUDENT"},
                "responsavel@ctcore.test", new String[]{"responsavel123", "GUARDIAN"});
        for (var e : accounts.entrySet()) {
            JsonNode login = loginOk(e.getKey(), e.getValue()[0]);
            assertThat(roles(login)).as(e.getKey()).containsExactly(e.getValue()[1]);
            assertThat(login.path("activeLinkId").isNull()).as(e.getKey()).isFalse();
        }
        JsonNode multiple = loginOk("multiplo@ctcore.test", "multiplo123");
        assertThat(multiple.path("activeLinkId").isNull()).isTrue();
        assertThat(roles(multiple)).containsExactlyInAnyOrder("TEACHER", "STUDENT");
        assertThat(count("select count(distinct organization_id) from account_link where account_id = (select id from account where email = 'multiplo@ctcore.test') and status = 'ACTIVE'")).isEqualTo(2);
    }

    @Test
    @DisplayName("CA1: unidades do Administrador de uma e de duas unidades, e quem cada conta representa")
    void linksPointToTheRightRecords() {
        assertThat(count("select count(*) from account_link_unit u join account_link l on l.id = u.link_id join account a on a.id = l.account_id where a.email = 'admin@ctcore.test'")).isEqualTo(1);
        assertThat(count("select count(*) from account_link_unit u join account_link l on l.id = u.link_id join account a on a.id = l.account_id where a.email = 'admin2@ctcore.test'")).isEqualTo(2);
        assertThat(count("select count(*) from teacher t join account a on a.id = t.account_id where a.email = 'professor@ctcore.test'")).isEqualTo(1);
        assertThat(count("select count(*) from teacher t join account a on a.id = t.account_id where a.email = 'multiplo@ctcore.test'")).isEqualTo(1);
        assertThat(count("select count(*) from student s join account a on a.id = s.account_id where a.email = 'aluno@ctcore.test' and s.birth_date < current_date - interval '18 years'")).isEqualTo(1);
        assertThat(count("select count(*) from student s join organization o on o.id = s.organization_id join account a on a.id = s.account_id where a.email = 'multiplo@ctcore.test' and o.id = md5('ctcore-seed-org-2')::uuid")).isEqualTo(1);
        assertThat(count("select count(*) from student_guardian sg join guardian g on g.id = sg.guardian_id and g.organization_id = sg.organization_id join account a on a.id = g.account_id join student s on s.id = sg.student_id where a.email = 'responsavel@ctcore.test' and s.birth_date > current_date - interval '18 years'")).isEqualTo(2);
    }

    @Test
    @DisplayName("CA3: o Coordenador entra pelo código gerado do segredo documentado no README")
    void coordinatorTwoFactor() throws Exception {
        byte[] documented = Base32.decode("MN2GG33SMUWXGZLFMQWTEZTBFV2GK43U");
        // O texto do seed é cifrado com a chave local; o teste usa outra chave, então só confere o segredo e regrava com a chave do teste.
        String stored = admin.queryForObject("select secret_encrypted from account_two_factor where account_id = md5('ctcore-seed-account-1')::uuid", String.class);
        var local = new SecretCipher("Y3Rjb3JlLWxvY2FsLWRldi1rZXktMDEyMzQ1Njc4OSE=");
        assertThat(local.decrypt(stored)).isEqualTo(documented);
        admin.update("update account_two_factor set secret_encrypted = ? where account_id = md5('ctcore-seed-account-1')::uuid", cipher.encrypt(documented));

        MvcResult first = login("coordenador@ctcore.test", "coordenador123");
        assertThat(body(first).path("ticket").asText()).isNotBlank();
        MvcResult second = post("/api/v1/auth/login/two-factor",
                Map.of("ticket", body(first).path("ticket").asText(), "code", nextCode(documented)), null).andReturn();
        assertThat(second.getResponse().getStatus()).isEqualTo(200);
        assertThat(roles(body(second))).containsExactly("COORDINATOR");
    }
}
