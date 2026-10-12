import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  ChartContainer,
  LegendItem,
  MetricCard,
} from "@/components/ui";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { SeriesChart } from "@/components/charts/SeriesChart";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { useApp } from "@/state/AppContext";
import { analyticsService, portfolioService } from "@/services";
import { formatCurrency, formatDate, formatPct } from "@/lib/format";
import styles from "./Analytics.module.css";

export function Analytics() {
  const { activePortfolio, timeframe } = useApp();
  const a = analyticsService.getPerformanceAnalytics();
  const perf = analyticsService.getPerformanceSeries();
  const cumulative = analyticsService.getCumulativeReturn();
  const monthly = analyticsService.getMonthlyReturns();
  const distribution = analyticsService.getReturnDistribution();
  const rollingVol = analyticsService.getRollingVolatility();
  const metrics = portfolioService.getMetrics();

  return (
    <div className="page">
      <PageHeader
        eyebrow={activePortfolio.name}
        title="Performance Analytics"
        subtitle="Returns, drawups and the shape of your daily P&L."
        actions={
          <Badge tone={a.totalReturn >= 0 ? "pos" : "neg"} size="md">
            {formatPct(a.totalReturn)} total
          </Badge>
        }
      />

      <section className={styles.metrics}>
        <MetricCard
          label="Total Return"
          value={formatPct(a.totalReturn)}
          delta={formatCurrency(metrics.totalPnl, { compact: true })}
          deltaDirection={a.totalReturn >= 0 ? "pos" : "neg"}
          icon="trending-up"
          accent
        />
        <MetricCard label="Annualised" value={formatPct(a.annualizedReturn)} delta="p.a." deltaDirection={a.annualizedReturn >= 0 ? "pos" : "neg"} icon="analytics" />
        <MetricCard label="CAGR" value={formatPct(a.cagr)} delta="Compound" deltaDirection="neu" icon="analytics" />
        <MetricCard label="Avg Daily" value={formatPct(a.avgDailyReturn, { decimals: 3 })} delta="per session" deltaDirection={a.avgDailyReturn >= 0 ? "pos" : "neg"} icon="markets" />
        <MetricCard
          label="Best Day"
          value={formatPct(a.bestDay.value)}
          delta={formatDate(a.bestDay.date)}
          deltaDirection="pos"
          icon="arrow-up"
        />
        <MetricCard
          label="Worst Day"
          value={formatPct(a.worstDay.value)}
          delta={formatDate(a.worstDay.date)}
          deltaDirection="neg"
          icon="arrow-down"
        />
        <MetricCard label="Winning Days" value={`${a.winningDays}`} delta={`${a.losingDays} losing`} deltaDirection="pos" icon="check" />
        <MetricCard label="Positive Months" value={`${a.positiveMonths}/${a.totalMonths}`} delta="hit rate" deltaDirection="neu" icon="calendar" />
      </section>

      <section className={styles.grid2}>
        <ChartContainer
          eyebrow="Performance"
          title="Portfolio vs Benchmark"
          subtitle={`${timeframe} · indexed to invested capital`}
          height={300}
          legend={
            <>
              <LegendItem colorVar="--accent" label="Portfolio" value={formatCurrency(metrics.value, { compact: true })} />
              <LegendItem colorVar="--neu" label={perf.benchmarkLabel} dashed />
            </>
          }
        >
          <PerformanceChart data={perf} height={300} />
        </ChartContainer>

        <ChartContainer
          eyebrow="Returns"
          title="Cumulative Return"
          subtitle="Growth of ₹100 invested at inception"
          height={300}
          legend={<LegendItem colorVar="--chart-3" label="Cumulative %" />}
        >
          <SeriesChart
            data={cumulative}
            height={300}
            colorVar="--chart-3"
            valueFormatter={(v) => `${v.toFixed(0)}%`}
            seriesLabel="Cumulative"
            referenceY={0}
          />
        </ChartContainer>
      </section>

      <section className={styles.grid2}>
        <ChartContainer
          eyebrow="Returns"
          title="Monthly Returns"
          subtitle="Calendar-month P&L"
          height={260}
        >
          <ColumnChart
            data={monthly.map((m) => ({ label: m.month, value: m.value }))}
            height={260}
            valueFormatter={(v) => `${v}%`}
            seriesLabel="Return"
          />
        </ChartContainer>

        <ChartContainer
          eyebrow="Distribution"
          title="Daily Return Distribution"
          subtitle="Frequency of daily P&L buckets"
          height={260}
        >
          <ColumnChart
            data={distribution.map((d) => ({ label: d.label.replace(/%/g, ""), value: d.count, direction: d.direction }))}
            height={260}
            colorBySign={false}
            valueFormatter={(v) => `${v}`}
            seriesLabel="Days"
          />
        </ChartContainer>
      </section>

      <section>
        <ChartContainer
          eyebrow="Risk"
          title="Rolling Volatility (21-day)"
          subtitle="Annualised standard deviation over a trailing month"
          height={240}
          legend={<LegendItem colorVar="--chart-5" label="Annualised volatility" />}
        >
          <SeriesChart
            data={rollingVol}
            height={240}
            colorVar="--chart-5"
            type="area"
            valueFormatter={(v) => `${v.toFixed(0)}%`}
            seriesLabel="Volatility"
          />
        </ChartContainer>
      </section>
    </div>
  );
}
