package br.com.ctcore.seed;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Stream;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * #671: na homologação, recria o banco quando os arquivos do seed mudam. Compara o SHA-256 dos {@code *.sql}
 * (sem {@code *-local.sql}) com o gravado em {@code ctcore_seed_state}; diferente ou ausente: apaga tudo, migra e aplica o seed.
 * Roda com o usuário de migração (dono das tabelas); o usuário da API não ganha privilégio novo. Nunca em produção.
 */
public class HomologationSeed {
    private static final Logger log = LoggerFactory.getLogger(HomologationSeed.class);
    static final long LOCK_KEY = 6_710_671L;

    private final Flyway flyway;
    private final Path dir;
    private final String runtimeUser;
    private final String envVar;

    /**
     * @param flyway      com {@code cleanDisabled=false}
     * @param runtimeUser papel da API, para devolver os privilégios exatos que tinha (pode ser vazio)
     * @param envVar      valor de CTCORE_ENV
     */
    public HomologationSeed(Flyway flyway, Path dir, String runtimeUser, String envVar) {
        this.flyway = flyway;
        this.dir = dir;
        this.runtimeUser = runtimeUser == null ? "" : runtimeUser;
        this.envVar = envVar;
    }

    public void run() {
        DataSource ds = flyway.getConfiguration().getDataSource();
        try (Connection lock = ds.getConnection()) {
            lock.setAutoCommit(true);
            if ("production".equals(envVar) || "production".equals(scalar(lock, "select coalesce(current_setting('ctcore.env', true), '')"))) {
                throw new IllegalStateException("Seed de homologação recusado: o ambiente está marcado como produção (ctcore.env/CTCORE_ENV). Nada foi apagado nem aplicado.");
            }
            exec(lock, "select pg_advisory_lock(" + LOCK_KEY + ")");
            try {
                String hash = hash();
                String stored = "true".equals(scalar(lock, "select (to_regclass('public.ctcore_seed_state') is not null)::text"))
                        ? scalar(lock, "select coalesce(max(hash), '') from ctcore_seed_state") : "";
                if (hash.equals(stored)) {
                    log.info("Seed de homologação já aplicado (hash igual); nada a fazer.");
                    flyway.migrate();
                    return;
                }
                log.warn("Seed de homologação mudou: apagando o banco, migrando e aplicando o seed.");
                List<String[]> grants = grants(lock);
                flyway.clean();
                flyway.migrate();
                apply(ds, hash, grants);
            } finally {
                exec(lock, "select pg_advisory_unlock(" + LOCK_KEY + ")");
            }
        } catch (SQLException | IOException e) {
            throw new IllegalStateException("Falha no seed de homologação: " + e.getMessage(), e);
        }
    }

    /** SHA-256 de nome + bytes de cada seed, em ordem de nome, sem os {@code -local.sql}. */
    String hash() throws IOException {
        List<Path> files = seedFiles();
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            for (Path f : files) {
                md.update(f.getFileName().toString().getBytes(StandardCharsets.UTF_8));
                md.update((byte) 0);
                md.update(Files.readAllBytes(f));
            }
            return HexFormat.of().formatHex(md.digest());
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private List<Path> seedFiles() throws IOException {
        try (Stream<Path> s = Files.list(dir)) {
            List<Path> files = s.filter(p -> p.getFileName().toString().endsWith(".sql") && !p.getFileName().toString().endsWith("-local.sql"))
                    .sorted().toList();
            if (files.isEmpty()) throw new IOException("nenhum arquivo .sql em " + dir.toAbsolutePath());
            return files;
        }
    }

    private void apply(DataSource ds, String hash, List<String[]> grants) throws SQLException, IOException {
        List<Path> files = seedFiles();
        try (Connection c = ds.getConnection()) {
            c.setAutoCommit(false);
            try (Statement st = c.createStatement()) {
                restoreGrants(st, grants);
                st.execute("create table if not exists ctcore_seed_state (hash text not null, applied_at timestamptz not null default now())");
                if (!runtimeUser.isEmpty()) st.execute("revoke all on ctcore_seed_state from " + ident(runtimeUser));
                List<String> forced = new ArrayList<>();
                try (ResultSet rs = st.executeQuery("select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relforcerowsecurity")) {
                    while (rs.next()) forced.add(rs.getString(1));
                }
                for (String t : forced) st.execute("alter table " + ident(t) + " no force row level security");
                for (Path f : files) st.execute(Files.readString(f, StandardCharsets.UTF_8));
                for (String t : forced) st.execute("alter table " + ident(t) + " force row level security");
                st.execute("delete from ctcore_seed_state");
                try (PreparedStatement ins = c.prepareStatement("insert into ctcore_seed_state (hash) values (?)")) {
                    ins.setString(1, hash);
                    ins.executeUpdate();
                }
            } catch (SQLException | IOException | RuntimeException e) {
                c.rollback();
                throw e;
            }
            c.commit();
            log.info("Seed de homologação aplicado ({} arquivos).", files.size());
        }
    }

    /** Privilégios que a API tinha por tabela antes do clean (ex.: sem DELETE em student); o clean os leva junto. */
    private List<String[]> grants(Connection c) throws SQLException {
        List<String[]> out = new ArrayList<>();
        if (runtimeUser.isEmpty()) return out;
        try (PreparedStatement ps = c.prepareStatement(
                "select table_name, privilege_type from information_schema.role_table_grants where grantee = ? and table_schema = 'public'")) {
            ps.setString(1, runtimeUser);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(new String[]{rs.getString(1), rs.getString(2)});
            }
        }
        return out;
    }

    private void restoreGrants(Statement st, List<String[]> grants) throws SQLException {
        if (grants.isEmpty()) return;
        st.execute("revoke all on all tables in schema public from " + ident(runtimeUser));
        for (String[] g : grants) {
            st.execute("grant " + g[1] + " on " + ident(g[0]) + " to " + ident(runtimeUser));
        }
    }

    private static String ident(String name) {
        return "\"" + name.replace("\"", "\"\"") + "\"";
    }

    private static String scalar(Connection c, String sql) throws SQLException {
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return rs.getString(1);
        }
    }

    private static void exec(Connection c, String sql) throws SQLException {
        try (Statement st = c.createStatement()) {
            st.execute(sql);
        }
    }
}
