import type { RiskBand } from "@/types";
import styles from "./RiskGauge.module.css";

interface RiskGaugeProps {
  score: number; // 0-100
  band: RiskBand;
  size?: number;
}

const bandColor: Record<RiskBand, string> = {
  LOW: "--risk-low",
  MODERATE: "--risk-moderate",
  ELEVATED: "--risk-elevated",
  HIGH: "--risk-high",
};

const bandLabel: Record<RiskBand, string> = {
  LOW: "Low Risk",
  MODERATE: "Moderate Risk",
  ELEVATED: "Elevated Risk",
  HIGH: "High Risk",
};

export function RiskGauge({ score, band, size = 200 }: RiskGaugeProps) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // semicircle: 180deg sweep from left (180) to right (360/0)
  const circumference = Math.PI * r; // half circle
  const clamped = Math.max(0, Math.min(100, score));
  const filled = (clamped / 100) * circumference;

  const color = `var(${bandColor[band]})`;

  return (
    <div className={styles.wrap} style={{ width: size }}>
      <svg
        width={size}
        height={size / 2 + stroke}
        viewBox={`0 0 ${size} ${size / 2 + stroke}`}
      >
        {/* track */}
        <path
          d={describeArc(cx, cy, r)}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* value */}
        <path
          d={describeArc(cx, cy, r)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className={styles.value}
        />
      </svg>
      <div className={styles.readout}>
        <span className={`${styles.score} mono`} style={{ color }}>
          {Math.round(clamped)}
        </span>
        <span className={styles.scale}>/ 100</span>
        <span className={styles.band} style={{ color }}>
          {bandLabel[band]}
        </span>
      </div>
    </div>
  );
}

/** Semicircle arc from left to right across the top. */
function describeArc(cx: number, cy: number, r: number): string {
  const startX = cx - r;
  const endX = cx + r;
  return `M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`;
}
