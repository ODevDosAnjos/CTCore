package br.com.ctcore.teacher;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import br.com.ctcore.modality.Modalities;
import br.com.ctcore.organization.OrganizationBase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RF-PRO-04 / RN-PRO-05: inativar professor, com banco real. */
class TeacherDeactivationIT extends OrganizationBase {
    @Autowired ObjectMapper json;
    private final List<String> emails = new ArrayList<>();

    @AfterEach
    void clean() {
        adminJdbc().update("delete from lesson");
        adminJdbc().update("delete from training_class_assistant");
        adminJdbc().update("delete from training_class");
        adminJdbc().update("delete from teacher_modality");
        adminJdbc().update("delete from teacher_unit");
        adminJdbc().update("delete from teacher");
        for (String email : emails) {
            adminJdbc().update("delete from account_session where account_id in (select id from account where email = ?)", email);
            adminJdbc().update("delete from account_invite where account_id in (select id from account where email = ?) "
                    + "or sent_by in (select id from account where email = ?)", email, email);
            adminJdbc().update("delete from account_link_unit where link_id in (select l.id from account_link l join account a on a.id = l.account_id where a.email = ?)", email);
            adminJdbc().update("delete from account_link where account_id in (select id from account where email = ?)", email);
            adminJdbc().update("delete from account where email = ?", email);
        }
        emails.clear();
    }

    private AccountPrincipal principal(Tenant t, Role role, Set<UUID> units) {
        UUID account = UUID.randomUUID();
        String email = "ator-" + account + "@synthetic.example";
        emails.add(email);
        adminJdbc().update("insert into account (id, email, name, status) values (?, ?, 'Ator', 'ACTIVE')", account, email);
        return new AccountPrincipal(account, UUID.randomUUID(), UUID.randomUUID(), t.orgId(), role, units);
    }

    @Override
    protected AccountPrincipal who(Tenant t, Role role) {
        return principal(t, role, Set.of(t.unitId()));
    }

    private String email() {
        String e = "prof-" + UUID.randomUUID() + "@synthetic.example";
        emails.add(e);
        return e;
    }

    private UUID unit(Tenant t, String name) {
        UUID id = UUID.randomUUID();
        adminJdbc().update("insert into unit (id, organization_id, name, short_name, active) values (?, ?, ?, ?, true)", id, t.orgId(), name,
                "u" + id.toString().substring(0, 12));
        return id;
    }

    private UUID teacher(Tenant t, String email, String status, UUID... units) {
        UUID id = UUID.randomUUID();
        adminJdbc().update("insert into teacher (id, organization_id, name, name_key, email, phone, status) values (?, ?, 'Ana', ?, ?, '11999990000', ?)",
                id, t.orgId(), Modalities.normalize("Ana"), email, status);
        for (UUID unit : units) {
            adminJdbc().update("insert into teacher_unit (organization_id, teacher_id, unit_id) values (?, ?, ?)", t.orgId(), id, unit);
        }
        return id;
    }

    private MockHttpServletResponse preview(UUID id, AccountPrincipal who) throws Exception {
        return call(MockMvcRequestBuilders.get("/api/v1/teachers/" + id + "/deactivation"), who).getResponse();
    }

    private MockHttpServletResponse deactivate(UUID id, AccountPrincipal who) throws Exception {
        return deactivate(id, who, "{\"reason\":\"Saída da academia\"}");
    }

    private MockHttpServletResponse deactivate(UUID id, AccountPrincipal who, String content) throws Exception {
        var post = MockMvcRequestBuilders.post("/api/v1/teachers/" + id + "/deactivate");
        return call(content == null ? post : post.contentType("application/json").content(content), who).getResponse();
    }

    private MockHttpServletResponse grant(UUID id, AccountPrincipal who) throws Exception {
        return call(MockMvcRequestBuilders.post("/api/v1/teachers/" + id + "/access"), who).getResponse();
    }

    private JsonNode body(MockHttpServletResponse r) throws Exception {
        return json.readTree(r.getContentAsString());
    }

    private String status(UUID id) {
        return adminJdbc().queryForObject("select status from teacher where id = ?", String.class, id);
    }

    private String linkStatus(String email) {
        return adminJdbc().queryForObject("select l.status from account_link l join account a on a.id = l.account_id where a.email = ? and l.role = 'TEACHER'",
                String.class, email);
    }

    private List<String> audit(Tenant t, String action) {
        return adminJdbc().queryForList("select coalesce(before_data::text, '') || coalesce(after_data::text, '') from audit_log "
                + "where organization_id = ? and action = ?", String.class, t.orgId(), action);
    }

    @Test
    @DisplayName("CA1, CA2: pré-visualização não altera nada; inativar dá 200 INACTIVE, a lista filtra e repetir dá 409")
    void deactivates() throws Exception {
        var t = tenant();
        UUID id = teacher(t, email(), "ACTIVE", t.unitId());
        var c = who(t, Role.COORDINATOR);
        var p = preview(id, c);
        assertThat(p.getStatus()).isEqualTo(200);
        assertThat(body(p).get("headClasses")).isEmpty();
        assertThat(body(p).get("canDeactivate").asBoolean()).isTrue();
        assertThat(status(id)).isEqualTo("ACTIVE");
        var r = deactivate(id, c);
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("status").asText()).isEqualTo("INACTIVE");
        assertThat(status(id)).isEqualTo("INACTIVE");
        var list = call(MockMvcRequestBuilders.get("/api/v1/teachers?status=INACTIVE"), c).getResponse();
        assertThat(body(list).get("items")).hasSize(1);
        assertThat(deactivate(id, c).getStatus()).isEqualTo(409);
        assertThat(body(preview(id, c)).get("canDeactivate").asBoolean()).isFalse();
    }

    @Test
    @DisplayName("CA3, CA7: acesso ACTIVE encerra o vínculo e a sessão, conta e account_id ficam; auditoria sem contato e com fim de vínculo")
    void endsActiveLink() throws Exception {
        var t = tenant();
        String email = email();
        UUID id = teacher(t, email, "ACTIVE", t.unitId());
        var c = who(t, Role.COORDINATOR);
        assertThat(grant(id, c).getStatus()).isEqualTo(200);
        UUID account = adminJdbc().queryForObject("select id from account where email = ?", UUID.class, email);
        adminJdbc().update("update account_link set status = 'ACTIVE' where account_id = ?", account);
        UUID link = adminJdbc().queryForObject("select id from account_link where account_id = ?", UUID.class, account);
        adminJdbc().update("insert into account_session (account_id, token_hash, active_link_id, expires_at) values (?, ?, ?, now() + interval '1 hour')",
                account, "h-" + UUID.randomUUID(), link);
        var r = deactivate(id, c);
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("access").asText()).isEqualTo("ENDED");
        assertThat(linkStatus(email)).isEqualTo("ENDED");
        assertThat(adminJdbc().queryForObject("select count(*) from account_session where account_id = ?", Integer.class, account)).isZero();
        assertThat(adminJdbc().queryForObject("select count(*) from account where id = ?", Integer.class, account)).isEqualTo(1);
        assertThat(adminJdbc().queryForObject("select account_id from teacher where id = ?", UUID.class, id)).isEqualTo(account);
        var log = audit(t, "teacher.deactivated");
        assertThat(log).hasSize(1);
        assertThat(log.get(0)).contains("ACTIVE", "INACTIVE").doesNotContain(email).doesNotContain("11999990000");
        assertThat(audit(t, "link.ended")).hasSize(1);
    }

    @Test
    @DisplayName("CA3: acesso PENDING cancela o convite e encerra o vínculo (Administrador); sem conta só muda a situação")
    void endsPendingLink() throws Exception {
        var t = tenant();
        String email = email();
        UUID id = teacher(t, email, "ACTIVE", t.unitId());
        assertThat(grant(id, who(t, Role.COORDINATOR)).getStatus()).isEqualTo(200);
        var r = deactivate(id, who(t, Role.ADMINISTRATOR));
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(linkStatus(email)).isEqualTo("ENDED");
        assertThat(adminJdbc().queryForObject("select count(*) from account_invite i join account a on a.id = i.account_id where a.email = ? "
                + "and i.used_at is null and i.canceled_at is null", Integer.class, email)).isZero();
        assertThat(audit(t, "invite.canceled")).hasSize(1);

        UUID coordinatorCase = teacher(t, email(), "ACTIVE", t.unitId());
        String email2 = adminJdbc().queryForObject("select email from teacher where id = ?", String.class, coordinatorCase);
        var c = who(t, Role.COORDINATOR);
        assertThat(grant(coordinatorCase, c).getStatus()).isEqualTo(200);
        assertThat(deactivate(coordinatorCase, c).getStatus()).isEqualTo(200);
        assertThat(linkStatus(email2)).isEqualTo("ENDED");

        UUID bare = teacher(t, null, "ACTIVE", t.unitId());
        assertThat(deactivate(bare, c).getStatus()).isEqualTo(200);
        assertThat(status(bare)).isEqualTo("INACTIVE");
    }

    @Test
    @DisplayName("CA4: Administrador só inativa quem tem todas as unidades dele; senão canDeactivate false e 403 sem alterar; Coordenador inativa")
    void administratorReach() throws Exception {
        var t = tenant();
        UUID second = unit(t, "Zona Sul");
        UUID id = teacher(t, email(), "ACTIVE", t.unitId(), second);
        var admin = who(t, Role.ADMINISTRATOR);
        assertThat(body(preview(id, admin)).get("canDeactivate").asBoolean()).isFalse();
        assertThat(deactivate(id, admin).getStatus()).isEqualTo(403);
        assertThat(status(id)).isEqualTo("ACTIVE");
        var both = principal(t, Role.ADMINISTRATOR, Set.of(t.unitId(), second));
        assertThat(body(preview(id, both)).get("canDeactivate").asBoolean()).isTrue();
        assertThat(deactivate(id, both).getStatus()).isEqualTo(200);
        UUID other = teacher(t, email(), "ACTIVE", t.unitId(), second);
        assertThat(deactivate(other, who(t, Role.COORDINATOR)).getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("CA5, CA6: Professor, Aluno e Responsável 403; anônimo 401; Administrador sem alcance e outra organização 404; RLS com ctcore_app")
    void permissionsAndIsolation() throws Exception {
        var a = tenant();
        var b = tenant();
        UUID second = unit(a, "Zona Sul");
        UUID id = teacher(a, email(), "ACTIVE", a.unitId());
        for (Role role : new Role[] {Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            assertThat(preview(id, who(a, role)).getStatus()).as(role.name()).isEqualTo(403);
            assertThat(deactivate(id, who(a, role)).getStatus()).as(role.name()).isEqualTo(403);
        }
        assertThat(preview(id, null).getStatus()).isEqualTo(401);
        assertThat(deactivate(id, null).getStatus()).isEqualTo(401);
        var far = principal(a, Role.ADMINISTRATOR, Set.of(second));
        assertThat(preview(id, far).getStatus()).isEqualTo(404);
        assertThat(deactivate(id, far).getStatus()).isEqualTo(404);
        var cb = who(b, Role.COORDINATOR);
        assertThat(preview(id, cb).getStatus()).isEqualTo(404);
        assertThat(deactivate(id, cb).getStatus()).isEqualTo(404);
        assertThat(status(id)).isEqualTo("ACTIVE");

        try (Connection app = DriverManager.getConnection(POSTGRES.getJdbcUrl(), "ctcore_app", "synthetic_runtime"); var sql = app.createStatement()) {
            app.setAutoCommit(false);
            sql.execute("select set_config('app.organization_id', '" + b.orgId() + "', true)");
            assertThat(sql.executeUpdate("update teacher set status = 'INACTIVE' where id = '" + id + "'")).isZero();
            app.rollback();
        }
        assertThat(status(id)).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("CA8: professor inativo pode ser editado e não recebe convite (409)")
    void inactiveRules() throws Exception {
        var t = tenant();
        UUID id = teacher(t, email(), "ACTIVE", t.unitId());
        var c = who(t, Role.COORDINATOR);
        assertThat(deactivate(id, c).getStatus()).isEqualTo(200);
        assertThat(grant(id, c).getStatus()).isEqualTo(409);
        var put = call(MockMvcRequestBuilders.put("/api/v1/teachers/" + id).contentType("application/json")
                .content("{\"name\":\"Ana Maria\",\"unitIds\":[\"" + t.unitId() + "\"],\"modalities\":[],\"directoryConsent\":false}"), c).getResponse();
        assertThat(put.getStatus()).as(put.getContentAsString()).isEqualTo(200);
        assertThat(status(id)).isEqualTo("INACTIVE");
    }

    private UUID teaches(Tenant t, UUID teacher, String modality) {
        UUID m = adminJdbc().queryForObject("select id from modality where name = ?", UUID.class, modality);
        adminJdbc().update("insert into teacher_modality (organization_id, teacher_id, modality_id) values (?, ?, ?)", t.orgId(), teacher, m);
        return m;
    }

    private UUID klass(Tenant t, UUID unit, String name, UUID modality, UUID head, UUID... assistants) {
        UUID id = UUID.randomUUID();
        adminJdbc().update("insert into training_class (id, organization_id, unit_id, name, name_key, modality_id, head_teacher_id, status) values (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
                id, t.orgId(), unit, name, name.toLowerCase(), modality, head);
        for (UUID a : assistants) {
            adminJdbc().update("insert into training_class_assistant (organization_id, class_id, teacher_id) values (?, ?, ?)", t.orgId(), id, a);
        }
        return id;
    }

    private UUID head(UUID klass) {
        return adminJdbc().queryForObject("select head_teacher_id from training_class where id = ?", UUID.class, klass);
    }

    private static String replacements(String reason, UUID... pairs) {
        StringBuilder sb = new StringBuilder("{\"reason\":\"" + reason + "\",\"replacements\":[");
        for (int i = 0; i < pairs.length; i += 2) {
            sb.append(i > 0 ? "," : "").append("{\"classId\":\"").append(pairs[i]).append("\",\"teacherId\":\"").append(pairs[i + 1]).append("\"}");
        }
        return sb.append("]}").toString();
    }

    @Test
    @DisplayName("#470 CA8, CA9: prévia traz unidade, candidatos e turmas de auxiliar; inativar troca o titular escolhido, tira o auxiliar e audita sem contato")
    void replacesHeads() throws Exception {
        var t = tenant();
        UUID thiago = teacher(t, email(), "ACTIVE", t.unitId());
        UUID rafael = teacher(t, email(), "ACTIVE", t.unitId());
        UUID lia = teacher(t, email(), "ACTIVE", t.unitId());
        UUID jj = teaches(t, thiago, "Jiu-Jitsu");
        teaches(t, rafael, "Jiu-Jitsu");
        teaches(t, lia, "Judô");
        UUID a = klass(t, t.unitId(), "JJ Manhã", jj, thiago);
        UUID b = klass(t, t.unitId(), "JJ Kids", jj, thiago);
        UUID c = klass(t, t.unitId(), "JJ Noite", jj, rafael, thiago);
        var coordinator = who(t, Role.COORDINATOR);
        var p = body(preview(thiago, coordinator));
        assertThat(p.get("headClasses").get(0).get("name").asText() + "," + p.get("headClasses").get(1).get("name").asText()).isEqualTo("JJ Kids,JJ Manhã");
        assertThat(p.get("headClasses").get(0).get("unitName").asText()).isEqualTo("Unit");
        assertThat(p.get("headClasses").get(0).get("candidates")).hasSize(1);
        assertThat(p.get("headClasses").get(0).get("candidates").get(0).get("id").asText()).isEqualTo(rafael.toString());
        assertThat(p.get("assistantClasses").findValuesAsText("name")).containsExactly("JJ Noite");

        var r = deactivate(thiago, coordinator, replacements("Mudou de cidade", a, rafael));
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(status(thiago)).isEqualTo("INACTIVE");
        assertThat(head(a)).isEqualTo(rafael);
        assertThat(head(b)).isEqualTo(thiago);
        assertThat(adminJdbc().queryForObject("select count(*) from training_class_assistant where class_id = ?", Integer.class, c)).isZero();
        var log = audit(t, "teacher.deactivated");
        assertThat(log).hasSize(1);
        assertThat(log.get(0)).contains("Mudou de cidade", a.toString()).doesNotContain("11999990000").doesNotContain("@synthetic");
        assertThat(audit(t, "class.updated")).hasSize(1);
    }

    @Test
    @DisplayName("#470 CA9: motivo fora de 3 a 200 ou sem corpo e troca inválida dão 400 no campo e nada muda, nem a situação nem outra troca já válida")
    void rejectsInvalidBody() throws Exception {
        var t = tenant();
        var other = tenant();
        UUID second = unit(t, "Zona Sul");
        UUID thiago = teacher(t, email(), "ACTIVE", t.unitId());
        UUID rafael = teacher(t, email(), "ACTIVE", t.unitId());
        UUID inactive = teacher(t, email(), "INACTIVE", t.unitId());
        UUID elsewhere = teacher(t, email(), "ACTIVE", second);
        UUID judoOnly = teacher(t, email(), "ACTIVE", t.unitId());
        UUID jj = teaches(t, thiago, "Jiu-Jitsu");
        teaches(t, rafael, "Jiu-Jitsu");
        teaches(t, inactive, "Jiu-Jitsu");
        teaches(t, elsewhere, "Jiu-Jitsu");
        teaches(t, judoOnly, "Judô");
        UUID a = klass(t, t.unitId(), "JJ Manhã", jj, thiago);
        UUID b = klass(t, t.unitId(), "JJ Kids", jj, thiago);
        UUID notHis = klass(t, t.unitId(), "JJ Noite", jj, rafael, thiago);
        UUID foreignTeacher = teacher(other, email(), "ACTIVE", other.unitId());
        UUID foreignClass = klass(other, other.unitId(), "JJ Alheia", teaches(other, foreignTeacher, "Jiu-Jitsu"), foreignTeacher);
        var c = who(t, Role.COORDINATOR);

        assertThat(deactivate(thiago, c, null).getStatus()).isEqualTo(400);
        for (String reason : new String[] {"", "ab", "x".repeat(201)}) {
            var r = deactivate(thiago, c, "{\"reason\":\"" + reason + "\"}");
            assertThat(r.getStatus()).as(reason.length() + "").isEqualTo(400);
            assertThat(r.getContentAsString()).contains("reason");
        }
        assertThat(deactivate(thiago, c, "{}").getStatus()).isEqualTo(400);
        UUID[][] bad = {{a, inactive}, {a, elsewhere}, {a, judoOnly}, {a, thiago}, {notHis, rafael}, {foreignClass, rafael}, {a, foreignTeacher},
                {a, UUID.randomUUID()}, {UUID.randomUUID(), rafael}};
        for (UUID[] pair : bad) {
            var r = deactivate(thiago, c, replacements("Motivo válido", b, rafael, pair[0], pair[1]));
            assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(400);
            assertThat(r.getContentAsString()).contains("replacements");
            assertThat(status(thiago)).isEqualTo("ACTIVE");
            assertThat(head(b)).isEqualTo(thiago);
            assertThat(head(a)).isEqualTo(thiago);
        }
        assertThat(deactivate(thiago, c, replacements("Motivo válido", a, rafael, a, rafael)).getStatus()).isEqualTo(400);
        assertThat(adminJdbc().queryForObject("select count(*) from training_class_assistant where class_id = ?", Integer.class, notHis)).isEqualTo(1);
        assertThat(audit(t, "teacher.deactivated")).isEmpty();
        assertThat(head(foreignClass)).isEqualTo(foreignTeacher);
    }
}
