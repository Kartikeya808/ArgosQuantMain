package com.argosquant.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Entry point for the ArgosQuant web/REST backend.
 *
 * <p>The datasource is provided by {@code argosquant-core}'s hand-written JDBC
 * {@link com.argosquant.database.DataSourceFactory}, so Spring Boot's own
 * datasource auto-configuration is excluded. The default in-memory
 * {@code UserDetailsService} is also excluded — authentication is entirely
 * JWT-based via {@code JwtAuthFilter}.
 */
@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class})
public class ArgosQuantWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(ArgosQuantWebApplication.class, args);
    }
}
