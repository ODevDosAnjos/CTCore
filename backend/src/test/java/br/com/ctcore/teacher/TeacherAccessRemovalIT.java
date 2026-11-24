package br.com.ctcore.teacher;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Codes;
import br.com.ctcore.identity.Role;
import br.com.ctcore.modality.Modalities;
import br.com.ctcore.organization.OrganizationBase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RF-PRO-02 / RN-PRO-02 / RN-ACE-20: remover o acesso do professor sem inativar o cadastro, com banco real. */
class TeacherAccessRemovalIT extends OrganizationBase {
    @Autowired ObjectMapper json;

    @BeforeEach
    void clean() {
        truncateCascade(adminJdbc(), "organization", "account");
    }

    private record Prof(UUID id, UUID account, UUID link) {}

    private AccountPrincipal manager(Tenant t, Role role, UUID... units) {
        UUID account = UUID.randomUUID();
        adminJdbc().update("insert into account (id, email, name, status) values (?, ?, 'Ator', 'ACTIVE')", account, "ator-" + account + "@synthetic.example");
        return new AccountPrincipal(account, UUID.randomUUID(), UUID.randomUUID(), t.orgId(), role, Set.of(units));
    }

    private UUID unit(Tenant t, String name) {
        UUID id = UUID.randomUUID();
        adminJdbc().update("insert into unit (id, organization_id, name, short_name, active) values (?, ?, ?, ?, true)", id, t.orgId(), name,
                "u" + id.toString().substring(0, 12));
        return id;
    }

    /** Professor ativo, com conta, vínculo de Professor no estado dado e nas unidades dadas (todas também em teacher_unit). */
    private Prof teacher(Tenant t, String linkStatus, UUID... units) {
        UUID id = UUID.randomUUID(), account = UUID.randomUUID(), link = UUID.randomUUID();
        String email = "prof-" + id + "@synthetic.example";
        adminJdbc().update("insert into account (id, email, name, status) values (?, ?, 'Ana', 'ACTIVE')", account, email);
        adminJdbc().update("insert into teacher (id, organization_id, name, name_key, email, status, account_id) values (?, ?, 'Ana', ?, ?, 'ACTIVE', ?)",
                id, t.orgId(), Modalities.normalize("Ana"), email, account);
        adminJdbc().update("insert into account_link (id, account_id, organization_id, role, status) values (?, ?, ?, 'TEACHER', ?)", link, account, t.orgId(), linkStatus);
        for (UUID unit : units) {
            adminJdbc().update("insert into teacher_unit (organization_id, teacher_id, unit_id) values (?, ?, ?)", t.orgId(), id, unit);
            adminJdbc().update("insert into account_link_unit (link_id, organization_id, unit_id) values (?, ?, ?)", link, t.orgId(), unit);
        }
        return new Prof(id, account, link);
    }

    private void session(UUID account, UUID link) {
        adminJdbc().update("insert into account_session (id, account_id, token_hash, active_link_id, expires_at) values (?, ?, ?, ?, now() + interval '1 hour')",
                UUID.randomUUID(), account, Codes.hash("s-" + UUID.randomUUID()), link);
    }

    private int sessions(UUID account) {
        return adminJdbc().queryForObject("select count(*) from account_session where account_id = ?", Integer.class, account);
    }

    private String linkStatus(UUID link) {
        return adminJdbc().queryForObject("select status from account_link where id = ?", String.class, link);
    }

    private Set<UUID> linkUnits(UUID link) {
        return Set.copyOf(adminJdbc().queryForList("select unit_id from account_link_unit where link_id = ?", UUID.class, link));
    }

    private MockHttpServletResponse remove(UUID teacher, AccountPrincipal who) throws Exception {
        return call(MockMvcRequestBuilders.delete("/api/v1/teachers/" + teacher + "/access"), who).getResponse();
    }

    private MockHttpServletResponse preview(UUID teacher, AccountPrincipal who) throws Exception {
        return call(MockMvcRequestBuilders.get("/api/v1/teachers/" + teacher + "/access-removal"), who).getResponse();
    }

    private JsonNode body(MockHttpServletResponse r) throws Exception {
        return json.readTree(r.getContentAsString());
    }

    private int audits(Tenant t) {
        return adminJdbc().queryForObject("select count(*) from audit_log where organization_id = ? and action = 'teacher.access_removed'", Integer.class, t.orgId());
    }

    @Test
    @DisplayName("CA1, CA5, CA8: Coordenador remove em todas as unidades; cadastro, status e turma ficam; sessões de gestão saem e o vínculo de aluno segue; auditoria sem sessão")
    void coordinatorRemovesAll() throws Exception {
        var t = tenant();
        UUID b = unit(t, "Zona Sul");
        var p = teacher(t, "ACTIVE", t.unitId(), b);
        adminJdbc().update("insert into account_link (account_id, organization_id, role, status) values (?, ?, 'STUDENT', 'ACTIVE')", p.account(), t.orgId());
        session(p.account(), p.link());
        var r = remove(p.id(), manager(t, Role.COORDINATOR));
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("access").asText()).isEqualTo("ENDED");
        assertThat(body(r).get("status").asText()).isEqualTo("ACTIVE");
        assertThat(linkStatus(p.link())).isEqualTo("ENDED");
        assertThat(adminJdbc().queryForObject("select status from teacher where id = ?", String.class, p.id())).isEqualTo("ACTIVE");
        assertThat(adminJdbc().queryForObject("select account_id from teacher where id = ?", UUID.class, p.id())).isEqualTo(p.account());
        assertThat(adminJdbc().queryForObject("select count(*) from teacher_unit where teacher_id = ?", Integer.class, p.id())).isEqualTo(2);
        assertThat(sessions(p.account())).isZero();
        assertThat(adminJdbc().queryForObject("select status from account_link where account_id = ? and role = 'STUDENT'", String.class, p.account())).isEqualTo("ACTIVE");
        var log = adminJdbc().queryForList("select coalesce(after_data::text, '') from audit_log where organization_id = ? and action = 'teacher.access_removed'",
                String.class, t.orgId());
        assertThat(log).hasSize(1);
        assertThat(log.get(0)).contains(t.unitId().toString()).doesNotContainIgnoringCase("token").doesNotContainIgnoringCase("session")
                .doesNotContainIgnoringCase("code");
    }

    @Test
    @DisplayName("CA2, CA3, CA4: Administrador tira só as unidades dele; sessões ficam; sem sobra o vínculo encerra; o outro Administrador ainda alcança")
    void administratorPartial() throws Exception {
        var t = tenant();
        UUID b = unit(t, "B"), c = unit(t, "C");
        var p = teacher(t, "ACTIVE", t.unitId(), b, c);
        session(p.account(), p.link());
        var x = manager(t, Role.ADMINISTRATOR, t.unitId());
        var y = manager(t, Role.ADMINISTRATOR, b);
        var r = remove(p.id(), x);
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("access").asText()).isEqualTo("ACTIVE");
        assertThat(linkStatus(p.link())).isEqualTo("ACTIVE");
        assertThat(linkUnits(p.link())).containsExactlyInAnyOrder(b, c);
        assertThat(sessions(p.account())).isEqualTo(1);
        assertThat(call(MockMvcRequestBuilders.get("/api/v1/teachers/" + p.id()), y).getResponse().getStatus()).isEqualTo(200);
        // Y tira a sua (B); sobra C
        assertThat(remove(p.id(), y).getStatus()).isEqualTo(200);
        assertThat(linkUnits(p.link())).containsExactly(c);
        // CA3: vínculo só em uma unidade e Administrador dela encerra
        var only = teacher(t, "ACTIVE", b);
        assertThat(remove(only.id(), y).getStatus()).isEqualTo(200);
        assertThat(linkStatus(only.link())).isEqualTo("ENDED");
    }

    @Test
    @DisplayName("CA5: com outro vínculo de gestão na conta, as sessões ficam")
    void keepsSessionsWithOtherManagementLink() throws Exception {
        var t = tenant();
        var p = teacher(t, "ACTIVE", t.unitId());
        adminJdbc().update("insert into account_link (account_id, organization_id, role, status) values (?, ?, 'ADMINISTRATOR', 'ACTIVE')", p.account(), t.orgId());
        session(p.account(), p.link());
        assertThat(remove(p.id(), manager(t, Role.COORDINATOR)).getStatus()).isEqualTo(200);
        assertThat(sessions(p.account())).isEqualTo(1);
    }

    @Test
    @DisplayName("CA6: PENDING cancela o convite e encerra; NONE e ENDED são 409; remover duas vezes é 409")
    void pendingAndRefusals() throws Exception {
        var t = tenant();
        var c = manager(t, Role.COORDINATOR);
        var p = teacher(t, "PENDING", t.unitId());
        adminJdbc().update("insert into account_invite (account_id, link_id, organization_id, code_hash, expires_at, sent_by) values (?, ?, ?, ?, now() + interval '1 day', ?)",
                p.account(), p.link(), t.orgId(), Codes.hash("c-" + p.id()), p.account());
        var r = remove(p.id(), c);
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("access").asText()).isEqualTo("ENDED");
        assertThat(adminJdbc().queryForObject("select count(*) from account_invite where link_id = ? and canceled_at is not null", Integer.class, p.link())).isEqualTo(1);
        assertThat(remove(p.id(), c).getStatus()).isEqualTo(409);
        var ended = teacher(t, "ENDED", t.unitId());
        assertThat(remove(ended.id(), c).getStatus()).isEqualTo(409);
        UUID none = UUID.randomUUID();
        adminJdbc().update("insert into teacher (id, organization_id, name, name_key, email, status) values (?, ?, 'Bia', ?, 'bia@synthetic.example', 'ACTIVE')",
                none, t.orgId(), Modalities.normalize("Bia"));
        adminJdbc().update("insert into teacher_unit (organization_id, teacher_id, unit_id) values (?, ?, ?)", t.orgId(), none, t.unitId());
        assertThat(remove(none, c).getStatus()).isEqualTo(409);
        assertThat(preview(none, c).getStatus()).isEqualTo(409);
    }

    @Test
    @DisplayName("CA7: sem unidade em comum 404, outra organização 404, vínculo fora do alcance 409, perfis sem TEACHERS 403, anônimo 401; nada muda")
    void scopeAndPermissions() throws Exception {
        var a = tenant();
        var other = tenant();
        UUID b = unit(a, "B"), far = unit(a, "Longe");
        var p = teacher(a, "ACTIVE", a.unitId(), b);
        assertThat(remove(p.id(), manager(a, Role.ADMINISTRATOR, far)).getStatus()).isEqualTo(404);
        assertThat(remove(p.id(), manager(other, Role.COORDINATOR)).getStatus()).isEqualTo(404);
        for (Role role : new Role[] {Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            assertThat(remove(p.id(), manager(a, role, a.unitId())).getStatus()).as(role.name()).isEqualTo(403);
            assertThat(preview(p.id(), manager(a, role, a.unitId())).getStatus()).as(role.name()).isEqualTo(403);
        }
        assertThat(remove(p.id(), null).getStatus()).isEqualTo(401);
        // professor alcançado por teacher_unit, mas o vínculo só tem unidade fora do alcance do Administrador
        var odd = teacher(a, "ACTIVE", b);
        adminJdbc().update("insert into teacher_unit (organization_id, teacher_id, unit_id) values (?, ?, ?)", a.orgId(), odd.id(), far);
        assertThat(remove(odd.id(), manager(a, Role.ADMINISTRATOR, far)).getStatus()).isEqualTo(409);
        assertThat(linkStatus(p.link())).isEqualTo("ACTIVE");
        assertThat(linkUnits(p.link())).containsExactlyInAnyOrder(a.unitId(), b);
        assertThat(linkStatus(odd.link())).isEqualTo("ACTIVE");
        assertThat(audits(a)).isZero();
    }

    @Test
    @DisplayName("CA9: o resumo do Administrador separa removidas e mantidas, o do Coordenador remove todas; nada muda")
    void preview() throws Exception {
        var t = tenant();
        UUID b = unit(t, "B");
        var p = teacher(t, "ACTIVE", t.unitId(), b);
        var r = preview(p.id(), manager(t, Role.ADMINISTRATOR, t.unitId()));
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("removed")).hasSize(1);
        assertThat(body(r).get("removed").get(0).get("id").asText()).isEqualTo(t.unitId().toString());
        assertThat(body(r).get("kept").get(0).get("id").asText()).isEqualTo(b.toString());
        assertThat(body(r).get("endsAccess").asBoolean()).isFalse();
        var c = body(preview(p.id(), manager(t, Role.COORDINATOR)));
        assertThat(c.get("removed")).hasSize(2);
        assertThat(c.get("kept")).isEmpty();
        assertThat(c.get("endsAccess").asBoolean()).isTrue();
        assertThat(linkStatus(p.link())).isEqualTo("ACTIVE");
        assertThat(linkUnits(p.link())).hasSize(2);
        assertThat(audits(t)).isZero();
    }

    @Test
    @DisplayName("CA10: depois de remover, dar acesso de novo volta a PENDING")
    void grantAgain() throws Exception {
        var t = tenant();
        var c = manager(t, Role.COORDINATOR);
        var p = teacher(t, "ACTIVE", t.unitId());
        assertThat(remove(p.id(), c).getStatus()).isEqualTo(200);
        var r = call(MockMvcRequestBuilders.post("/api/v1/teachers/" + p.id() + "/access"), c).getResponse();
        assertThat(r.getStatus()).as(r.getContentAsString()).isEqualTo(200);
        assertThat(body(r).get("access").asText()).isEqualTo("PENDING");
    }
}
