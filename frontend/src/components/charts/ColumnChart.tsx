/* =====================================================================
   ColumnChart — categorical vertical bars with per-bar directional
   colouring (pos/neg/neu). Used for monthly returns and the daily-return
   distribution histogram.
   ===================================================================== */

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Direction } from "@/types";
import styles from "./PerformanceChart.module.css";

function cssVar(name: string): string {
  if (typeof window === "undefined") return "#f5a623";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export interface ColumnDatum {
  label: string;
  value: number;
  direction?: Direction;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  height?: number;
  valueFormatter?: (v: number) => string;
  /** colour bars by sign of value when directions aren't supplied. */
  colorBySign?: boolean;
  referenceY?: number;
  seriesLabel?: string;
}

export function ColumnChart({
  data,
  height = 240,
  valueFormatter = (v) => `${v}`,
  colorBySign = true,
  referenceY = 0,
  seriesLabel = "Value",
}: ColumnChartProps) {
  const grid = cssVar("--chart-grid");
  const axis = cssVar("--chart-axis");
  const pos = cssVar("--pos");
  const neg = cssVar("--neg");
  const neu = cssVar("--chart-2");

  const colorOf = (d: ColumnDatum) => {
    const dir = d.direction ?? (colorBySign ? (d.value >= 0 ? "pos" : "neg") : "neu");
    return dir === "pos" ? pos : dir === "neg" ? neg : neu;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={axis}
          tick={{ fontSize: 11, fill: axis }}
          tickLine={false}
          axisLine={{ stroke: grid }}
          interval={0}
        />
        <YAxis
          stroke={axis}
          tick={{ fontSize: 11, fill: axis }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className={styles.tip}>
                <div className={styles.tipDate}>{label as string}</div>
                <div className={styles.tipRow}>
                  <span
                    className={styles.tipSwatch}
                    style={{ background: colorOf(payload[0].payload as ColumnDatum) }}
                  />
                  <span className={styles.tipLabel}>{seriesLabel}</span>
                  <span className={`${styles.tipVal} mono`}>
                    {valueFormatter(payload[0].value as number)}
                  </span>
                </div>
              </div>
            );
          }}
        />
        <ReferenceLine y={referenceY} stroke={grid} />
        <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={44}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorOf(d)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
