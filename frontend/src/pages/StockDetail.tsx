import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  ChartContainer,
  EmptyState,
  Tabs,
  type TabItem,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { SeriesChart } from "@/components/charts/SeriesChart";
import { TransactionModal } from "@/components/portfolio/TransactionModal";
import { useApp } from "@/state/AppContext";
import { marketService, portfolioService } from "@/services";
import type { Timeframe } from "@/types";
import {
  formatCompact,
  formatCurrency,
  formatPct,
  formatSignedCurrency,
  valueClass,
} from "@/lib/format";
import styles from "./StockDetail.module.css";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

export function StockDetail() {
  const { symbol = "" } = useParams();
  const navigate = useNavigate();
  const { isWatched, addToWatchlist, removeFromWatchlist } = useApp();

  const [tf, setTf] = useState<Timeframe>("6M");
  const [tab, setTab] = useState("overview");
  const [modalOpen, setModalOpen] = useState(false);

  const quote = marketService.getQuote(symbol);
  const history = useMemo(() => marketService.getPriceHistory(symbol), [symbol]);
  const holding = portfolioService.getHolding(symbol);

  // per-stock performance/risk derived from the 1Y daily series
  const derived = useMemo(() => {
    const series = history["1Y"] ?? [];
    if (series.length < 2) return null;
    const rets: number[] = [];
    for (let i = 1; i < series.length; i++) rets.push(series[i].value / series[i - 1].value - 1);
    const mean = rets.reduce((s, x) => s + x, 0) / rets.length;
    const variance = rets.reduce((s, x) => s + (x - mean) ** 2, 0) / rets.length;
    const vol = Math.sqrt(variance) * Math.sqrt(252) * 100;
    const yearReturn = (series[series.length - 1].value / series[0].value - 1) * 100;
    const best = Math.max(...rets) * 100;
    const worst = Math.min(...rets) * 100;
    return { vol, yearReturn, best, worst };
  }, [history]);

  if (!quote) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            icon="search"
            title={`No data for "${symbol}"`}
            description="This symbol isn't in the ArgosQuant universe."
            action={
              <Button variant="secondary" icon="markets" onClick={() => navigate("/markets")}>
                Back to Markets
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const watched = isWatched(symbol);
  const series = history[tf] ?? [];

  const tabs: TabItem[] = [
    { value: "overview", label: "Overview" },
    { value: "performance", label: "Performance" },
    { value: "risk", label: "Risk" },
    { value: "position", label: "Position" },
  ];

  const fundamentals: Array<[string, string]> = [
    ["Open", formatCurrency(quote.open)],
    ["Prev Close", formatCurrency(quote.prevClose)],
    ["Day High", formatCurrency(quote.dayHigh)],
    ["Day Low", formatCurrency(quote.dayLow)],
    ["52W High", formatCurrency(quote.high52)],
    ["52W Low", formatCurrency(quote.low52)],
    ["Volume", formatCompact(quote.volume)],
    ["Avg Volume", formatCompact(quote.avgVolume)],
    ["Market Cap", formatCurrency(quote.marketCap, { compact: true })],
    ["P/E", quote.pe.toFixed(1)],
    ["EPS", formatCurrency(quote.eps)],
    ["Div Yield", formatPct(quote.dividendYield, { signed: false })],
  ];

  return (
    <div className="page">
      {/* ---- security header ---- */}
      <div className={styles.header}>
        <div className={styles.idGroup}>
          <button className={styles.back} onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="chevron-left" size={16} />
          </button>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.ticker}>{quote.symbol}</h1>
              <Badge tone="neutral" size="sm">
                {quote.sector}
              </Badge>
              <Badge tone="neutral" size="sm">
                {quote.assetType}
              </Badge>
            </div>
            <span className={styles.company}>{quote.company}</span>
          </div>
        </div>

        <div className={styles.priceGroup}>
          <div className={styles.priceRow}>
            <span className={`${styles.price} mono`}>{formatCurrency(quote.ltp)}</span>
            <span className={`${styles.change} mono ${valueClass(quote.change)}`}>
              <Icon name={quote.change >= 0 ? "arrow-up" : "arrow-down"} size={14} />
              {formatCurrency(Math.abs(quote.change))} ({formatPct(quote.changePct)})
            </span>
          </div>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              icon={watched ? "star-filled" : "star"}
              onClick={() => (watched ? removeFromWatchlist(symbol) : addToWatchlist(symbol))}
            >
              {watched ? "Watching" : "Watch"}
            </Button>
            <Button variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
              Trade
            </Button>
          </div>
        </div>
      </div>

      {/* ---- price chart ---- */}
      <ChartContainer
        eyebrow="Price"
        title={`${quote.symbol} Price`}
        subtitle={`${tf} · last traded ${formatCurrency(quote.ltp)}`}
        height={320}
        actions={
          <Tabs
            size="sm"
            variant="segmented"
            items={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
            value={tf}
            onChange={(v) => setTf(v as Timeframe)}
          />
        }
        state={series.length ? "ready" : "empty"}
      >
        <SeriesChart
          data={series}
          height={320}
          autoColor
          valueFormatter={(v) => formatCurrency(v, { compact: true })}
          seriesLabel={quote.symbol}
          xMode={tf === "1D" ? "raw" : "date"}
        />
      </ChartContainer>

      {/* ---- position summary strip ---- */}
      <section className={styles.strip}>
        <StatCell label="Your Qty" value={holding ? `${holding.quantity}` : "—"} />
        <StatCell label="Avg Cost" value={holding ? formatCurrency(holding.avgPrice) : "—"} />
        <StatCell label="Position Value" value={holding ? formatCurrency(holding.value, { decimals: 0 }) : "—"} />
        <StatCell
          label="Unrealised P&L"
          value={holding ? formatSignedCurrency(holding.pnl, { decimals: 0 }) : "—"}
          tone={holding ? (holding.pnl >= 0 ? "pos" : "neg") : undefined}
        />
        <StatCell
          label="Portfolio Weight"
          value={holding ? formatPct(holding.weight, { signed: false, decimals: 1 }) : "—"}
        />
      </section>

      {/* ---- detail tabs ---- */}
      <Card>
        <Tabs items={tabs} value={tab} onChange={setTab} />

        {tab === "overview" && (
          <div className={styles.fundGrid}>
            {fundamentals.map(([label, value]) => (
              <div key={label} className={styles.fundItem}>
                <span className={styles.fundLabel}>{label}</span>
                <span className={`${styles.fundValue} mono`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "performance" && derived && (
          <div className={styles.fundGrid}>
            <StatCell label="1Y Return" value={formatPct(derived.yearReturn)} tone={derived.yearReturn >= 0 ? "pos" : "neg"} block />
            <StatCell label="Best Day" value={formatPct(derived.best)} tone="pos" block />
            <StatCell label="Worst Day" value={formatPct(derived.worst)} tone="neg" block />
            <StatCell label="Day Change" value={formatPct(quote.changePct)} tone={quote.changePct >= 0 ? "pos" : "neg"} block />
          </div>
        )}

        {tab === "risk" && derived && (
          <div className={styles.fundGrid}>
            <StatCell label="Volatility (1Y)" value={formatPct(derived.vol, { signed: false })} block />
            <StatCell label="Beta vs NIFTY 50" value={quote.beta.toFixed(2)} block />
            <StatCell
              label="52W Range"
              value={`${formatCurrency(quote.low52, { decimals: 0 })} – ${formatCurrency(quote.high52, { decimals: 0 })}`}
              block
            />
            <StatCell label="P/E" value={quote.pe.toFixed(1)} block />
          </div>
        )}

        {tab === "position" && (
          holding ? (
            <div className={styles.positionBody}>
              <div className={styles.fundGrid}>
                <StatCell label="Quantity" value={`${holding.quantity}`} block />
                <StatCell label="Avg Cost" value={formatCurrency(holding.avgPrice)} block />
                <StatCell label="Invested" value={formatCurrency(holding.invested, { decimals: 0 })} block />
                <StatCell label="Current Value" value={formatCurrency(holding.value, { decimals: 0 })} block />
                <StatCell
                  label="Unrealised P&L"
                  value={`${formatSignedCurrency(holding.pnl, { decimals: 0 })} (${formatPct(holding.pnlPct)})`}
                  tone={holding.pnl >= 0 ? "pos" : "neg"}
                  block
                />
                <StatCell label="Weight" value={formatPct(holding.weight, { signed: false, decimals: 1 })} block />
              </div>
              <div className={styles.positionActions}>
                <Button variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
                  Buy / Sell {quote.symbol}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="portfolio"
              title={`No open position in ${quote.symbol}`}
              description="Record a buy to start tracking this security in your portfolio."
              action={
                <Button variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
                  Add Position
                </Button>
              }
            />
          )
        )}
      </Card>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} defaultSymbol={symbol} />
    </div>
  );
}

function StatCell({
  label,
  value,
  tone,
  block = false,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
  block?: boolean;
}) {
  const toneClass = tone === "pos" ? "val-pos" : tone === "neg" ? "val-neg" : "";
  return (
    <div className={block ? styles.fundItem : styles.stripCell}>
      <span className={block ? styles.fundLabel : styles.stripLabel}>{label}</span>
      <span className={`${block ? styles.fundValue : styles.stripValue} mono ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
