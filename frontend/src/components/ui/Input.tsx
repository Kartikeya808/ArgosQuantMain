import type { InputHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
  invalid?: boolean;
  sizeVariant?: "sm" | "md";
}

export function Input({
  icon,
  invalid,
  sizeVariant = "md",
  className = "",
  ...rest
}: InputProps) {
  return (
    <div
      className={`${styles.wrap} ${styles[sizeVariant]} ${
        invalid ? styles.invalid : ""
      } ${className}`}
    >
      {icon && <Icon name={icon} size={15} className={styles.icon} />}
      <input className={styles.input} {...rest} />
    </div>
  );
}
