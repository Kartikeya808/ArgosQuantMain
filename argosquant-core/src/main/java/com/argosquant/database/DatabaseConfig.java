package com.argosquant.database;

import java.util.Objects;

/**
 * Immutable connection settings for the application datasource.
 *
 * <p>Values are resolved from environment variables (so the same build runs
 * unchanged against Docker, CI, and cloud Postgres) with local-dev defaults
 * that match {@code docker-compose.yml}.
 */
public record DatabaseConfig(
        String jdbcUrl,
        String username,
        String password,
        int maxPoolSize) {

    public DatabaseConfig {
        Objects.requireNonNull(jdbcUrl, "jdbcUrl");
        Objects.requireNonNull(username, "username");
        Objects.requireNonNull(password, "password");
        if (maxPoolSize < 1) {
            throw new IllegalArgumentException("maxPoolSize must be >= 1, was " + maxPoolSize);
        }
    }

    /** Builds config from {@code ARGOS_DB_*} environment variables, falling back to docker-compose defaults. */
    public static DatabaseConfig fromEnvironment() {
        String host = env("ARGOS_DB_HOST", "localhost");
        String port = env("ARGOS_DB_PORT", "5432");
        String name = env("ARGOS_DB_NAME", "argosquant");
        String url = env("ARGOS_DB_URL", "jdbc:postgresql://" + host + ":" + port + "/" + name);
        String user = env("ARGOS_DB_USER", "argos");
        String pass = env("ARGOS_DB_PASSWORD", "argos");
        int pool = Integer.parseInt(env("ARGOS_DB_POOL_SIZE", "10"));
        return new DatabaseConfig(url, user, pass, pool);
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
