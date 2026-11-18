package br.com.ctcore.agerange;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import br.com.ctcore.organization.OrganizationBase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RF-MOD-04: padrão, criação, validação, nome único, alteração, remoção, perfis, isolamento com RLS e auditoria. */
class AgeRangeIT extends OrganizationBase {
    @Autowired ObjectMapper json;

    private static MockHttpServletRequestBuilder list() {
        return MockMvcRequestBuilders.get("/api/v1/age-ranges");
    }

    private static MockHttpServletRequestBuilder create(String body) {
        return MockMvcRequestBuilders.post("/api/v1/age-ranges").contentType("application/json").content(body);
    }

    private static MockHttpServletRequestBuilder change(UUID id, String body) {
        return MockMvcRequestBuilders.put("/api/v1/age-ranges/" + id).contentType("application/json").content(body);
    }

    private static MockHttpServletRequestBuilder remove(UUID id) {
        return MockMvcRequestBuilders.delete("/api/v1/age-ranges/" + id);
    }

    private MockHttpServletResponse send(MockHttpServletRequestBuilder request, AccountPrincipal who) throws Exception {
        return call(request, who).getResponse();
    }

    private JsonNode body(MockHttpServletResponse r) throws Exception {
        return json.readTree(r.getContentAsString());
    }

    private UUID idOf(Tenant t, String name) {
        return adminJdbc().queryForObject("select id from age_range where organization_id = ? and name = ?", UUID.class, t.orgId(), name);
    }

    private int count(Tenant t) {
        return adminJdbc().queryForObject("select count(*) from age_range where organization_id = ?", Integer.class, t.orgId());
    }

    private int audits(Tenant t, String action) {
        return adminJdbc().queryForObject("select count(*) from audit_log where organization_id = ? and action = ?", Integer.class, t.orgId(), action);
    }

    @Test
    @DisplayName("CA1: organização nova tem Infantil 4-12, Juvenil 13-17 e Adulto 18+, nessa ordem, e o Coordenador gerencia")
    void defaults() throws Exception {
        var t = tenant();
        var data = body(send(list(), who(t, Role.COORDINATOR)));
        assertThat(data.get("canManage").asBoolean()).isTrue();
        var items = data.get("items");
        assertThat(items.findValuesAsText("name")).containsExactly("Infantil", "Juvenil", "Adulto");
        assertThat(items.get(0).get("minAge").asInt()).isEqualTo(4);
        assertThat(items.get(0).get("maxAge").asInt()).isEqualTo(12);
        assertThat(items.get(2).get("minAge").asInt()).isEqualTo(18);
        assertThat(items.get(2).get("maxAge").isNull()).isTrue();
    }

    @Test
    @DisplayName("CA2, CA3: cria Master sem máximo; nome repetido 409; sobreposição aceita; entradas inválidas 400 sem mudar nada")
    void createAndValidate() throws Exception {
        var t = tenant();
        var c = who(t, Role.COORDINATOR);
        var created = send(create("{\"name\":\" Master \",\"minAge\":35}"), c);
        assertThat(created.getStatus()).isEqualTo(201);
        assertThat(body(created).get("name").asText()).isEqualTo("Master");
        assertThat(body(send(list(), c)).get("items").findValuesAsText("name")).contains("Master");
        for (String name : new String[] {"infantil", "INFANTIL", "Infântil"}) {
            var r = send(create("{\"name\":\"" + name + "\",\"minAge\":4}"), c);
            assertThat(r.getStatus()).as(name).isEqualTo(409);
            assertThat(r.getContentAsString()).contains("AGE_RANGE_NAME_TAKEN");
        }
        assertThat(send(create("{\"name\":\"Kids\",\"minAge\":4,\"maxAge\":12}"), c).getStatus()).isEqualTo(201);
        int before = count(t);
        UUID master = idOf(t, "Master");
        for (String bad : new String[] {"{\"minAge\":5}", "{\"name\":\"\",\"minAge\":5}", "{\"name\":\"a\",\"minAge\":5}",
                "{\"name\":\"" + "x".repeat(41) + "\",\"minAge\":5}", "{\"name\":\"Teste\"}", "{\"name\":\"Teste\",\"minAge\":-1}",
                "{\"name\":\"Teste\",\"minAge\":121}", "{\"name\":\"Teste\",\"minAge\":10,\"maxAge\":9}", "{\"name\":\"Teste\",\"minAge\":10,\"maxAge\":121}"}) {
            assertThat(send(create(bad), c).getStatus()).as(bad).isEqualTo(400);
            assertThat(send(change(master, bad), c).getStatus()).as(bad).isEqualTo(400);
        }
        assertThat(count(t)).isEqualTo(before);
        assertThat(adminJdbc().queryForObject("select name || min_age from age_range where id = ?", String.class, master)).isEqualTo("Master35");
        assertThat(send(create("{\"name\":\"Maiores\",\"minAge\":60,\"maxAge\":120}"), c).getStatus()).isEqualTo(201);
    }

    @Test
    @DisplayName("CA4, CA8: altera com auditoria antes e depois; mesmos valores sem nova auditoria; nome de outra faixa 409; 404 inexistente")
    void update() throws Exception {
        var t = tenant();
        var c = who(t, Role.COORDINATOR);
        UUID id = idOf(t, "Juvenil");
        var r = send(change(id, "{\"name\":\"Teen\",\"minAge\":12,\"maxAge\":16}"), c);
        assertThat(r.getStatus()).isEqualTo(200);
        assertThat(body(r).get("name").asText()).isEqualTo("Teen");
        assertThat(body(r).get("maxAge").asInt()).isEqualTo(16);
        assertThat(audits(t, "age_range.updated")).isEqualTo(1);
        assertThat(send(change(id, "{\"name\":\"Teen\",\"minAge\":12,\"maxAge\":16}"), c).getStatus()).isEqualTo(200);
        assertThat(audits(t, "age_range.updated")).isEqualTo(1);
        var clash = send(change(id, "{\"name\":\"adulto\",\"minAge\":12}"), c);
        assertThat(clash.getStatus()).isEqualTo(409);
        assertThat(clash.getContentAsString()).contains("AGE_RANGE_NAME_TAKEN");
        assertThat(adminJdbc().queryForObject("select name from age_range where id = ?", String.class, id)).isEqualTo("Teen");
        // mudar só a caixa do próprio nome não conflita com ela mesma
        assertThat(send(change(id, "{\"name\":\"TEEN\",\"minAge\":12,\"maxAge\":16}"), c).getStatus()).isEqualTo(200);
        assertThat(send(change(UUID.randomUUID(), "{\"name\":\"Teen\",\"minAge\":12}"), c).getStatus()).isEqualTo(404);
        var data = adminJdbc().queryForList("select actor_id::text || actor_profile || coalesce(before_data::text, '') || coalesce(after_data::text, '') "
                + "from audit_log where organization_id = ? and action = 'age_range.updated' order by occurred_at", String.class, t.orgId());
        assertThat(data).hasSize(2);
        assertThat(data.get(0)).contains("Juvenil", "Teen");
        data.forEach(s -> assertThat(s).doesNotContain("@", "password", "token"));
    }

    @Test
    @DisplayName("CA5, CA8: apaga com auditoria, some da lista e apagar de novo dá 404")
    void remove() throws Exception {
        var t = tenant();
        var c = who(t, Role.COORDINATOR);
        UUID id = idOf(t, "Adulto");
        assertThat(send(remove(id), c).getStatus()).isEqualTo(204);
        assertThat(body(send(list(), c)).get("items").findValuesAsText("name")).doesNotContain("Adulto");
        assertThat(audits(t, "age_range.deleted")).isEqualTo(1);
        assertThat(send(remove(id), c).getStatus()).isEqualTo(404);
        assertThat(audits(t, "age_range.deleted")).isEqualTo(1);
    }

    private void klass(Tenant t, UUID modality, UUID teacher, UUID range, String name, String status) {
        adminJdbc().update("insert into training_class (id, organization_id, unit_id, name, name_key, modality_id, age_range_id, head_teacher_id, status) "
                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?)", UUID.randomUUID(), t.orgId(), t.unitId(), name, name.toLowerCase(), modality, range, teacher, status);
    }

    @Test
    @DisplayName("CA9: usedIn conta turmas (até dois nomes, em ordem, desativadas contam), sem vazar de outra organização; lastChange nulo e depois preenchido")
    void usedInAndLastChange() throws Exception {
        var t = tenant();
        var other = tenant();
        var c = who(t, Role.COORDINATOR);
        UUID modality = adminJdbc().queryForObject("select id from modality limit 1", UUID.class);
        UUID teacher = UUID.randomUUID();
        adminJdbc().update("insert into teacher (id, organization_id, name, name_key) values (?, ?, 'Prof', 'prof')", teacher, t.orgId());
        adminJdbc().update("insert into teacher (id, organization_id, name, name_key) values (?, ?, 'Prof', 'prof')", UUID.randomUUID(), other.orgId());
        UUID teacherOther = adminJdbc().queryForObject("select id from teacher where organization_id = ?", UUID.class, other.orgId());
        for (UUID org : new UUID[] {t.orgId(), other.orgId()})
            adminJdbc().update("insert into organization_modality (organization_id, modality_id, active) values (?, ?, true) on conflict do nothing", org, modality);
        klass(t, modality, teacher, idOf(t, "Infantil"), "Turma B", "ACTIVE");
        klass(t, modality, teacher, idOf(t, "Infantil"), "Turma A", "INACTIVE");
        klass(t, modality, teacher, idOf(t, "Infantil"), "Turma C", "ACTIVE");
        klass(t, modality, teacher, idOf(t, "Juvenil"), "Turma J", "ACTIVE");
        klass(other, modality, teacherOther, idOf(other, "Adulto"), "Turma X", "ACTIVE");

        var first = body(send(list(), c));
        assertThat(first.get("lastChange").isNull()).isTrue();
        var items = first.get("items");
        assertThat(items.get(0).get("usedIn").get("count").asInt()).isEqualTo(3);
        assertThat(items.get(0).get("usedIn").get("names")).hasSize(2);
        assertThat(items.get(0).get("usedIn").get("names").get(0).asText()).isEqualTo("Turma A");
        assertThat(items.get(0).get("usedIn").get("names").get(1).asText()).isEqualTo("Turma B");
        assertThat(items.get(1).get("usedIn").get("count").asInt()).isEqualTo(1);
        assertThat(items.get(2).get("usedIn").get("count").asInt()).isZero();
        assertThat(items.get(2).get("usedIn").get("names")).isEmpty();

        assertThat(send(create("{\"name\":\"Master\",\"minAge\":35}"), c).getStatus()).isEqualTo(201);
        var last = body(send(list(), c)).get("lastChange");
        assertThat(last.get("at").isNull()).isFalse();
        assertThat(body(send(list(), who(other, Role.COORDINATOR))).get("lastChange").isNull()).isTrue();
        var put = body(send(change(idOf(t, "Infantil"), "{\"name\":\"Infantil\",\"minAge\":4,\"maxAge\":11}"), c));
        assertThat(put.get("usedIn").get("count").asInt()).isEqualTo(3);
    }

    @Test
    @DisplayName("CA6: Administrador lê sem gerenciar e não escreve; Professor e portal 403; anônimo 401")
    void permissions() throws Exception {
        var t = tenant();
        UUID id = idOf(t, "Infantil");
        assertThat(send(list(), null).getStatus()).isEqualTo(401);
        assertThat(send(create("{\"name\":\"Nova\",\"minAge\":1}"), null).getStatus()).isEqualTo(401);
        for (Role role : new Role[] {Role.ADMINISTRATOR, Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            var who = who(t, role);
            assertThat(send(create("{\"name\":\"Nova\",\"minAge\":1}"), who).getStatus()).as(role.name()).isEqualTo(403);
            assertThat(send(change(id, "{\"name\":\"Nova\",\"minAge\":1}"), who).getStatus()).as(role.name()).isEqualTo(403);
            assertThat(send(remove(id), who).getStatus()).as(role.name()).isEqualTo(403);
            var read = send(list(), who);
            assertThat(read.getStatus()).as(role.name()).isEqualTo(role == Role.ADMINISTRATOR ? 200 : 403);
            if (role == Role.ADMINISTRATOR) assertThat(body(read).get("canManage").asBoolean()).isFalse();
        }
        assertThat(count(t)).isEqualTo(3);
        assertThat(adminJdbc().queryForObject("select name from age_range where id = ?", String.class, id)).isEqualTo("Infantil");
    }

    @Test
    @DisplayName("CA7: outra organização 404 sem mudar nada; faixas separadas; RLS com ctcore_app")
    void isolation() throws Exception {
        var a = tenant();
        var b = tenant();
        var ca = who(a, Role.COORDINATOR);
        UUID other = idOf(b, "Adulto");
        assertThat(send(change(other, "{\"name\":\"Invasor\",\"minAge\":1}"), ca).getStatus()).isEqualTo(404);
        assertThat(send(remove(other), ca).getStatus()).isEqualTo(404);
        assertThat(adminJdbc().queryForObject("select name from age_range where id = ?", String.class, other)).isEqualTo("Adulto");
        assertThat(body(send(list(), ca)).get("items")).hasSize(3);
        assertThat(send(create("{\"name\":\"Extra\",\"minAge\":1}"), ca).getStatus()).isEqualTo(201);
        assertThat(count(b)).isEqualTo(3);

        try (Connection app = DriverManager.getConnection(POSTGRES.getJdbcUrl(), "ctcore_app", "synthetic_runtime"); Statement sql = app.createStatement()) {
            app.setAutoCommit(false);
            sql.execute("select set_config('app.organization_id', '', true)");
            try (var rows = sql.executeQuery("select 1 from age_range")) {
                assertThat(rows.next()).isFalse();
            }
            sql.execute("select set_config('app.organization_id', '" + a.orgId() + "', true)");
            try (var rows = sql.executeQuery("select count(*), count(distinct organization_id) from age_range")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getInt(1)).isEqualTo(4);
                assertThat(rows.getInt(2)).isEqualTo(1);
            }
            assertThatThrownBy(() -> sql.executeUpdate("insert into age_range (id, organization_id, name, name_key, min_age) values (gen_random_uuid(), '"
                    + b.orgId() + "', 'X', 'x', 1)")).hasMessageContaining("row-level security");
            app.rollback();
        }
    }
}
