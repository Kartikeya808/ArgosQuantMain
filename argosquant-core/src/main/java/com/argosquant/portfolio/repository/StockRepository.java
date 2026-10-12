package com.argosquant.portfolio.repository;

import com.argosquant.model.AssetType;
import com.argosquant.model.asset.Equity;
import com.argosquant.model.asset.EtfAsset;
import com.argosquant.model.asset.FinancialAsset;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

/**
 * JDBC access to the {@code stocks} table. Reconstructs the correct
 * {@link FinancialAsset} subclass from {@code asset_type}, demonstrating
 * polymorphic hydration from the database.
 */
public class StockRepository {

    private static final String COLUMNS =
            "id, symbol, name, exchange, currency, asset_type, sector, underlying_index";

    public Optional<FinancialAsset> findBySymbol(Connection conn, String symbol) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT " + COLUMNS + " FROM stocks WHERE symbol = ?")) {
            ps.setString(1, symbol);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public Optional<FinancialAsset> findById(Connection conn, long id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT " + COLUMNS + " FROM stocks WHERE id = ?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    /** Inserts a new instrument and returns it hydrated with its generated id. */
    public FinancialAsset insert(Connection conn, String symbol, String name, String exchange,
                                 String currency, AssetType type, String sector, String underlyingIndex)
            throws SQLException {
        String sql = "INSERT INTO stocks (symbol, name, exchange, currency, asset_type, sector, underlying_index) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING " + COLUMNS;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, symbol);
            ps.setString(2, name);
            ps.setString(3, exchange);
            ps.setString(4, currency);
            ps.setString(5, type.name());
            ps.setString(6, sector);
            ps.setString(7, underlyingIndex);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return map(rs);
            }
        }
    }

    private FinancialAsset map(ResultSet rs) throws SQLException {
        long id = rs.getLong("id");
        String symbol = rs.getString("symbol");
        String name = rs.getString("name");
        String exchange = rs.getString("exchange");
        String currency = rs.getString("currency");
        AssetType type = AssetType.valueOf(rs.getString("asset_type"));
        return switch (type) {
            case EQUITY -> new Equity(id, symbol, name, exchange, currency, rs.getString("sector"));
            case ETF -> new EtfAsset(id, symbol, name, exchange, currency, rs.getString("underlying_index"));
        };
    }
}
