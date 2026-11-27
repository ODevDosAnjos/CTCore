package br.com.ctcore.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import br.com.ctcore.db.PostgresIT;
import br.com.ctcore.storage.FileStorage;
import br.com.ctcore.student.EnrollmentFixtures;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MvcResult;

/** #764 (RF-LGP-01): "Baixar meus dados" brings everything of the account of the session, and nothing of anyone else. */
@Import({AuthBase.Config.class, AuthBase.OrgProbe.class})
class AccountDataExportIT extends AuthBase {
    static final String EXPORT = "/api/v1/auth/data-export";

    @Autowired AccountTransactions accountTx;
    @Autowired JdbcClient runtime;
    @Autowired FileStorage storage;

    /** Two organizations shared by every account: an active one and one where the other links have ended. */
    UUID active, ended, activeUnit, endedUnit;

    @BeforeEach
    void world() {
        PostgresIT.truncateCascade(admin, "organization", "account", "login_attempt");
        active = org("Academia Ativa");
        ended = org("Academia Encerrada");
        activeUnit = unit(active);
        endedUnit = unit(ended);
        admin.update("update unit set name = 'Unidade Centro' where id = ?", activeUnit);
        admin.update("update unit set name = 'Unidade Antiga' where id = ?", endedUnit);
    }

    @AfterEach
    void clean() {
        PostgresIT.truncateCascade(admin, "organization", "account", "login_attempt");
    }

    private record Person(UUID id, String email, UUID activeLink) {}

    private UUID student(UUID org, UUID unit, String name) {
        UUID id = UUID.randomUUID();
        admin.update("insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, postal_code, street, number, district, city, state) "
                + "values (?, ?, ?, ?, ?, '2015-01-01', '01000000', 'Rua', '1', 'Centro', 'Cidade', 'SP')", id, org, unit, name, name);
        return id;
    }

    private void attempt(String email, String ip, String at, String result) {
        admin.update("insert into login_attempt (email, ip, occurred_at, result) values (?, ?, ?::timestamptz, ?)", email, ip, at, result);
    }

    /** A management link in the active organization and an ended guardian link in the other, with consents and accesses. */
    private Person person(String tag, String role, String ipPrefix) {
        String email = tag + "@dados.example";
        UUID id = account(email);
        admin.update("update account set name = ?, phone = ?, created_at = '2026-01-01T00:00:00Z' where id = ?",
                "Pessoa " + tag, "119" + String.format("%08d", Math.abs(tag.hashCode() % 100_000_000)), id);
        UUID link = link(id, active, role, "ACTIVE");
        admin.update("insert into account_link_unit (link_id, organization_id, unit_id) values (?, ?, ?)", link, active, activeUnit);
        UUID old = link(id, ended, "GUARDIAN", "ENDED");
        admin.update("insert into account_link_unit (link_id, organization_id, unit_id) values (?, ?, ?)", old, ended, endedUnit);
        admin.update("update account_link set starts_on = '2025-02-01', ends_on = '2025-12-01', announcement_email = false where id = ?", old);

        UUID pupil = student(ended, endedUnit, "Aluno Secreto " + tag);
        admin.update("insert into term_acceptance (id, organization_id, student_id, kind, event, version, account_id, accepted_at, ip) "
                + "values (?, ?, ?, 'IMAGE_USE', 'REVOKED', 3, ?, '2025-03-04T10:00:00Z', ?)", UUID.randomUUID(), ended, pupil, id, ipPrefix + ".201");
        var enrolled = EnrollmentFixtures.enroll(admin, ended, pupil, endedUnit, "ACTIVE", 0, null);
        admin.update("insert into modality_confirmation (id, organization_id, enrollment_modality_id, student_id, account_id, plan_id, plan_value_cents, confirmed_at, ip) "
                + "values (?, ?, ?, ?, ?, ?, 15000, '2025-04-05T10:00:00Z', ?)", UUID.randomUUID(), ended, enrolled.row(), pupil, id,
                enrolled.plan(), ipPrefix + ".202");
        admin.update("insert into teacher (id, organization_id, name, name_key, account_id, directory_consent, consent_declared_by_management) "
                + "values (?, ?, 'Professor Ficha', ?, ?, true, true)", UUID.randomUUID(), ended, tag, id);

        attempt(email, ipPrefix + ".77", "2026-07-01T10:00:00Z", "WRONG_PASSWORD");
        attempt(email, "2001:db8:abcd:12::" + ipPrefix.substring(ipPrefix.lastIndexOf('.') + 1), "2026-07-02T10:00:00Z", "SUCCESS");
        admin.update("insert into account_session (account_id, token_hash, device, ip, created_at, last_used_at, expires_at, ended_at, ended_reason) "
                + "values (?, ?, ?, ?, '2026-08-01T10:00:00Z', '2026-08-02T10:00:00Z', '2026-08-03T10:00:00Z', '2026-08-02T11:00:00Z', 'REPLACED')",
                id, "token-hash-" + tag, "Mozilla/5.0 (Windows NT 10.0) Chrome/1.0 " + tag, ipPrefix + ".99");
        return new Person(id, email, link);
    }

    private Cookie sessionOn(Person p) throws Exception {
        Cookie s = sessionOf(p.email());
        assertThat(put("/api/v1/auth/session/link", Map.of("linkId", p.activeLink()), s).andReturn().getResponse().getStatus()).isEqualTo(200);
        return s;
    }

    private MvcResult download(Cookie s) throws Exception {
        return get(EXPORT, s).andReturn();
    }

    private JsonNode file(Cookie s) throws Exception {
        MvcResult r = download(s);
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        assertThat(r.getResponse().getContentType()).startsWith("application/json");
        assertThat(r.getResponse().getHeader("Content-Disposition")).isEqualTo("attachment; filename=\"meus-dados-ctcore.json\"");
        assertThat(r.getResponse().getHeader("Cache-Control")).contains("no-store");
        return json.readTree(r.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private static List<JsonNode> list(JsonNode array) {
        assertThat(array.isArray()).isTrue();
        List<JsonNode> out = new ArrayList<>();
        array.forEach(out::add);
        return out;
    }

    private void photo(UUID account, String name, byte[] content) {
        if (content != null) storage.putAccountFile(account, name, content, "image/png");
        admin.update("update account set photo = ? where id = ?", name, account);
    }

    @Test
    @DisplayName("RF-LGP-01: CA7, CA9: Coordenador, Administrador e Professor baixam conta, vínculos, consentimentos e acessos de todas as organizações")
    void bringsTheWholeAccount() throws Exception {
        Person coordinator = person("coord", "COORDINATOR", "203.0.113");
        Person administrator = person("adm", "ADMINISTRATOR", "198.51.100");
        Person teacher = person("prof", "TEACHER", "192.0.2");
        enableTwoFactor(coordinator.id(), coordinator.email());
        byte[] picture = "foto-ficticia".getBytes(StandardCharsets.UTF_8);
        photo(coordinator.id(), "photo-a.png", picture);
        photo(administrator.id(), "photo-missing.webp", null);

        for (var entry : Map.of(coordinator, "COORDINATOR", administrator, "ADMINISTRATOR", teacher, "TEACHER").entrySet()) {
            Person p = entry.getKey();
            String tag = p.email().substring(0, p.email().indexOf('@'));
            JsonNode f = file(sessionOn(p));

            assertThat(f.path("generatedAt").asText()).startsWith("2026-10-17T");
            assertThat(f.path("account").path("name").asText()).isEqualTo("Pessoa " + tag);
            assertThat(f.path("account").path("email").asText()).isEqualTo(p.email());
            assertThat(f.path("account").path("phone").asText()).startsWith("119");
            if (p == coordinator) {
                assertThat(f.path("account").path("photo").path("contentType").asText()).isEqualTo("image/png");
                assertThat(Base64.getDecoder().decode(f.path("account").path("photo").path("base64").asText())).isEqualTo(picture);
            } else {
                assertThat(f.path("account").path("photo").isNull()).isTrue();
            }

            assertThat(list(f.path("links"))).extracting(l -> l.path("organization").asText(), l -> l.path("role").asText(),
                    l -> l.path("status").asText(), l -> l.path("startsOn").asText(), l -> l.path("endsOn").asText(), l -> l.path("units").toString())
                    .containsExactly(
                            tuple("Academia Ativa", entry.getValue(), "ACTIVE", "null", "null", "[\"Unidade Centro\"]"),
                            tuple("Academia Encerrada", "GUARDIAN", "ENDED", "2025-02-01", "2025-12-01", "[\"Unidade Antiga\"]"));

            JsonNode consents = f.path("consents");
            assertThat(list(consents.path("termAcceptances"))).hasSize(1).first().satisfies(t -> assertThat(t.toString()).isEqualTo(
                    "{\"organization\":\"Academia Encerrada\",\"kind\":\"IMAGE_USE\",\"event\":\"REVOKED\",\"version\":3,\"at\":\"2025-03-04T10:00:00Z\"}"));
            assertThat(list(consents.path("modalityConfirmations"))).hasSize(1).first().satisfies(m -> assertThat(m.toString())
                    .isEqualTo("{\"organization\":\"Academia Encerrada\",\"at\":\"2025-04-05T10:00:00Z\"}"));
            assertThat(consents.path("emailPreferences").toString())
                    .isEqualTo("[{\"organization\":\"Academia Encerrada\",\"role\":\"GUARDIAN\",\"announcements\":false}]");
            assertThat(consents.path("teacherDirectory").toString())
                    .isEqualTo("[{\"organization\":\"Academia Encerrada\",\"consent\":true,\"declaredByManagement\":true}]");

            List<JsonNode> attempts = list(f.path("access").path("attempts"));
            assertThat(attempts.get(attempts.size() - 1).path("at").asText()).startsWith("2026-10-17T12:"); // the login of this test
            assertThat(attempts.get(attempts.size() - 1).path("ip").asText()).isEqualTo("127.0.0");
            assertThat(attempts).extracting(a -> a.path("at").asText(), a -> a.path("result").asText(),
                    a -> a.path("ip").asText())
                    .contains(tuple("2026-07-01T10:00:00Z", "WRONG_PASSWORD", ipPrefixOf(p, coordinator, administrator)),
                            tuple("2026-07-02T10:00:00Z", "SUCCESS", "2001:db8:abcd::/48"));
            List<JsonNode> sessions = list(f.path("access").path("sessions"));
            assertThat(sessions).hasSize(2);
            assertThat(sessions.get(0).path("device").asText()).isEqualTo("Chrome em Windows");
            assertThat(sessions.get(0).path("createdAt").asText()).isEqualTo("2026-08-01T10:00:00Z");
            assertThat(sessions.get(0).path("lastUsedAt").asText()).isEqualTo("2026-08-02T10:00:00Z");
            assertThat(sessions.get(0).path("endedAt").asText()).isEqualTo("2026-08-02T11:00:00Z");
            assertThat(sessions.get(1).path("endedAt").isNull()).isTrue();
            assertThat(sessions.get(1).path("ip").asText()).isEqualTo("127.0.0");
        }
    }

    private static String ipPrefixOf(Person p, Person coordinator, Person administrator) {
        return p == coordinator ? "203.0.113" : p == administrator ? "198.51.100" : "192.0.2";
    }

    @Test
    @DisplayName("RF-LGP-01, RN-ACE-25: CA8: nada de outra conta, nenhum hash, segredo, URL, aluno ou IP inteiro, e nada anterior ao e-mail ser da conta")
    void nothingElse() throws Exception {
        Person a = person("ana", "ADMINISTRATOR", "203.0.113");
        Person b = person("bia", "ADMINISTRATOR", "198.51.100");
        UUID onlyOfB = org("Academia So De Bia");
        admin.update("update unit set name = 'Unidade So De Bia' where id = ?", unit(onlyOfB));
        link(b.id(), onlyOfB, "TEACHER", "ENDED");
        photo(a.id(), "photo-a.png", "a".getBytes(StandardCharsets.UTF_8));
        photo(b.id(), "photo-b.png", "foto-de-bia".getBytes(StandardCharsets.UTF_8));
        enableTwoFactor(a.id(), a.email());
        admin.update("insert into account_backup_code (account_id, code_hash) values (?, 'hash-de-codigo')", a.id());
        // before the account existed, and before the last confirmed change of e-mail: someone else's use of the address
        attempt(a.email(), "192.0.2.10", "2025-12-31T23:59:59Z", "SUCCESS");
        attempt(a.email(), "192.0.2.11", "2026-05-01T10:00:00Z", "SUCCESS");
        attempt("antigo@dados.example", "192.0.2.12", "2026-07-03T10:00:00Z", "SUCCESS");
        admin.update("insert into account_email_change (account_id, new_email, code_hash, expires_at, used_at) "
                + "values (?, ?, 'hash-de-troca', '2026-06-02T00:00:00Z', '2026-06-01T00:00:00Z')", a.id(), a.email());
        admin.update("insert into account_email_change (account_id, new_email, code_hash, expires_at, canceled_at) "
                + "values (?, 'outro@dados.example', 'hash-cancelado', '2026-09-02T00:00:00Z', '2026-09-01T00:00:00Z')", a.id());

        Cookie s = sessionOn(a);
        JsonNode f = file(s);
        String text = f.toString();
        assertThat(list(f.path("access").path("attempts"))).extracting(x -> x.path("at").asText())
                .contains("2026-07-01T10:00:00Z", "2026-07-02T10:00:00Z")
                .allMatch(at -> at.compareTo("2026-06-01") > 0);
        assertThat(text).doesNotContain("bia", "198.51.100", "So De Bia", "foto-de-bia",
                Base64.getEncoder().encodeToString("foto-de-bia".getBytes(StandardCharsets.UTF_8)),
                admin.queryForObject("select phone from account where id = ?", String.class, b.id()),
                "Aluno Secreto", "Professor Ficha", "192.0.2", "antigo@", "outro@")
                .doesNotContain(passwordHash, "token-hash", "hash-de", "hash-cancelado", "X-Amz", "http", "Mozilla", b.id().toString())
                .doesNotContain(admin.queryForObject("select secret_encrypted from account_two_factor where account_id = ?", String.class, a.id()),
                        Base32.encode(secrets.get(a.email())), s.getValue(), Codes.hash(s.getValue()))
                .doesNotContain("203.0.113.", "127.0.0.1", "2001:db8:abcd:12");
        for (String forbidden : new String[]{"password", "secret", "token", "hash", "photoUrl", "studentName"}) {
            assertThat(text.toLowerCase(java.util.Locale.ROOT)).doesNotContain(forbidden.toLowerCase(java.util.Locale.ROOT) + "\":");
        }
        // the route takes no id: whatever is sent, the file is of the session
        MvcResult forced = get(EXPORT + "?accountId=" + b.id(), s).andReturn();
        assertThat(json.readTree(forced.getResponse().getContentAsString()).path("account").path("email").asText()).isEqualTo(a.email());
    }

    @Test
    @DisplayName("RF-LGP-01: CA9: audita só na organização ativa, sem o conteúdo; sem sessão 401; portal ou sem vínculo ativo 403 sem auditoria")
    void accessAndAudit() throws Exception {
        assertThat(download(null).getResponse().getStatus()).isEqualTo(401);

        UUID portal = account("portal@dados.example");
        link(portal, active, "STUDENT", "ACTIVE");
        UUID guardian = account("resp@dados.example");
        link(guardian, active, "GUARDIAN", "ACTIVE");
        UUID undecided = account("dois@dados.example");
        link(undecided, active, "ADMINISTRATOR", "ACTIVE");
        link(undecided, ended, "TEACHER", "ACTIVE");
        UUID none = account("nenhum@dados.example");
        link(none, ended, "ADMINISTRATOR", "ENDED");
        for (String email : List.of("portal@dados.example", "resp@dados.example", "dois@dados.example", "nenhum@dados.example")) {
            assertThat(download(sessionOf(email)).getResponse().getStatus()).as(email).isEqualTo(403);
        }
        assertThat(count("select count(*) from audit_log where action = 'account.data_downloaded'")).isZero();

        Person p = person("ana", "ADMINISTRATOR", "203.0.113");
        link(p.id(), org("Outra Ativa"), "TEACHER", "ACTIVE");
        file(sessionOn(p));
        assertThat(admin.queryForList("select organization_id, actor_id, entity_id, before_data, after_data, reason from audit_log "
                + "where action = 'account.data_downloaded'")).singleElement().satisfies(row -> {
                    assertThat(row.get("organization_id")).isEqualTo(active);
                    assertThat(row.get("actor_id")).isEqualTo(p.id());
                    assertThat(row.get("entity_id")).isEqualTo(p.id().toString());
                    assertThat(row.get("before_data")).isNull();
                    assertThat(row.get("after_data")).isNull();
                    assertThat(row.get("reason")).isNull();
                });
    }

    @Test
    @DisplayName("RF-LGP-01: CA8: no escopo da conta o papel operacional só lê o que é dela, não escreve, e sem conta no contexto não lê nada")
    void rowLevelSecurity() {
        Person a = person("ana", "ADMINISTRATOR", "203.0.113");
        Person b = person("bia", "ADMINISTRATOR", "198.51.100");
        UUID onlyOfB = org("Academia So De Bia");
        UUID unitOfB = unit(onlyOfB);
        UUID linkOfB = link(b.id(), onlyOfB, "TEACHER", "ENDED");
        admin.update("insert into account_link_unit (link_id, organization_id, unit_id) values (?, ?, ?)", linkOfB, onlyOfB, unitOfB);

        accountTx.forAccount(a.id(), () -> {
            for (String table : List.of("term_acceptance", "modality_confirmation", "teacher")) {
                assertThat(ids("select account_id from " + table)).as(table).containsExactly(a.id());
            }
            assertThat(ids("select id from organization")).containsExactlyInAnyOrder(active, ended);
            assertThat(ids("select id from unit")).containsExactlyInAnyOrder(activeUnit, endedUnit);
            assertThat(runtime.sql("update teacher set directory_consent = false").update()).isZero();
            assertThat(runtime.sql("update organization set name = 'x'").update()).isZero();
            assertThat(runtime.sql("update unit set name = 'x'").update()).isZero();
            return null;
        });
        accountTx.forInvite("hash-inexistente", () -> {
            for (String table : List.of("term_acceptance", "modality_confirmation", "teacher", "organization", "unit")) {
                assertThat(runtime.sql("select count(*) from " + table).query(Long.class).single()).as(table).isZero();
            }
            return null;
        });
    }

    private List<UUID> ids(String sql) {
        return runtime.sql(sql).query(UUID.class).list();
    }

    @Test
    @DisplayName("RN-ACE-25: o IP nunca sai inteiro: IPv4 sem o último número, IPv6 com o prefixo /48 e o que não é IP vira nulo")
    void masksAddresses() {
        assertThat(AccountDataExport.mask("203.0.113.77")).isEqualTo("203.0.113");
        assertThat(AccountDataExport.mask("2001:db8:abcd:12:1:2:3:4")).isEqualTo("2001:db8:abcd::/48");
        assertThat(AccountDataExport.mask("0:0:0:0:0:0:0:1")).isEqualTo("0:0:0::/48");
        assertThat(AccountDataExport.mask("fe80::1%eth0")).isEqualTo("fe80:0:0::/48");
        assertThat(AccountDataExport.mask("::ffff:203.0.113.77")).isEqualTo("203.0.113");
        for (String other : new String[]{null, "", "unknown", "host.example", "203.0.113", "999.1.1.1", "1:2:zz", "abc:def"}) {
            assertThat(AccountDataExport.mask(other)).as(String.valueOf(other)).isNull();
        }
    }
}
