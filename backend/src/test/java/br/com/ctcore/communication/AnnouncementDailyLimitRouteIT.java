package br.com.ctcore.communication;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

/** RF-COM-01 (#491, CA7, CA19): permissão por perfil e isolamento entre organizações na rota do limite diário. */
class AnnouncementDailyLimitRouteIT extends AnnouncementBase {
    @Test
    @DisplayName("CA19: Aluno, Responsável e Professor sem a permissão recebem 403; anônimo 401")
    void profiles() throws Exception {
        Tenant t = tenant();
        adminJdbc().update("update unit_settings set teacher_permissions = '{false,true,true,true,false}' where unit_id = ?", t.unitId());
        for (Role role : new Role[] {Role.STUDENT, Role.GUARDIAN}) {
            assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + t.unitId(), account(t, role)).getStatus()).as(role.name()).isEqualTo(403);
        }
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + t.unitId(), accountIn(t, Role.TEACHER, t.unitId())).getStatus()).isEqualTo(403);
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + t.unitId(), null).getStatus()).isEqualTo(401);
    }

    @Test
    @DisplayName("CA19: unitId de outra organização ou inexistente é 404 e a contagem da outra organização nunca aparece")
    void organizations() throws Exception {
        Tenant a = tenant(), b = tenant();
        AccountPrincipal coordinatorA = account(a, Role.COORDINATOR), coordinatorB = account(b, Role.COORDINATOR);
        sentToUnit(a, coordinatorA, "Da A", java.time.Instant.now().toString());
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + a.unitId(), coordinatorB).getStatus()).isEqualTo(404);
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + UUID.randomUUID(), coordinatorB).getStatus()).isEqualTo(404);
        var own = ok(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + b.unitId(), coordinatorB), 200);
        assertThat(own.get("unit").get("used").asInt()).isZero();
        assertThat(own.get("organization").get("used").asInt()).isZero();
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + b.unitId(), accountIn(a, Role.ADMINISTRATOR, a.unitId())).getStatus()).isEqualTo(404);
        assertThat(count("select count(*) from audit_log where organization_id = ? and action like 'announcement%'", a.orgId())).isZero();
    }
}
