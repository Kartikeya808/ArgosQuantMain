import styles from "./Tabs.module.css";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  variant?: "underline" | "segmented";
}

export function Tabs({
  items,
  value,
  onChange,
  size = "md",
  variant = "underline",
}: TabsProps) {
  return (
    <div
      className={`${styles.tabs} ${styles[variant]} ${styles[size]}`}
      role="tablist"
    >
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={it.value === value}
          className={`${styles.tab} ${it.value === value ? styles.active : ""}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
