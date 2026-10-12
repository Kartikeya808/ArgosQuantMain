-- Per-user watchlist of symbols to track market data for.
-- Decoupled from the stocks/holdings tables: a user can watch a symbol they
-- do not own. Market data is keyed by symbol throughout.
CREATE TABLE watchlist (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    symbol     TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, symbol)
);

CREATE INDEX idx_watchlist_user ON watchlist (user_id);
