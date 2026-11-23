package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.Codes;
import br.com.ctcore.identity.Role;
import br.com.ctcore.identity.SessionCookie;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RN-ORG-06 / RN-ORG-07 / RN-ASS-21 (#609): o antigo Coordenador sai sem acesso, ou fica Administrador só nas unidades marcadas. */
class CoordinationTransferKeepUnitsIT extends CoordinationTransferBase {
    @Autowired br.com.ctcore.permission.Permissions permissions;

    private UUID unit(Tenant t, boolean active) {
        return adminJdbc().queryForObject("insert into unit (organization_id, name, short_name, active) values (?, 'U', ?, ?) returning id", UUID.class,
                t.orgId(), "u-" + UUID.randomUUID(), active);
    }

    private void admins(Member member, UUID... units) {
        for (UUID u : units) {
            adminJdbc().update("insert into account_link_unit (link_id, organization_id, unit_id) values (?, ?, ?)", member.link, member.tenant.orgId(), u);
        }
    }

    private List<String> roles(UUID account) {
        return adminJdbc().queryForList("select role || ':' || status from account_link where account_id = ?", String.class, account);
    }

    private int sessions(Member m) {
        return adminJdbc().queryForObject("select count(*) from account_session where id = ?", Integer.class, m.session);
    }

    private MockHttpServletResponse withSession(MockHttpServletRequestBuilder request, Member who) throws Exception {
        request.secure(true).cookie(new Cookie(SessionCookie.NAME, who.sessionToken))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf());
        return mvc.perform(request).andReturn().getResponse();
    }

    @Test
    @DisplayName("CA1 / CA2 / CA11 / CA17: sem unidades, o vínculo do antigo termina, a sessão de gestão sai, a do portal fica e o e-mail sai")
    void withoutUnits() throws Exception {
        var t = tenant();
        var a = new Member(t, Role.COORDINATOR, "ACTIVE");
        var b = new Member(t, Role.ADMINISTRATOR, "ACTIVE");
        UUID portalLink = UUID.randomUUID();
        UUID portalSession = UUID.randomUUID();
        adminJdbc().update("insert into account_link (id, account_id, organization_id, role, status) values (?, ?, ?, 'STUDENT', 'ACTIVE')", portalLink, a.account, t.orgId());
        adminJdbc().update("insert into account_session (id, account_id, token_hash, active_link_id, expires_at) values (?, ?, ?, ?, now() + interval '1 hour')",
                portalSession, a.account, Codes.hash("portal-" + a.account), portalLink);
        assertThat(withSession(MockMvcRequestBuilders.get("/api/v1/organization"), a).getStatus()).isEqualTo(200);

        var response = send(a, b.email, "TRANSFERIR", a.reauth);

        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(204);
        assertThat(b.role()).isEqualTo("COORDINATOR");
        assertThat(roles(a.account)).containsExactlyInAnyOrder("COORDINATOR:ENDED", "STUDENT:ACTIVE");
        assertThat(sessions(a)).isZero();
        assertThat(adminJdbc().queryForObject("select count(*) from account_session where id = ?", Integer.class, portalSession)).isEqualTo(1);
        assertThat(withSession(MockMvcRequestBuilders.get("/api/v1/organization"), a).getStatus()).isEqualTo(401);
        assertThat(emails(b.email)).isEqualTo(1);
        assertThat(audit(t).get(0).toString()).contains("keptUnitIds", "seats");
    }

    @Test
    @DisplayName("CA3 / CA4 / CA9: com unidades, o antigo é Administrador só nelas, reaproveita a linha encerrada, mantém a sessão e a auditoria traz as unidades e as vagas")
    void withUnits() throws Exception {
        var t = tenant();
        UUID second = unit(t, true);
        unit(t, true);
        var a = new Member(t, Role.COORDINATOR, "ACTIVE");
        var b = new Member(t, Role.ADMINISTRATOR, "ACTIVE");
        adminJdbc().update("insert into account_link (account_id, organization_id, role, status, ends_on) values (?, ?, 'ADMINISTRATOR', 'ENDED', current_date)", a.account, t.orgId());

        var response = send(a, b.email, "TRANSFERIR", a.reauth, t.unitId(), second);

        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(204);
        assertThat(roles(a.account)).containsExactlyInAnyOrder("COORDINATOR:ENDED", "ADMINISTRATOR:ACTIVE");
        assertThat(adminJdbc().queryForList("select lu.unit_id from account_link_unit lu join account_link l on l.id = lu.link_id "
                + "where l.account_id = ? and l.status = 'ACTIVE'", UUID.class, a.account)).containsExactlyInAnyOrder(t.unitId(), second);
        assertThat(sessions(a)).isEqualTo(1);
        var reachable = withSession(MockMvcRequestBuilders.get("/api/v1/units/reachable"), a);
        assertThat(reachable.getStatus()).isEqualTo(200);
        assertThat(reachable.getContentAsString()).contains(t.unitId().toString(), second.toString());
        String trail = audit(t).get(0).toString();
        assertThat(trail).contains("keptUnitIds", t.unitId().toString(), second.toString(), "seats").doesNotContain(a.reauth, "password");
    }

    @Test
    @DisplayName("CA5 / CA10: unidade inativa, de outra organização, inexistente ou repetida dá 400 em keepUnitIds, nada muda e o token não é gasto")
    void invalidUnits() throws Exception {
        var t = tenant();
        var other = tenant();
        var a = new Member(t, Role.COORDINATOR, "ACTIVE");
        var b = new Member(t, Role.ADMINISTRATOR, "ACTIVE");
        UUID inactive = unit(t, false);
        for (UUID[] keep : new UUID[][] {{inactive}, {other.unitId()}, {UUID.randomUUID()}, {t.unitId(), t.unitId()}}) {
            var response = send(a, b.email, "TRANSFERIR", a.reauth, keep);
            assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(400);
            assertThat(response.getContentAsString()).contains("\"field\":\"keepUnitIds\"");
        }
        untouched(a, b);
        assertThat(audits(other)).isZero();
        assertThat(send(a, b.email, "TRANSFERIR", a.reauth, t.unitId()).getStatus()).isEqualTo(204);
    }

    @Test
    @DisplayName("CA6 / CA7: o escolhido era o único Administrador de uma unidade não marcada dá 409 e nada muda; marcando, ou com outro Administrador, dá 204")
    void lastAdministrator() throws Exception {
        var t = tenant();
        UUID x = unit(t, true);
        var a = new Member(t, Role.COORDINATOR, "ACTIVE");
        var b = new Member(t, Role.ADMINISTRATOR, "ACTIVE");
        admins(b, x);

        var refused = send(a, b.email, "TRANSFERIR", a.reauth);

        assertThat(refused.getStatus()).as(refused.getContentAsString()).isEqualTo(409);
        assertThat(refused.getContentAsString()).contains("LAST_UNIT_ADMINISTRATOR", x.toString());
        untouched(a, b);
        assertThat(send(a, b.email, "TRANSFERIR", a.reauth, x).getStatus()).isEqualTo(204);

        var u = tenant();
        UUID y = unit(u, true);
        var c = new Member(u, Role.COORDINATOR, "ACTIVE");
        var d = new Member(u, Role.ADMINISTRATOR, "ACTIVE");
        var e = new Member(u, Role.ADMINISTRATOR, "ACTIVE");
        admins(d, y);
        admins(e, y);
        assertThat(send(c, d.email, "TRANSFERIR", c.reauth).getStatus()).isEqualTo(204);
        assertThat(roles(c.account)).containsExactly("COORDINATOR:ENDED");
    }

    @Test
    @DisplayName("CA8: só o Coordenador lê o valor da vaga; o valor vem da configuração")
    void seatPrice() throws Exception {
        var t = tenant();
        var a = new Member(t, Role.COORDINATOR, "ACTIVE");
        var get = MockMvcRequestBuilders.get("/api/v1/organization/admin-seat-price");
        var ok = call(get, a.principal()).getResponse();
        assertThat(ok.getStatus()).isEqualTo(200);
        assertThat(ok.getContentAsString()).contains("\"adminSeatCents\":5000");
        for (Role role : List.of(Role.ADMINISTRATOR, Role.TEACHER, Role.STUDENT)) {
            assertThat(call(MockMvcRequestBuilders.get("/api/v1/organization/admin-seat-price"), new Member(t, role, "ACTIVE").principal()).getResponse().getStatus())
                    .as(role.name()).isEqualTo(403);
        }
        assertThat(call(MockMvcRequestBuilders.get("/api/v1/organization/admin-seat-price"), null).getResponse().getStatus()).isEqualTo(401);
        var other = new OrganizationController(null, null, permissions, 7000);
        assertThat(other.adminSeatPrice(a.principal())).isEqualTo(new OrganizationController.SeatPrice(7000));
    }
}
