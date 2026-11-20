package br.com.ctcore.seed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.ctcore.db.PostgresIT;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/** #671: recriação automática do banco de homologação. Cada caso usa um banco novo, de dono sem superusuário. */
class HomologationSeedIT extends PostgresIT {
    static final Path SEED = Path.of("..", "infra", "seed");
    static final String OWNER = "seed_owner", OWNER_PWD = "synthetic_owner";
    static final String ORG1 = "md5('ctcore-seed-org-1')::uuid";
    static final AtomicInteger N = new AtomicInteger();

    @Autowired ApplicationContext ctx;

    @BeforeAll
    static void owner() {
        adminJdbc().execute("create role " + OWNER + " login password '" + OWNER_PWD + "' nosuperuser nobypassrls");
    }

    /** Banco novo cujo dono é o papel sem superusuário; o papel da API recebe só os privilégios padrão de CRUD. */
    record Db(String name) {
        String url() { return POSTGRES.getJdbcUrl().replaceFirst("/[^/?]+(\\?|$)", "/" + name + "$1"); }

        /** Superusuário no banco do teste: ignora a RLS, para conferir o que ficou gravado. */
        JdbcTemplate admin() {
            return new JdbcTemplate(new DriverManagerDataSource(url(), POSTGRES.getUsername(), POSTGRES.getPassword()));
        }

        Flyway flyway() {
            return Flyway.configure().dataSource(url(), OWNER, OWNER_PWD).locations("classpath:db/migration").cleanDisabled(false).load();
        }

        HomologationSeed seed(Path dir, String env) { return new HomologationSeed(flyway(), dir, "ctcore_app", env); }

        Connection app() throws Exception { return DriverManager.getConnection(url(), "ctcore_app", "synthetic_runtime"); }
    }

    static Db newDb() throws Exception {
        String name = "seed_it_" + N.incrementAndGet();
        adminJdbc().execute("create database " + name + " owner " + OWNER);
        Db db = new Db(name);
        db.admin().execute("grant usage on schema public to ctcore_app");
        try (Connection c = DriverManager.getConnection(db.url(), OWNER, OWNER_PWD); Statement s = c.createStatement()) {
            s.execute("alter default privileges in schema public grant select, insert, update, delete on tables to ctcore_app");
        }
        return db;
    }

    static int forced(JdbcTemplate j) {
        return j.queryForObject("select count(*) from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relforcerowsecurity", Integer.class);
    }

    static String state(JdbcTemplate j) {
        return j.queryForObject("select coalesce(max(hash), '') from ctcore_seed_state", String.class);
    }

    static Path copySeed(Path to) throws IOException {
        try (Stream<Path> s = Files.list(SEED)) {
            for (Path f : s.toList()) Files.copy(f, to.resolve(f.getFileName()), StandardCopyOption.REPLACE_EXISTING);
        }
        return to;
    }

    @Test
    @DisplayName("CA1: sem a variável o bean do seed não existe e nada é apagado")
    void offByDefault() {
        adminJdbc().execute("create table if not exists ca1_marker (id int)");
        adminJdbc().update("insert into ca1_marker values (1)");
        assertThat(ctx.containsBean("homologationSeedStrategy")).isFalse();
        assertThat(adminJdbc().queryForObject("select count(*) from ca1_marker", Integer.class)).isEqualTo(1);
        adminJdbc().execute("drop table ca1_marker");
    }

    @Test
    @DisplayName("CA2: ctcore.env=production no banco ou CTCORE_ENV=production: erro e nada apagado")
    void refusesProduction() throws Exception {
        Db db = newDb();
        db.flyway().migrate();
        db.admin().execute("create table marker (id int)");
        db.admin().execute("alter database " + db.name() + " set ctcore.env = 'production'");
        assertThatThrownBy(() -> db.seed(SEED, null).run()).isInstanceOf(IllegalStateException.class).hasMessageContaining("produção");
        db.admin().execute("alter database " + db.name() + " reset ctcore.env");
        assertThatThrownBy(() -> db.seed(SEED, "production").run()).isInstanceOf(IllegalStateException.class).hasMessageContaining("produção");
        assertThat(db.admin().queryForObject("select to_regclass('public.marker') is not null", Boolean.class)).isTrue();
        assertThat(db.admin().queryForObject("select to_regclass('public.ctcore_seed_state') is null", Boolean.class)).isTrue();
    }

    @Test
    @DisplayName("CA3: seed antigo e linhas extras somem; entram o seed novo e as 7 contas")
    void recreatesFromOldSeed() throws Exception {
        Db db = newDb();
        db.flyway().migrate();
        db.admin().update("insert into organization_feature (organization_id, feature_key, enabled) values (" + ORG1 + ", 'online-payments', false)");
        db.admin().update("insert into organization_feature (organization_id, feature_key, enabled) values (md5('outra')::uuid, 'extra', true)");
        db.seed(SEED, null).run();
        JdbcTemplate j = db.admin();
        assertThat(j.queryForObject("select count(*) from organization_feature where feature_key = 'extra'", Integer.class)).isZero();
        assertThat(j.queryForObject("select enabled from organization_feature where organization_id = " + ORG1 + " and feature_key = 'online-payments'", Boolean.class)).isTrue();
        assertThat(j.queryForObject("select count(*) from account where email in ('admin@ctcore.test','coordenador@ctcore.test','professor@ctcore.test',"
                + "'aluno@ctcore.test','responsavel@ctcore.test','multiplo@ctcore.test')", Integer.class)).isEqualTo(6);
        assertThat(j.queryForObject("select count(*) from account where email like '%@ctcore.test'", Integer.class)).isGreaterThanOrEqualTo(7);
    }

    @Test
    @DisplayName("CA4: mesmo hash na segunda subida não recria")
    void sameHashDoesNothing() throws Exception {
        Db db = newDb();
        db.seed(SEED, null).run();
        db.admin().update("insert into organization_feature (organization_id, feature_key, enabled) values (md5('depois')::uuid, 'depois', true)");
        db.seed(SEED, null).run();
        assertThat(db.admin().queryForObject("select count(*) from organization_feature where feature_key = 'depois'", Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("CA5: arquivo alterado recria e grava o hash novo; só um -local.sql não muda o hash")
    void hashChange(@TempDir Path tmp) throws Exception {
        Path dir = copySeed(tmp);
        Db db = newDb();
        db.seed(dir, null).run();
        String first = state(db.admin());
        db.admin().update("insert into organization_feature (organization_id, feature_key, enabled) values (md5('depois')::uuid, 'depois', true)");

        Path local = dir.resolve("25-duas-etapas-local.sql");
        Files.writeString(local, "\n-- alterado\n", StandardOpenOption.APPEND);
        db.seed(dir, null).run();
        assertThat(state(db.admin())).isEqualTo(first);
        assertThat(db.admin().queryForObject("select count(*) from organization_feature where feature_key = 'depois'", Integer.class)).isEqualTo(1);

        Path any = Files.list(dir).filter(p -> !p.toString().endsWith("-local.sql")).sorted().findFirst().orElseThrow();
        Files.writeString(any, "\n-- alterado\n", StandardCharsets.UTF_8, StandardOpenOption.APPEND);
        db.seed(dir, null).run();
        assertThat(state(db.admin())).isNotEqualTo(first);
        assertThat(db.admin().queryForObject("select count(*) from organization_feature where feature_key = 'depois'", Integer.class)).isZero();
    }

    @Test
    @DisplayName("CA6: dono sem superusuário com FORCE aplica, devolve o FORCE e a API lê pela RLS sem privilégio novo")
    void ownerWithForce(@TempDir Path tmp) throws Exception {
        Db db = newDb();
        db.flyway().migrate();
        int before = forced(db.admin());
        assertThat(before).isPositive();
        db.seed(SEED, null).run();
        assertThat(forced(db.admin())).isEqualTo(before);
        try (Connection c = db.app()) {
            c.setAutoCommit(false);
            try (Statement s = c.createStatement()) {
                s.execute("select set_config('app.organization_id', md5('ctcore-seed-org-1'), true), set_config('app.scope_initialized', 'true', true)");
                var rs = s.executeQuery("select count(*) from unit");
                rs.next();
                assertThat(rs.getInt(1)).isPositive();
                assertThatThrownBy(() -> s.executeQuery("select * from ctcore_seed_state")).hasMessageContaining("permission denied");
            }
            c.rollback();
        }
        // privilégio retirado da API continua retirado depois de nova recriação
        db.admin().execute("revoke delete on student from ctcore_app");
        Path dir = copySeed(tmp);
        Files.writeString(dir.resolve("01-organizacoes.sql"), "\n-- alterado\n", StandardOpenOption.APPEND);
        db.seed(dir, null).run();
        assertThat(db.admin().queryForObject("select has_table_privilege('ctcore_app', 'student', 'delete')", Boolean.class)).isFalse();
        assertThat(db.admin().queryForObject("select has_table_privilege('ctcore_app', 'student', 'select')", Boolean.class)).isTrue();
    }

    @Test
    @DisplayName("CA7: erro num arquivo desfaz a transação e o FORCE continua")
    void failureRollsBack(@TempDir Path tmp) throws Exception {
        Db db = newDb();
        db.flyway().migrate();
        int before = forced(db.admin());
        Path dir = copySeed(tmp);
        Files.writeString(dir.resolve("99-erro.sql"), "select 1/0;", StandardCharsets.UTF_8);
        assertThatThrownBy(() -> db.seed(dir, null).run()).isInstanceOf(IllegalStateException.class);
        assertThat(forced(db.admin())).isEqualTo(before);
        assertThat(db.admin().queryForObject("select count(*) from organization_feature", Integer.class)).isZero();
        assertThat(db.admin().queryForObject("select to_regclass('public.ctcore_seed_state') is null", Boolean.class)).isTrue();
    }

    @Test
    @DisplayName("CA8: com a trava em outro processo, espera e aplica uma vez só")
    void waitsForLock() throws Exception {
        Db db = newDb();
        try (Connection other = DriverManager.getConnection(db.url(), OWNER, OWNER_PWD); Statement s = other.createStatement()) {
            s.execute("select pg_advisory_lock(" + HomologationSeed.LOCK_KEY + ")");
            CompletableFuture<Void> run = CompletableFuture.runAsync(() -> db.seed(SEED, null).run());
            Thread.sleep(1500);
            assertThat(run).isNotDone();
            s.execute("select pg_advisory_unlock(" + HomologationSeed.LOCK_KEY + ")");
            run.get(120, TimeUnit.SECONDS);
        }
        assertThat(db.admin().queryForObject("select count(*) from ctcore_seed_state", Integer.class)).isEqualTo(1);
        assertThat(db.admin().queryForObject("select count(*) from organization_feature", Integer.class)).isPositive();
    }
}
