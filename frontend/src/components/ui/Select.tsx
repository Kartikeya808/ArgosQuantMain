import type { SelectHTMLAttributes } from "react";
import { Icon } from "./Icon";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  sizeVariant?: "sm" | "md";
}

export function Select({
  options,
  sizeVariant = "md",
  className = "",
  ...rest
}: SelectProps) {
  return (
    <div className={`${styles.wrap} ${styles[sizeVariant]} ${className}`}>
      <select className={styles.select} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={14} className={styles.chevron} />
    </div>
  );
}
