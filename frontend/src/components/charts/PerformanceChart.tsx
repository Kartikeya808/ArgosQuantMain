import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerformanceSeries } from "@/types";
import { formatCurrency } from "@/lib/format";
import styles from "./PerformanceChart.module.css";

interface PerformanceChartProps {
  data: PerformanceSeries;
  height?: number;
}

interface MergedPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

function cssVar(name: string): string {
  if (typeof window === "undefined") return "#f5a623";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export function PerformanceChart({ data, height = 300 }: PerformanceChartProps) {
  const merged: MergedPoint[] = data.portfolio.map((p, i) => ({
    date: p.date,
    portfolio: p.value,
    benchmark: data.benchmark[i]?.value ?? 0,
  }));

  const accent = cssVar("--accent");
  const neutral = cssVar("--neu");
  const grid = cssVar("--chart-grid");
  const axis = cssVar("--chart-axis");

  const tickFmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={merged}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <defs>
          <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={tickFmt}
          stroke={axis}
          tick={{ fontSize: 11, fill: axis }}
          tickLine={false}
          axisLine={{ stroke: grid }}
          minTickGap={48}
        />
        <YAxis
          stroke={axis}
          tick={{ fontSize: 11, fill: axis }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          domain={["auto", "auto"]}
        />
        <Tooltip
          cursor={{ stroke: axis, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className={styles.tip}>
                <div className={styles.tipDate}>
                  {new Date(label as string).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                {payload.map((p) => (
                  <div key={p.dataKey} className={styles.tipRow}>
                    <span
                      className={styles.tipSwatch}
                      style={{ background: p.color }}
                    />
                    <span className={styles.tipLabel}>
                      {p.dataKey === "portfolio" ? "Portfolio" : data.benchmarkLabel}
                    </span>
                    <span className={`${styles.tipVal} mono`}>
                      {formatCurrency(p.value as number, { compact: true })}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="portfolio"
          stroke={accent}
          strokeWidth={2}
          fill="url(#pfFill)"
          dot={false}
          activeDot={{ r: 3, fill: accent }}
        />
        <Line
          type="monotone"
          dataKey="benchmark"
          stroke={neutral}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 3, fill: neutral }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
