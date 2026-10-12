package com.argosquant.portfolio;

import com.argosquant.auth.dto.AuthResult;
import com.argosquant.auth.dto.LoginCommand;
import com.argosquant.auth.dto.RegistrationCommand;
import com.argosquant.auth.repository.UserRepository;
import com.argosquant.auth.security.JwtService;
import com.argosquant.auth.security.PasswordHasher;
import com.argosquant.auth.service.AuthService;
import com.argosquant.database.DataSourceFactory;
import com.argosquant.database.DatabaseConfig;
import com.argosquant.database.Jdbc;
import com.argosquant.database.MigrationRunner;
import com.argosquant.exceptions.InsufficientHoldingsException;
import com.argosquant.model.Holding;
import com.argosquant.model.Portfolio;
import com.argosquant.model.Transaction;
import com.argosquant.model.TransactionSide;
import com.argosquant.portfolio.dto.TradeCommand;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.PortfolioRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.repository.TransactionRepository;
import com.argosquant.portfolio.service.PortfolioService;
import com.argosquant.portfolio.service.TransactionService;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * End-to-end test over a real Postgres (Testcontainers): applies migrations,
 * then drives register -> create portfolio -> buy/buy/sell through the actual
 * JDBC repositories and services, asserting positions persist correctly.
 *
 * <p>The container is managed manually (rather than via the {@code @Container}
 * extension) so the whole class is <em>skipped</em> — not failed — when no
 * usable Docker client is available in the build environment.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PortfolioFlowIntegrationTest {

    private PostgreSQLContainer<?> postgres;
    private HikariDataSource dataSource;
    private Jdbc jdbc;
    private AuthService authService;
    private PortfolioService portfolioService;
    private TransactionService transactionService;

    @BeforeAll
    void setUp() {
        assumeTrue(DockerClientFactory.instance().isDockerAvailable(),
                "Docker is not available to the test client; skipping Testcontainers integration test");

        postgres = new PostgreSQLContainer<>("postgres:16-alpine");
        postgres.start();

        dataSource = DataSourceFactory.create(new DatabaseConfig(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword(), 4));
        new MigrationRunner(dataSource).migrate();

        jdbc = new Jdbc(dataSource);
        UserRepository users = new UserRepository();
        PortfolioRepository portfolios = new PortfolioRepository();
        StockRepository stocks = new StockRepository();
        HoldingRepository holdings = new HoldingRepository();
        TransactionRepository transactions = new TransactionRepository();

        JwtService jwt = new JwtService("integration-test-secret-key-at-least-32-bytes!!", Duration.ofMinutes(30));
        authService = new AuthService(jdbc, users, new PasswordHasher(4), jwt);
        portfolioService = new PortfolioService(jdbc, portfolios, holdings);
        transactionService = new TransactionService(jdbc, portfolios, stocks, holdings, transactions);
    }

    @AfterAll
    void tearDown() {
        if (dataSource != null) {
            dataSource.close();
        }
        if (postgres != null) {
            postgres.stop();
        }
    }

    @Test
    void migrationsCreateAllCoreTables() throws Exception {
        List<String> tables = jdbc.inConnection(conn -> {
            var found = new java.util.ArrayList<String>();
            try (var st = conn.createStatement();
                 var rs = st.executeQuery(
                         "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")) {
                while (rs.next()) {
                    found.add(rs.getString(1));
                }
            }
            return found;
        });
        assertTrue(tables.containsAll(
                List.of("users", "portfolios", "stocks", "holdings", "transactions", "schema_history")),
                "expected core tables, found: " + tables);
    }

    @Test
    void fullTradeFlowMaintainsPositionAndAverageCost() throws Exception {
        AuthResult registered = authService.register(
                new RegistrationCommand("trader@example.com", "Trader", "password123"));
        long userId = registered.userId();

        // Login returns a usable token for the same identity.
        AuthResult loggedIn = authService.login(new LoginCommand("TRADER@example.com", "password123"));
        assertEquals(userId, loggedIn.userId());
        assertTrue(loggedIn.token().length() > 0);

        Portfolio portfolio = portfolioService.create(userId, "Growth", "INR");

        // Buy 10 @ 100, then 10 @ 200 -> 20 @ 150.
        transactionService.execute(userId, portfolio.id(),
                new TradeCommand(TransactionSide.BUY, "TCS", bd("10"), bd("100"), null));
        transactionService.execute(userId, portfolio.id(),
                new TradeCommand(TransactionSide.BUY, "TCS", bd("10"), bd("200"), null));
        // Sell 5 -> 15 @ 150.
        transactionService.execute(userId, portfolio.id(),
                new TradeCommand(TransactionSide.SELL, "TCS", bd("5"), bd("250"), null));

        List<Holding> holdings = portfolioService.listHoldings(userId, portfolio.id());
        assertEquals(1, holdings.size());
        Holding tcs = holdings.get(0);
        assertEquals(0, bd("15").compareTo(tcs.quantity()));
        assertEquals(0, bd("150").compareTo(tcs.avgCost()));

        List<Transaction> history = transactionService.history(userId, portfolio.id());
        assertEquals(3, history.size());

        // Overselling is rejected and leaves state untouched.
        assertThrows(InsufficientHoldingsException.class, () -> transactionService.execute(userId, portfolio.id(),
                new TradeCommand(TransactionSide.SELL, "TCS", bd("100"), bd("250"), null)));
        assertEquals(3, transactionService.history(userId, portfolio.id()).size());
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
