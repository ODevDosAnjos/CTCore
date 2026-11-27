package br.com.ctcore.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import br.com.ctcore.db.PostgresIT;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

/** #763: name, phone and photo of the own account, with real database and storage. */
@Import({AuthBase.Config.class, AuthBase.OrgProbe.class})
class AccountProfileIT extends AuthBase {
    static final GenericContainer<?> STORAGE = new GenericContainer<>(DockerImageName.parse("chrislusf/seaweedfs:3.80"))
            .withCommand("server", "-dir=/data", "-s3", "-s3.port=8333", "-s3.config=/etc/seaweedfs/s3.json", "-ip.bind=0.0.0.0")
            .withCopyFileToContainer(MountableFile.forHostPath(Path.of("../infra/storage/s3.json")), "/etc/seaweedfs/s3.json")
            .withTmpFs(Map.of("/data", "rw"))
            .withExposedPorts(8333)
            .waitingFor(Wait.forHttp("/status").forPort(8333));

    static {
        STORAGE.start();
    }

    @DynamicPropertySource
    static void storageProperties(DynamicPropertyRegistry registry) {
        registry.add("ctcore.storage.endpoint", () -> "http://" + STORAGE.getHost() + ":" + STORAGE.getMappedPort(8333));
    }

    static final String SESSION = "/api/v1/auth/session";
    static final String PROFILE = "/api/v1/auth/profile";
    static final String PHOTO = "/api/v1/auth/profile/photo";
    static final String EMAIL = "ana@example.com";

    UUID ana, org1, org2, link1, link2;

    @BeforeEach
    void data() {
        PostgresIT.truncateCascade(admin, "organization", "account", "login_attempt");
        org1 = org("Um");
        org2 = org("Dois");
        ana = account(EMAIL);
        link1 = link(ana, org1, "TEACHER", "ACTIVE");
        link2 = link(ana, org2, "TEACHER", "ACTIVE");
    }

    /** Runs before the base cleanup: registrations reference the account, so only a cascade removes them. */
    @AfterEach
    void clean() {
        PostgresIT.truncateCascade(admin, "organization", "account", "login_attempt");
    }

    Cookie sessionOn(String email, UUID link) throws Exception {
        Cookie c = sessionOf(email);
        select(c, link);
        return c;
    }

    void select(Cookie c, UUID link) throws Exception {
        assertThat(status(put("/api/v1/auth/session/link", Map.of("linkId", link), c).andReturn())).isEqualTo(200);
    }

    static int status(MvcResult r) {
        return r.getResponse().getStatus();
    }

    static Map<String, Object> input(String name, String phone) {
        Map<String, Object> m = new HashMap<>();
        m.put("name", name);
        m.put("phone", phone);
        return m;
    }

    JsonNode accountOf(MvcResult r) throws Exception {
        assertThat(status(r)).isEqualTo(200);
        return body(r).path("account");
    }

    MvcResult upload(byte[] content, Cookie session) throws Exception {
        var request = MockMvcRequestBuilders.multipart(HttpMethod.PUT, PHOTO);
        if (content != null) request.file(new MockMultipartFile("file", "foto.png", "image/png", content));
        else request.file(new MockMultipartFile("other", "x".getBytes()));
        return send(request, null, session).andReturn();
    }

    static byte[] image(String format, int width, int height) throws Exception {
        var out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), format, out);
        return out.toByteArray();
    }

    /** Minimal VP8L header: the server only reads the header of a WebP. */
    static byte[] webp() {
        var b = new byte[40];
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, b, 0, 4);
        b[4] = (byte) (b.length - 8);
        System.arraycopy("WEBPVP8L".getBytes(StandardCharsets.US_ASCII), 0, b, 8, 8);
        b[20] = 0x2F;
        long bits = 511 | (511L << 14);
        for (int i = 0; i < 4; i++) b[21 + i] = (byte) (bits >> (8 * i));
        return b;
    }

    static HttpResponse<byte[]> fetch(String url) throws Exception {
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(url)).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
    }

    List<Map<String, Object>> audits() {
        return admin.queryForList("select organization_id, action, entity_id, before_data::text as before, after_data::text as after "
                + "from audit_log where action in ('account.profile_updated', 'account.photo_updated', 'account.photo_removed') order by ctid");
    }

    Map<String, Object> accountRow(UUID id) {
        return admin.queryForMap("select name, phone, photo from account where id = ?", id);
    }

    @Test
    @DisplayName("RF-ACE-04: CA1: nome e telefone valem nas duas organizações, auditados só na ativa; cadastros não mudam")
    void updatesTheAccountEverywhereAndAuditsOnlyTheActiveOrganization() throws Exception {
        UUID unit = unit(org1), teacher = UUID.randomUUID(), guardian = UUID.randomUUID(), student = UUID.randomUUID();
        admin.update("insert into teacher (id, organization_id, name, name_key, phone, account_id) values (?, ?, 'Prof', 'prof', '1133334444', ?)",
                teacher, org1, ana);
        admin.update("insert into guardian (id, organization_id, account_id, name, cpf, phone) values (?, ?, ?, 'Resp', '52998224725', '1133335555')",
                guardian, org1, ana);
        admin.update("insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, postal_code, street, number, "
                + "district, city, state, phone, account_id) values (?, ?, ?, 'Aluno', 'aluno', date '1990-01-01', '01001000', 'Rua', '1', "
                + "'Centro', 'Cidade', 'SP', '1133336666', ?)", student, org1, unit, ana);
        Cookie c = sessionOn(EMAIL, link1);

        JsonNode saved = accountOf(put(PROFILE, input("  Ana Nova  ", "+55 (11) 98765-4321"), c).andReturn());
        assertThat(saved.path("name").asText()).isEqualTo("Ana Nova");
        assertThat(saved.path("phone").asText()).isEqualTo("11987654321");
        select(c, link2);
        JsonNode other = accountOf(get(SESSION, c).andReturn());
        assertThat(other.path("name").asText()).isEqualTo("Ana Nova");
        assertThat(other.path("phone").asText()).isEqualTo("11987654321");

        assertThat(audits()).singleElement().satisfies(a -> {
            assertThat(a.get("organization_id")).isEqualTo(org1);
            assertThat(a.get("action")).isEqualTo("account.profile_updated");
            assertThat(a.get("entity_id")).isEqualTo(ana.toString());
            assertThat((String) a.get("before")).contains("\"Nome\"");
            assertThat((String) a.get("after")).contains("Ana Nova", "\"phone\": \"alterado\"").doesNotContain("98765");
        });

        // Same values: nothing audited. Empty phone erases it.
        select(c, link1);
        accountOf(put(PROFILE, input("Ana Nova", "11987654321"), c).andReturn());
        assertThat(audits()).hasSize(1);
        assertThat(accountOf(put(PROFILE, input("Ana Nova", ""), c).andReturn()).path("phone").isNull()).isTrue();
        assertThat(accountRow(ana).get("phone")).isNull();
        assertThat(audits()).hasSize(2);
        assertThat((String) audits().get(1).get("after")).contains("alterado").doesNotContain("Ana Nova");

        assertThat(admin.queryForList("select name || ' ' || phone from teacher union all select name || ' ' || phone from guardian "
                + "union all select name || ' ' || phone from student order by 1", String.class))
                .containsExactly("Aluno 1133336666", "Prof 1133334444", "Resp 1133335555");
    }

    @Test
    @DisplayName("RF-ACE-04: CA2: nome ou telefone inválido responde 422 com o campo e nada muda")
    void refusesInvalidProfile() throws Exception {
        Cookie c = sessionOn(EMAIL, link1);
        for (String name : Arrays.asList(null, "", "   ", "a".repeat(121))) {
            assertInvalid(put(PROFILE, input(name, null), c).andReturn(), "name");
        }
        for (String phone : List.of("123", "abc", "0011111111111")) {
            assertInvalid(put(PROFILE, input("Ana", phone), c).andReturn(), "phone");
        }
        assertThat(accountRow(ana)).containsEntry("name", "Nome").containsEntry("phone", null);
        assertThat(audits()).isEmpty();
        assertThat(accountOf(put(PROFILE, input("a".repeat(120), null), c).andReturn()).path("name").asText()).hasSize(120);
    }

    void assertInvalid(MvcResult r, String field) throws Exception {
        assertThat(status(r)).isEqualTo(422);
        assertThat(body(r).path("code").asText()).isEqualTo("UNPROCESSABLE");
        assertThat(body(r).path("fields").get(0).path("field").asText()).isEqualTo(field);
    }

    @Test
    @DisplayName("RF-ACE-04: CA3: envia, troca e remove a foto da conta, lida por URL assinada nas duas organizações")
    void uploadsReplacesAndRemovesThePhoto() throws Exception {
        Cookie c = sessionOn(EMAIL, link1);
        assertThat(accountOf(get(SESSION, c).andReturn()).path("photoUrl").isNull()).isTrue();
        String previousUrl = null;
        for (byte[] content : List.of(image("png", 512, 512), image("jpg", 512, 512), webp())) {
            String url = accountOf(upload(content, c)).path("photoUrl").asText();
            assertThat(url).contains("/account/" + ana + "/photo-").contains("X-Amz-Signature=");
            assertThat(fetch(url).body()).isEqualTo(content);
            if (previousUrl != null) assertThat(fetch(previousUrl).statusCode()).isEqualTo(404);
            previousUrl = url;
        }
        select(c, link2);
        assertThat(fetch(accountOf(get(SESSION, c).andReturn()).path("photoUrl").asText()).body()).isEqualTo(webp());

        select(c, link1);
        assertThat(accountOf(delete(PHOTO, c).andReturn()).path("photoUrl").isNull()).isTrue();
        assertThat(fetch(previousUrl).statusCode()).isEqualTo(404);
        assertThat(accountRow(ana).get("photo")).isNull();
        accountOf(delete(PHOTO, c).andReturn()); // no photo: 200, no audit

        assertThat(audits()).extracting(a -> a.get("action")).containsExactly("account.photo_updated", "account.photo_updated",
                "account.photo_updated", "account.photo_removed");
        assertThat(audits()).allSatisfy(a -> {
            assertThat(a.get("organization_id")).isEqualTo(org1);
            assertThat(String.valueOf(a.get("before")) + a.get("after")).doesNotContain("photo-", "http", "foto.png");
        });
    }

    @Test
    @DisplayName("RF-ACE-04: o login e a sessão não dependem do armazenamento para assinar a URL da foto")
    void sessionDoesNotReadTheStorage() throws Exception {
        admin.update("update account set photo = 'photo-missing.png' where id = ?", ana);
        Cookie c = sessionOn(EMAIL, link1);
        assertThat(accountOf(get(SESSION, c).andReturn()).path("photoUrl").asText()).contains("photo-missing.png");
    }

    @Test
    @DisplayName("RF-ACE-04: CA4: arquivo inválido responde 422 em file, mantém a foto anterior e não audita")
    void refusesInvalidFiles() throws Exception {
        Cookie c = sessionOn(EMAIL, link1);
        accountOf(upload(image("png", 512, 512), c));
        Object photo = accountRow(ana).get("photo");
        byte[] png = image("png", 512, 512);
        for (byte[] bad : Arrays.asList(null, new byte[0], "not an image".getBytes(), image("gif", 512, 512),
                Arrays.copyOf(png, 40), Arrays.copyOf(png, br.com.ctcore.organization.LogoImage.MAX_BYTES + 1), image("png", 511, 512), image("jpg", 1024, 1024))) {
            assertInvalid(upload(bad, c), "file");
        }
        assertThat(status(put(PHOTO, Map.of("file", "x"), c).andReturn())).isEqualTo(415);
        assertThat(accountRow(ana).get("photo")).isEqualTo(photo);
        assertThat(audits()).hasSize(1);
    }

    @Test
    @DisplayName("RF-ACE-04: CA5: sem sessão 401, sem CSRF, portal ou sem vínculo 403; Coordenador, Administrador e Professor podem")
    void protectsTheRoutes() throws Exception {
        byte[] png = image("png", 512, 512);
        assertAll(null, png, 401);

        Cookie noLink = sessionOf(EMAIL); // two links, none chosen
        assertAll(noLink, png, 403);
        for (String role : List.of("STUDENT", "GUARDIAN")) {
            String email = role.toLowerCase() + "@example.com";
            link(account(email), org1, role, "ACTIVE");
            assertAll(sessionOf(email), png, 403);
        }

        Cookie c = sessionOn(EMAIL, link1);
        var withoutCsrf = MockMvcRequestBuilders.put(PROFILE).secure(true).cookie(c).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(input("Sem CSRF", null)));
        assertThat(status(mvc.perform(withoutCsrf).andReturn())).isEqualTo(403);
        var photoWithoutCsrf = MockMvcRequestBuilders.multipart(HttpMethod.PUT, PHOTO).file(new MockMultipartFile("file", png))
                .secure(true).cookie(c);
        assertThat(status(mvc.perform(photoWithoutCsrf).andReturn())).isEqualTo(403);
        assertThat(status(mvc.perform(MockMvcRequestBuilders.delete(PHOTO).secure(true).cookie(c)).andReturn())).isEqualTo(403);
        assertThat(status(mvc.perform(MockMvcRequestBuilders.put(PROFILE).secure(true).with(csrf()).cookie(c)
                .contentType(MediaType.APPLICATION_JSON).content("{")).andReturn())).isEqualTo(400);
        assertThat(accountRow(ana)).containsEntry("name", "Nome").containsEntry("photo", null);
        assertThat(audits()).isEmpty();

        for (String role : List.of("COORDINATOR", "ADMINISTRATOR", "TEACHER")) {
            String email = role.toLowerCase() + "@example.com";
            UUID id = account(email);
            link(id, org1, role, "ACTIVE");
            enableTwoFactor(id, email);
            Cookie session = sessionOf(email);
            accountOf(put(PROFILE, input(role, null), session).andReturn());
            accountOf(upload(png, session));
            accountOf(delete(PHOTO, session).andReturn());
        }
    }

    void assertAll(Cookie session, byte[] png, int expected) throws Exception {
        assertThat(status(put(PROFILE, input("Invasor", null), session).andReturn())).isEqualTo(expected);
        assertThat(status(upload(png, session))).isEqualTo(expected);
        assertThat(status(delete(PHOTO, session).andReturn())).isEqualTo(expected);
    }

    @Test
    @DisplayName("RF-ACE-04: CA5: as escritas de A não alcançam a conta de B, nem com id ou e-mail dela no corpo")
    void neverReachesAnotherAccount() throws Exception {
        UUID bia = account("bia@example.com");
        link(bia, org1, "TEACHER", "ACTIVE");
        Cookie b = sessionOf("bia@example.com");
        String biaUrl = accountOf(upload(image("jpg", 512, 512), b)).path("photoUrl").asText();
        accountOf(put(PROFILE, input("Bia", "11912345678"), b).andReturn());
        Map<String, Object> before = accountRow(bia);

        Cookie a = sessionOn(EMAIL, link1);
        Map<String, Object> forged = input("Ana", null);
        forged.put("id", bia);
        forged.put("accountId", bia);
        forged.put("email", "bia@example.com");
        assertThat(accountOf(put(PROFILE, forged, a).andReturn()).path("id").asText()).isEqualTo(ana.toString());
        accountOf(upload(image("png", 512, 512), a));
        accountOf(delete(PHOTO, a).andReturn());

        assertThat(accountRow(bia)).isEqualTo(before);
        assertThat(fetch(biaUrl).statusCode()).isEqualTo(200);
        assertThat(admin.queryForObject("select email from account where id = ?", String.class, ana)).isEqualTo(EMAIL);
    }
}
