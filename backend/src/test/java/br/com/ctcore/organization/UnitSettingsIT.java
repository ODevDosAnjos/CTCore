package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import br.com.ctcore.permission.Access;
import br.com.ctcore.permission.Permission;
import br.com.ctcore.permission.Permissions;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** RF-ORG-04: leitura, lista e alteração das configurações da unidade, com o banco real. */
class UnitSettingsIT extends UnitBase {
    @Autowired Permissions permissions;

    private AccountPrincipal coordinator(Tenant t) {
        return who(t, Role.COORDINATOR);
    }

    private JsonNode get(Tenant t, UUID unit, AccountPrincipal who) throws Exception {
        var response = call(read(unit), who).getResponse();
        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);
        return body(response);
    }

    @Test
    @DisplayName("CA1 / CA12: leitura traz os campos do contrato, com os padrões, sem a referência da conta e sem chaves a mais")
    void reads() throws Exception {
        var a = tenant();
        var unit = get(a, a.unitId(), coordinator(a));
        assertThat(fieldNames(unit)).containsExactlyInAnyOrder("id", "name", "shortName", "postalCode", "address", "city", "latitude", "longitude",
                "phone", "email", "whatsapp", "cnpj", "legalName", "active", "timezone", "settings", "version", "lastChange");
        var s = unit.path("settings");
        assertThat(fieldNames(s)).containsExactlyInAnyOrder("dueDays", "enrollmentFeeEnabled", "enrollmentFeeCents", "feesCents", "pixKey",
                "paymentAccount", "reminders", "teacherPermissions", "directoryEnabled", "trialLinkEnabled", "selfRegistrationLinkEnabled", "remindersEnabled", "remindersHour", "trialLimit");
        assertThat(s.path("dueDays")).hasSize(4);
        assertThat(s.path("reminders")).isEqualTo(json.readTree(STANDARD_REMINDERS));
        assertThat(fieldNames(s.path("feesCents"))).containsExactlyInAnyOrder("cash", "pix", "bankSlip", "creditCard", "debitCard",
                "automaticDebit", "manualPix", "terminalCard", "transfer");
        assertThat(fieldNames(s.path("teacherPermissions"))).containsExactlyInAnyOrder("announcements", "agendaEdit", "studentContacts", "trialClasses", "studentRecord");
        assertThat(s.path("paymentAccount").asText()).isEqualTo("NOT_CONNECTED");
        adminJdbc().update("update unit_settings set payment_account_reference = 'conta-secreta-123' where unit_id = ?", a.unitId());
        var response = call(read(a.unitId()), coordinator(a)).getResponse();
        assertThat(body(response).path("settings").path("paymentAccount").asText()).isEqualTo("CONNECTED");
        assertThat(response.getContentAsString()).doesNotContain("conta-secreta-123");
        assertThat(call(put(a.unitId(), payload()), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(adminJdbc().queryForObject("select payment_account_reference from unit_settings where unit_id = ?", String.class, a.unitId()))
                .isEqualTo("conta-secreta-123");
    }

    private static List<String> fieldNames(JsonNode node) {
        var names = new java.util.ArrayList<String>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }

    @Test
    @DisplayName("CA3: Coordenador vê as 3 unidades; Administrador só a sua; Professor 403")
    void mineLists() throws Exception {
        var a = tenant();
        UUID second = addUnit(a, "Segunda", "segunda-" + a.orgId(), "Rio");
        addUnit(a, "Terceira", "terceira-" + a.orgId(), null);
        var all = body(call(mine(), coordinator(a)).getResponse());
        assertThat(all).hasSize(3);
        assertThat(all.get(0).fieldNames().next()).isNotNull();
        var admin = new AccountPrincipal(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), a.orgId(), Role.ADMINISTRATOR, Set.of(second));
        var own = body(call(mine(), admin).getResponse());
        assertThat(own).hasSize(1);
        assertThat(own.get(0).path("id").asText()).isEqualTo(second.toString());
        assertThat(call(mine(), who(a, Role.TEACHER)).getResponse().getStatus()).isEqualTo(403);
    }

    @Test
    @DisplayName("CA4 / CA6 / CA9 / CA10 / CA11 / CA13 / CA14: alteração válida volta nova na leitura; organizationId e shortName do corpo são ignorados")
    void updates() throws Exception {
        var a = tenant();
        var b = tenant();
        String shortBefore = unitRow(a.unitId()).get("short_name").toString();
        ObjectNode body = payload();
        body.put("name", "Academia Nova").put("phone", "(21) 99999-8888").put("cnpj", "11.222.333/0001-81")
                .put("organizationId", b.orgId().toString()).put("shortName", "invadido");
        ObjectNode s = (ObjectNode) body.path("settings");
        s.putArray("dueDays").add(15).add(5).add(1);
        s.put("enrollmentFeeEnabled", true).put("enrollmentFeeCents", 15000).put("pixKey", "Ana@Exemplo.com");
        ((ObjectNode) s.path("feesCents")).put("pix", 199).put("creditCard", 450);
        ((ObjectNode) s.path("teacherPermissions")).put("announcements", false).put("agendaEdit", true).put("studentContacts", false)
                .put("trialClasses", true).put("studentRecord", true);
        s.put("directoryEnabled", true).put("trialLinkEnabled", false).put("selfRegistrationLinkEnabled", false);
        var response = call(put(a.unitId(), body), coordinator(a)).getResponse();
        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);
        var read = get(a, a.unitId(), coordinator(a));
        assertThat(read).isEqualTo(body(response));
        assertThat(read.path("name").asText()).isEqualTo("Academia Nova");
        assertThat(read.path("phone").asText()).isEqualTo("21999998888");
        assertThat(read.path("cnpj").asText()).isEqualTo("11222333000181");
        assertThat(read.path("shortName").asText()).isEqualTo(shortBefore);
        var rs = read.path("settings");
        assertThat(rs.path("dueDays").toString()).isEqualTo("[1,5,15]");
        assertThat(rs.path("enrollmentFeeCents").asInt()).isEqualTo(15000);
        assertThat(rs.path("pixKey").asText()).isEqualTo("ana@exemplo.com");
        assertThat(rs.path("feesCents").path("pix").asInt()).isEqualTo(199);
        assertThat(rs.path("feesCents").path("creditCard").asInt()).isEqualTo(450);
        assertThat(rs.path("reminders")).isEqualTo(json.readTree(STANDARD_REMINDERS));
        assertThat(rs.path("directoryEnabled").asBoolean()).isTrue();
        assertThat(rs.path("trialLinkEnabled").asBoolean()).isFalse();
        assertThat(adminJdbc().queryForObject("select organization_id from unit where id = ?", UUID.class, a.unitId())).isEqualTo(a.orgId());
        assertThat(adminJdbc().queryForObject("select teacher_permissions::text from unit_settings where unit_id = ?", String.class, a.unitId()))
                .isEqualTo("{f,t,f,t,t}");
        // CA14: a tabela de permissões do Professor reflete a mudança.
        var teacher = who(a, Role.TEACHER);
        assertThat(permissions.grant(teacher, Permission.ANNOUNCEMENTS, a.unitId())).isEqualTo(Access.NONE);
        assertThat(permissions.grant(teacher, Permission.AGENDA_EDIT, a.unitId())).isNotEqualTo(Access.NONE);
        assertThat(permissions.grant(teacher, Permission.STUDENT_CONTACTS, a.unitId())).isEqualTo(Access.NONE);
        assertThat(permissions.grant(teacher, Permission.TRIAL_CLASSES, a.unitId())).isNotEqualTo(Access.NONE);
        // CA9: taxa de matrícula desligada grava 0.
        ObjectNode off = payload();
        ((ObjectNode) off.path("settings")).put("enrollmentFeeEnabled", false).put("enrollmentFeeCents", 500);
        assertThat(call(put(a.unitId(), off), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(adminJdbc().queryForObject("select enrollment_fee_cents from unit_settings where unit_id = ?", Long.class, a.unitId())).isZero();
        // CA11: chave em branco apaga.
        assertThat(adminJdbc().queryForObject("select pix_key from unit_settings where unit_id = ?", String.class, a.unitId())).isNull();
    }

    @Test
    @DisplayName("CA6 / CA8 / CA10: corpo inválido responde 400 com o campo e nada é salvo nem auditado")
    void invalid() throws Exception {
        var a = tenant();
        String before = unitSnapshot(a);
        for (var change : List.<Map.Entry<String, java.util.function.Consumer<ObjectNode>>>of(
                Map.entry("name", n -> n.put("name", " ")),
                Map.entry("email", n -> n.put("email", "ruim")),
                Map.entry("cnpj", n -> n.put("cnpj", "11.222.333/0001-82")),
                Map.entry("longitude", n -> n.put("latitude", 1.0)),
                Map.entry("settings.dueDays", n -> ((ObjectNode) n.path("settings")).putArray("dueDays").add(0)),
                Map.entry("settings.feesCents.pix", n -> ((ObjectNode) n.path("settings").path("feesCents")).put("pix", -1)),
                Map.entry("settings.pixKey", n -> ((ObjectNode) n.path("settings")).put("pixKey", "abc")),
                Map.entry("settings.reminders", n -> ((ObjectNode) n.path("settings")).remove("reminders")),
                Map.entry("settings.reminders.due", n -> reminders(n).remove("due")),
                Map.entry("settings.reminders.before.days", n -> ((ObjectNode) reminders(n).path("before")).put("days", 31)),
                Map.entry("settings.reminders.afterFirst.enabled", n -> ((ObjectNode) reminders(n).path("afterFirst")).remove("enabled")),
                Map.entry("settings.reminders.afterSecond.days", n -> ((ObjectNode) reminders(n).path("afterSecond")).put("days", 3)))) {
            ObjectNode body = payload();
            change.getValue().accept(body);
            var response = call(put(a.unitId(), body), coordinator(a)).getResponse();
            assertThat(response.getStatus()).as(change.getKey()).isEqualTo(400);
            assertThat(response.getContentAsString()).contains("VALIDATION_ERROR").contains("\"field\":\"" + change.getKey() + "\"");
        }
        assertThat(unitSnapshot(a)).isEqualTo(before);
        assertThat(audit(a, "unit.update")).isEmpty();
    }

    private static final String STANDARD_REMINDERS = """
            {"before":{"enabled":true,"days":3},"due":{"enabled":true},"afterFirst":{"enabled":true,"days":3},"afterSecond":{"enabled":true,"days":10}}""";

    private static ObjectNode reminders(ObjectNode body) {
        return (ObjectNode) body.path("settings").path("reminders");
    }

    @Test
    @DisplayName("#638 CA5: desligar um lembrete e mudar o dia de outro audita só o que mudou, com antes e depois")
    void reminderAudit() throws Exception {
        var a = tenant();
        assertThat(call(put(a.unitId(), payload()), coordinator(a)).getResponse().getStatus()).isEqualTo(200); // baseline: o nome muda
        int audits = audit(a, "unit.update").size();
        ObjectNode body = payload();
        ((ObjectNode) reminders(body).path("before")).put("enabled", false);
        ((ObjectNode) reminders(body).path("afterFirst")).put("days", 5);
        var response = call(put(a.unitId(), body), coordinator(a)).getResponse();
        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);
        assertThat(body(response).path("settings").path("reminders").path("before")).isEqualTo(json.readTree("{\"enabled\":false,\"days\":3}"));
        assertThat(audit(a, "unit.update")).hasSize(audits + 1);
        var row = adminJdbc().queryForMap("select before_data::text as was, after_data::text as now from audit_log "
                + "where organization_id = ? and action = 'unit.update' order by occurred_at desc limit 1", a.orgId());
        assertThat(json.readTree(row.get("was").toString()))
                .isEqualTo(json.readTree("{\"reminders.before.enabled\":true,\"reminders.afterFirst.days\":3}"));
        assertThat(json.readTree(row.get("now").toString()))
                .isEqualTo(json.readTree("{\"reminders.before.enabled\":false,\"reminders.afterFirst.days\":5}"));
    }

    private String unitSnapshot(Tenant t) {
        return adminJdbc().queryForList("select u.*, s.* from unit u join unit_settings s on s.unit_id = u.id where u.id = ?", t.unitId()).toString();
    }

    @Test
    @DisplayName("CA7: CEP novo sem coordenadas usa a porta; CEP desconhecido deixa vazio; coordenadas enviadas valem; CEP igual mantém as atuais")
    void coordinates() throws Exception {
        var a = tenant();
        ObjectNode known = payload();
        known.put("postalCode", "01001-000");
        assertThat(call(put(a.unitId(), known), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        var row = adminJdbc().queryForMap("select postal_code, latitude::float8 as lat, longitude::float8 as lon from unit where id = ?", a.unitId());
        assertThat(row.get("postal_code")).isEqualTo("01001000");
        assertThat((double) row.get("lat")).isEqualTo(-23.5505);
        assertThat((double) row.get("lon")).isEqualTo(-46.6333);
        // CEP igual e sem coordenadas: mantém.
        assertThat(call(put(a.unitId(), known), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat((double) adminJdbc().queryForObject("select latitude::float8 from unit where id = ?", Double.class, a.unitId())).isEqualTo(-23.5505);
        // Coordenadas enviadas valem.
        ObjectNode manual = payload();
        manual.put("postalCode", "01001-000").put("latitude", -1.5).put("longitude", 2.5);
        assertThat(call(put(a.unitId(), manual), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat((double) adminJdbc().queryForObject("select longitude::float8 from unit where id = ?", Double.class, a.unitId())).isEqualTo(2.5);
        // CEP desconhecido: vazio, sem erro.
        ObjectNode unknown = payload();
        unknown.put("postalCode", "99999999");
        assertThat(call(put(a.unitId(), unknown), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(adminJdbc().queryForObject("select latitude from unit where id = ?", Object.class, a.unitId())).isNull();
    }

    @Test
    @DisplayName("CA15: auditoria unit.update só com os campos mudados; Pix e CNPJ sem valor; PUT idêntico não grava")
    void audited() throws Exception {
        var a = tenant();
        assertThat(call(put(a.unitId(), payload()), coordinator(a)).getResponse().getStatus()).isEqualTo(200); // baseline: o nome muda
        ObjectNode body = payload();
        body.put("phone", "21999998888");
        ((ObjectNode) body.path("settings").path("teacherPermissions")).put("studentRecord", true);
        ((ObjectNode) body.path("settings")).putArray("dueDays").add(7);
        assertThat(call(put(a.unitId(), body), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        var rows = audit(a, "unit.update");
        assertThat(rows).hasSize(2);
        var row = rows.stream().filter(r -> r.get("a").toString().contains("21999998888")).findFirst().orElseThrow();
        assertThat(row.get("actor_profile")).isEqualTo("COORDINATOR");
        assertThat(row.get("a").toString()).contains("dueDays", "teacher.studentRecord").doesNotContain("name");
        assertThat(row.get("b").toString().replace(" ", "")).contains("dueDays").contains("[1,5,10,15]").doesNotContain("21999998888");
        assertThat(call(put(a.unitId(), body), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(audit(a, "unit.update")).hasSize(2);
        ObjectNode secret = payload();
        secret.put("cnpj", "11.222.333/0001-81");
        ((ObjectNode) secret.path("settings")).put("pixKey", "529.982.247-25");
        ((ObjectNode) secret.path("settings")).putArray("dueDays").add(7);
        assertThat(call(put(a.unitId(), secret), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        var all = audit(a, "unit.update").toString();
        assertThat(all).contains("cnpj").contains("pixKey").doesNotContain("11222333000181").doesNotContain("52998224725");
    }

    @Test
    @DisplayName("CA15: falha ao auditar desfaz a alteração (tudo ou nada)")
    void allOrNothing() throws Exception {
        var a = tenant();
        String before = unitSnapshot(a);
        var db = adminJdbc();
        db.execute("create function fail_audit_unit() returns trigger language plpgsql as $$ begin raise exception 'audit down'; end $$");
        db.execute("create trigger fail_audit_unit before insert on audit_log for each row execute function fail_audit_unit()");
        try {
            ObjectNode body = payload();
            body.put("name", "Outro nome");
            ((ObjectNode) body.path("settings")).putArray("dueDays").add(9);
            assertThat(call(put(a.unitId(), body), coordinator(a)).getResponse().getStatus()).isEqualTo(500);
        } finally {
            db.execute("drop trigger fail_audit_unit on audit_log");
            db.execute("drop function fail_audit_unit()");
        }
        assertThat(unitSnapshot(a)).isEqualTo(before);
    }

    private ObjectNode limited(Integer limit) {
        ObjectNode body = payload();
        ObjectNode s = (ObjectNode) body.path("settings");
        if (limit == null) s.remove("trialLimit");
        else s.put("trialLimit", limit);
        return body;
    }

    @Test
    @DisplayName("RN-AEX-02 / RF-ORG-08: o limite é de cada unidade, sobe a versão, audita antes e depois e atualiza a última alteração; unidade nova nasce com 2")
    void trialLimitPerUnit() throws Exception {
        var a = tenant();
        UUID second = addUnit(a, "Segunda", "segunda-" + a.orgId(), null);
        assertThat(get(a, a.unitId(), coordinator(a)).path("settings").path("trialLimit").asInt()).isEqualTo(2);
        assertThat(get(a, second, coordinator(a)).path("settings").path("trialLimit").asInt()).isEqualTo(2);
        assertThat(call(put(a.unitId(), payload()), coordinator(a)).getResponse().getStatus()).isEqualTo(200); // baseline: o nome muda
        int version = get(a, a.unitId(), coordinator(a)).path("version").asInt();
        var response = call(put(a.unitId(), limited(3)), coordinator(a)).getResponse();
        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);
        var changed = body(response);
        assertThat(changed.path("settings").path("trialLimit").asInt()).isEqualTo(3);
        assertThat(changed.path("version").asInt()).isEqualTo(version + 1);
        assertThat(changed.path("lastChange").isNull()).isFalse();
        assertThat(get(a, a.unitId(), coordinator(a))).isEqualTo(changed);
        assertThat(get(a, second, coordinator(a)).path("settings").path("trialLimit").asInt()).isEqualTo(2);
        var row = audit(a, "unit.update").stream().filter(r -> r.get("a").toString().contains("trialLimit")).findFirst().orElseThrow();
        assertThat(row.get("entity_id").toString()).isEqualTo(a.unitId().toString());
        assertThat(row.get("b")).hasToString("{\"trialLimit\": 2}");
        assertThat(row.get("a")).hasToString("{\"trialLimit\": 3}");
    }

    @Test
    @DisplayName("RN-AEX-02: limite 0, 4 ou ausente responde 400 com o campo; sem If-Match 428 e versão velha 409; nada é gravado")
    void trialLimitRefused() throws Exception {
        var a = tenant();
        String before = unitSnapshot(a);
        for (Integer bad : new Integer[] {0, 4, null}) {
            ObjectNode body = limited(bad);
            body.put("name", "Outro nome");
            var response = call(put(a.unitId(), body), coordinator(a)).getResponse();
            assertThat(response.getStatus()).as(String.valueOf(bad)).isEqualTo(400);
            assertThat(response.getContentAsString()).contains("\"field\":\"settings.trialLimit\"");
        }
        assertThat(raw(put(a.unitId(), limited(3)), coordinator(a)).getResponse().getStatus()).isEqualTo(428);
        assertThat(call(put(a.unitId(), limited(3)).header("If-Match", "99"), coordinator(a)).getResponse().getStatus()).isEqualTo(409);
        assertThat(unitSnapshot(a)).isEqualTo(before);
        assertThat(audit(a, "unit.update")).isEmpty();
    }

    @Test
    @DisplayName("RN-AEX-02: a V58 copia o limite de cada organização para as unidades dela e remove a coluna antiga; o banco recusa 0 e 4")
    void migrationCopiesTrialLimit() {
        var admin = adminJdbc();
        admin.execute("drop schema if exists trial_backfill cascade");
        migrateTrialSchema("57");
        for (int[] org : new int[][] {{3, 2}, {1, 1}}) { // limite e quantidade de unidades
            UUID id = UUID.randomUUID();
            admin.update("insert into trial_backfill.organization (id, name) values (?, 'Org')", id);
            admin.update("insert into trial_backfill.organization_settings (organization_id, trial_limit) values (?, ?)", id, org[0]);
            for (int i = 0; i < org[1]; i++) {
                UUID unit = UUID.randomUUID();
                admin.update("insert into trial_backfill.unit (id, organization_id, name, short_name) values (?, ?, 'U', ?)", unit, id, unit.toString());
                admin.update("insert into trial_backfill.unit_settings (organization_id, unit_id) values (?, ?)", id, unit);
            }
        }
        migrateTrialSchema("latest");
        assertThat(admin.queryForList("select trial_limit from trial_backfill.unit_settings order by 1 desc", Integer.class)).containsExactly(3, 3, 1);
        assertThat(admin.queryForObject("select count(*) from information_schema.columns where table_schema = 'trial_backfill' "
                + "and table_name = 'organization_settings' and column_name = 'trial_limit'", Integer.class)).isZero();
        for (int bad : new int[] {0, 4}) {
            org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> admin.update("update trial_backfill.unit_settings set trial_limit = ?", bad));
        }
        admin.execute("drop schema trial_backfill cascade");
    }

    private static void migrateTrialSchema(String target) {
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()).schemas("trial_backfill")
                .createSchemas(true).locations("classpath:db/migration").target(target).load().migrate();
    }

    @Test
    @DisplayName("RN-MAT-21: razão social grava aparada, é relida e audita antes e depois; vazio, espaços, nulo e omitido apagam; igual não audita")
    void legalName() throws Exception {
        var a = tenant();
        assertThat(get(a, a.unitId(), coordinator(a)).path("legalName").isNull()).isTrue();
        assertThat(call(put(a.unitId(), payload()), coordinator(a)).getResponse().getStatus()).isEqualTo(200); // baseline: o nome muda
        for (Consumer<ObjectNode> erase : List.<Consumer<ObjectNode>>of(n -> n.put("legalName", ""), n -> n.put("legalName", "   "),
                n -> n.putNull("legalName"), n -> n.remove("legalName"))) {
            var saved = call(put(a.unitId(), payload().put("legalName", "  Dojo Ltda.  ")), coordinator(a)).getResponse();
            assertThat(saved.getStatus()).as(saved.getContentAsString()).isEqualTo(200);
            assertThat(body(saved).path("legalName").asText()).isEqualTo("Dojo Ltda.");
            assertThat(get(a, a.unitId(), coordinator(a)).path("legalName").asText()).isEqualTo("Dojo Ltda.");
            assertThat(lastLegalName(a)).isEqualTo("null>Dojo Ltda.");
            ObjectNode gone = payload();
            erase.accept(gone);
            assertThat(call(put(a.unitId(), gone), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
            assertThat(get(a, a.unitId(), coordinator(a)).path("legalName").isNull()).isTrue();
            assertThat(lastLegalName(a)).isEqualTo("Dojo Ltda.>null");
        }
        var long160 = payload().put("legalName", "x".repeat(160));
        assertThat(call(put(a.unitId(), long160), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        int audits = audit(a, "unit.update").size();
        assertThat(call(put(a.unitId(), long160), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(audit(a, "unit.update")).hasSize(audits);
        String before = unitSnapshot(a);
        var refused = call(put(a.unitId(), payload().put("legalName", "x".repeat(161))), coordinator(a)).getResponse();
        assertThat(refused.getStatus()).isEqualTo(400);
        assertThat(refused.getContentAsString()).contains("VALIDATION_ERROR").contains("\"field\":\"legalName\"");
        assertThat(unitSnapshot(a)).isEqualTo(before);
        assertThat(audit(a, "unit.update")).hasSize(audits);
        for (String bad : new String[] {"", "x".repeat(161)}) {
            org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> adminJdbc().update("update unit set legal_name = ? where id = ?", bad, a.unitId()));
        }
    }

    // Antes e depois da razão social no último unit.update, como "antes>depois".
    private String lastLegalName(Tenant t) {
        return adminJdbc().queryForObject("select coalesce(before_data->>'legalName', 'null') || '>' || coalesce(after_data->>'legalName', 'null') "
                + "from audit_log where organization_id = ? and action = 'unit.update' order by occurred_at desc limit 1", String.class, t.orgId());
    }

    @Test
    @DisplayName("RN-MAT-21 / RNF-26: Professor, portal, Administrador de outra unidade (403) e outra organização (404) não gravam razão social")
    void legalNameRefused() throws Exception {
        var a = tenant();
        var b = tenant();
        String before = unitSnapshot(a);
        var body = payload().put("legalName", "Invasora Ltda.");
        var otherAdmin = new AccountPrincipal(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), a.orgId(), Role.ADMINISTRATOR,
                Set.of(UUID.randomUUID()));
        for (var who : List.of(who(a, Role.TEACHER), who(a, Role.STUDENT), otherAdmin)) {
            assertThat(call(put(a.unitId(), body), who).getResponse().getStatus()).as(who.role().name()).isEqualTo(403);
        }
        assertThat(call(put(a.unitId(), body), coordinator(b)).getResponse().getStatus()).isEqualTo(404);
        assertThat(unitSnapshot(a)).isEqualTo(before);
        assertThat(audit(a, "unit.update")).isEmpty();
    }

    @Test
    @DisplayName("T1: o banco recusa CNPJ fora do padrão de 14 dígitos")
    void databaseCheck() {
        var a = tenant();
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> adminJdbc().update("update unit set cnpj = '11.222.333/0001-81' where id = ?", a.unitId()));
        assertThat(adminJdbc().update("update unit set cnpj = '11222333000181' where id = ?", a.unitId())).isEqualTo(1);
    }

    @Test
    @DisplayName("RF-COB-09 CA1 / CA2 / CA3 / CA4 / CA6: padrão 9h ligado; troca grava e audita; hora inválida 400; só dias mantém a hora do corpo; igual não audita")
    void reminders() throws Exception {
        var a = tenant();
        var s = get(a, a.unitId(), coordinator(a)).path("settings");
        assertThat(s.path("remindersEnabled").asBoolean()).isTrue();
        assertThat(s.path("remindersHour").asInt()).isEqualTo(9);
        assertThat(s.path("reminders")).isEqualTo(json.readTree(STANDARD_REMINDERS));
        assertThat(call(put(a.unitId(), payload()), coordinator(a)).getResponse().getStatus()).isEqualTo(200); // baseline: o nome muda
        int version = get(a, a.unitId(), coordinator(a)).path("version").asInt();
        ObjectNode body = payload();
        ((ObjectNode) body.path("settings")).put("remindersEnabled", false).put("remindersHour", 14);
        var response = call(put(a.unitId(), body), coordinator(a)).getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        var changed = body(response);
        assertThat(changed.path("settings").path("remindersEnabled").asBoolean()).isFalse();
        assertThat(changed.path("settings").path("remindersHour").asInt()).isEqualTo(14);
        assertThat(changed.path("version").asInt()).isEqualTo(version + 1);
        var row = adminJdbc().queryForMap("select reminders_enabled, reminders_hour from unit_settings where unit_id = ?", a.unitId());
        assertThat(row).containsEntry("reminders_enabled", false).containsEntry("reminders_hour", 14);
        var last = audit(a, "unit.update").stream().filter(r -> r.get("a").toString().contains("remindersHour")).findFirst().orElseThrow();
        assertThat(last.get("a").toString()).contains("remindersEnabled").contains("remindersHour");
        assertThat(last.get("b").toString().replace(" ", "")).contains("true").contains("9");
        // CA6: igual não sobe versão nem audita.
        int audits = audit(a, "unit.update").size();
        assertThat(call(put(a.unitId(), body), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(audit(a, "unit.update")).hasSize(audits);
        // CA4: só um dia muda; os dois campos do corpo valem (padrão volta).
        ObjectNode days = payload();
        ((ObjectNode) reminders(days).path("before")).put("days", 1);
        assertThat(call(put(a.unitId(), days), coordinator(a)).getResponse().getStatus()).isEqualTo(200);
        assertThat(adminJdbc().queryForMap("select reminders_enabled, reminders_hour, reminder_before_days::text as d from unit_settings where unit_id = ?", a.unitId()))
                .containsEntry("reminders_enabled", true).containsEntry("reminders_hour", 9).containsEntry("d", "1");
        // CA3: inválidos.
        String before = unitSnapshot(a);
        for (var change : List.<Consumer<ObjectNode>>of(n -> ((ObjectNode) n.path("settings")).put("remindersHour", 24),
                n -> ((ObjectNode) n.path("settings")).put("remindersHour", -1), n -> ((ObjectNode) n.path("settings")).remove("remindersHour"))) {
            ObjectNode bad = payload();
            change.accept(bad);
            var r = call(put(a.unitId(), bad), coordinator(a)).getResponse();
            assertThat(r.getStatus()).isEqualTo(400);
            assertThat(r.getContentAsString()).contains("\"field\":\"settings.remindersHour\"");
        }
        ObjectNode noSwitch = payload();
        ((ObjectNode) noSwitch.path("settings")).remove("remindersEnabled");
        var r = call(put(a.unitId(), noSwitch), coordinator(a)).getResponse();
        assertThat(r.getStatus()).isEqualTo(400);
        assertThat(r.getContentAsString()).contains("\"field\":\"settings.remindersEnabled\"");
        assertThat(unitSnapshot(a)).isEqualTo(before);
    }
}
