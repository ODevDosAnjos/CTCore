package br.com.ctcore.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.exception.FlywayValidateException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class MigrationIT extends PostgresIT {

    JdbcTemplate jdbc = adminJdbc();
    @Autowired ObjectMapper mapper;
    @Autowired Clock clock;

    @Test
    @DisplayName("CA2: a V1 foi aplicada com sucesso ao subir a aplicação")
    void v1Applied() {
        Boolean success = jdbc.queryForObject(
                "select success from flyway_schema_history where version = '1'", Boolean.class);
        assertThat(success).isTrue();
    }

    @Test
    @DisplayName("RNF-30 / CA3: migração já aplicada com conteúdo alterado faz a subida falhar por checksum")
    void changedMigrationFailsValidation() {
        Flyway flyway = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas("checksum_check").createSchemas(true)
                .locations("classpath:db/migration")
                .validateOnMigrate(true)
                .load();
        flyway.migrate();
        jdbc.update("update checksum_check.flyway_schema_history set checksum = checksum + 1 where version = '1'");

        assertThatThrownBy(flyway::migrate).isInstanceOf(FlywayValidateException.class);
    }

    @Test
    @DisplayName("#758 CA4: a V59 tira a coluna color e a restrição, sem mudar o resto da linha")
    void v59DropsOrganizationColor() {
        jdbc.execute("drop schema if exists v59_check cascade");
        var config = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas("v59_check").createSchemas(true)
                .locations("classpath:db/migration");
        config.target("58").load().migrate();
        UUID id = UUID.randomUUID();
        jdbc.update("insert into v59_check.organization (id, name, color, holder_document, logo_url) "
                + "values (?, 'Academia Fictícia', '#1a56db', '11222333000181', 'logo-ficticia.png')", id);
        String before = jdbc.queryForObject("select (to_jsonb(o) - 'color')::text from v59_check.organization o where id = ?", String.class, id);

        config.target("59").load().migrate();

        assertThat(jdbc.queryForObject("select to_jsonb(o)::text from v59_check.organization o where id = ?", String.class, id))
                .isEqualTo(before);
        assertThat(jdbc.queryForList("select column_name from information_schema.columns "
                + "where table_schema = 'v59_check' and table_name = 'organization'", String.class))
                .contains("name", "holder_document", "logo_url").doesNotContain("color");
        assertThat(jdbc.queryForList("select conname from pg_constraint where conrelid = 'v59_check.organization'::regclass", String.class))
                .contains("organization_holder_format").doesNotContain("organization_color_format");
    }

    @Test
    @DisplayName("#638 CA6: a V66 converte reminder_days em quatro chaves e dias, tira a coluna e o banco recusa dia inválido ou repetido")
    void v66ReminderSwitches() {
        jdbc.execute("drop schema if exists v66_check cascade");
        var config = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas("v66_check").createSchemas(true)
                .locations("classpath:db/migration");
        config.target("65").load().migrate();
        UUID org = UUID.randomUUID();
        jdbc.update("insert into v66_check.organization (id, name) values (?, 'Academia Fictícia')", org);
        // lista antiga -> antes (chave, dia), no dia, 1º depois (chave, dia), 2º depois (chave, dia)
        var cases = new java.util.LinkedHashMap<String, String>();
        cases.put("{-3,0,3,10}", "t,3,t,t,3,t,10");
        cases.put("{0,10}", "f,3,t,f,3,t,10");
        cases.put("{}", "f,3,f,f,3,f,10");
        cases.put("{-1,5}", "t,1,f,t,5,f,10");
        cases.put("{-5,-3,3,7,15}", "t,3,f,t,3,t,7");
        var units = new java.util.LinkedHashMap<String, UUID>();
        cases.keySet().forEach(list -> {
            UUID unit = UUID.randomUUID();
            units.put(list, unit);
            jdbc.update("insert into v66_check.unit (id, organization_id, name, short_name) values (?, ?, 'Unidade', ?)", unit, org, "u-" + unit);
            jdbc.update("insert into v66_check.unit_settings (organization_id, unit_id, reminder_days) values (?, ?, cast(? as integer[]))", org, unit, list);
        });

        config.target("66").load().migrate();

        cases.forEach((list, expected) -> assertThat(jdbc.queryForObject("select concat_ws(',', reminder_before_enabled, reminder_before_days, "
                + "reminder_due_enabled, reminder_after_first_enabled, reminder_after_first_days, reminder_after_second_enabled, "
                + "reminder_after_second_days) from v66_check.unit_settings where unit_id = ?", String.class, units.get(list))).as(list).isEqualTo(expected));
        assertThat(jdbc.queryForList("select column_name from information_schema.columns "
                + "where table_schema = 'v66_check' and table_name = 'unit_settings'", String.class)).doesNotContain("reminder_days");
        for (String bad : new String[] {"reminder_before_days = 0", "reminder_before_days = 31", "reminder_after_first_days = 61",
                "reminder_after_second_days = 0", "reminder_after_first_days = 10"}) {
            assertThatThrownBy(() -> jdbc.update("update v66_check.unit_settings set " + bad + " where unit_id = ?", units.get("{}"))).as(bad)
                    .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        }
    }

    @Test
    @DisplayName("CA4: id uuid gerado pelo banco volta como UUID, diferente a cada linha")
    void uuidGeneratedByDatabase() {
        jdbc.execute("create table it_uuid (id uuid primary key default gen_random_uuid(), n int)");
        jdbc.update("insert into it_uuid (n) values (1), (2)");

        List<UUID> ids = jdbc.queryForList("select id from it_uuid", UUID.class);

        assertThat(ids).hasSize(2).doesNotHaveDuplicates().doesNotContainNull();
    }

    @Test
    @DisplayName("CA5: timestamptz mantém o instante, JSON sai com Z, JVM e Clock em UTC")
    void utcEverywhere() throws Exception {
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        jdbc.execute("create table it_time (at timestamptz not null)");
        jdbc.update("insert into it_time (at) values (?)", OffsetDateTime.ofInstant(now, ZoneOffset.ofHours(-3)));

        OffsetDateTime read = jdbc.queryForObject("select at from it_time", OffsetDateTime.class);

        assertThat(read.toInstant()).isEqualTo(now);
        assertThat(mapper.writeValueAsString(now)).endsWith("Z\"");
        assertThat(ZoneId.systemDefault().getId()).isIn("UTC", "Z", "Etc/UTC");
        assertThat(clock.getZone()).isEqualTo(ZoneOffset.UTC);
    }
}
