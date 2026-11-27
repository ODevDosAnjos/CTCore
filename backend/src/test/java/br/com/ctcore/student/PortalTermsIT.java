package br.com.ctcore.student;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.identity.AccountPrincipal;
import br.com.ctcore.identity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** RN-MAT-11 a RN-MAT-14, RN-LGP-01: regras do aceite do termo e do uso de imagem, com banco real. */
class PortalTermsIT extends PortalTermBase {
    @Test
    @DisplayName("CA1, CA5, CA7, CA20: aceite grava conta, versão e IP, com uso de imagem na caixa; repetir devolve 200 sem nova linha; auditoria sem o texto")
    void accept() throws Exception {
        Tenant t = tenant();
        publish(t, "ENROLLMENT", 1, true);
        publish(t, "IMAGE_USE", 1, true);
        UUID acc = account("aluno@portal.example"), acc2 = account("outro@portal.example");
        UUID s = enrolledAdult(t, "Aluno Um", acc), noImage = enrolledAdult(t, "Aluno Dois", acc2);
        var who = portal(t, acc, Role.STUDENT);

        assertThat(body(get(who, "/term")).get(0).get("id").asText()).isEqualTo(s.toString());
        var first = post(who, s, "{\"version\":1,\"imageUse\":true}");
        assertThat(first.getStatus()).isEqualTo(201);
        assertThat(body(first).get("imageUse").asBoolean()).isTrue();
        var row = adminJdbc().queryForMap("select account_id, version, ip, accepted_at from term_acceptance where student_id = ? and kind = 'ENROLLMENT'", s);
        assertThat(row.get("account_id")).isEqualTo(acc);
        assertThat(row.get("version")).isEqualTo(1);
        assertThat(row.get("ip").toString()).isNotBlank();
        assertThat(row.get("accepted_at")).isNotNull();
        assertThat(count("student_id = ? and kind = 'IMAGE_USE' and event = 'ACCEPTED' and version = 1", s)).isEqualTo(1);
        assertThat(body(get(who, "/term"))).isEmpty();

        assertThat(post(who, s, "{\"version\":1,\"imageUse\":true}").getStatus()).isEqualTo(200);
        assertThat(count("student_id = ?", s)).isEqualTo(2);
        assertThat(audits("term.accepted", s)).isEqualTo(1);
        assertThat(audits("image-use.granted", s)).isEqualTo(1);
        assertThat(adminJdbc().queryForObject("select coalesce(string_agg(after_data::text, ''), '') from audit_log where entity_id = ?", String.class, s.toString()))
                .doesNotContain("Texto do termo");

        assertThat(post(portal(t, acc2, Role.STUDENT), noImage, "{\"version\":1,\"imageUse\":false}").getStatus()).isEqualTo(201);
        assertThat(count("student_id = ? and kind = 'IMAGE_USE'", noImage)).isZero();
        assertThat(body(get(portal(t, acc2, Role.STUDENT), "/students/" + noImage + "/image-use")).get("granted").asBoolean()).isFalse();
    }

    private static final String FIELDS_TERM = "Contratante: {unidade} | {razao_social} | {cnpj} | {endereco}.";

    private UUID unit(Tenant t, String name, String legalName, String cnpj, String address) {
        UUID id = UUID.randomUUID();
        adminJdbc().update("insert into unit (id, organization_id, name, short_name, legal_name, cnpj, address, city, postal_code) values (?, ?, ?, ?, ?, ?, ?, 'Cidade Fictícia', '20000000')",
                id, t.orgId(), name, id.toString(), legalName, cnpj, address);
        return id;
    }

    private void publishFields(Tenant t) {
        publish(t, "ENROLLMENT", 1, true);
        adminJdbc().update("update terms_version set body = ? where organization_id = ?", FIELDS_TERM, t.orgId());
    }

    private UUID enrolledAt(Tenant t, String name, UUID account, UUID unit) {
        UUID id = student(t, name, "1990-01-01", account);
        EnrollmentFixtures.enroll(adminJdbc(), t.orgId(), id, unit, "ACTIVE", 0, null);
        return id;
    }

    private JsonNode term(AccountPrincipal who) throws Exception {
        return body(get(who, "/term")).get(0).get("term");
    }

    private String stored(UUID student) {
        return adminJdbc().queryForObject("select body from term_acceptance where student_id = ? and kind = 'ENROLLMENT'", String.class, student);
    }

    private static String acceptance(int version, JsonNode term) {
        return "{\"version\":" + version + ",\"hash\":\"" + term.get("hash").asText() + "\"}";
    }

    @Test
    @DisplayName("769 CA1, CA3: cada aluno lê e aceita o texto da própria unidade; o gravado é o mostrado e não muda com a unidade nem com o titular")
    void filledPerUnit() throws Exception {
        Tenant t = tenant();
        publishFields(t);
        publish(t, "IMAGE_USE", 1, true);
        UUID north = unit(t, "Norte", "Norte Ltda", "11222333000181", "Rua Norte, 1"), south = unit(t, "Sul", "Sul Ltda", "11444777000161", "Rua Sul, 2");
        UUID accN = account("norte@portal.example"), accS = account("sul@portal.example");
        UUID a = enrolledAt(t, "Aluno Norte", accN, north), b = enrolledAt(t, "Aluno Sul", accS, south);
        var expected = java.util.Map.of(a, "Contratante: Norte | Norte Ltda | 11.222.333/0001-81 | Rua Norte, 1, Cidade Fictícia, CEP 20000-000.",
                b, "Contratante: Sul | Sul Ltda | 11.444.777/0001-61 | Rua Sul, 2, Cidade Fictícia, CEP 20000-000.");
        for (var entry : java.util.Map.of(a, accN, b, accS).entrySet()) {
            var who = portal(t, entry.getValue(), Role.STUDENT);
            var shown = term(who);
            assertThat(shown.get("body").asText()).isEqualTo(expected.get(entry.getKey()));
            assertThat(post(who, entry.getKey(), "{\"version\":1,\"imageUse\":true,\"hash\":\"" + shown.get("hash").asText() + "\"}").getStatus()).isEqualTo(201);
            assertThat(stored(entry.getKey())).isEqualTo(shown.get("body").asText());
        }
        assertThat(count("kind = 'IMAGE_USE' and body is null")).isEqualTo(2);
        assertThat(adminJdbc().queryForObject("select coalesce(string_agg(after_data::text, ''), '') from audit_log where entity_id = ?", String.class, a.toString()))
                .doesNotContain("Contratante", "Norte Ltda", "11.222.333");

        adminJdbc().update("update unit set name = 'Outro', legal_name = 'Outra Ltda', cnpj = null, address = 'Outra Rua' where id = ?", north);
        adminJdbc().update("update organization set holder_name = 'Novo Titular' where id = ?", t.orgId());
        assertThat(stored(a)).isEqualTo(expected.get(a));
        assertThat(post(portal(t, accN, Role.STUDENT), a, "{\"version\":1,\"hash\":\"antigo\"}").getStatus()).isEqualTo(200);
        assertThat(count("student_id = ? and kind = 'ENROLLMENT'", a)).isEqualTo(1);
        assertThat(stored(a)).isEqualTo(expected.get(a));
    }

    @Test
    @DisplayName("769 CA2, CA10: sem CNPJ vale o titular; em branco sai não informado e o aceite funciona; o modelo (versão 0) vem preenchido")
    void holderAndMissing() throws Exception {
        Tenant t = tenant();
        UUID noCnpj = unit(t, "Filial", "Razão Que Não Sai", null, "Rua Filial, 3");
        UUID acc = account("filial@portal.example");
        UUID s = enrolledAt(t, "Aluno Filial", acc, noCnpj);
        var who = portal(t, acc, Role.STUDENT);
        adminJdbc().update("update organization set holder_name = 'Titular Fictício', holder_document = '52998224725' where id = ?", t.orgId());

        var model = term(who);
        assertThat(model.get("version").asInt()).isZero();
        assertThat(model.get("body").asText()).contains("Unidade: Filial", "Razão social: Titular Fictício", "CNPJ ou CPF: 529.982.247-25", "Endereço: Rua Filial, 3")
                .doesNotContain("{", "Razão Que Não Sai");

        adminJdbc().update("update organization set holder_name = null, holder_document = null where id = ?", t.orgId());
        adminJdbc().update("update unit set address = null, city = null, postal_code = null where id = ?", noCnpj);
        var blank = term(who);
        assertThat(blank.get("body").asText()).contains("Razão social: não informado", "CNPJ ou CPF: não informado", "Endereço: não informado");
        assertThat(post(who, s, acceptance(0, blank)).getStatus()).isEqualTo(201);
        assertThat(stored(s)).isEqualTo(blank.get("body").asText());
    }

    @Test
    @DisplayName("769 CA8: vale a modalidade ativa mais antiga; todas encerradas, a unidade de cadastro; mudar de unidade depois não reabre o termo")
    void enrollmentUnit() throws Exception {
        Tenant t = tenant();
        publishFields(t);
        UUID older = unit(t, "Antiga", null, null, null), newer = unit(t, "Recente", null, null, null);
        UUID acc = account("duas@portal.example");
        UUID s = student(t, "Aluno Duas", "1990-01-01", acc);
        var first = EnrollmentFixtures.enroll(adminJdbc(), t.orgId(), s, newer, "ACTIVE", 0, null);
        var second = EnrollmentFixtures.enroll(adminJdbc(), t.orgId(), s, older, "ACTIVE", 1, null);
        adminJdbc().update("update enrollment_modality set started_at = now() - interval '30 days' where id = ?", second.row());
        var who = portal(t, acc, Role.STUDENT);
        assertThat(term(who).get("body").asText()).startsWith("Contratante: Antiga |");

        adminJdbc().update("update enrollment_modality set status = 'ENDED', ended_at = now() where id = ?", second.row());
        assertThat(term(who).get("body").asText()).startsWith("Contratante: Recente |");
        adminJdbc().update("update enrollment_modality set status = 'ENDED', ended_at = now() where id = ?", first.row());
        assertThat(term(who).get("body").asText()).startsWith("Contratante: Unit |");

        assertThat(post(who, s, acceptance(1, term(who))).getStatus()).isEqualTo(201);
        adminJdbc().update("update enrollment_modality set status = 'ACTIVE', ended_at = null where id = ?", second.row());
        assertThat(body(get(who, "/term"))).isEmpty();
        assertThat(stored(s)).startsWith("Contratante: Unit |");
    }

    @Test
    @DisplayName("769 CA9: dado mudou antes do aceite, hash antigo dá 409 sem gravar; o novo funciona; sem hash grava o texto do momento")
    void changedBeforeAcceptance() throws Exception {
        Tenant t = tenant();
        publishFields(t);
        publish(t, "IMAGE_USE", 1, true);
        UUID u = unit(t, "Centro Fictício", "Centro Ltda", "11222333000181", "Rua Um, 1");
        UUID acc = account("mudou@portal.example"), acc2 = account("semhash@portal.example");
        UUID s = enrolledAt(t, "Aluno Mudou", acc, u), s2 = enrolledAt(t, "Aluno Sem Hash", acc2, u);
        var who = portal(t, acc, Role.STUDENT);
        var old = term(who);
        adminJdbc().update("update unit set legal_name = 'Centro Novo Ltda' where id = ?", u);

        var refused = post(who, s, "{\"version\":1,\"imageUse\":true,\"hash\":\"" + old.get("hash").asText() + "\"}");
        assertThat(refused.getStatus()).isEqualTo(409);
        assertThat(body(refused).get("code").asText()).isEqualTo("TERMS_VERSION_CONFLICT");
        assertThat(count("true")).isZero();
        assertThat(audits("term.accepted", s)).isZero();

        var fresh = term(who);
        assertThat(fresh.get("hash").asText()).isNotEqualTo(old.get("hash").asText());
        assertThat(post(who, s, acceptance(1, fresh)).getStatus()).isEqualTo(201);
        assertThat(stored(s)).contains("Centro Novo Ltda");
        assertThat(post(portal(t, acc2, Role.STUDENT), s2, "{\"version\":1}").getStatus()).isEqualTo(201);
        assertThat(stored(s2)).isEqualTo(stored(s));
    }

    @Test
    @DisplayName("CA5: duas chamadas simultâneas gravam uma linha só")
    void concurrent() throws Exception {
        Tenant t = tenant();
        publish(t, "ENROLLMENT", 1, true);
        UUID acc = account("corrida@portal.example");
        UUID s = enrolledAdult(t, "Aluno Corrida", acc);
        var who = portal(t, acc, Role.STUDENT);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Callable<Integer> call = () -> post(who, s, "{\"version\":1}").getStatus();
            Future<Integer> a = pool.submit(call), b = pool.submit(call);
            assertThat(List.of(a.get(), b.get())).containsExactlyInAnyOrder(200, 201);
        } finally {
            pool.shutdown();
        }
        assertThat(count("student_id = ? and kind = 'ENROLLMENT'", s)).isEqualTo(1);
    }

    @Test
    @DisplayName("CA2: menor com dois responsáveis: o financeiro aceita (201), o não financeiro recebe 403 e nada é gravado")
    void guardians() throws Exception {
        Tenant t = tenant();
        publish(t, "ENROLLMENT", 1, true);
        UUID fin = account("financeiro@portal.example"), other = account("outro@portal.example");
        UUID child = student(t, "Filho Menor", "2015-01-01", null);
        EnrollmentFixtures.enroll(adminJdbc(), t.orgId(), child, t.unitId(), "ACTIVE", 0, null);
        guardian(t, fin, "52998224725", true, child);
        guardian(t, other, "11144477735", false, child);

        assertThat(post(portal(t, other, Role.GUARDIAN), child, "{\"version\":1}").getStatus()).isEqualTo(403);
        assertThat(count("student_id = ?", child)).isZero();
        assertThat(post(portal(t, fin, Role.GUARDIAN), child, "{\"version\":1}").getStatus()).isEqualTo(201);
        assertThat(count("student_id = ? and account_id = ?", child, fin)).isEqualTo(1);
    }

    @Test
    @DisplayName("CA4, CA6: versão antiga 409, sem versão 400, aluno sem matrícula 200; nada é gravado")
    void rejected() throws Exception {
        Tenant t = tenant();
        publish(t, "ENROLLMENT", 1, true);
        publish(t, "ENROLLMENT", 2, true);
        UUID acc = account("aluno@portal.example"), acc2 = account("semmatricula@portal.example");
        UUID s = enrolledAdult(t, "Aluno Um", acc), none = student(t, "Sem Matricula", "1990-01-01", acc2);
        var who = portal(t, acc, Role.STUDENT);

        var old = post(who, s, "{\"version\":1}");
        assertThat(old.getStatus()).isEqualTo(409);
        assertThat(body(old).get("code").asText()).isEqualTo("TERMS_VERSION_CONFLICT");
        var missing = post(who, s, "{}");
        assertThat(missing.getStatus()).isEqualTo(400);
        assertThat(body(missing).get("code").asText()).isEqualTo("VALIDATION_ERROR");
        assertThat(post(portal(t, acc2, Role.STUDENT), none, "{\"version\":2}").getStatus()).isEqualTo(200);
        assertThat(count("true")).isZero();
        assertThat(body(get(portal(t, acc2, Role.STUDENT), "/term"))).isEmpty();
    }

    @Test
    @DisplayName("CA10, CA11: reaceite só quando a versão nova pede; aluno matriculado depois da v3 sem aceite está pendente e aceita a v3")
    void reaccept() throws Exception {
        Tenant t = tenant();
        publish(t, "ENROLLMENT", 1, true);
        UUID acc = account("aluno@portal.example"), late = account("tarde@portal.example");
        UUID s = enrolledAdult(t, "Aluno Um", acc);
        var who = portal(t, acc, Role.STUDENT);
        assertThat(post(who, s, "{\"version\":1}").getStatus()).isEqualTo(201);

        publish(t, "ENROLLMENT", 2, false);
        assertThat(body(get(who, "/term"))).isEmpty();
        publish(t, "ENROLLMENT", 3, true);
        var pending = body(get(who, "/term"));
        assertThat(pending).hasSize(1);
        assertThat(pending.get(0).get("term").get("version").asInt()).isEqualTo(3);
        assertThat(post(who, s, "{\"version\":3}").getStatus()).isEqualTo(201);
        assertThat(body(get(who, "/term"))).isEmpty();

        publish(t, "ENROLLMENT", 4, false);
        UUID s2 = enrolledAdult(t, "Aluno Tarde", late);
        assertThat(body(get(portal(t, late, Role.STUDENT), "/term"))).hasSize(1);
        assertThat(post(portal(t, late, Role.STUDENT), s2, "{\"version\":4}").getStatus()).isEqualTo(201);
        assertThat(count("student_id = ? and version = 4", s2)).isEqualTo(1);
    }

    @Test
    @DisplayName("CA8, CA9, CA20: revogar e conceder uso de imagem são registros novos; versão antiga 409; nova versão com reaccept volta a falso")
    void imageUse() throws Exception {
        Tenant t = tenant();
        publish(t, "IMAGE_USE", 1, true);
        UUID acc = account("aluno@portal.example");
        UUID s = enrolledAdult(t, "Aluno Um", acc);
        AccountPrincipal who = portal(t, acc, Role.STUDENT);

        assertThat(body(put(who, s, "{\"granted\":true,\"version\":1}")).get("granted").asBoolean()).isTrue();
        assertThat(put(who, s, "{\"granted\":true,\"version\":1}").getStatus()).isEqualTo(200);
        assertThat(count("student_id = ? and kind = 'IMAGE_USE'", s)).isEqualTo(1);
        var revoked = put(who, s, "{\"granted\":false}");
        assertThat(revoked.getStatus()).isEqualTo(200);
        assertThat(body(revoked).get("granted").asBoolean()).isFalse();
        assertThat(body(get(who, "/students/" + s + "/image-use")).get("granted").asBoolean()).isFalse();
        assertThat(count("student_id = ? and event = 'REVOKED'", s)).isEqualTo(1);
        assertThat(count("student_id = ? and event = 'ACCEPTED'", s)).isEqualTo(1);
        assertThat(audits("image-use.revoked", s)).isEqualTo(1);
        assertThat(put(who, s, "{\"granted\":false}").getStatus()).isEqualTo(200);
        assertThat(count("student_id = ?", s)).isEqualTo(2);
        assertThat(put(who, s, "{\"granted\":true,\"version\":1}").getStatus()).isEqualTo(200);
        assertThat(count("student_id = ? and event = 'ACCEPTED'", s)).isEqualTo(2);
        assertThat(put(who, s, "{}").getStatus()).isEqualTo(400);

        publish(t, "IMAGE_USE", 2, true);
        var after = body(get(who, "/students/" + s + "/image-use"));
        assertThat(after.get("granted").asBoolean()).isFalse();
        assertThat(after.get("version").asInt()).isEqualTo(2);
        assertThat(after.get("body").asText()).contains("v2");
        assertThat(put(who, s, "{\"granted\":true,\"version\":1}").getStatus()).isEqualTo(409);
        assertThat(put(who, s, "{\"granted\":true,\"version\":2}").getStatus()).isEqualTo(200);
        assertThat(body(get(who, "/students/" + s + "/image-use")).get("granted").asBoolean()).isTrue();
    }
}
