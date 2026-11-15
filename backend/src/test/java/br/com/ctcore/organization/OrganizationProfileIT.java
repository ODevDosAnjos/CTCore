package br.com.ctcore.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.ctcore.identity.Role;
import br.com.ctcore.isolation.Scopes;
import br.com.ctcore.storage.FileStorage;
import br.com.ctcore.storage.S3FileStorage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class OrganizationProfileIT extends OrganizationBase {
    @Autowired ObjectMapper json;
    @Autowired S3FileStorage storage;

    JsonNode ok(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, Tenant t, Role role) throws Exception {
        var response = call(request, who(t, role)).getResponse();
        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(200);
        return json.readTree(response.getContentAsString());
    }

    JsonNode invalid(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, Tenant t, String field) throws Exception {
        var response = call(request, who(t, Role.COORDINATOR)).getResponse();
        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getContentAsString()).contains("VALIDATION_ERROR").contains("\"" + field + "\"");
        return json.readTree(response.getContentAsString());
    }

    List<Map<String, Object>> audit(Tenant t, String action) {
        return adminJdbc().queryForList("select actor_profile, actor_id, before_data::text as b, after_data::text as a, entity_id from audit_log "
                + "where organization_id = ? and action = ? order by occurred_at", t.orgId(), action);
    }


    String logoColumn(Tenant t) {
        return adminJdbc().queryForObject("select logo_url from organization where id = ?", String.class, t.orgId());
    }

    boolean exists(Tenant t, String file) {
        try (var ignored = Scopes.open(t.orgId(), null)) {
            storage.readUrl(file);
            return true;
        } catch (FileStorage.NotFound e) {
            return false;
        }
    }

    @Test
    @DisplayName("CA1 / CA13: Coordenador e Administrador leem; a resposta tem exatamente as chaves do contrato e logo nula sem logo")
    void read() throws Exception {
        var a = tenant();
        for (Role role : new Role[] {Role.COORDINATOR, Role.ADMINISTRATOR}) {
            var view = ok(get(), a, role);
            assertThat(view.fieldNames()).toIterable().containsExactlyInAnyOrder("name", "color", "holderDocument", "logoUrl", "version", "lastChange", "rules", "coordinator");
            assertThat(view.path("name").asText()).isEqualTo("Synthetic " + a.orgId());
            assertThat(view.path("logoUrl").isNull()).isTrue();
            assertThat(view.path("coordinator").isNull()).isTrue();
            assertThat(view.path("rules").toString()).isEqualTo(RULES_DEFAULT);
        }
    }

    static final String RULES_DEFAULT = "{\"deactivationDays\":30,\"formerStudentRetentionMonths\":12,\"trialRetentionMonths\":6,\"trialLimit\":2,\"crossUnitTraining\":\"plan\"}";

    static String rules(int days, int former, int trial, int limit, String cross) {
        return "{\"deactivationDays\":" + days + ",\"formerStudentRetentionMonths\":" + former + ",\"trialRetentionMonths\":" + trial
                + ",\"trialLimit\":" + limit + ",\"crossUnitTraining\":\"" + cross + "\"}";
    }

    @Test
    @DisplayName("CA13 / RF-ORG-01 / RN-ORG-13: coordinator traz nome, e-mail e duas etapas do Coordenador ativo, para os dois perfis")
    void coordinatorInView() throws Exception {
        var a = tenant();
        UUID account = UUID.randomUUID();
        adminJdbc().update("insert into account (id, email, name, status) values (?, 'marcos@academialeao.example', 'Marcos Leão', 'ACTIVE')", account);
        adminJdbc().update("insert into account_link (account_id, organization_id, role, status) values (?, ?, 'COORDINATOR', 'ACTIVE')", account, a.orgId());
        assertThat(ok(get(), a, Role.ADMINISTRATOR).path("coordinator").toString())
                .isEqualTo("{\"name\":\"Marcos Leão\",\"email\":\"marcos@academialeao.example\",\"twoFactorEnabled\":false}");
        adminJdbc().update("insert into account_two_factor (account_id, secret_encrypted, enabled_at) values (?, 'x', now())", account);
        assertThat(ok(get(), a, Role.COORDINATOR).path("coordinator").path("twoFactorEnabled").asBoolean()).isTrue();
    }

    @Test
    @DisplayName("CA13 / RF-ORG-01 / RN-ORG-13: PATCH com rules grava as cinco regras, sobe a versão e audita antes e depois; sem rules mantém")
    void rulesUpdate() throws Exception {
        var a = tenant();
        var coordinator = who(a, Role.COORDINATOR);
        var view = ok(patch("{\"name\":\"Dojo\",\"rules\":" + rules(45, 24, 3, 3, "denied") + "}"), a, Role.COORDINATOR);
        assertThat(view.path("rules").toString()).isEqualTo(rules(45, 24, 3, 3, "denied"));
        assertThat(view.path("version").asInt()).isEqualTo(1);
        assertThat(adminJdbc().queryForObject("select deactivation_days || '/' || trial_limit || '/' || cross_unit_training from organization_settings where organization_id = ?",
                String.class, a.orgId())).isEqualTo("45/3/denied");
        var rows = audit(a, "organization.update");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("b").toString()).contains("\"deactivationDays\": 30", "\"crossUnitTraining\": \"plan\"");
        assertThat(rows.get(0).get("a").toString()).contains("\"deactivationDays\": 45", "\"crossUnitTraining\": \"denied\"");
        // omitido: as regras ficam; igual: nada muda
        assertThat(ok(patch("{\"name\":\"Dojo\"}"), a, Role.COORDINATOR).path("rules").toString()).isEqualTo(rules(45, 24, 3, 3, "denied"));
        var same = ok(patch("{\"name\":\"Dojo\",\"rules\":" + rules(45, 24, 3, 3, "denied") + "}"), a, Role.COORDINATOR);
        assertThat(same.path("version").asInt()).isEqualTo(1);
        assertThat(audit(a, "organization.update")).hasSize(1);
        // só regra mudou: a versão sobe e a auditoria traz as regras
        assertThat(ok(patch("{\"name\":\"Dojo\",\"rules\":" + rules(45, 24, 3, 1, "denied") + "}"), a, Role.COORDINATOR).path("version").asInt()).isEqualTo(2);
        assertThat(audit(a, "organization.update")).hasSize(2);
    }

    @Test
    @DisplayName("CA13 / RF-ORG-01: regra fora da faixa ou ausente responde 400 apontando rules.<campo> e nada é gravado")
    void rulesValidation() throws Exception {
        var a = tenant();
        String[][] bad = {
            {"deactivationDays", rules(14, 12, 6, 2, "plan")}, {"deactivationDays", rules(91, 12, 6, 2, "plan")},
            {"formerStudentRetentionMonths", rules(30, 0, 6, 2, "plan")}, {"formerStudentRetentionMonths", rules(30, 61, 6, 2, "plan")},
            {"trialRetentionMonths", rules(30, 12, 0, 2, "plan")}, {"trialLimit", rules(30, 12, 6, 4, "plan")},
            {"trialLimit", rules(30, 12, 6, 0, "plan")}, {"crossUnitTraining", rules(30, 12, 6, 2, "x")},
            {"deactivationDays", "{\"formerStudentRetentionMonths\":12,\"trialRetentionMonths\":6,\"trialLimit\":2,\"crossUnitTraining\":\"plan\"}"}};
        for (String[] b : bad) invalid(patch("{\"name\":\"Outro\",\"rules\":" + b[1] + "}"), a, "rules." + b[0]);
        assertThat(adminJdbc().queryForObject("select name || version from organization where id = ?", String.class, a.orgId())).isEqualTo("Synthetic " + a.orgId() + "0");
        ok(patch("{\"name\":\"Faixa\",\"rules\":" + rules(15, 1, 60, 3, "allowed") + "}"), a, Role.COORDINATOR);
        ok(patch("{\"name\":\"Faixa\",\"rules\":" + rules(90, 60, 1, 1, "plan") + "}"), a, Role.COORDINATOR);
    }

    @Test
    @DisplayName("CA13 / RNF-26: Administrador não grava regras (403); organização B não vê nem altera as regras da A")
    void rulesIsolated() throws Exception {
        var a = tenant();
        var b = tenant();
        assertThat(call(patch("{\"name\":\"Hack\",\"rules\":" + rules(60, 12, 6, 3, "denied") + "}"), who(a, Role.ADMINISTRATOR)).getResponse().getStatus()).isEqualTo(403);
        ok(patch("{\"name\":\"A\",\"rules\":" + rules(60, 12, 6, 3, "denied") + "}"), a, Role.COORDINATOR);
        assertThat(ok(get(), b, Role.COORDINATOR).path("rules").toString()).isEqualTo(RULES_DEFAULT);
        assertThat(adminJdbc().queryForObject("select deactivation_days from organization_settings where organization_id = ?", Integer.class, b.orgId())).isEqualTo(30);
        assertThat(call(get(), who(a, Role.TEACHER)).getResponse().getStatus()).isEqualTo(403);
    }

    @Test
    @DisplayName("CA3 / CA6 / CA7: PATCH salva nome, cor e titular (só dígitos) e a leitura devolve; vazio salva nulo")
    void update() throws Exception {
        var a = tenant();
        var view = ok(patch("{\"name\":\"  Dojo Alfa \",\"color\":\"#1A56DB\",\"holderDocument\":\"11.222.333/0001-81\"}"), a, Role.COORDINATOR);
        assertThat(view.path("name").asText()).isEqualTo("Dojo Alfa");
        assertThat(view.path("color").asText()).isEqualTo("#1a56db");
        assertThat(view.path("holderDocument").asText()).isEqualTo("11222333000181");
        assertThat(ok(get(), a, Role.ADMINISTRATOR)).isEqualTo(view);
        var cleared = ok(patch("{\"name\":\"Dojo Alfa\",\"color\":\"\",\"holderDocument\":null}"), a, Role.COORDINATOR);
        assertThat(cleared.path("color").isNull()).isTrue();
        assertThat(cleared.path("holderDocument").isNull()).isTrue();
        assertThat(ok(patch("{\"name\":\"Dojo\",\"holderDocument\":\"529.982.247-25\"}"), a, Role.COORDINATOR).path("holderDocument").asText())
                .isEqualTo("52998224725");
    }

    @Test
    @DisplayName("CA5 / CA6 / CA7: valores inválidos dão erro com o campo apontado e nada é salvo")
    void validation() throws Exception {
        var a = tenant();
        var before = row(a);
        String longName = "x".repeat(121);
        invalid(patch("{\"name\":\"\"}"), a, "name");
        invalid(patch("{\"name\":\"   \"}"), a, "name");
        invalid(patch("{\"name\":\"" + longName + "\"}"), a, "name");
        invalid(patch("{\"name\":\"ok\",\"holderDocument\":\"529.982.247-26\"}"), a, "holderDocument");
        invalid(patch("{\"name\":\"ok\",\"holderDocument\":\"abc\"}"), a, "holderDocument");
        for (String color : new String[] {"#ffeb3b", "azul", "#fff", "1a56db"}) {
            invalid(patch("{\"name\":\"ok\",\"color\":\"" + color + "\"}"), a, "color");
        }
        assertThat(ok(patch("{\"name\":\"" + "x".repeat(120) + "\"}"), a, Role.COORDINATOR).path("name").asText()).hasSize(120);
        assertThat(row(a)).isNotEqualTo(before);
        var current = row(a);
        invalid(patch("{\"name\":\"\",\"color\":\"#1a56db\"}"), a, "name");
        assertThat(row(a)).isEqualTo(current);
    }

    @Test
    @DisplayName("T2: o banco também recusa cor e titular fora do formato")
    void databaseChecks() {
        var a = tenant();
        assertThatThrownBy(() -> adminJdbc().update("update organization set color = 'red' where id = ?", a.orgId())).isInstanceOf(Exception.class);
        assertThatThrownBy(() -> adminJdbc().update("update organization set color = '#ABCDEF' where id = ?", a.orgId())).isInstanceOf(Exception.class);
        assertThatThrownBy(() -> adminJdbc().update("update organization set holder_document = '123' where id = ?", a.orgId())).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("CA8 / CA11: PNG, JPEG e WebP de 512 x 512; a URL assinada baixa a imagem; a troca apaga o arquivo antigo")
    void logoReplace() throws Exception {
        var a = tenant();
        byte[] png = LogoImageTest.image("png", 512, 512);
        var first = ok(putLogo(png, "qualquer.txt"), a, Role.COORDINATOR);
        String firstFile = logoColumn(a);
        assertThat(firstFile).matches("logo-[0-9a-f-]{36}\\.png");
        String url = first.path("logoUrl").asText();
        assertThat(url).contains("/org/" + a.orgId() + "/" + firstFile).contains("X-Amz-Signature=");
        var download = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(url)).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        assertThat(download.statusCode()).isEqualTo(200);
        assertThat(download.body()).isEqualTo(png);

        ok(putLogo(LogoImageTest.image("jpg", 512, 512), "a.png"), a, Role.COORDINATOR);
        String secondFile = logoColumn(a);
        assertThat(secondFile).endsWith(".jpg");
        assertThat(exists(a, firstFile)).isFalse();
        assertThat(exists(a, secondFile)).isTrue();

        ok(putLogo(LogoImageTest.webp("L", 512, 512), "a.png"), a, Role.COORDINATOR);
        assertThat(logoColumn(a)).endsWith(".webp");
        assertThat(exists(a, secondFile)).isFalse();
        assertThat(logoColumn(a)).doesNotContain("http").doesNotContain("/");
    }

    @Test
    @DisplayName("CA9: texto .png, 511 x 512, 1024 x 1024, GIF, SVG, vazio e acima de 5 MB dão erro e a logo anterior permanece")
    void logoInvalid() throws Exception {
        var a = tenant();
        ok(putLogo(LogoImageTest.image("png", 512, 512), "a.png"), a, Role.COORDINATOR);
        String current = logoColumn(a);
        byte[][] bad = {"not an image".getBytes(), LogoImageTest.image("png", 511, 512), LogoImageTest.image("png", 1024, 1024),
            LogoImageTest.image("gif", 512, 512), "<svg xmlns='http://www.w3.org/2000/svg'/>".getBytes(), new byte[0]};
        for (byte[] content : bad) invalid(putLogo(content, "logo.png"), a, "file");
        var huge = call(putLogo(new byte[5 * 1024 * 1024 + 1024], "big.png"), who(a, Role.COORDINATOR)).getResponse();
        assertThat(huge.getStatus()).isEqualTo(400);
        assertThat(logoColumn(a)).isEqualTo(current);
        assertThat(exists(a, current)).isTrue();
    }

    @Test
    @DisplayName("CA10: DELETE remove a logo e o arquivo; repetir não dá erro")
    void logoRemove() throws Exception {
        var a = tenant();
        ok(putLogo(LogoImageTest.image("png", 512, 512), "a.png"), a, Role.COORDINATOR);
        String file = logoColumn(a);
        assertThat(ok(deleteLogo(), a, Role.COORDINATOR).path("logoUrl").isNull()).isTrue();
        assertThat(logoColumn(a)).isNull();
        assertThat(exists(a, file)).isFalse();
        assertThat(ok(deleteLogo(), a, Role.COORDINATOR).path("logoUrl").isNull()).isTrue();
        assertThat(audit(a, "organization.logo.remove")).hasSize(1);
    }

    @Test
    @DisplayName("CA12: auditoria com antes e depois só dos campos alterados; sem mudança ou recusado não grava; sem URL assinada nem titular completo")
    void auditTrail() throws Exception {
        var a = tenant();
        var coordinator = who(a, Role.COORDINATOR);
        assertThat(call(patch("{\"name\":\"Novo\",\"color\":\"#1a56db\",\"holderDocument\":\"52998224725\"}"), coordinator).getResponse().getStatus()).isEqualTo(200);
        var rows = audit(a, "organization.update");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("actor_profile")).isEqualTo("COORDINATOR");
        assertThat(rows.get(0).get("actor_id")).isEqualTo(coordinator.accountId());
        assertThat(rows.get(0).get("entity_id")).isEqualTo(a.orgId().toString());
        assertThat(rows.get(0).get("a").toString()).contains("Novo", "#1a56db").doesNotContain("52998224725");
        assertThat(rows.get(0).get("b").toString()).contains("Synthetic");

        call(patch("{\"name\":\"Novo\",\"color\":\"#1a56db\",\"holderDocument\":\"52998224725\"}"), coordinator);
        call(patch("{\"name\":\"\"}"), coordinator);
        call(patch("{\"name\":\"Hack\"}"), who(a, Role.ADMINISTRATOR));
        call(patch("{\"name\":\"Só nome\",\"color\":\"#1a56db\",\"holderDocument\":\"52998224725\"}"), coordinator);
        rows = audit(a, "organization.update");
        assertThat(rows).hasSize(2);
        assertThat(rows).anySatisfy(r -> assertThat(r.get("a").toString()).contains("Só nome").doesNotContain("color"));

        call(putLogo(LogoImageTest.image("png", 512, 512), "a.png"), coordinator);
        call(putLogo(LogoImageTest.image("png", 512, 512), "a.png"), coordinator);
        assertThat(audit(a, "organization.logo.update")).hasSize(2);
        assertThat(audit(a, "organization.logo.update").toString()).doesNotContain("X-Amz").doesNotContain("http");
    }

    @Test
    @DisplayName("Isolamento: logo e dados de A não aparecem para B; a pasta do armazenamento é da própria organização")
    void logoIsolated() throws Exception {
        var a = tenant();
        var b = tenant();
        ok(putLogo(LogoImageTest.image("png", 512, 512), "a.png"), a, Role.COORDINATOR);
        assertThat(ok(get(), b, Role.COORDINATOR).path("logoUrl").isNull()).isTrue();
        assertThat(logoColumn(b)).isNull();
        assertThat(exists(b, logoColumn(a))).isFalse();
    }
}
