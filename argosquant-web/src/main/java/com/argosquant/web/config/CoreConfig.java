package com.argosquant.web.config;

import com.argosquant.auth.repository.UserRepository;
import com.argosquant.auth.security.JwtService;
import com.argosquant.auth.security.PasswordHasher;
import com.argosquant.auth.service.AuthService;
import com.argosquant.database.Jdbc;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.PortfolioRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.repository.TransactionRepository;
import com.argosquant.portfolio.service.PortfolioService;
import com.argosquant.portfolio.service.TransactionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.time.Duration;

/**
 * Wires the plain-Java core services into the Spring context. The core module
 * has no Spring annotations; all bean construction happens here so business
 * logic stays framework-agnostic and reusable by the desktop client.
 */
@Configuration
public class CoreConfig {

    @Bean
    public Jdbc jdbc(DataSource dataSource) {
        return new Jdbc(dataSource);
    }

    @Bean
    public UserRepository userRepository() {
        return new UserRepository();
    }

    @Bean
    public PortfolioRepository portfolioRepository() {
        return new PortfolioRepository();
    }

    @Bean
    public StockRepository stockRepository() {
        return new StockRepository();
    }

    @Bean
    public HoldingRepository holdingRepository() {
        return new HoldingRepository();
    }

    @Bean
    public TransactionRepository transactionRepository() {
        return new TransactionRepository();
    }

    @Bean
    public PasswordHasher passwordHasher() {
        return new PasswordHasher();
    }

    @Bean
    public JwtService jwtService(
            @Value("${argos.jwt.secret:change-me-in-prod-this-is-a-dev-only-secret-0123456789}") String secret,
            @Value("${argos.jwt.ttl-minutes:60}") long ttlMinutes) {
        return new JwtService(secret, Duration.ofMinutes(ttlMinutes));
    }

    @Bean
    public AuthService authService(Jdbc jdbc, UserRepository users, PasswordHasher hasher, JwtService jwt) {
        return new AuthService(jdbc, users, hasher, jwt);
    }

    @Bean
    public PortfolioService portfolioService(Jdbc jdbc, PortfolioRepository portfolios, HoldingRepository holdings) {
        return new PortfolioService(jdbc, portfolios, holdings);
    }

    @Bean
    public TransactionService transactionService(Jdbc jdbc, PortfolioRepository portfolios, StockRepository stocks,
                                                 HoldingRepository holdings, TransactionRepository transactions) {
        return new TransactionService(jdbc, portfolios, stocks, holdings, transactions);
    }
}
