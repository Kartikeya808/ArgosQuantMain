package com.argosquant.portfolio.service;

import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.DuplicateResourceException;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.exceptions.UncheckedArgosException;
import com.argosquant.model.Holding;
import com.argosquant.model.Portfolio;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.PortfolioRepository;

import java.util.List;

/**
 * Portfolio and holding CRUD. All reads/writes are scoped to the owning user so
 * one user can never touch another's data.
 */
public class PortfolioService {

    private static final String DEFAULT_CURRENCY = "INR";

    private final Jdbc jdbc;
    private final PortfolioRepository portfolios;
    private final HoldingRepository holdings;

    public PortfolioService(Jdbc jdbc, PortfolioRepository portfolios, HoldingRepository holdings) {
        this.jdbc = jdbc;
        this.portfolios = portfolios;
        this.holdings = holdings;
    }

    public Portfolio create(long userId, String name, String baseCurrency) throws DuplicateResourceException {
        String portfolioName = requireName(name);
        String currency = (baseCurrency == null || baseCurrency.isBlank())
                ? DEFAULT_CURRENCY : baseCurrency.trim().toUpperCase();
        try {
            return jdbc.inTransaction(conn -> {
                if (portfolios.existsByUserAndName(conn, userId, portfolioName)) {
                    throw new UncheckedArgosException(
                            new DuplicateResourceException("Portfolio already exists: " + portfolioName));
                }
                return portfolios.insert(conn, userId, portfolioName, currency);
            });
        } catch (UncheckedArgosException e) {
            throw (DuplicateResourceException) e.unwrap();
        }
    }

    public List<Portfolio> list(long userId) {
        return jdbc.inConnection(conn -> portfolios.findByUserId(conn, userId));
    }

    public Portfolio get(long userId, long portfolioId) throws ResourceNotFoundException {
        return jdbc.inConnection(conn -> portfolios.findByIdAndUser(conn, portfolioId, userId))
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", portfolioId));
    }

    public List<Holding> listHoldings(long userId, long portfolioId) throws ResourceNotFoundException {
        // get() enforces ownership before we expose any holdings.
        get(userId, portfolioId);
        return jdbc.inConnection(conn -> holdings.findByPortfolio(conn, portfolioId));
    }

    public void delete(long userId, long portfolioId) throws ResourceNotFoundException {
        boolean removed = jdbc.inTransaction(conn -> portfolios.deleteByIdAndUser(conn, portfolioId, userId));
        if (!removed) {
            throw new ResourceNotFoundException("Portfolio", portfolioId);
        }
    }

    private static String requireName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("portfolio name is required");
        }
        return name.trim();
    }
}
