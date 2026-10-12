package com.argosquant.portfolio.repository;

import com.argosquant.model.Portfolio;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** JDBC access to the {@code portfolios} table. */
public class PortfolioRepository {

    private static final String COLUMNS = "id, user_id, name, base_currency, created_at";

    public Portfolio insert(Connection conn, long userId, String name, String baseCurrency) throws SQLException {
        String sql = "INSERT INTO portfolios (user_id, name, base_currency) VALUES (?, ?, ?) RETURNING " + COLUMNS;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setString(2, name);
            ps.setString(3, baseCurrency);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return map(rs);
            }
        }
    }

    public List<Portfolio> findByUserId(Connection conn, long userId) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM portfolios WHERE user_id = ? ORDER BY created_at";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                List<Portfolio> out = new ArrayList<>();
                while (rs.next()) {
                    out.add(map(rs));
                }
                return out;
            }
        }
    }

    /** Finds a portfolio by id, scoped to its owner so users cannot read others' portfolios. */
    public Optional<Portfolio> findByIdAndUser(Connection conn, long id, long userId) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM portfolios WHERE id = ? AND user_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.setLong(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public boolean existsByUserAndName(Connection conn, long userId, String name) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT 1 FROM portfolios WHERE user_id = ? AND name = ?")) {
            ps.setLong(1, userId);
            ps.setString(2, name);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    /** Deletes a portfolio scoped to its owner. Returns true if a row was removed. */
    public boolean deleteByIdAndUser(Connection conn, long id, long userId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM portfolios WHERE id = ? AND user_id = ?")) {
            ps.setLong(1, id);
            ps.setLong(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    private Portfolio map(ResultSet rs) throws SQLException {
        return new Portfolio(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getString("name"),
                rs.getString("base_currency"),
                rs.getObject("created_at", OffsetDateTime.class).toInstant());
    }
}
