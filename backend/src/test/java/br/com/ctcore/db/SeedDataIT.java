package br.com.ctcore.db;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.ctcore.features.FeatureFlags;
import br.com.ctcore.isolation.Scopes;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

public class SeedDataIT extends PostgresIT {

    public static final Path SEED_DIR = Path.of("..", "infra", "seed");
    static final String LIST = "select organization_id::text || feature_key || enabled from organization_feature order by 1";

    JdbcTemplate jdbc = adminJdbc();
    @Autowired FeatureFlags flags;

    @BeforeEach
    void clean() {
        cleanAll(jdbc);
    }

    /** Apaga tudo o que o seed cria, na ordem das chaves estrangeiras (também usada pelo SeedLoginIT). */
    public static void cleanAll(JdbcTemplate jdbc) {
        // audit_log is append-only and shares the container with AuditServiceIT: test cleanup only.
        jdbc.execute("alter table audit_log disable trigger user");
        jdbc.update("delete from audit_log");
        jdbc.execute("alter table audit_log enable trigger user");
        for (String table : new String[]{"notification", "notification_preference", "announcement_read", "announcement", "payment_proof", "receipt", "receipt_counter", "payment", "charge_reminder", "charge", "modality_confirmation", "term_acceptance", "terms_version", "portal_request", "student_graduation", "enrollment_start", "benefit", "enrollment_modality_class", "enrollment_modality", "enrollment", "plan", "student_guardian", "guardian", "student", "lesson", "no_class_day", "training_class_assistant", "training_class_schedule", "training_class", "teacher_modality", "teacher_unit", "teacher", "age_range", "unit_modality", "graduation_level", "modality_request", "organization_modality", "email_message", "account_device", "login_attempt", "account_session", "password_reset", "account_invite",
                "account_link_unit", "account_link", "account"}) {
            jdbc.update("delete from " + table);
        }
        jdbc.update("delete from organization_feature");
        jdbc.update("delete from unit_short_name_history");
        jdbc.update("delete from unit_settings");
        jdbc.update("delete from unit");
        jdbc.update("delete from organization_settings");
        jdbc.update("delete from organization_limits");
        jdbc.update("delete from organization");
    }

    // Os professores do seed referenciam contas: sem apagar, os testes seguintes não conseguem limpar account.
    @org.junit.jupiter.api.AfterEach
    void cleanTeachers() {
        for (String table : new String[]{"notification", "notification_preference", "announcement_read", "announcement", "payment_proof", "receipt", "receipt_counter", "payment", "charge_reminder", "charge", "modality_confirmation", "term_acceptance", "terms_version", "portal_request", "student_graduation", "enrollment_start", "benefit", "enrollment_modality_class", "enrollment_modality", "enrollment", "plan", "student_guardian", "guardian", "student", "lesson", "no_class_day", "training_class_assistant", "training_class_schedule", "training_class", "teacher_modality", "teacher_unit", "teacher",
                "email_message", "account_device", "login_attempt", "account_session", "password_reset", "account_invite", "account_link_unit", "account_link", "account"}) {
            jdbc.update("delete from " + table);
        }
    }

    /** Aplica os .sql do diretório em ordem do nome, como o seed.sh. */
    public static void apply(JdbcTemplate jdbc, Path dir) throws IOException {
        List<Path> files;
        try (Stream<Path> s = Files.list(dir)) {
            files = s.filter(p -> p.toString().endsWith(".sql")).sorted().toList();
        }
        assertThat(files).as("arquivos de seed em " + dir.toAbsolutePath()).isNotEmpty();
        for (Path f : files) {
            jdbc.execute(Files.readString(f, StandardCharsets.UTF_8));
        }
    }

    @Test
    @DisplayName("CA1: 2 organizações fictícias com recursos ligados e desligados")
    void createsOrganizations() throws IOException {
        apply(jdbc, SEED_DIR);
        assertThat(jdbc.queryForObject("select count(distinct organization_id) from organization_feature", Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject("select count(*) from organization_feature where enabled", Integer.class)).isPositive();
        assertThat(jdbc.queryForObject("select count(*) from organization_feature where not enabled", Integer.class)).isPositive();
        assertThat(jdbc.queryForObject(
                "select count(*) from organization_feature where organization_id = md5('ctcore-seed-org-1')::uuid", Integer.class))
                .isPositive();
    }

    @Test
    @DisplayName("CA1 / RN-PNL-07: toda chave do seed é aceita pelo FeatureFlags e lida com o valor gravado")
    void readableByApplication() throws IOException {
        apply(jdbc, SEED_DIR);
        List<Map<String, Object>> rows = jdbc.queryForList("select organization_id, feature_key, enabled from organization_feature");
        assertThat(rows).isNotEmpty();
        for (Map<String, Object> r : rows) {
            String key = (String) r.get("feature_key");
            try (var scope = Scopes.open((UUID) r.get("organization_id"), null)) {
                assertThat(flags.isEnabled((UUID) r.get("organization_id"), key)).as(key).isEqualTo(r.get("enabled"));
            }
        }
    }

    @Test
    @DisplayName("CA2: segunda execução não muda contagem nem conteúdo")
    void idempotent() throws IOException {
        apply(jdbc, SEED_DIR);
        List<String> first = jdbc.queryForList(LIST, String.class);
        apply(jdbc, SEED_DIR);
        assertThat(jdbc.queryForList(LIST, String.class)).isEqualTo(first);
    }

    @Test
    @DisplayName("CA3: valor alterado depois do primeiro run é mantido")
    void keepsChanges() throws IOException {
        apply(jdbc, SEED_DIR);
        jdbc.update("update organization_feature set enabled = not enabled where organization_id = md5('ctcore-seed-org-1')::uuid and feature_key = 'online-payments'");
        List<String> changed = jdbc.queryForList(LIST, String.class);
        apply(jdbc, SEED_DIR);
        assertThat(jdbc.queryForList(LIST, String.class)).isEqualTo(changed);
    }

    @Test
    @DisplayName("CA4: banco limpo e reaplicado dá os mesmos identificadores e valores")
    void reproducible() throws IOException {
        apply(jdbc, SEED_DIR);
        List<String> first = jdbc.queryForList(LIST, String.class);
        jdbc.update("delete from organization_feature");
        apply(jdbc, SEED_DIR);
        assertThat(jdbc.queryForList(LIST, String.class)).isEqualTo(first);
    }

    @Test
    @DisplayName("RN-ORG-04/16: deterministic pilot, complete tenants and preserved settings on seed reapplication")
    void organizationSettingsAreCompleteAndPreserved() throws IOException {
        apply(jdbc, SEED_DIR);
        for (String table : new String[]{"organization", "unit", "organization_settings", "unit_settings", "organization_limits"}) {
            int expected = table.equals("unit") || table.equals("unit_settings") ? 4 : 2;
            assertThat(jdbc.queryForObject("select count(*) from " + table, Integer.class)).as(table).isEqualTo(expected);
        }
        assertThat(jdbc.queryForObject("select name from organization where id = md5('ctcore-seed-org-1')::uuid", String.class))
                .isEqualTo("Academia Maré Alta");
        assertThat(jdbc.queryForObject("select count(*) from unit u join unit_settings s on (s.organization_id, s.unit_id) = (u.organization_id, u.id) join organization_settings o on o.organization_id = u.organization_id join organization_limits l on l.organization_id = u.organization_id", Integer.class))
                .isEqualTo(4);
        jdbc.update("update organization_settings set deactivation_days = 60, trial_limit = 3 where organization_id = md5('ctcore-seed-org-1')::uuid");
        jdbc.update("update unit_settings set due_days = '{2,28}', pix_key = 'synthetic-key' where organization_id = md5('ctcore-seed-org-1')::uuid");
        jdbc.update("update organization_limits set students = 1 where organization_id = md5('ctcore-seed-org-1')::uuid");
        Map<String, List<String>> before = new java.util.HashMap<>();
        for (String table : new String[]{"organization", "unit", "organization_settings", "unit_settings", "organization_limits"}) {
            before.put(table, jdbc.queryForList("select row_to_json(t)::text from " + table + " t order by 1", String.class));
        }
        apply(jdbc, SEED_DIR);
        for (var entry : before.entrySet()) {
            assertThat(jdbc.queryForList("select row_to_json(t)::text from " + entry.getKey() + " t order by 1", String.class))
                    .as(entry.getKey()).isEqualTo(entry.getValue());
        }
    }

    private int count(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }

    @Test
    @DisplayName("RN-ACE-01: contas fictícias com vínculos, senha Argon2 que confere e reaplicação sem duplicar")
    void accountsSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        // 7 fáceis + convidado e desativado + 13 responsáveis convidados.
        assertThat(count("select count(*) from account")).isEqualTo(22);
        assertThat(count("select count(*) from account_link")).isEqualTo(23);
        assertThat(count("select count(*) from account_link_unit")).isEqualTo(5);
        assertThat(count("select count(*) from account where password_hash is null")).isEqualTo(15);
        assertThat(count("select count(*) from account_invite where used_at is null and canceled_at is null and expires_at > now()")).isEqualTo(1);
        String hash = jdbc.queryForObject("select password_hash from account where email = 'coordenador@ctcore.test'", String.class);
        assertThat(new br.com.ctcore.config.SecurityConfig().passwordEncoder().matches("coordenador123", hash)).isTrue();
    }

    @Test
    @DisplayName("CA4 / RF-ALU-01: cerca de 60 alunos em todas as faixas e situações, menores com responsável e irmãos, sem duplicar")
    void studentsSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from student")).isEqualTo(60);
        assertThat(count("select count(*) from organization")).isEqualTo(2);
        assertThat(count("select count(*) from unit where organization_id = md5('ctcore-seed-org-1')::uuid")).isEqualTo(3);
        assertThat(count("select count(*) from guardian")).isEqualTo(14);
        assertThat(count("select count(*) from student_guardian")).isEqualTo(27);
        assertThat(count("select count(*) from student_guardian where financial")).isEqualTo(26);
        // Situações calculadas da matrícula (RN-MAT-04): ativo, ex-aluno e sem matrícula; o bloqueio por atraso não é gravado, o atraso vem das cobranças.
        String active = "exists (select 1 from enrollment_modality m where m.student_id = s.id and m.status = 'ACTIVE')";
        String enrolled = "exists (select 1 from enrollment_modality m where m.student_id = s.id)";
        assertThat(count("select count(*) from student s where " + active)).isEqualTo(46);
        assertThat(count("select count(*) from student s where " + enrolled + " and not " + active)).isEqualTo(7);
        assertThat(count("select count(*) from student s where not " + enrolled)).isEqualTo(7);
        assertThat(count("select count(distinct c.student_id) from charge c where c.status = 'OPEN' and c.due_on < current_date - 6")).isGreaterThanOrEqualTo(4);
        // Uma faixa etária do cadastro por grupo (idade em anos hoje, com folga de um ano pela data de nascimento fixa).
        String age = "extract(year from age(current_date, s.birth_date))";
        assertThat(count("select count(*) from student s where " + age + " between 4 and 12")).isPositive();
        assertThat(count("select count(*) from student s where " + age + " between 14 and 17")).isPositive();
        assertThat(count("select count(*) from student s where " + age + " between 19 and 34")).isPositive();
        assertThat(count("select count(*) from student s where " + age + " >= 36")).isPositive();
        // Todo menor tem responsável e há irmãos com o mesmo responsável.
        assertThat(count("select count(*) from student s where " + age + " < 17 and not exists (select 1 from student_guardian g where g.student_id = s.id)")).isZero();
        assertThat(count("select count(*) from (select guardian_id from student_guardian group by guardian_id having count(*) >= 2) g")).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("R7: todo e-mail termina em .test, nos arquivos e nas tabelas, e todo CPF tem dígitos verificadores válidos")
    void fictitiousData() throws IOException {
        apply(jdbc, SEED_DIR);
        Pattern email = Pattern.compile("[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+)");
        try (Stream<Path> files = Files.list(SEED_DIR)) {
            for (Path f : files.filter(p -> p.toString().endsWith(".sql")).toList()) {
                Matcher m = email.matcher(Files.readString(f, StandardCharsets.UTF_8));
                while (m.find()) {
                    assertThat(m.group(1)).as(f.getFileName() + ": " + m.group()).endsWith(".test");
                }
            }
        }
        for (String sql : new String[]{"select email from account where email is not null", "select email from student where email is not null",
                "select email from teacher where email is not null"}) {
            assertThat(jdbc.queryForList(sql, String.class)).as(sql).allMatch(e -> e.endsWith(".test"));
        }
        for (String sql : new String[]{"select cpf from student where cpf is not null", "select cpf from guardian"}) {
            assertThat(jdbc.queryForList(sql, String.class)).as(sql).allMatch(SeedDataIT::validCpf);
        }
    }

    static boolean validCpf(String cpf) {
        int[] d = cpf.chars().map(c -> c - '0').toArray();
        for (int len = 9; len <= 10; len++) {
            int sum = 0;
            for (int i = 0; i < len; i++) sum += d[i] * (len + 1 - i);
            int dv = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (d[len] != dv) return false;
        }
        return true;
    }

    @Test
    @DisplayName("RF-MOD-01, RF-MOD-02: seed ativa 3 modalidades nas 2 organizações e copia o padrão do Jiu-Jitsu, sem duplicar")
    void modalitiesSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from organization_modality where active")).isEqualTo(6);
        assertThat(count("select count(*) from graduation_level")).isEqualTo(38);
        assertThat(count("select count(*) from organization_modality where graduation_enabled")).isEqualTo(1);
        assertThat(count("select count(*) from unit_modality where offered")).isEqualTo(3 * count("select count(*) from unit"));
    }

    @Test
    @DisplayName("RF-MOD-04: seed cria 5 faixas etárias em cada uma das 2 organizações, sem duplicar")
    void ageRangesSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from age_range")).isEqualTo(10);
        assertThat(count("select count(*) from age_range where name = 'Master' and max_age is null")).isEqualTo(2);
    }

    @Test
    @DisplayName("RF-PRO-01: seed cria 6 professores (5 na principal, um inativo), sem duplicar, com unidade e modalidade")
    void teachersSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from teacher")).isEqualTo(6);
        assertThat(count("select count(*) from teacher where status = 'INACTIVE'")).isEqualTo(1);
        assertThat(count("select count(*) from teacher_unit")).isEqualTo(6);
        assertThat(count("select count(*) from teacher_modality")).isEqualTo(10);
        assertThat(count("select count(*) from teacher where account_id is not null")).isEqualTo(2);
    }

    @Test
    @DisplayName("RF-TUR-01: seed cria 12 turmas (9 na principal), sem duplicar, com horários e auxiliar; professor@ chefia 2 turmas ativas")
    void classesSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from training_class")).isEqualTo(12);
        assertThat(count("select count(*) from training_class where status = 'INACTIVE'")).isEqualTo(2);
        assertThat(count("select count(*) from training_class_schedule")).isEqualTo(21);
        assertThat(count("select count(*) from training_class_assistant")).isEqualTo(1);
        assertThat(count("select count(distinct modality_id) from training_class where organization_id = md5('ctcore-seed-org-1')::uuid")).isEqualTo(3);
        assertThat(count("select count(*) from training_class c join teacher t on t.id = c.head_teacher_id where c.status = 'ACTIVE' and t.account_id = md5('ctcore-seed-account-2')::uuid")).isEqualTo(2);
        // RN-TUR-05, RN-PRO-09: titular e auxiliares do seed ensinam a modalidade da turma.
        assertThat(count("select count(*) from training_class c where not exists (select 1 from teacher_modality tm where tm.teacher_id = c.head_teacher_id and tm.modality_id = c.modality_id) "
                + "or exists (select 1 from training_class_assistant a where a.class_id = c.id and not exists (select 1 from teacher_modality tm where tm.teacher_id = a.teacher_id and tm.modality_id = c.modality_id))")).isZero();
    }

    @Test
    @DisplayName("RF-AGE-01: seed cria feriado e recesso em todas as unidades, sem duplicar")
    void noClassDaysSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from no_class_day where origin = 'HOLIDAY'")).isEqualTo(4);
        assertThat(count("select count(*) from no_class_day where origin = 'COORDINATOR'")).isEqualTo(4);
    }

    @Test
    @DisplayName("RF-PLA-01: seed cria 13 planos (9 na principal), sem duplicar, 2 desativados")
    void plansSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from plan")).isEqualTo(13);
        assertThat(count("select count(*) from plan where status = 'INACTIVE'")).isEqualTo(2);
    }

    @Test
    @DisplayName("RF-MAT, #63: seed cria matrículas (49 + 4), modalidades ativas e encerradas, sem duplicar")
    void enrollmentsSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from enrollment")).isEqualTo(53);
        assertThat(count("select count(*) from enrollment_modality where status = 'ACTIVE'")).isEqualTo(47);
        assertThat(count("select count(*) from enrollment_modality where status = 'ENDED'")).isEqualTo(7);
        assertThat(count("select count(*) from student s where not exists (select 1 from enrollment e where e.student_id = s.id)")).isEqualTo(7);
    }

    @Test
    @DisplayName("RF-BEN-01, #64: seed cria 12 benefícios (11 ativos, 1 encerrado) sem duplicar")
    void benefitsSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from benefit where status = 'ACTIVE'")).isEqualTo(11);
        assertThat(count("select count(*) from benefit where status = 'ENDED'")).isEqualTo(1);
    }

    @Test
    @DisplayName("RF-MAT-01, #67: seed cria 3 inícios de matrícula e 14 graduações (5 alunos com histórico) sem duplicar")
    void enrollmentStartSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from enrollment_start")).isEqualTo(3);
        assertThat(count("select count(*) from student_graduation")).isEqualTo(14);
        assertThat(count("select count(*) from student_graduation where origin")).isEqualTo(7);
        assertThat(count("select count(*) from (select student_id from student_graduation group by student_id having count(*) > 1) g")).isEqualTo(5);
    }

    @Test
    @DisplayName("RN-COB, #71 CA31 e #644 CA5: cobranças em todas as situações, pagamentos com os 8 meios, renegociação com parcelas, recibo público, sem duplicar")
    void chargesSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        // Situação calculada (RN-COB-03): datas do seed relativas à data de hoje, com folga para o fuso da unidade.
        assertThat(count("select count(*) from charge where status = 'OPEN' and type = 'MONTHLY' and due_on > current_date + 1")).as("pendente").isPositive();
        assertThat(count("select count(*) from charge where status = 'OPEN' and due_on between current_date - 1 and current_date + 1")).as("vence hoje").isPositive();
        assertThat(count("select count(*) from charge where status = 'OPEN' and due_on < current_date - 6")).as("atrasada").isPositive();
        assertThat(count("select count(*) from charge where status = 'IN_REVIEW'")).isEqualTo(2);
        assertThat(count("select count(*) from charge where status = 'PAID'")).isEqualTo(15);
        assertThat(count("select count(*) from charge where status = 'CANCELED' and canceled_at is not null")).isEqualTo(1);
        assertThat(count("select count(*) from charge where status = 'RENEGOTIATED'")).isEqualTo(1);
        assertThat(count("select count(*) from charge i join charge o on o.id = i.origin_charge_id where i.type = 'INSTALLMENT' and o.status = 'RENEGOTIATED' and i.renegotiation_id = o.renegotiation_id")).isEqualTo(3);
        assertThat(count("select count(*) from charge where type = 'ONE_OFF'")).isEqualTo(3);
        assertThat(count("select count(*) from payment")).isEqualTo(15);
        assertThat(count("select count(distinct method) from payment")).isEqualTo(8);
        assertThat(count("select count(*) from receipt")).isEqualTo(1);
        assertThat(count("select count(*) from enrollment_modality where next_charge_ref is not null")).isEqualTo(1);
        assertThat(jdbc.queryForMap("select unit_name, number, reference, amount_cents, payer_initials from public_receipt('SEEDRECEIPT00001')"))
                .containsEntry("number", 1).containsEntry("amount_cents", 15000L).containsEntry("reference", "Jiu-Jitsu · out/2026");
    }

    @Test
    @DisplayName("RF-COM-01, #81: seed cria 5 comunicados (3 enviados, 2 agendados, um deles para duas turmas) sem duplicar")
    void announcementsSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from announcement where sent_at is not null")).isEqualTo(3);
        assertThat(count("select count(*) from announcement where sent_at is null and scheduled_for > now()")).isEqualTo(2);
        assertThat(count("select count(*) from announcement_class")).isEqualTo(2);
        assertThat(count("select count(*) from announcement_read")).isEqualTo(12);
    }

    @Test
    @DisplayName("RF-NOT-01, #84: seed cria 8 notificações (3 do Administrador e 5 do Coordenador, duas lidas) sem duplicar")
    void notificationsSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from notification")).isEqualTo(8);
        assertThat(count("select count(*) from notification where read_at is not null")).isEqualTo(2);
        assertThat(count("select count(distinct link_id) from notification")).isEqualTo(2);
    }

    @Test
    @DisplayName("#85, CA24: seed grava os aceites do termo e do uso de imagem, sem duplicar")
    void termAcceptanceSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from terms_version")).isEqualTo(2);
        assertThat(count("select count(*) from term_acceptance")).isEqualTo(24);
        assertThat(count("select count(distinct kind) from term_acceptance where event = 'ACCEPTED' and version = 1")).isEqualTo(2);
    }

    @Test
    @DisplayName("#86, CA22: seed grava pedidos do portal de todos os tipos e situações, sem duplicar")
    void portalRequestSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from portal_request")).isEqualTo(8);
        assertThat(count("select count(*) from portal_request where status = 'OPEN'")).isEqualTo(4);
        assertThat(count("select count(distinct kind) from portal_request")).isEqualTo(4);
        assertThat(count("select count(distinct status) from portal_request")).isEqualTo(5);
    }

    @Test
    @DisplayName("#87, CA17: seed grava dois comprovantes pendentes de cobranças em conferência, sem duplicar")
    void paymentProofSeed() throws IOException {
        apply(jdbc, SEED_DIR);
        apply(jdbc, SEED_DIR);
        assertThat(count("select count(*) from payment_proof where status = 'PENDING'")).isEqualTo(2);
        assertThat(count("select count(*) from charge where status = 'IN_REVIEW'")).isEqualTo(2);
    }


    @Test
    @DisplayName("CA9 / R7: nomes sem repetição, menores com o sobrenome do responsável, nada com \"Fictíci\", Rio de Janeiro e Niterói com DDD 21 e endereços variados")
    void realisticData() throws IOException {
        apply(jdbc, SEED_DIR);
        // Nenhum nome completo repetido entre alunos, responsáveis e professores da mesma organização.
        assertThat(count("select count(*) from (select organization_id, name from (select organization_id, name from student union all select organization_id, name from guardian "
                + "union all select organization_id, name from teacher) n group by organization_id, name having count(*) > 1) d")).isZero();
        // Cada menor com responsável leva o sobrenome (última palavra do nome) de ao menos um deles.
        String minors = "birth_date > current_date - interval '18 years'";
        assertThat(count("select count(*) from student where " + minors)).isEqualTo(26);
        assertThat(count("select count(*) from student s where " + minors + " and not exists (select 1 from student_guardian sg join guardian g on g.id = sg.guardian_id "
                + "where sg.student_id = s.id and regexp_replace(g.name, '^.* ', '') = regexp_replace(s.name, '^.* ', ''))")).isZero();
        // Nada que aparece na tela diz "Fictício".
        assertThat(count("select count(*) from (select name t from organization union all select name from unit union all select name from account union all select name from student "
                + "union all select name from guardian union all select name from teacher union all select name from plan union all select name from training_class "
                + "union all select title || body from announcement union all select body from terms_version union all select decided_by from benefit "
                + "union all select reason from no_class_day union all select params::text from notification union all select coalesce(description, '') from charge "
                + "union all select coalesce(note, '') || coalesce(response, '') from portal_request) x where t ~* 'fict[ií]ci'")).isZero();
        // Rio de Janeiro e Niterói, CEP do RJ, DDD 21, endereços variados.
        assertThat(jdbc.queryForList("select distinct city from unit", String.class)).containsExactlyInAnyOrder("Rio de Janeiro", "Niterói");
        assertThat(jdbc.queryForList("select name from unit where organization_id = md5('ctcore-seed-org-1')::uuid order by name", String.class))
                .containsExactly("Maré Alta Barra", "Maré Alta Botafogo", "Maré Alta Tijuca");
        assertThat(count("select count(*) from unit where postal_code !~ '^2[0-4][0-9]{6}$' or phone !~ '^[+]55 21 '")).isZero();
        assertThat(count("select count(*) from student where state <> 'RJ' or postal_code !~ '^2[0-4][0-9]{6}$' or city not in ('Rio de Janeiro', 'Niterói') or (phone is not null and phone !~ '^21')")).isZero();
        assertThat(count("select count(*) from guardian where phone !~ '^21'")).isZero();
        assertThat(count("select count(*) from teacher where phone !~ '^[+]55 21 '")).isZero();
        assertThat(count("select count(distinct street) from student")).isGreaterThan(4);
        assertThat(count("select count(distinct postal_code) from student")).isGreaterThan(4);
        // E-mail no formato nome.sobrenome@ctcore.test (alunos, responsáveis convidados, professores, convidados).
        assertThat(jdbc.queryForList("select email from account where email is not null", String.class)).allMatch(e -> e.endsWith("@ctcore.test"));
        assertThat(jdbc.queryForList("select email from student where email is not null union all select email from teacher where email is not null", String.class))
                .allMatch(e -> e.matches("[a-z]+([.][a-z]+)+@ctcore[.]test") || e.matches("[a-z0-9]+@ctcore[.]test"));
    }
    @Test
    @DisplayName("CA8: banco limpo e reaplicado dá o mesmo conteúdo; valor alterado depois do primeiro run é mantido")
    void fullSeedReproducible() throws IOException {
        apply(jdbc, SEED_DIR);
        String students = "select string_agg(id::text || name || birth_date, ',' order by id) from student";
        String first = jdbc.queryForObject(students, String.class);
        jdbc.update("update student set name = 'Nome Alterado' where id = md5('ctcore-seed-student-30')::uuid");
        apply(jdbc, SEED_DIR);
        assertThat(jdbc.queryForObject("select name from student where id = md5('ctcore-seed-student-30')::uuid", String.class)).isEqualTo("Nome Alterado");
        cleanAll(jdbc);
        apply(jdbc, SEED_DIR);
        assertThat(jdbc.queryForObject(students, String.class)).isEqualTo(first);
    }

    @Test
    @DisplayName("CA6: arquivos aplicados em ordem do nome")
    void order(@org.junit.jupiter.api.io.TempDir Path tmp) throws IOException {
        Files.writeString(tmp.resolve("02-b.sql"),
                "update organization_feature set enabled = false where feature_key = 'x';");
        Files.writeString(tmp.resolve("01-a.sql"),
                "insert into organization_feature (organization_id, feature_key, enabled) values (md5('t')::uuid, 'x', true);");
        apply(jdbc, tmp);
        assertThat(jdbc.queryForObject("select enabled from organization_feature where feature_key = 'x'", Boolean.class)).isFalse();
    }
}
