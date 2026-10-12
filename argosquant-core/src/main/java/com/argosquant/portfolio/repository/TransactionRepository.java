package com.argosquant.portfolio.repository;

import com.argosquant.model.Transaction;
import com.argosquant.model.TransactionSide;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/** JDBC access to the {@code transactions} table (immutable trade log). */
public class TransactionRepository {

    private static final String COLUMNS =
            "id, portfolio_id, stock_id, side, quantity, price, executed_at, created_at";

    public Transaction insert(Connection conn, long portfolioId, long stockId, TransactionSide side,
                              BigDecimal quantity, BigDecimal price, Instant executedAt) throws SQLException {
        String sql = "INSERT INTO transactions (portfolio_id, stock_id, side, quantity, price, executed_at) "
                + "VALUES (?, ?, ?, ?, ?, ?) RETURNING " + COLUMNS;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, portfolioId);
            ps.setLong(2, stockId);
            ps.setString(3, side.name());
            ps.setBigDecimal(4, quantity);
            ps.setBigDecimal(5, price);
            ps.setObject(6, executedAt.atOffset(ZoneOffset.UTC));
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return map(rs);
            }
        }
    }

    public List<Transaction> findByPortfolio(Connection conn, long portfolioId) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM transactions WHERE portfolio_id = ? ORDER BY executed_at DESC, id DESC";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, portfolioId);
            try (ResultSet rs = ps.executeQuery()) {
                List<Transaction> out = new ArrayList<>();
                while (rs.next()) {
                    out.add(map(rs));
                }
                return out;
            }
        }
    }

    private Transaction map(ResultSet rs) throws SQLException {
        return new Transaction(
                rs.getLong("id"),
                rs.getLong("portfolio_id"),
                rs.getLong("stock_id"),
                TransactionSide.valueOf(rs.getString("side")),
                rs.getBigDecimal("quantity"),
                rs.getBigDecimal("price"),
                rs.getObject("executed_at", OffsetDateTime.class).toInstant(),
                rs.getObject("created_at", OffsetDateTime.class).toInstant());
    }
}
