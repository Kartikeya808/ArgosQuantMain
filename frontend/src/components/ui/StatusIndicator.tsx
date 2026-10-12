import styles from "./StatusIndicator.module.css";

type Status = "live" | "closed" | "warn" | "offline";

interface StatusIndicatorProps {
  status: Status;
  label: string;
  pulse?: boolean;
}

export function StatusIndicator({
  status,
  label,
  pulse = true,
}: StatusIndicatorProps) {
  return (
    <span className={`${styles.wrap} ${styles[status]}`}>
      <span className={`${styles.dot} ${pulse && status === "live" ? styles.pulse : ""}`} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
