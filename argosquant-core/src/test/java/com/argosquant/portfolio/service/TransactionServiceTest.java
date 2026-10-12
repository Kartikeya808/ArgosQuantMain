package com.argosquant.portfolio.service;

import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.InsufficientHoldingsException;
import com.argosquant.exceptions.InvalidTransactionException;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.model.AssetType;
import com.argosquant.model.Holding;
import com.argosquant.model.Portfolio;
import com.argosquant.model.Transaction;
import com.argosquant.model.TransactionSide;
import com.argosquant.model.asset.Equity;
import com.argosquant.model.asset.FinancialAsset;
import com.argosquant.portfolio.dto.TradeCommand;
import com.argosquant.portfolio.dto.TradeResult;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.PortfolioRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.sql.Connection;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for buy/sell business rules with all repositories mocked. The
 * {@link Jdbc} helper is stubbed to run the work lambda against a mock
 * connection so the service's logic — not the database — is under test.
 */
class TransactionServiceTest {

    private static final long USER_ID = 7L;
    private static final long PORTFOLIO_ID = 42L;
    private static final long STOCK_ID = 100L;

    private Jdbc jdbc;
    private PortfolioRepository portfolios;
    private StockRepository stocks;
    private HoldingRepository holdings;
    private TransactionRepository transactions;
    private TransactionService service;
    private Connection conn;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        jdbc = mock(Jdbc.class);
        portfolios = mock(PortfolioRepository.class);
        stocks = mock(StockRepository.class);
        holdings = mock(HoldingRepository.class);
        transactions = mock(TransactionRepository.class);
        conn = mock(Connection.class);
        service = new TransactionService(jdbc, portfolios, stocks, holdings, transactions);

        // Run the work lambda immediately against the mock connection.
        when(jdbc.inTransaction(any())).thenAnswer(inv -> ((Jdbc.Work<Object>) inv.getArgument(0)).run(conn));
        when(jdbc.inConnection(any())).thenAnswer(inv -> ((Jdbc.Work<Object>) inv.getArgument(0)).run(conn));

        // Owned portfolio and a known stock by default.
        when(portfolios.findByIdAndUser(conn, PORTFOLIO_ID, USER_ID))
                .thenReturn(Optional.of(new Portfolio(PORTFOLIO_ID, USER_ID, "Main", "INR", Instant.now())));
        FinancialAsset asset = new Equity(STOCK_ID, "TCS", "TCS", "NSE", "INR", "IT");
        when(stocks.findBySymbol(conn, "TCS")).thenReturn(Optional.of(asset));
        when(transactions.insert(any(), anyLong(), anyLong(), any(), any(), any(), any()))
                .thenReturn(new Transaction(1L, PORTFOLIO_ID, STOCK_ID, TransactionSide.BUY,
                        bd("1"), bd("1"), Instant.now(), Instant.now()));
    }

    @Test
    void buyIntoEmptyHoldingSetsAvgCostToPrice() throws Exception {
        when(holdings.find(conn, PORTFOLIO_ID, STOCK_ID)).thenReturn(Optional.empty());

        service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.BUY, "TCS", bd("10"), bd("100"), null));

        ArgumentCaptor<BigDecimal> qty = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<BigDecimal> avg = ArgumentCaptor.forClass(BigDecimal.class);
        verify(holdings).upsert(eq(conn), eq(PORTFOLIO_ID), eq(STOCK_ID), qty.capture(), avg.capture());
        assertEquals(0, bd("10").compareTo(qty.getValue()));
        assertEquals(0, bd("100").compareTo(avg.getValue()));
    }

    @Test
    void buyIntoExistingHoldingComputesWeightedAverageCost() throws Exception {
        // Hold 10 @ 100, buy 10 @ 200 -> 20 @ 150.
        when(holdings.find(conn, PORTFOLIO_ID, STOCK_ID))
                .thenReturn(Optional.of(new Holding(1L, PORTFOLIO_ID, STOCK_ID, bd("10"), bd("100"), Instant.now())));

        service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.BUY, "TCS", bd("10"), bd("200"), null));

        ArgumentCaptor<BigDecimal> qty = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<BigDecimal> avg = ArgumentCaptor.forClass(BigDecimal.class);
        verify(holdings).upsert(eq(conn), eq(PORTFOLIO_ID), eq(STOCK_ID), qty.capture(), avg.capture());
        assertEquals(0, bd("20").compareTo(qty.getValue()));
        assertEquals(0, bd("150").compareTo(avg.getValue()));
    }

    @Test
    void sellReducesQuantityAndKeepsAvgCost() throws Exception {
        when(holdings.find(conn, PORTFOLIO_ID, STOCK_ID))
                .thenReturn(Optional.of(new Holding(1L, PORTFOLIO_ID, STOCK_ID, bd("10"), bd("100"), Instant.now())));

        service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.SELL, "TCS", bd("4"), bd("130"), null));

        ArgumentCaptor<BigDecimal> qty = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<BigDecimal> avg = ArgumentCaptor.forClass(BigDecimal.class);
        verify(holdings).upsert(eq(conn), eq(PORTFOLIO_ID), eq(STOCK_ID), qty.capture(), avg.capture());
        assertEquals(0, bd("6").compareTo(qty.getValue()));
        assertEquals(0, bd("100").compareTo(avg.getValue()));
        verify(holdings, never()).delete(any(), anyLong(), anyLong());
    }

    @Test
    void sellEntirePositionClosesHolding() throws Exception {
        when(holdings.find(conn, PORTFOLIO_ID, STOCK_ID))
                .thenReturn(Optional.of(new Holding(1L, PORTFOLIO_ID, STOCK_ID, bd("10"), bd("100"), Instant.now())),
                        Optional.empty()); // second lookup (post-sell) is empty

        TradeResult result = service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.SELL, "TCS", bd("10"), bd("130"), null));

        verify(holdings).delete(conn, PORTFOLIO_ID, STOCK_ID);
        verify(holdings, never()).upsert(any(), anyLong(), anyLong(), any(), any());
        assertNull(result.resultingHolding());
    }

    @Test
    void sellMoreThanHeldThrowsInsufficientHoldings() throws Exception {
        when(holdings.find(conn, PORTFOLIO_ID, STOCK_ID))
                .thenReturn(Optional.of(new Holding(1L, PORTFOLIO_ID, STOCK_ID, bd("3"), bd("100"), Instant.now())));

        assertThrows(InsufficientHoldingsException.class, () -> service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.SELL, "TCS", bd("5"), bd("130"), null)));
        verify(transactions, never()).insert(any(), anyLong(), anyLong(), any(), any(), any(), any());
    }

    @Test
    void nonPositiveQuantityThrowsInvalidTransaction() {
        assertThrows(InvalidTransactionException.class, () -> service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.BUY, "TCS", bd("0"), bd("100"), null)));
    }

    @Test
    void unknownSymbolIsAutoCreatedAsEquity() throws Exception {
        when(stocks.findBySymbol(conn, "NEW")).thenReturn(Optional.empty());
        when(stocks.insert(conn, "NEW", "NEW", "NSE", "INR", AssetType.EQUITY, null, null))
                .thenReturn(new Equity(STOCK_ID, "NEW", "NEW", "NSE", "INR", null));
        when(holdings.find(conn, PORTFOLIO_ID, STOCK_ID)).thenReturn(Optional.empty());

        service.execute(USER_ID, PORTFOLIO_ID,
                new TradeCommand(TransactionSide.BUY, "new", bd("1"), bd("50"), null));

        verify(stocks).insert(conn, "NEW", "NEW", "NSE", "INR", AssetType.EQUITY, null, null);
    }

    @Test
    void tradingInUnownedPortfolioThrowsNotFound() {
        // portfolioId 999 is unstubbed -> repository returns Optional.empty() by default.
        assertThrows(ResourceNotFoundException.class, () -> service.execute(USER_ID, 999L,
                new TradeCommand(TransactionSide.BUY, "TCS", bd("1"), bd("50"), null)));
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
