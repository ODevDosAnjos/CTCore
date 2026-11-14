package br.com.ctcore.plan;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import br.com.ctcore.modality.Modalities;
import br.com.ctcore.organization.OrganizationBase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RN-PLA-06, RF-PLA-03: GET /plans/{id} com última alteração, desativação e histórico de valor; isolamento e perfis. */
class PlanDetailIT extends OrganizationBase {
    @Autowired ObjectMapper json;

    @AfterEach
    void clean() {
        adminJdbc().update("delete from plan_value_history");
        adminJdbc().update("delete from plan");
    }

    private MockHttpServletResponse get(UUID id, AccountPrincipal who) throws Exception {
        return call(MockMvcRequestBuilders.get("/api/v1/plans/" + id), who).getResponse();
    }

    private UUID plan(Tenant t, UUID unit, String name, String status) {
        UUID id = UUID.randomUUID();
        UUID modality = adminJdbc().queryForObject("select id from modality where name = 'Judô'", UUID.class);
        adminJdbc().update("insert into plan (id, organization_id, unit_id, modality_id, name, name_key, value_cents, weekly_frequency, status) values (?, ?, ?, ?, ?, ?, 22000, 3, ?)",
                id, t.orgId(), unit, modality, name, Modalities.normalize(name), status);
        return id;
    }

    private UUID account(String name) {
        UUID id = UUID.randomUUID();
        adminJdbc().update("insert into account (id, email, name, status) values (?, ?, ?, 'ACTIVE')", id, id + "@synthetic.example", name);
        return id;
    }

    private void audited(Tenant t, UUID actor, String action, UUID plan, String when) {
        adminJdbc().update("insert into audit_log (organization_id, unit_id, actor_type, actor_id, action, entity_type, entity_id, occurred_at) "
                + "values (?, ?, 'ACCOUNT', ?, ?, 'plan', ?, ?::timestamptz)", t.orgId(), t.unitId(), actor, action, plan.toString(), when);
    }

    private void history(Tenant t, UUID plan, long cents, String startsOn, UUID by) {
        adminJdbc().update("insert into plan_value_history (organization_id, plan_id, value_cents, starts_on, created_by) values (?, ?, ?, ?::date, ?)",
                t.orgId(), plan, cents, startsOn, by);
    }

    @Test
    @DisplayName("CA13 (RN-PLA-06): plano desativado traz lastChange, deactivation e histórico do mais novo para o mais antigo, autor ausente nulo; não grava auditoria")
    void detail() throws Exception {
        var t = tenant();
        UUID carla = account("Carla Mendes");
        UUID id = plan(t, t.unitId(), "Adulto 2x (antigo)", "INACTIVE");
        history(t, id, 18000, "2026-01-10", null);
        history(t, id, 22000, "2026-05-02", carla);
        audited(t, carla, "plan.updated", id, "2026-05-02T10:00:00Z");
        audited(t, carla, "plan.deactivated", id, "2026-08-01T12:30:00Z");
        int before = adminJdbc().queryForObject("select count(*) from audit_log where organization_id = ?", Integer.class, t.orgId());

        var r = get(id, who(t, Role.COORDINATOR));
        assertThat(r.getStatus()).isEqualTo(200);
        JsonNode b = json.readTree(r.getContentAsString());
        assertThat(b.get("name").asText()).isEqualTo("Adulto 2x (antigo)");
        assertThat(b.get("status").asText()).isEqualTo("INACTIVE");
        assertThat(b.get("studentsUsing").asInt()).isZero();
        assertThat(b.get("lastChange").get("by").asText()).isEqualTo("Carla Mendes");
        assertThat(b.get("deactivation").get("by").asText()).isEqualTo("Carla Mendes");
        assertThat(b.get("deactivation").get("at").asText()).startsWith("2026-08-01");
        var h = b.get("valueHistory");
        assertThat(h.size()).isEqualTo(2);
        assertThat(h.get(0).get("startsOn").asText()).isEqualTo("2026-05-02");
        assertThat(h.get(0).get("valueCents").asLong()).isEqualTo(22000);
        assertThat(h.get(0).get("changedBy").asText()).isEqualTo("Carla Mendes");
        assertThat(h.get(1).get("changedBy").isNull()).isTrue();
        assertThat(adminJdbc().queryForObject("select count(*) from audit_log where organization_id = ?", Integer.class, t.orgId())).isEqualTo(before);
    }

    @Test
    @DisplayName("CA13: plano ativo sem auditoria tem lastChange e deactivation nulos")
    void active() throws Exception {
        var t = tenant();
        UUID id = plan(t, t.unitId(), "Mensal", "ACTIVE");
        JsonNode b = json.readTree(get(id, who(t, Role.COORDINATOR)).getContentAsString());
        assertThat(b.get("lastChange").isNull()).isTrue();
        assertThat(b.get("deactivation").isNull()).isTrue();
        assertThat(b.get("valueHistory").isArray()).isTrue();
    }

    @Test
    @DisplayName("CA13: outra organização e unidade fora do alcance do Administrador 404; Professor, Aluno e Responsável 403; anônimo 401")
    void isolationAndProfiles() throws Exception {
        var a = tenant();
        var b = tenant();
        UUID other = UUID.randomUUID();
        adminJdbc().update("insert into unit (id, organization_id, name, short_name) values (?, ?, 'Zona Sul', ?)", other, a.orgId(), "u" + other.toString().substring(0, 12));
        UUID mine = plan(a, a.unitId(), "Minha", "ACTIVE");
        UUID outside = plan(a, other, "Alheia", "ACTIVE");
        UUID foreign = plan(b, b.unitId(), "Dele", "ACTIVE");
        assertThat(get(mine, who(a, Role.ADMINISTRATOR)).getStatus()).isEqualTo(200);
        assertThat(get(outside, who(a, Role.ADMINISTRATOR)).getStatus()).isEqualTo(404);
        assertThat(get(outside, who(a, Role.COORDINATOR)).getStatus()).isEqualTo(200);
        assertThat(get(foreign, who(a, Role.COORDINATOR)).getStatus()).isEqualTo(404);
        assertThat(get(UUID.randomUUID(), who(a, Role.COORDINATOR)).getStatus()).isEqualTo(404);
        for (Role role : new Role[] {Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            assertThat(get(mine, who(a, role)).getStatus()).as(role.name()).isEqualTo(403);
        }
        assertThat(get(mine, null).getStatus()).isEqualTo(401);
    }
}
