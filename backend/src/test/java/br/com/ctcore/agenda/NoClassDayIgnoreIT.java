package br.com.ctcore.agenda;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** RF-AGE-05 (#474): POST /no-class-days/ignored-holidays, com banco real. */
class NoClassDayIgnoreIT extends NoClassDayBase {
    private static final String IGNORE = PATH + "/ignored-holidays";

    private int rows(Tenant t) {
        return adminJdbc().queryForObject("select count(*) from no_class_day_ignored_holiday where organization_id = ?", Integer.class, t.orgId());
    }

    @Test
    @DisplayName("CA11: ignora, repetir devolve 204 sem duplicar, a sugestão some só nessa unidade e a auditoria não leva dado extra")
    void ignores() throws Exception {
        var t = tenant();
        var second = secondUnit(t);
        var coord = who(t, Role.COORDINATOR);
        String date = Holidays.next12Months(TODAY).get(0).date().toString();
        var in = Map.of("unitId", t.unitId().toString(), "date", date);

        assertThat(send(MockMvcRequestBuilders.post(IGNORE), in, coord).getStatus()).isEqualTo(204);
        assertThat(send(MockMvcRequestBuilders.post(IGNORE), in, coord).getStatus()).isEqualTo(204);
        assertThat(rows(t)).isEqualTo(1);
        assertThat(body(get(PATH + "?unitId=" + t.unitId(), coord), 200).get("suggestions").findValuesAsText("date")).doesNotContain(date);
        assertThat(body(get(PATH + "?unitId=" + second.unitId(), coord), 200).get("suggestions").findValuesAsText("date")).contains(date);
        assertThat(adminJdbc().queryForObject("select count(*) from audit_log where action = 'no_class_day.holiday_ignored' and organization_id = ?", Integer.class,
                t.orgId())).isEqualTo(1);
        String after = adminJdbc().queryForObject("select after_data::text from audit_log where action = 'no_class_day.holiday_ignored' and organization_id = ?",
                String.class, t.orgId());
        assertThat(json.readTree(after).fieldNames()).toIterable().containsExactly("date");
    }

    @Test
    @DisplayName("CA11: data que não é feriado 422 em date; data inválida 400; perfis sem permissão 403; sem sessão 401")
    void validationAndProfiles() throws Exception {
        var t = tenant();
        var coord = who(t, Role.COORDINATOR);
        var notHoliday = send(MockMvcRequestBuilders.post(IGNORE), Map.of("unitId", t.unitId().toString(), "date", TODAY.plusYears(2).toString()), coord);
        assertThat(notHoliday.getStatus()).isEqualTo(422);
        assertThat(field(notHoliday)).isEqualTo("date");
        assertThat(send(MockMvcRequestBuilders.post(IGNORE), Map.of("unitId", t.unitId().toString(), "date", "x"), coord).getStatus()).isEqualTo(400);
        String date = Holidays.next12Months(TODAY).get(0).date().toString();
        var in = Map.of("unitId", t.unitId().toString(), "date", date);
        for (Role r : new Role[] {Role.TEACHER, Role.STUDENT, Role.GUARDIAN}) {
            assertThat(send(MockMvcRequestBuilders.post(IGNORE), in, who(t, r)).getStatus()).as(r.name()).isEqualTo(403);
        }
        assertThat(send(MockMvcRequestBuilders.post(IGNORE), in, null).getStatus()).isEqualTo(401);
        assertThat(rows(t)).isZero();
    }

    @Test
    @DisplayName("CA11: Administrador de outra unidade e unidade de outra organização 404; a organização B não vê nem altera o que a A ignorou")
    void isolation() throws Exception {
        var a = tenant();
        var b = tenant();
        var secondOfA = secondUnit(a);
        String date = Holidays.next12Months(TODAY).get(0).date().toString();
        var admin = admin(a, a.unitId());
        assertThat(send(MockMvcRequestBuilders.post(IGNORE), Map.of("unitId", secondOfA.unitId().toString(), "date", date), admin).getStatus()).isEqualTo(404);
        assertThat(send(MockMvcRequestBuilders.post(IGNORE), Map.of("unitId", b.unitId().toString(), "date", date), who(a, Role.COORDINATOR)).getStatus())
                .isEqualTo(404);
        assertThat(send(MockMvcRequestBuilders.post(IGNORE), Map.of("unitId", a.unitId().toString(), "date", date), admin).getStatus()).isEqualTo(204);
        assertThat(rows(a)).isEqualTo(1);
        assertThat(rows(b)).isZero();
        JsonNode viewB = body(get(PATH, who(b, Role.COORDINATOR)), 200);
        assertThat(viewB.get("suggestions").findValuesAsText("date")).contains(date);
        assertThat(adminJdbc().queryForObject("select count(*) from no_class_day_ignored_holiday where unit_id = ?", Integer.class, b.unitId())).isZero();
    }
}
