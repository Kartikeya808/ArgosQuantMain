package com.argosquant.model.asset;

import com.argosquant.model.AssetType;

/** An exchange-traded fund tracking a basket/index. */
public final class EtfAsset extends FinancialAsset {

    private final String underlyingIndex;

    public EtfAsset(Long id, String symbol, String name, String exchange, String currency, String underlyingIndex) {
        super(id, symbol, name, exchange, currency);
        this.underlyingIndex = underlyingIndex;
    }

    /** @return the index this ETF tracks, or {@code null} if unspecified. */
    public String underlyingIndex() {
        return underlyingIndex;
    }

    @Override
    public AssetType type() {
        return AssetType.ETF;
    }

    @Override
    public String describe() {
        return underlyingIndex == null ? "ETF" : "ETF tracking " + underlyingIndex;
    }
}
