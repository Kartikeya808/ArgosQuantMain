package com.argosquant.database;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

/**
 * Builds the pooled {@link DataSource} used by every JDBC repository.
 *
 * <p>HikariCP provides connection pooling only — there is no ORM here; all SQL
 * is hand-written in the repository layer per the project's raw-JDBC constraint.
 */
public final class DataSourceFactory {

    private DataSourceFactory() {
    }

    public static HikariDataSource create(DatabaseConfig config) {
        HikariConfig hikari = new HikariConfig();
        hikari.setJdbcUrl(config.jdbcUrl());
        hikari.setUsername(config.username());
        hikari.setPassword(config.password());
        hikari.setMaximumPoolSize(config.maxPoolSize());
        hikari.setPoolName("argosquant-pool");
        hikari.setDriverClassName("org.postgresql.Driver");
        // Fail fast at startup rather than on first query if the DB is unreachable.
        hikari.setInitializationFailTimeout(10_000);
        return new HikariDataSource(hikari);
    }
}
