import { Icon } from "./Icon";
import { Button } from "./Button";
import styles from "./FeedbackState.module.css";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  title = "Unable to load data",
  description = "Something went wrong while fetching this view. This is mock data in Phase 1 — the backend service layer arrives in Phase 5.",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
      <div className={`${styles.iconCircle} ${styles.danger}`}>
        <Icon name="alert" size={compact ? 20 : 26} />
      </div>
      <div className={styles.title}>{title}</div>
      <p className={styles.desc}>{description}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
