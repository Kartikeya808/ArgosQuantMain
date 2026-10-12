package com.argosquant.simulation;

import com.argosquant.database.Jdbc;
import com.argosquant.market.Quote;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.model.Holding;
import com.argosquant.model.Portfolio;
import com.argosquant.model.asset.Equity;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Connection;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Verifies scenario impact math and the read-only (non-persistent) guarantee. */
class ScenarioEngineTest {

    private static final long USER = 1L;
    private static final long PID = 10L;

    private Jdbc jdbc;
    private PortfolioService portfolioService;
    private HoldingRepository holdings;
    private StockRepository stocks;
    private MarketDataService marketDataService;
    private ScenarioEngine engine;
    private Connection conn;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        jdbc = mock(Jdbc.class);
        portfolioService = mock(PortfolioService.class);
        holdings = mock(HoldingRepository.class);
        stocks = mock(StockRepository.class);
        marketDataService = mock(MarketDataService.class);
        conn = mock(Connection.class);
        engine = new ScenarioEngine(jdbc, portfolioService, holdings, stocks, marketDataService);

        when(jdbc.inConnection(any())).thenAnswer(inv -> ((Jdbc.Work<Object>) inv.getArgument(0)).run(conn));
        when(portfolioService.get(USER, PID))
                .thenReturn(new Portfolio(PID, USER, "P", "INR", Instant.now()));

        // Two IT holdings: 10 TCS (stock 1), 5 INFY (stock 2).
        when(holdings.findByPortfolio(conn, PID)).thenReturn(List.of(
                new Holding(1L, PID, 1L, bd("10"), bd("90"), Instant.now()),
                new Holding(2L, PID, 2L, bd("5"), bd("150"), Instant.now())));
        when(stocks.findById(conn, 1L)).thenReturn(Optional.of(new Equity(1L, "TCS", "TCS", "NSE", "INR", "IT")));
        when(stocks.findById(conn, 2L)).thenReturn(Optional.of(new Equity(2L, "INFY", "INFY", "NSE", "INR", "IT")));
        when(marketDataService.getQuotes(any())).thenReturn(Map.of(
                "TCS", new Quote("TCS", bd("100"), "INR", Instant.now()),
                "INFY", new Quote("INFY", bd("200"), "INR", Instant.now())));
    }

    @Test
    void marketShockAppliesToEveryHolding() throws Exception {
        ScenarioResult result = engine.run(USER, PID, ScenarioDefinition.market("Market -10%", -0.10));

        // Current: 10*100 + 5*200 = 2000. Shocked -10%: 1800. Impact -200 (-10%).
        assertEquals(0, bd("2000.00").compareTo(result.currentValue()));
        assertEquals(0, bd("1800.00").compareTo(result.shockedValue()));
        assertEquals(0, bd("-200.00").compareTo(result.absoluteImpact()));
        assertEquals(-0.10, result.percentImpact(), 1e-9);
        assertEquals(2, result.holdings().size());
    }

    @Test
    void symbolShockAffectsOnlyThatSymbol() throws Exception {
        ScenarioResult result = engine.run(USER, PID, ScenarioDefinition.symbol("TCS -20%", "TCS", -0.20));

        // Only TCS shocked: 10*100 -> 10*80 = -200. INFY (1000) unchanged. Total 2000 -> 1800.
        assertEquals(0, bd("2000.00").compareTo(result.currentValue()));
        assertEquals(0, bd("-200.00").compareTo(result.absoluteImpact()));
    }

    @Test
    void sectorShockAppliesToHoldingsInThatSector() throws Exception {
        ScenarioResult result = engine.run(USER, PID, ScenarioDefinition.sector("IT -50%", "IT", -0.50));

        // Both are IT: 2000 -> 1000.
        assertEquals(0, bd("1000.00").compareTo(result.shockedValue()));
        assertEquals(-0.50, result.percentImpact(), 1e-9);
    }

    @Test
    void scenarioNeverMutatesHoldings() throws Exception {
        engine.run(USER, PID, ScenarioDefinition.market("Market -10%", -0.10));
        verify(holdings, never()).upsert(any(), anyLong(), anyLong(), any(), any());
        verify(holdings, never()).delete(any(), anyLong(), anyLong());
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
