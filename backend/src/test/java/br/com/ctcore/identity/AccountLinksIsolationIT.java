package br.com.ctcore.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

/** CA3 and CA4 (#762): "Meus vínculos" shows only what is of the account of the session, in the query and in the RLS (V61). */
@Import({AuthBase.Config.class, AuthBase.OrgProbe.class})
class AccountLinksIsolationIT extends AuthBase {
    @Autowired AccountTransactions accountTx;
    @Autowired JdbcClient runtime;

    private int cpf;

    /** Runs before the cleanup of AuthBase: students and guardians point to accounts, units and organizations. */
    @AfterEach
    void cleanStudents() {
        truncateCascade(admin, "student", "guardian");
    }

    private UUID guardian(UUID org, UUID account) {
        UUID id = UUID.randomUUID();
        admin.update("insert into guardian (id, organization_id, account_id, name, cpf, phone) values (?, ?, ?, 'Pessoa Ficticia', ?, '11900000000')",
                id, org, account, String.format("%011d", ++cpf));
        return id;
    }

    private UUID student(UUID org, UUID unit, String name, UUID guardian) {
        UUID id = UUID.randomUUID();
        admin.update("insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, postal_code, street, number, district, city, state) "
                + "values (?, ?, ?, ?, ?, '2015-01-01', '01000000', 'Rua', '1', 'Centro', 'Cidade', 'SP')",
                id, org, unit, name, name.toLowerCase(java.util.Locale.ROOT));
        admin.update("insert into student_guardian (organization_id, student_id, guardian_id) values (?, ?, ?)", org, id, guardian);
        return id;
    }

    private static List<String> texts(JsonNode array) {
        List<String> out = new ArrayList<>();
        array.forEach(n -> out.add(n.asText()));
        return out;
    }

    private static JsonNode linkOf(JsonNode session, UUID id) {
        for (JsonNode l : session.path("links")) {
            if (l.path("id").asText().equals(id.toString())) return l;
        }
        throw new AssertionError("link not in the session: " + id);
    }

    private record World(UUID account, UUID admin1, UUID guardian2, UUID org2, List<UUID> studentsOfA) {}

    /** A: Administrator in 1 (with a guardian record there too) and Guardian in 2; B: another guardian in 2 and in 1. */
    private World world() {
        UUID org1 = org("Academia Um"), org2 = org("Academia Dois"), pendingOrg = org(), endedOrg = org();
        UUID unit1 = unit(org1), unit2 = unit(org2), unitEnded = unit(endedOrg);
        UUID a = account("ana@vinculos.example"), b = account("bia@vinculos.example");
        UUID admin1 = link(a, org1, "ADMINISTRATOR", "ACTIVE");
        admin.update("insert into account_link_unit (link_id, organization_id, unit_id) values (?, ?, ?)", admin1, org1, unit1);
        admin.update("update account_link set starts_on = '2026-03-05' where id = ?", admin1);
        UUID guardian2 = link(a, org2, "GUARDIAN", "ACTIVE");
        link(a, pendingOrg, "GUARDIAN", "PENDING");
        link(a, endedOrg, "GUARDIAN", "ENDED");
        link(b, org2, "GUARDIAN", "ACTIVE");
        link(b, org1, "GUARDIAN", "ACTIVE");

        student(org1, unit1, "Aluno Da Ficha Sem Vinculo", guardian(org1, a));
        student(endedOrg, unitEnded, "Aluno Do Vinculo Encerrado", guardian(endedOrg, a));
        UUID own = guardian(org2, a);
        UUID zeca = student(org2, unit2, "Zeca Ficticio", own);
        UUID bruno = student(org2, unit2, "Bruno Ficticio", own);
        student(org2, unit2, "Aluno De Bia Na Dois", guardian(org2, b));
        student(org1, unit1, "Aluno De Bia Na Um", guardian(org1, b));
        return new World(a, admin1, guardian2, org2, List.of(zeca, bruno));
    }

    @Test
    @DisplayName("CA3, CA4: com a organização 1, a 2 ou nenhuma ativa vêm os dois vínculos da conta, só com os alunos dela")
    void sessionShowsOnlyOwnActiveLinks() throws Exception {
        World w = world();
        assertThat(get("/api/v1/auth/session", null).andReturn().getResponse().getStatus()).isEqualTo(401);
        Cookie s = sessionOf("ana@vinculos.example");
        for (UUID active : new UUID[]{null, w.admin1(), w.guardian2()}) {
            if (active != null) {
                assertThat(put("/api/v1/auth/session/link", Map.of("linkId", active), s).andReturn().getResponse().getStatus()).isEqualTo(200);
            }
            JsonNode session = body(get("/api/v1/auth/session", s).andReturn());
            assertThat(session.path("activeLinkId").asText("null")).isEqualTo(String.valueOf(active));
            assertThat(session.path("links")).hasSize(2);

            JsonNode administrator = linkOf(session, w.admin1());
            assertThat(administrator.path("organizationName").asText()).isEqualTo("Academia Um");
            assertThat(administrator.path("role").asText()).isEqualTo("ADMINISTRATOR");
            assertThat(texts(administrator.path("unitNames"))).containsExactly("U");
            assertThat(administrator.path("startsOn").asText()).isEqualTo("2026-03-05");
            assertThat(administrator.path("studentNames").isArray()).isTrue();
            assertThat(administrator.path("studentNames")).isEmpty();

            JsonNode guardian = linkOf(session, w.guardian2());
            assertThat(guardian.path("organizationName").asText()).isEqualTo("Academia Dois");
            assertThat(guardian.path("role").asText()).isEqualTo("GUARDIAN");
            assertThat(guardian.path("startsOn").isNull()).isTrue();
            assertThat(texts(guardian.path("studentNames"))).containsExactly("Bruno Ficticio", "Zeca Ficticio");
        }
    }

    @Test
    @DisplayName("CA4: no escopo de conta o papel operacional só lê o ligado à conta como responsável, não escreve e perde tudo com o vínculo encerrado")
    void rowLevelSecurity() {
        World w = world();
        accountTx.forAccount(w.account(), () -> {
            assertThat(ids("select id from student")).containsExactlyInAnyOrderElementsOf(w.studentsOfA());
            assertThat(ids("select student_id from student_guardian")).containsExactlyInAnyOrderElementsOf(w.studentsOfA());
            assertThat(ids("select organization_id from guardian")).containsExactly(w.org2());
            assertThat(runtime.sql("update student set email = 'x@vinculos.example'").update()).isZero();
            assertThat(runtime.sql("update guardian set phone = '11911111111'").update()).isZero();
            assertThat(runtime.sql("update student_guardian set financial = true").update()).isZero();
            return null;
        });

        admin.update("update account_link set status = 'ENDED' where id = ?", w.guardian2());
        accountTx.forAccount(w.account(), () -> {
            assertThat(ids("select id from student")).isEmpty();
            assertThat(ids("select student_id from student_guardian")).isEmpty();
            assertThat(ids("select id from guardian")).isEmpty();
            return null;
        });
    }

    private List<UUID> ids(String sql) {
        return runtime.sql(sql).query(UUID.class).list();
    }
}
