package com.argosquant.database;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Lightweight, hand-written schema migration runner — no Flyway/Liquibase.
 *
 * <p>Applies versioned SQL scripts named {@code V<n>__<description>.sql} found
 * on the classpath under {@code db/migration/}, in ascending numeric order,
 * each inside its own transaction. Applied versions are recorded in
 * {@code schema_history} so re-runs are idempotent.
 */
public final class MigrationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(MigrationRunner.class);
    private static final String MIGRATION_PATH = "db/migration";
    private static final Pattern FILE_PATTERN = Pattern.compile("^V(\\d+)__.+\\.sql$");

    private final DataSource dataSource;

    public MigrationRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Applies any migrations not yet recorded in {@code schema_history}. Returns the count applied. */
    public int migrate() {
        try (Connection conn = dataSource.getConnection()) {
            ensureHistoryTable(conn);
            Set<Integer> applied = loadAppliedVersions(conn);
            List<Migration> pending = discoverMigrations().stream()
                    .filter(m -> !applied.contains(m.version()))
                    .sorted(Comparator.comparingInt(Migration::version))
                    .toList();

            if (pending.isEmpty()) {
                LOG.info("Schema up to date; no migrations to apply.");
                return 0;
            }

            for (Migration migration : pending) {
                apply(conn, migration);
            }
            LOG.info("Applied {} migration(s).", pending.size());
            return pending.size();
        } catch (SQLException e) {
            throw new IllegalStateException("Migration failed: " + e.getMessage(), e);
        }
    }

    private void ensureHistoryTable(Connection conn) throws SQLException {
        try (Statement st = conn.createStatement()) {
            st.execute("""
                    CREATE TABLE IF NOT EXISTS schema_history (
                        version     INTEGER PRIMARY KEY,
                        description TEXT        NOT NULL,
                        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """);
        }
    }

    private Set<Integer> loadAppliedVersions(Connection conn) throws SQLException {
        Set<Integer> versions = new HashSet<>();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT version FROM schema_history")) {
            while (rs.next()) {
                versions.add(rs.getInt(1));
            }
        }
        return versions;
    }

    private void apply(Connection conn, Migration migration) throws SQLException {
        LOG.info("Applying V{} — {}", migration.version(), migration.description());
        boolean autoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try (Statement st = conn.createStatement()) {
            st.execute(migration.sql());
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO schema_history (version, description) VALUES (?, ?)")) {
                ps.setInt(1, migration.version());
                ps.setString(2, migration.description());
                ps.executeUpdate();
            }
            conn.commit();
        } catch (SQLException e) {
            conn.rollback();
            throw new SQLException("Migration V" + migration.version() + " failed, rolled back", e);
        } finally {
            conn.setAutoCommit(autoCommit);
        }
    }

    /** Lists migration scripts on the classpath, handling both exploded-dir and jar layouts. */
    private List<Migration> discoverMigrations() {
        try {
            URL root = Thread.currentThread().getContextClassLoader().getResource(MIGRATION_PATH);
            if (root == null) {
                LOG.warn("No {} directory on classpath; nothing to migrate.", MIGRATION_PATH);
                return List.of();
            }
            URI uri = root.toURI();
            if ("jar".equals(uri.getScheme())) {
                try (FileSystem fs = FileSystems.newFileSystem(uri, java.util.Map.of())) {
                    return readFrom(fs.getPath(MIGRATION_PATH));
                }
            }
            return readFrom(Path.of(uri));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to scan migrations: " + e.getMessage(), e);
        }
    }

    private List<Migration> readFrom(Path dir) throws IOException {
        List<Migration> migrations = new ArrayList<>();
        try (Stream<Path> files = Files.list(dir)) {
            for (Path file : files.toList()) {
                String fileName = file.getFileName().toString();
                Matcher matcher = FILE_PATTERN.matcher(fileName);
                if (!matcher.matches()) {
                    continue;
                }
                int version = Integer.parseInt(matcher.group(1));
                String description = describe(fileName);
                String sql = Files.readString(file, StandardCharsets.UTF_8);
                migrations.add(new Migration(version, description, sql));
            }
        }
        return migrations;
    }

    /** Reads a single classpath resource (used by tests/callers that prefer resource lookup). */
    static String readResource(String resourcePath) {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        try (InputStream in = cl.getResourceAsStream(resourcePath)) {
            if (in == null) {
                throw new IllegalArgumentException("Resource not found: " + resourcePath);
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                return reader.lines().reduce(new StringBuilder(),
                        (sb, line) -> sb.append(line).append('\n'),
                        StringBuilder::append).toString();
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String describe(String fileName) {
        int start = fileName.indexOf("__") + 2;
        int end = fileName.length() - ".sql".length();
        return fileName.substring(start, end).replace('_', ' ');
    }

    private record Migration(int version, String description, String sql) {
    }
}
