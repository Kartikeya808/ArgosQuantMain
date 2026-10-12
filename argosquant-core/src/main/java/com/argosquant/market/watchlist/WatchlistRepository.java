package com.argosquant.market.watchlist;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** JDBC access to the {@code watchlist} table. */
public class WatchlistRepository {

    /** Adds a symbol to a user's watchlist, ignoring duplicates. Returns true if a row was inserted. */
    public boolean add(Connection conn, long userId, String symbol) throws SQLException {
        String sql = "INSERT INTO watchlist (user_id, symbol) VALUES (?, ?) "
                + "ON CONFLICT (user_id, symbol) DO NOTHING";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setString(2, symbol);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean remove(Connection conn, long userId, String symbol) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM watchlist WHERE user_id = ? AND symbol = ?")) {
            ps.setLong(1, userId);
            ps.setString(2, symbol);
            return ps.executeUpdate() > 0;
        }
    }

    public List<String> symbols(Connection conn, long userId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT symbol FROM watchlist WHERE user_id = ? ORDER BY symbol")) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                List<String> out = new ArrayList<>();
                while (rs.next()) {
                    out.add(rs.getString(1));
                }
                return out;
            }
        }
    }

    /** Distinct symbols watched by any user — used by the scheduled refresh job. */
    public List<String> allDistinctSymbols(Connection conn) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT DISTINCT symbol FROM watchlist");
             ResultSet rs = ps.executeQuery()) {
            List<String> out = new ArrayList<>();
            while (rs.next()) {
                out.add(rs.getString(1));
            }
            return out;
        }
    }
}
