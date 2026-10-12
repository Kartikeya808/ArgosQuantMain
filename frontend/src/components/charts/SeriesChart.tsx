/* =====================================================================
   SeriesChart — single-series area/line chart used for stock prices,
   cumulative return, rolling volatility and drawdown. Themed off the
   same CSS custom properties as PerformanceChart.
   ===================================================================== */

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/types";
import styles from "./PerformanceChart.module.css";

function cssVar(name: string): string {
  if (typeof window === "undefined") return "#f5a623";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface SeriesChartProps {
  data: SeriesPoint[];
  height?: number;
  colorVar?: string; // e.g. "--accent"
  /** "auto" colours by last-vs-first direction (pos/neg). */
  autoColor?: boolean;
  type?: "area" | "line";
  valueFormatter?: (v: number) => string;
  labelFormatter?: (iso: string) => string;
  seriesLabel?: string;
  /** draw a reference line at this y value (e.g. 0 for drawdown). */
  referenceY?: number;
  /** format X ticks as intraday times vs dates. */
  xMode?: "date" | "raw";
}

export function SeriesChart({
  data,
  height = 280,
  colorVar = "--accent",
  autoColor = false,
  type = "area",
  valueFormatter = (v) => `${v}`,
  labelFormatter,
  seriesLabel = "Value",
  referenceY,
  xMode = "date",
}: SeriesChartProps) {
  const grid = cssVar("--chart-grid");
  const axis = cssVar("--chart-axis");

  let color = cssVar(colorVar);
  if (autoColor && data.length > 1) {
    const up = data[data.length - 1].value >= data[0].value;
    color = cssVar(up ? "--pos" : "--neg");
  }

  const gradId = `grad-${colorVar.replace(/[^a-z]/gi, "")}-${type}`;

  const xTick = (v: string) => {
    if (xMode === "raw") return v;
    if (labelFormatter) return labelFormatter(v);
    const d = new Date(v);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.24} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={xTick}
          stroke={axis}
          tick={{ fontSize: 11, fill: axis }}
          tickLine={false}
          axisLine={{ stroke: grid }}
          minTickGap={40}
        />
        <YAxis
          stroke={axis}
          tick={{ fontSize: 11, fill: axis }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={valueFormatter}
          domain={["auto", "auto"]}
        />
        <Tooltip
          cursor={{ stroke: axis, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className={styles.tip}>
                <div className={styles.tipDate}>
                  {xMode === "raw" ? (label as string) : xTick(label as string)}
                </div>
                <div className={styles.tipRow}>
                  <span className={styles.tipSwatch} style={{ background: color }} />
                  <span className={styles.tipLabel}>{seriesLabel}</span>
                  <span className={`${styles.tipVal} mono`}>
                    {valueFormatter(payload[0].value as number)}
                  </span>
                </div>
              </div>
            );
          }}
        />
        {referenceY !== undefined && (
          <ReferenceLine y={referenceY} stroke={grid} strokeWidth={1} />
        )}
        {type === "area" ? (
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
