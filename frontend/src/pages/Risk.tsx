import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Card,
  CardHeader,
  ChartContainer,
  LegendItem,
  MetricCard,
  RiskIndicator,
  Table,
  type Column,
} from "@/components/ui";
import { RiskGauge } from "@/components/charts/RiskGauge";
import { SeriesChart } from "@/components/charts/SeriesChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { useApp } from "@/state/AppContext";
import { riskService } from "@/services";
import type { RiskContribution } from "@/types";
import { formatPct } from "@/lib/format";
import styles from "./Risk.module.css";

export function Risk() {
  const { activePortfolio } = useApp();
  const risk = riskService.getRiskMetrics();
  const contributions = riskService.getRiskContributions();
  const drawdown = riskService.getDrawdownSeries();
  const rollingVol = riskService.getRollingVolatility();
  const correlation = riskService.getCorrelationMatrix();

  const [selected, setSelected] = useState<{ a: string; b: string; v: number } | null>(null);

  const maxDD = Math.min(...drawdown.map((d) => d.value));

  const contribColumns: Column<RiskContribution>[] = [
    { key: "symbol", header: "Symbol", render: (r) => <span className={styles.sym}>{r.symbol}</span> },
    { key: "weight", header: "Weight", align: "right", mono: true, render: (r) => formatPct(r.weight, { signed: false, decimals: 1 }) },
    { key: "vol", header: "Volatility", align: "right", mono: true, render: (r) => formatPct(r.volatility, { signed: false }) },
    {
      key: "contribution",
      header: "Risk Contribution",
      align: "right",
      render: (r) => (
        <div className={styles.contribCell}>
          <span className="mono">{formatPct(r.contribution, { signed: false, decimals: 1 })}</span>
          <span className={styles.contribTrack}>
            <span className={styles.contribFill} style={{ width: `${Math.min(r.contribution * 3, 100)}%` }} />
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow={activePortfolio.name}
        title="Risk Analytics"
        subtitle="Volatility, drawdown, Value-at-Risk and where risk concentrates."
        actions={<RiskIndicator band={risk.band} score={risk.score} />}
      />

      <section className={styles.metrics}>
        <MetricCard label="Risk Score" value={`${risk.score}`} delta={risk.band} deltaDirection="neu" icon="shield" accent hint="Composite 0–100 score from volatility, drawdown & concentration." />
        <MetricCard label="Volatility" value={formatPct(risk.volatility, { signed: false })} delta="Annualised" deltaDirection="neu" icon="risk" />
        <MetricCard label="Sharpe Ratio" value={risk.sharpe.toFixed(2)} delta="Risk-adjusted" deltaDirection="pos" icon="analytics" />
        <MetricCard label="Beta" value={risk.beta.toFixed(2)} delta="vs NIFTY 50" deltaDirection="neu" icon="markets" />
        <MetricCard label="Max Drawdown" value={formatPct(risk.maxDrawdown)} delta="Peak-to-trough" deltaDirection="neg" icon="arrow-down" />
        <MetricCard label="VaR (95%, 1-day)" value={formatPct(risk.var95)} delta="Potential loss" deltaDirection="neg" icon="alert" hint="Maximum expected 1-day loss at 95% confidence." />
        <MetricCard label="Diversification" value={`${risk.diversification}/100`} delta="Spread of risk" deltaDirection="neu" icon="grid" />
        <MetricCard label="Positions" value={`${contributions.length}`} delta="Contributors" deltaDirection="neu" icon="portfolio" />
      </section>

      <section className={styles.grid2}>
        <Card>
          <CardHeader eyebrow="Risk" title="Risk Score" actions={<RiskIndicator band={risk.band} size="sm" showBar={false} />} />
          <RiskGauge score={risk.score} band={risk.band} size={200} />
          <p className={styles.gaugeNote}>
            A {risk.band.toLowerCase()} profile. Volatility of {formatPct(risk.volatility, { signed: false })} with a
            1-day 95% VaR of {formatPct(risk.var95)}.
          </p>
        </Card>

        <ChartContainer
          eyebrow="Risk"
          title="Drawdown"
          subtitle={`Peak-to-trough decline · max ${formatPct(maxDD)}`}
          height={280}
          legend={<LegendItem colorVar="--neg" label="Drawdown %" />}
        >
          <SeriesChart
            data={drawdown}
            height={280}
            colorVar="--neg"
            type="area"
            valueFormatter={(v) => `${v.toFixed(0)}%`}
            seriesLabel="Drawdown"
            referenceY={0}
          />
        </ChartContainer>
      </section>

      <section className={styles.grid2}>
        <ChartContainer
          eyebrow="Risk"
          title="Rolling Volatility (21-day)"
          subtitle="Annualised standard deviation over a trailing month"
          height={260}
          legend={<LegendItem colorVar="--chart-5" label="Annualised volatility" />}
        >
          <SeriesChart data={rollingVol} height={260} colorVar="--chart-5" valueFormatter={(v) => `${v.toFixed(0)}%`} seriesLabel="Volatility" />
        </ChartContainer>

        <Card padded={false} className={styles.contribCard}>
          <div className={styles.contribHeader}>
            <CardHeader eyebrow="Attribution" title="Risk Contribution" subtitle="Share of total portfolio risk by holding" />
          </div>
          <Table columns={contribColumns} rows={contributions} rowKey={(r) => r.symbol} dense />
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            eyebrow="Correlation"
            title="Correlation Matrix"
            subtitle="Pairwise return correlation across top holdings"
            actions={
              selected ? (
                <Badge tone={selected.v >= 0.6 ? "neg" : selected.v >= 0.3 ? "accent" : "pos"}>
                  {selected.a} · {selected.b}: {selected.v.toFixed(2)}
                </Badge>
              ) : (
                <Badge tone="neutral">Click a cell</Badge>
              )
            }
          />
          <Heatmap data={correlation} onSelect={(a, b, v) => setSelected({ a, b, v })} />
          <div className={styles.corrLegend}>
            <span className={styles.corrNote}>
              <span className={styles.swatchLow} /> Low / negative
            </span>
            <span className={styles.corrNote}>
              <span className={styles.swatchHigh} /> High positive
            </span>
            <p className={styles.corrHelp}>
              {selected
                ? selected.a === selected.b
                  ? `${selected.a} is perfectly correlated with itself.`
                  : `${selected.a} and ${selected.b} move together ${
                      selected.v >= 0.6 ? "strongly" : selected.v >= 0.3 ? "moderately" : "weakly"
                    } (ρ = ${selected.v.toFixed(2)}). High correlation reduces diversification benefit.`
                : "High positive values mean holdings move together, concentrating risk; lower values indicate diversification."}
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
