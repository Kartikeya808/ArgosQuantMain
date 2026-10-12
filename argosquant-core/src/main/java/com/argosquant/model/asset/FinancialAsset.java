package com.argosquant.model.asset;

import com.argosquant.model.AssetType;

import java.util.Objects;

/**
 * Abstract base for every tradable instrument ArgosQuant tracks.
 *
 * <p>This is the spec-mandated abstract class at the root of the asset
 * hierarchy. A persisted {@code stocks} row becomes a concrete subclass
 * ({@link Equity}, {@link EtfAsset}) chosen by its {@code asset_type}, so
 * downstream analytics can treat assets polymorphically.
 */
public abstract class FinancialAsset {

    private final Long id;
    private final String symbol;
    private final String name;
    private final String exchange;
    private final String currency;

    protected FinancialAsset(Long id, String symbol, String name, String exchange, String currency) {
        this.id = id;
        this.symbol = Objects.requireNonNull(symbol, "symbol");
        this.name = Objects.requireNonNull(name, "name");
        this.exchange = Objects.requireNonNull(exchange, "exchange");
        this.currency = Objects.requireNonNull(currency, "currency");
    }

    /** @return the concrete asset type; each subclass pins this to one {@link AssetType}. */
    public abstract AssetType type();

    /** @return a short human-readable classification, used in explanations and reports. */
    public abstract String describe();

    public Long id() {
        return id;
    }

    public String symbol() {
        return symbol;
    }

    public String name() {
        return name;
    }

    public String exchange() {
        return exchange;
    }

    public String currency() {
        return currency;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof FinancialAsset other)) {
            return false;
        }
        return Objects.equals(symbol, other.symbol) && type() == other.type();
    }

    @Override
    public int hashCode() {
        return Objects.hash(symbol, type());
    }

    @Override
    public String toString() {
        return type() + "{" + symbol + " @ " + exchange + "}";
    }
}
