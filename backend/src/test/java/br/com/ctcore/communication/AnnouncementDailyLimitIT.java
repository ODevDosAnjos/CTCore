package br.com.ctcore.communication;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

/** RF-COM-01 (#491, CA7): contagem do dia local da unidade (enviados e agendados, sem os cancelados) e o limite próprio da organização. */
class AnnouncementDailyLimitIT extends AnnouncementBase {
    private static String now() {
        return Instant.now().toString();
    }

    @Test
    @DisplayName("CA7: Coordenador vê a unidade e a organização; conta enviados e agendados de hoje, não conta ontem, outra unidade nem cancelado; limite 20")
    void coordinator() throws Exception {
        Tenant t = tenant();
        UUID second = secondUnit(t);
        AccountPrincipal coordinator = account(t, Role.COORDINATOR);
        announcement(t, coordinator, "UNIT", t.unitId(), null, "GENERAL", "Enviado", null, now());
        UUID scheduled = announcement(t, coordinator, "UNIT", t.unitId(), null, "GENERAL", "Agendado", now(), null);
        announcement(t, coordinator, "UNIT", t.unitId(), null, "GENERAL", "Ontem", null, Instant.now().minusSeconds(3 * 86400).toString());
        announcement(t, coordinator, "UNIT", second, null, "GENERAL", "Outra", null, now());
        announcement(t, coordinator, "ORGANIZATION", null, null, "GENERAL", "Todas", null, now());

        JsonNode body = ok(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + t.unitId(), coordinator), 200);
        assertThat(body.get("unit").get("id").asText()).isEqualTo(t.unitId().toString());
        assertThat(body.get("unit").get("used").asInt()).isEqualTo(2);
        assertThat(body.get("unit").get("limit").asInt()).isEqualTo(20);
        assertThat(body.get("organization").get("used").asInt()).isEqualTo(1);
        assertThat(body.get("organization").get("limit").asInt()).isEqualTo(20);

        ok(send(HttpMethod.DELETE, "/announcements/" + scheduled, coordinator), 204);
        assertThat(ok(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + t.unitId(), coordinator), 200).get("unit").get("used").asInt()).isEqualTo(1);
        assertThat(ok(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + second, coordinator), 200).get("unit").get("used").asInt()).isEqualTo(1);
    }

    @Test
    @DisplayName("Administrador só recebe a unidade (organization nulo); sem unitId vale a única unidade do alcance; com duas unidades e sem unitId é 400")
    void administrator() throws Exception {
        Tenant t = tenant();
        UUID second = secondUnit(t);
        AccountPrincipal coordinator = account(t, Role.COORDINATOR);
        announcement(t, coordinator, "UNIT", t.unitId(), null, "GENERAL", "Enviado", null, now());
        AccountPrincipal admin = accountIn(t, Role.ADMINISTRATOR, t.unitId());
        JsonNode body = ok(send(HttpMethod.GET, "/announcements/daily-limit", admin), 200);
        assertThat(body.get("organization").isNull()).isTrue();
        assertThat(body.get("unit").get("used").asInt()).isEqualTo(1);
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit", coordinator).getStatus()).isEqualTo(400);
        assertThat(send(HttpMethod.GET, "/announcements/daily-limit?unitId=" + second, admin).getStatus()).isEqualTo(403);
    }
}
