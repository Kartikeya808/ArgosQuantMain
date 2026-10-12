-- ArgosQuant base schema (Phase 0)
-- Core entities shared by both clients. Money/quantities use NUMERIC for
-- exact decimal arithmetic (never floating point for financial figures).

CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         TEXT        NOT NULL UNIQUE,
    display_name  TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portfolios (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    base_currency CHAR(3)   NOT NULL DEFAULT 'INR',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

-- Instrument reference data. asset_type backs the FinancialAsset hierarchy
-- (EQUITY, ETF, ...) in the model layer.
CREATE TABLE stocks (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol     TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    exchange   TEXT NOT NULL,
    currency   CHAR(3) NOT NULL DEFAULT 'INR',
    asset_type TEXT NOT NULL DEFAULT 'EQUITY'
);

-- Current net position per (portfolio, stock). Derived from transactions but
-- maintained for fast reads; quantity is signed shares, avg_cost the running
-- average purchase price.
CREATE TABLE holdings (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    portfolio_id BIGINT         NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    stock_id     BIGINT         NOT NULL REFERENCES stocks (id),
    quantity     NUMERIC(20, 6) NOT NULL DEFAULT 0,
    avg_cost     NUMERIC(20, 6) NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    UNIQUE (portfolio_id, stock_id)
);

CREATE TABLE transactions (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    portfolio_id  BIGINT         NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    stock_id      BIGINT         NOT NULL REFERENCES stocks (id),
    side          TEXT           NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity      NUMERIC(20, 6) NOT NULL CHECK (quantity > 0),
    price         NUMERIC(20, 6) NOT NULL CHECK (price >= 0),
    executed_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolios_user ON portfolios (user_id);
CREATE INDEX idx_holdings_portfolio ON holdings (portfolio_id);
CREATE INDEX idx_transactions_portfolio ON transactions (portfolio_id);
CREATE INDEX idx_transactions_stock ON transactions (stock_id);
