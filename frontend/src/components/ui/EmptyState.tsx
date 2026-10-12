import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./FeedbackState.module.css";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon = "portfolio",
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
      <div className={`${styles.iconCircle} ${styles.neutral}`}>
        <Icon name={icon} size={compact ? 20 : 26} />
      </div>
      <div className={styles.title}>{title}</div>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
