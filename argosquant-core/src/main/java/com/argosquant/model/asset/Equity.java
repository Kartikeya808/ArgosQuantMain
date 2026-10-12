package com.argosquant.model.asset;

import com.argosquant.model.AssetType;

/** A single-company common stock. */
public final class Equity extends FinancialAsset {

    private final String sector;

    public Equity(Long id, String symbol, String name, String exchange, String currency, String sector) {
        super(id, symbol, name, exchange, currency);
        this.sector = sector;
    }

    /** @return GICS-style sector label, or {@code null} if unclassified. */
    public String sector() {
        return sector;
    }

    @Override
    public AssetType type() {
        return AssetType.EQUITY;
    }

    @Override
    public String describe() {
        return sector == null ? "Equity" : "Equity (" + sector + ")";
    }
}
