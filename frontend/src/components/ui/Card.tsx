import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  as?: "div" | "section";
}

export function Card({
  children,
  className = "",
  padded = true,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag className={`${styles.card} ${padded ? styles.padded : ""} ${className}`}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}

export function CardHeader({ title, subtitle, actions, eyebrow }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headingGroup}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
