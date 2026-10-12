import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "neutral" | "accent" | "pos" | "neg" | "info";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${styles[size]} ${className}`}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
