import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Sparkline } from "./Sparkline";
import { Tooltip } from "./Tooltip";
import { Skeleton } from "./Skeleton";
import styles from "./MetricCard.module.css";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  /** secondary line, e.g. delta */
  delta?: ReactNode;
  deltaDirection?: "pos" | "neg" | "neu";
  icon?: IconName;
  hint?: string;
  spark?: number[];
  sparkColor?: "auto" | string;
  loading?: boolean;
  accent?: boolean;
}

export function MetricCard({
  label,
  value,
  delta,
  deltaDirection = "neu",
  icon,
  hint,
  spark,
  sparkColor = "auto",
  loading = false,
  accent = false,
}: MetricCardProps) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ""}`}>
      <div className={styles.top}>
        <span className={styles.label}>
          {label}
          {hint && (
            <Tooltip content={hint}>
              <Icon name="info" size={12} className={styles.hintIcon} />
            </Tooltip>
          )}
        </span>
        {icon && (
          <span className={styles.iconBox}>
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton width="60%" height={24} style={{ margin: "var(--sp-3) 0" }} />
      ) : (
        <div className={`${styles.value} mono`}>{value}</div>
      )}

      <div className={styles.bottom}>
        {!loading && delta !== undefined && (
          <span className={`${styles.delta} ${styles[deltaDirection]}`}>
            {deltaDirection !== "neu" && (
              <Icon
                name={deltaDirection === "pos" ? "arrow-up" : "arrow-down"}
                size={12}
              />
            )}
            <span className="mono">{delta}</span>
          </span>
        )}
        {spark && !loading && (
          <span className={styles.spark}>
            <Sparkline data={spark} color={sparkColor} width={84} height={26} />
          </span>
        )}
      </div>
    </div>
  );
}
