package com.argosquant.auth.repository;

import com.argosquant.model.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.Optional;

/** Hand-written JDBC access to the {@code users} table. */
public class UserRepository {

    /** Inserts a new user and returns it with the generated id and timestamp populated. */
    public User insert(Connection conn, String email, String displayName, String passwordHash) throws SQLException {
        String sql = "INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?) "
                + "RETURNING id, email, display_name, password_hash, created_at";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ps.setString(2, displayName);
            ps.setString(3, passwordHash);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return map(rs);
            }
        }
    }

    public Optional<User> findByEmail(Connection conn, String email) throws SQLException {
        String sql = "SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public Optional<User> findById(Connection conn, long id) throws SQLException {
        String sql = "SELECT id, email, display_name, password_hash, created_at FROM users WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public boolean existsByEmail(Connection conn, String email) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM users WHERE email = ?")) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private User map(ResultSet rs) throws SQLException {
        return new User(
                rs.getLong("id"),
                rs.getString("email"),
                rs.getString("display_name"),
                rs.getString("password_hash"),
                rs.getObject("created_at", OffsetDateTime.class).toInstant());
    }
}
