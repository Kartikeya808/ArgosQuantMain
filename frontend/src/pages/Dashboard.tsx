import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ChartContainer,
  LegendItem,
  MetricCard,
  RiskIndicator,
  Sparkline,
  Table,
  type Column,
  useToast,
} from "@/components/ui";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { RiskGauge } from "@/components/charts/RiskGauge";
import { TransactionModal } from "@/components/portfolio/TransactionModal";
import { useApp } from "@/state/AppContext";
import { portfolioService, riskService } from "@/services";
import type { Holding } from "@/types";
import {
  formatCurrency,
  formatNumber,
  formatPct,
  formatSignedCurrency,
  valueClass,
} from "@/lib/format";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const { activePortfolio, timeframe, marketStatus } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const holdings = portfolioService.getHoldings();
  const performance = portfolioService.getPerformance();
  const m = portfolioService.getMetrics();
  const riskMetrics = riskService.getRiskMetrics();
  const stockAllocation = portfolioService.getStockAllocation();
  const sectorAllocation = portfolioService.getSectorAllocation();

  const holdingColumns: Column<Holding>[] = [
    {
      key: "symbol",
      header: "Symbol",
      render: (h) => (
        <div className={styles.symCell}>
          <span className={styles.sym}>{h.symbol}</span>
          <Badge tone="neutral" size="sm">
            {h.sector}
          </Badge>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (h) => <span className={styles.company}>{h.company}</span>,
    },
    { key: "qty", header: "Qty", align: "right", mono: true, render: (h) => formatNumber(h.quantity) },
    {
      key: "avg",
      header: "Avg Price",
      align: "right",
      mono: true,
      render: (h) => formatCurrency(h.avgPrice),
    },
    {
      key: "ltp",
      header: "LTP",
      align: "right",
      mono: true,
      render: (h) => (
        <div className={styles.ltpCell}>
          <span>{formatCurrency(h.ltp)}</span>
          <span className={`${styles.dayChg} ${valueClass(h.dayChangePct)}`}>
            {formatPct(h.dayChangePct)}
          </span>
        </div>
      ),
    },
    {
      key: "spark",
      header: "7D",
      align: "center",
      render: (h) => <Sparkline data={h.spark} width={72} height={24} />,
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      mono: true,
      render: (h) => formatCurrency(h.value, { decimals: 0 }),
    },
    {
      key: "pnl",
      header: "P&L",
      align: "right",
      mono: true,
      render: (h) => (
        <span className={valueClass(h.pnl)}>
          {formatSignedCurrency(h.pnl, { decimals: 0 })}
        </span>
      ),
    },
    {
      key: "pnlpct",
      header: "P&L %",
      align: "right",
      mono: true,
      render: (h) => (
        <span className={valueClass(h.pnlPct)}>{formatPct(h.pnlPct)}</span>
      ),
    },
    {
      key: "weight",
      header: "Weight",
      align: "right",
      render: (h) => (
        <div className={styles.weightCell}>
          <span className="mono">{formatPct(h.weight, { signed: false, decimals: 1 })}</span>
          <span className={styles.weightTrack}>
            <span
              className={styles.weightFill}
              style={{ width: `${Math.min(h.weight * 2.4, 100)}%` }}
            />
          </span>
        </div>
      ),
    },
  ];

  const riskRows = [
    { label: "Volatility", value: formatPct(riskMetrics.volatility, { signed: false }), hint: "Annualized" },
    { label: "Sharpe Ratio", value: riskMetrics.sharpe.toFixed(2) },
    { label: "Beta", value: riskMetrics.beta.toFixed(2), hint: "vs NIFTY 50" },
    { label: "Max Drawdown", value: formatPct(riskMetrics.maxDrawdown), neg: true },
    { label: "VaR (95%)", value: formatPct(riskMetrics.var95), neg: true, hint: "1-day" },
    { label: "Diversification", value: `${riskMetrics.diversification}/100` },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow={activePortfolio.name}
        title="Dashboard"
        subtitle={
          <>
            <span>Overview of your portfolio performance & risk</span>
            <Badge tone="neutral" size="sm" dot>
              Updated {marketStatus.lastUpdate}
            </Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon="refresh"
              onClick={() => toast.success("Prices refreshed", "Mock data re-synced.")}
            >
              Refresh
            </Button>
            <Button variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
              Add Transaction
            </Button>
          </>
        }
      />

      {/* ---- Metric cards ---- */}
      <section className={styles.metrics}>
        <MetricCard
          label="Portfolio Value"
          value={formatCurrency(m.value, { decimals: 0 })}
          delta={formatSignedCurrency(m.dayPnl, { compact: true })}
          deltaDirection={m.dayPnl >= 0 ? "pos" : "neg"}
          icon="portfolio"
          accent
          spark={performance.portfolio.slice(-24).map((p) => p.value)}
          sparkColor="--accent"
        />
        <MetricCard
          label="Today's P&L"
          value={formatSignedCurrency(m.dayPnl, { decimals: 0 })}
          delta={formatPct(m.dayPnlPct)}
          deltaDirection={m.dayPnl >= 0 ? "pos" : "neg"}
          icon="trending-up"
        />
        <MetricCard
          label="Total Investment"
          value={formatCurrency(m.invested, { decimals: 0 })}
          delta="Cost basis"
          deltaDirection="neu"
          icon="portfolio"
        />
        <MetricCard
          label="Total P&L"
          value={formatSignedCurrency(m.totalPnl, { decimals: 0 })}
          delta={formatPct(m.totalPnlPct)}
          deltaDirection={m.totalPnl >= 0 ? "pos" : "neg"}
          icon="analytics"
        />
        <MetricCard
          label="Volatility"
          value={formatPct(m.volatility, { signed: false })}
          delta="Annualized"
          deltaDirection="neu"
          icon="risk"
          hint="Annualized standard deviation of portfolio returns."
        />
        <MetricCard
          label="Sharpe Ratio"
          value={m.sharpe.toFixed(2)}
          delta="Risk-adjusted"
          deltaDirection="pos"
          icon="analytics"
          hint="Excess return per unit of total risk."
        />
        <MetricCard
          label="Beta"
          value={m.beta.toFixed(2)}
          delta="vs NIFTY 50"
          deltaDirection="neu"
          icon="markets"
          hint="Sensitivity of the portfolio to the benchmark."
        />
        <MetricCard
          label="Risk Score"
          value={`${riskMetrics.score}`}
          delta={riskMetrics.band}
          deltaDirection="neu"
          icon="shield"
          hint="Composite 0–100 risk score from volatility, drawdown & concentration."
        />
      </section>

      {/* ---- Performance + Risk overview ---- */}
      <section className={styles.grid2}>
        <ChartContainer
          eyebrow="Performance"
          title="Portfolio vs Benchmark"
          subtitle={`${timeframe} · indexed to invested capital`}
          height={300}
          legend={
            <>
              <LegendItem colorVar="--accent" label="Portfolio" value={formatCurrency(m.value, { compact: true })} />
              <LegendItem colorVar="--neu" label={performance.benchmarkLabel} dashed />
            </>
          }
          actions={
            <Badge tone={m.totalPnl >= 0 ? "pos" : "neg"} size="md">
              {formatPct(m.totalPnlPct)} all-time
            </Badge>
          }
        >
          <PerformanceChart data={performance} height={300} />
        </ChartContainer>

        <Card>
          <CardHeader
            eyebrow="Risk"
            title="Risk Overview"
            actions={<RiskIndicator band={riskMetrics.band} size="sm" showBar={false} />}
          />
          <RiskGauge score={riskMetrics.score} band={riskMetrics.band} size={196} />
          <div className={styles.riskGrid}>
            {riskRows.map((r) => (
              <div key={r.label} className={styles.riskItem}>
                <span className={styles.riskLabel}>
                  {r.label}
                  {r.hint && <span className={styles.riskHint}>{r.hint}</span>}
                </span>
                <span className={`${styles.riskValue} mono ${r.neg ? "val-neg" : ""}`}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ---- Allocations ---- */}
      <section className={styles.grid2}>
        <ChartContainer eyebrow="Allocation" title="Stock Allocation" height={200}>
          <DonutChart
            data={stockAllocation}
            centerLabel="Positions"
            centerValue={`${holdings.length}`}
          />
        </ChartContainer>
        <ChartContainer eyebrow="Allocation" title="Sector Allocation" height={200}>
          <DonutChart data={sectorAllocation} centerLabel="Sectors" />
        </ChartContainer>
      </section>

      {/* ---- Holdings ---- */}
      <section>
        <Card padded={false} className={styles.holdingsCard}>
          <div className={styles.holdingsHeader}>
            <CardHeader
              eyebrow="Positions"
              title="Holdings"
              subtitle={`${holdings.length} positions · ${formatCurrency(m.value, { compact: true })} market value`}
            />
            <Button
              variant="ghost"
              size="sm"
              iconRight="chevron-right"
              onClick={() => navigate("/portfolio")}
            >
              View all
            </Button>
          </div>
          <Table
            columns={holdingColumns}
            rows={holdings}
            rowKey={(h) => h.symbol}
            dense
            onRowClick={(h) => navigate(`/stock/${h.symbol}`)}
          />
        </Card>
      </section>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
