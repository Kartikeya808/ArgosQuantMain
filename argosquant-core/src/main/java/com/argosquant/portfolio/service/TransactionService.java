package com.argosquant.portfolio.service;

import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.ArgosException;
import com.argosquant.exceptions.InsufficientHoldingsException;
import com.argosquant.exceptions.InvalidTransactionException;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.exceptions.UncheckedArgosException;
import com.argosquant.model.AssetType;
import com.argosquant.model.Holding;
import com.argosquant.model.Transaction;
import com.argosquant.model.TransactionSide;
import com.argosquant.model.asset.FinancialAsset;
import com.argosquant.portfolio.dto.TradeCommand;
import com.argosquant.portfolio.dto.TradeResult;
import com.argosquant.portfolio.dto.TransactionView;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.PortfolioRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.repository.TransactionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Executes buy/sell trades and keeps each holding's quantity and average cost
 * consistent with the transaction log. The whole trade — stock lookup/creation,
 * holding update, transaction insert — runs in one JDBC transaction so a failure
 * leaves no partial state.
 */
public class TransactionService {

    /** Scale for stored average cost; matches NUMERIC(20,6) in the schema. */
    private static final int MONEY_SCALE = 6;

    private final Jdbc jdbc;
    private final PortfolioRepository portfolios;
    private final StockRepository stocks;
    private final HoldingRepository holdings;
    private final TransactionRepository transactions;

    public TransactionService(Jdbc jdbc, PortfolioRepository portfolios, StockRepository stocks,
                              HoldingRepository holdings, TransactionRepository transactions) {
        this.jdbc = jdbc;
        this.portfolios = portfolios;
        this.stocks = stocks;
        this.holdings = holdings;
        this.transactions = transactions;
    }

    public TradeResult execute(long userId, long portfolioId, TradeCommand command)
            throws ArgosException {
        TransactionSide side = command.side();
        if (side == null) {
            throw new InvalidTransactionException("side is required (BUY or SELL)");
        }
        String symbol = requireSymbol(command.symbol());
        BigDecimal quantity = command.quantity();
        BigDecimal price = command.price();
        if (quantity == null || quantity.signum() <= 0) {
            throw new InvalidTransactionException("quantity must be positive");
        }
        if (price == null || price.signum() < 0) {
            throw new InvalidTransactionException("price must be non-negative");
        }
        Instant executedAt = command.executedAt() == null ? Instant.now() : command.executedAt();

        try {
            return jdbc.inTransaction(conn -> {
                portfolios.findByIdAndUser(conn, portfolioId, userId)
                        .orElseThrow(() -> new UncheckedArgosException(
                                new ResourceNotFoundException("Portfolio", portfolioId)));

                FinancialAsset asset = resolveStock(conn, symbol);
                long stockId = asset.id();
                Optional<Holding> existing = holdings.find(conn, portfolioId, stockId);
                BigDecimal heldQty = existing.map(Holding::quantity).orElse(BigDecimal.ZERO);
                BigDecimal heldAvg = existing.map(Holding::avgCost).orElse(BigDecimal.ZERO);

                if (side == TransactionSide.BUY) {
                    BigDecimal newQty = heldQty.add(quantity);
                    BigDecimal newCostBasis = heldQty.multiply(heldAvg).add(quantity.multiply(price));
                    BigDecimal newAvg = newCostBasis.divide(newQty, MONEY_SCALE, RoundingMode.HALF_UP);
                    holdings.upsert(conn, portfolioId, stockId, newQty, newAvg);
                } else { // SELL
                    if (heldQty.compareTo(quantity) < 0) {
                        throw new UncheckedArgosException(
                                new InsufficientHoldingsException(symbol, heldQty, quantity));
                    }
                    BigDecimal newQty = heldQty.subtract(quantity);
                    if (newQty.signum() == 0) {
                        holdings.delete(conn, portfolioId, stockId);
                    } else {
                        // Average cost is unchanged by a sell; only quantity drops.
                        holdings.upsert(conn, portfolioId, stockId, newQty, heldAvg);
                    }
                }

                Transaction tx = transactions.insert(conn, portfolioId, stockId, side, quantity, price, executedAt);
                Holding after = holdings.find(conn, portfolioId, stockId).orElse(null);
                return new TradeResult(tx, after);
            });
        } catch (UncheckedArgosException e) {
            throw e.unwrap();
        }
    }

    public List<Transaction> history(long userId, long portfolioId) throws ResourceNotFoundException {
        try {
            return jdbc.inConnection(conn -> {
                portfolios.findByIdAndUser(conn, portfolioId, userId)
                        .orElseThrow(() -> new UncheckedArgosException(
                                new ResourceNotFoundException("Portfolio", portfolioId)));
                return transactions.findByPortfolio(conn, portfolioId);
            });
        } catch (UncheckedArgosException e) {
            throw (ResourceNotFoundException) e.unwrap();
        }
    }

    /**
     * Transaction history enriched with each instrument's symbol/name, so
     * clients can render trades without a second lookup. Ownership-scoped.
     */
    public List<TransactionView> historyView(long userId, long portfolioId) throws ResourceNotFoundException {
        try {
            return jdbc.inConnection(conn -> {
                portfolios.findByIdAndUser(conn, portfolioId, userId)
                        .orElseThrow(() -> new UncheckedArgosException(
                                new ResourceNotFoundException("Portfolio", portfolioId)));
                List<Transaction> txs = transactions.findByPortfolio(conn, portfolioId);
                java.util.Map<Long, FinancialAsset> cache = new java.util.HashMap<>();
                List<TransactionView> views = new java.util.ArrayList<>(txs.size());
                for (Transaction t : txs) {
                    FinancialAsset asset = cache.get(t.stockId());
                    if (asset == null) {
                        asset = stocks.findById(conn, t.stockId()).orElse(null);
                        if (asset != null) {
                            cache.put(t.stockId(), asset);
                        }
                    }
                    String symbol = asset == null ? ("#" + t.stockId()) : asset.symbol();
                    String name = asset == null ? symbol : asset.name();
                    views.add(new TransactionView(t.id(), symbol, name, t.side(),
                            t.quantity(), t.price(), t.grossValue(), t.executedAt()));
                }
                return views;
            });
        } catch (UncheckedArgosException e) {
            throw (ResourceNotFoundException) e.unwrap();
        }
    }

    /** Finds the instrument by symbol, auto-creating a minimal equity if unknown. */
    private FinancialAsset resolveStock(java.sql.Connection conn, String symbol) throws java.sql.SQLException {
        Optional<FinancialAsset> found = stocks.findBySymbol(conn, symbol);
        if (found.isPresent()) {
            return found.get();
        }
        return stocks.insert(conn, symbol, symbol, "NSE", "INR", AssetType.EQUITY, null, null);
    }

    private static String requireSymbol(String symbol) throws InvalidTransactionException {
        if (symbol == null || symbol.isBlank()) {
            throw new InvalidTransactionException("symbol is required");
        }
        return symbol.trim().toUpperCase();
    }
}
