import { useState } from "react";
import type { AllocationSlice } from "@/types";
import { formatPct } from "@/lib/format";
import styles from "./DonutChart.module.css";

interface DonutChartProps {
  data: AllocationSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 168,
  thickness = 20,
  centerLabel = "Holdings",
  centerValue,
}: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.weight, 0) || 100;

  let offset = 0;
  const segments = data.map((d, i) => {
    const frac = d.weight / total;
    const len = frac * circumference;
    const seg = {
      slice: d,
      index: i,
      dash: `${len} ${circumference - len}`,
      dashoffset: -offset,
    };
    offset += len;
    return seg;
  });

  const activeSlice = active !== null ? data[active] : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.chart} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((s) => (
              <circle
                key={s.index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`var(${s.slice.colorVar})`}
                strokeWidth={active === s.index ? thickness + 3 : thickness}
                strokeDasharray={s.dash}
                strokeDashoffset={s.dashoffset}
                className={styles.seg}
                opacity={active === null || active === s.index ? 1 : 0.35}
                onMouseEnter={() => setActive(s.index)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className={styles.center}>
          <span className={styles.centerLabel}>
            {activeSlice ? activeSlice.label : centerLabel}
          </span>
          <span className={`${styles.centerValue} mono`}>
            {activeSlice
              ? formatPct(activeSlice.weight, { signed: false, decimals: 1 })
              : centerValue ?? data.length}
          </span>
        </div>
      </div>

      <ul className={styles.legend}>
        {data.map((d, i) => (
          <li
            key={d.label}
            className={styles.legendItem}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            data-active={active === i}
          >
            <span
              className={styles.swatch}
              style={{ background: `var(${d.colorVar})` }}
            />
            <span className={styles.legendLabel}>{d.label}</span>
            <span className={`${styles.legendVal} mono`}>
              {formatPct(d.weight, { signed: false, decimals: 1 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
