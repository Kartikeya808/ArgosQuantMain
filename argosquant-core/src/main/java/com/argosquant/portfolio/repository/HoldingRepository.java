package com.argosquant.portfolio.repository;

import com.argosquant.model.Holding;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** JDBC access to the {@code holdings} table (current net positions). */
public class HoldingRepository {

    private static final String COLUMNS = "id, portfolio_id, stock_id, quantity, avg_cost, updated_at";

    public Optional<Holding> find(Connection conn, long portfolioId, long stockId) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM holdings WHERE portfolio_id = ? AND stock_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, portfolioId);
            ps.setLong(2, stockId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public List<Holding> findByPortfolio(Connection conn, long portfolioId) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM holdings WHERE portfolio_id = ? ORDER BY stock_id";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, portfolioId);
            try (ResultSet rs = ps.executeQuery()) {
                List<Holding> out = new ArrayList<>();
                while (rs.next()) {
                    out.add(map(rs));
                }
                return out;
            }
        }
    }

    /** Inserts or updates the position for (portfolio, stock) to the given quantity/avg cost. */
    public void upsert(Connection conn, long portfolioId, long stockId,
                       BigDecimal quantity, BigDecimal avgCost) throws SQLException {
        String sql = "INSERT INTO holdings (portfolio_id, stock_id, quantity, avg_cost, updated_at) "
                + "VALUES (?, ?, ?, ?, now()) "
                + "ON CONFLICT (portfolio_id, stock_id) "
                + "DO UPDATE SET quantity = EXCLUDED.quantity, avg_cost = EXCLUDED.avg_cost, updated_at = now()";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, portfolioId);
            ps.setLong(2, stockId);
            ps.setBigDecimal(3, quantity);
            ps.setBigDecimal(4, avgCost);
            ps.executeUpdate();
        }
    }

    public void delete(Connection conn, long portfolioId, long stockId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM holdings WHERE portfolio_id = ? AND stock_id = ?")) {
            ps.setLong(1, portfolioId);
            ps.setLong(2, stockId);
            ps.executeUpdate();
        }
    }

    private Holding map(ResultSet rs) throws SQLException {
        return new Holding(
                rs.getLong("id"),
                rs.getLong("portfolio_id"),
                rs.getLong("stock_id"),
                rs.getBigDecimal("quantity"),
                rs.getBigDecimal("avg_cost"),
                rs.getObject("updated_at", OffsetDateTime.class).toInstant());
    }
}
