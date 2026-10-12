import type { ReactNode } from "react";
import { Card, CardHeader } from "./Card";
import { Skeleton } from "./Skeleton";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import styles from "./ChartContainer.module.css";

type ChartState = "ready" | "loading" | "error" | "empty";

interface ChartContainerProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  legend?: ReactNode;
  height?: number;
  state?: ChartState;
  onRetry?: () => void;
  children: ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  eyebrow,
  actions,
  legend,
  height = 280,
  state = "ready",
  onRetry,
  children,
}: ChartContainerProps) {
  return (
    <Card>
      <CardHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
      {legend && <div className={styles.legend}>{legend}</div>}
      <div className={styles.body} style={{ minHeight: height }}>
        {state === "loading" && (
          <div className={styles.loading} style={{ height }}>
            <Skeleton height="100%" radius="var(--radius-sm)" />
          </div>
        )}
        {state === "error" && <ErrorState compact onRetry={onRetry} />}
        {state === "empty" && (
          <EmptyState
            compact
            icon="analytics"
            title="No data for this range"
            description="Try a different timeframe or portfolio."
          />
        )}
        {state === "ready" && children}
      </div>
    </Card>
  );
}

interface LegendItemProps {
  colorVar: string;
  label: string;
  value?: string;
  dashed?: boolean;
}

export function LegendItem({ colorVar, label, value, dashed }: LegendItemProps) {
  return (
    <span className={styles.legendItem}>
      <span
        className={styles.swatch}
        style={{
          background: dashed ? "transparent" : `var(${colorVar})`,
          borderTop: dashed ? `2px dashed var(${colorVar})` : "none",
        }}
      />
      <span className={styles.legendLabel}>{label}</span>
      {value && <span className={styles.legendValue}>{value}</span>}
    </span>
  );
}
