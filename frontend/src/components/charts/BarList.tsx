import styles from "./BarList.module.css";

export interface BarItem {
  label: string;
  value: number; // raw value for display
  pct: number; // 0-100 bar fill
  colorVar?: string;
  valueLabel?: string;
}

interface BarListProps {
  items: BarItem[];
}

export function BarList({ items }: BarListProps) {
  const max = Math.max(...items.map((i) => i.pct), 1);
  return (
    <ul className={styles.list}>
      {items.map((it) => (
        <li key={it.label} className={styles.row}>
          <div className={styles.meta}>
            <span className={styles.label}>{it.label}</span>
            <span className={`${styles.value} mono`}>
              {it.valueLabel ?? `${it.pct.toFixed(1)}%`}
            </span>
          </div>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{
                width: `${(it.pct / max) * 100}%`,
                background: it.colorVar ? `var(${it.colorVar})` : "var(--accent)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
