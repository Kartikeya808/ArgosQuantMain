package com.argosquant.web.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

/**
 * Minimal liveness/readiness endpoint. Confirms the app is up and the database
 * connection pool can hand out a working connection.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public Map<String, Object> health() {
        boolean dbUp;
        try (Connection conn = dataSource.getConnection()) {
            dbUp = conn.isValid(2);
        } catch (Exception e) {
            dbUp = false;
        }
        return Map.of(
                "status", dbUp ? "UP" : "DEGRADED",
                "database", dbUp ? "UP" : "DOWN");
    }
}
