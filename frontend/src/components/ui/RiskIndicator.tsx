import type { RiskBand } from "@/types";
import styles from "./RiskIndicator.module.css";

interface RiskIndicatorProps {
  band: RiskBand;
  score?: number;
  showBar?: boolean;
  size?: "sm" | "md";
}

const bandMeta: Record<RiskBand, { label: string; cls: string }> = {
  LOW: { label: "Low", cls: "low" },
  MODERATE: { label: "Moderate", cls: "moderate" },
  ELEVATED: { label: "Elevated", cls: "elevated" },
  HIGH: { label: "High", cls: "high" },
};

export function RiskIndicator({
  band,
  score,
  showBar = true,
  size = "md",
}: RiskIndicatorProps) {
  const meta = bandMeta[band];
  return (
    <span className={`${styles.wrap} ${styles[size]}`}>
      <span className={`${styles.chip} ${styles[meta.cls]}`}>
        <span className={styles.chipDot} />
        {meta.label}
        {score !== undefined && <span className={styles.score}>{score}</span>}
      </span>
      {showBar && (
        <span className={styles.bar}>
          <span className={`${styles.seg} ${styles.low}`} data-on={band === "LOW" || band === "MODERATE" || band === "ELEVATED" || band === "HIGH"} />
          <span className={`${styles.seg} ${styles.moderate}`} data-on={band === "MODERATE" || band === "ELEVATED" || band === "HIGH"} />
          <span className={`${styles.seg} ${styles.elevated}`} data-on={band === "ELEVATED" || band === "HIGH"} />
          <span className={`${styles.seg} ${styles.high}`} data-on={band === "HIGH"} />
        </span>
      )}
    </span>
  );
}
