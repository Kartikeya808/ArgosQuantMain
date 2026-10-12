package com.argosquant.database;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Thin transaction/connection helper over a {@link DataSource}.
 *
 * <p>Repositories are pure data-access: every method takes a {@link Connection}
 * and does no connection management. Services compose repository calls inside
 * {@link #inTransaction} (atomic write) or {@link #inConnection} (read), so
 * transaction boundaries live in the service layer, not scattered across repos.
 */
public final class Jdbc {

    /** A unit of work that participates in a caller-supplied connection and may throw {@link SQLException}. */
    @FunctionalInterface
    public interface Work<T> {
        T run(Connection conn) throws SQLException;
    }

    private final DataSource dataSource;

    public Jdbc(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Runs {@code work} in a transaction: commits on success, rolls back on any exception. */
    public <T> T inTransaction(Work<T> work) {
        try (Connection conn = dataSource.getConnection()) {
            boolean previousAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);
            try {
                T result = work.run(conn);
                conn.commit();
                return result;
            } catch (RuntimeException | SQLException e) {
                conn.rollback();
                throw e instanceof RuntimeException re ? re : new DataAccessException(e);
            } finally {
                conn.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    /** Runs {@code work} on an auto-commit connection; use for read-only access. */
    public <T> T inConnection(Work<T> work) {
        try (Connection conn = dataSource.getConnection()) {
            return work.run(conn);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }
}
