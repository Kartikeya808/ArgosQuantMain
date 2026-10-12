package com.argosquant.market.watchlist;

import com.argosquant.database.Jdbc;

import java.util.List;

/** Manages each user's watchlist of symbols. */
public class WatchlistService {

    private final Jdbc jdbc;
    private final WatchlistRepository repository;

    public WatchlistService(Jdbc jdbc, WatchlistRepository repository) {
        this.jdbc = jdbc;
        this.repository = repository;
    }

    public List<String> list(long userId) {
        return jdbc.inConnection(conn -> repository.symbols(conn, userId));
    }

    public List<String> add(long userId, String symbol) {
        String ticker = normalize(symbol);
        jdbc.inTransaction(conn -> repository.add(conn, userId, ticker));
        return list(userId);
    }

    public List<String> remove(long userId, String symbol) {
        String ticker = normalize(symbol);
        jdbc.inTransaction(conn -> repository.remove(conn, userId, ticker));
        return list(userId);
    }

    /** All symbols watched by any user; the scheduled refresh warms the cache for these. */
    public List<String> allWatchedSymbols() {
        return jdbc.inConnection(repository::allDistinctSymbols);
    }

    private static String normalize(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("symbol is required");
        }
        return symbol.trim().toUpperCase();
    }
}
