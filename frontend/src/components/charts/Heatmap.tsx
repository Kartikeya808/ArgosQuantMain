/* =====================================================================
   Correlation heatmap — hand-built CSS grid, no chart dependency. Cells
   are colour-scaled from the accent (high +corr) through neutral to a
   cool tone (low/negative corr). Hovering a cell highlights its pair.
   ===================================================================== */

import { Fragment, useState } from "react";
import type { CorrelationMatrix } from "@/types";
import styles from "./Heatmap.module.css";

interface HeatmapProps {
  data: CorrelationMatrix;
  onSelect?: (a: string, b: string, value: number) => void;
}

/** Map a correlation value in [-1,1] to a background colour. */
function cellColor(v: number): string {
  if (v >= 0) {
    // 0 → transparent-ish neutral, 1 → strong amber
    const alpha = 0.12 + v * 0.62;
    return `rgba(245, 166, 35, ${alpha.toFixed(2)})`;
  }
  const alpha = 0.12 + Math.abs(v) * 0.5;
  return `rgba(74, 159, 224, ${alpha.toFixed(2)})`;
}

export function Heatmap({ data, onSelect }: HeatmapProps) {
  const { symbols, matrix } = data;
  const [hover, setHover] = useState<[number, number] | null>(null);

  return (
    <div className={styles.scroll}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `72px repeat(${symbols.length}, 1fr)` }}
      >
        <div className={styles.corner} />
        {symbols.map((s, j) => (
          <div
            key={`h-${s}`}
            className={`${styles.colHead} ${hover?.[1] === j ? styles.headActive : ""}`}
          >
            {s}
          </div>
        ))}

        {symbols.map((rowSym, i) => (
          <Fragment key={`row-${rowSym}`}>
            <div className={`${styles.rowHead} ${hover?.[0] === i ? styles.headActive : ""}`}>
              {rowSym}
            </div>
            {matrix[i].map((v, j) => (
              <button
                key={`c-${i}-${j}`}
                className={`${styles.cell} mono ${i === j ? styles.diag : ""} ${
                  hover && (hover[0] === i || hover[1] === j) ? styles.cellActive : ""
                }`}
                style={{ background: i === j ? "var(--bg-3)" : cellColor(v) }}
                onMouseEnter={() => setHover([i, j])}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(symbols[i], symbols[j], v)}
                title={`${rowSym} · ${symbols[j]}: ${v.toFixed(2)}`}
              >
                {v.toFixed(2)}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
