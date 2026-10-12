import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { allNavItems } from "./nav";
import styles from "./Breadcrumbs.module.css";

export function Breadcrumbs() {
  const { pathname } = useLocation();

  // Stock detail: ArgosQuant / Portfolio / <SYMBOL>
  const stockMatch = pathname.match(/^\/stock\/(.+)$/);
  if (stockMatch) {
    return (
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/" className={styles.crumb}>
          ArgosQuant
        </Link>
        <Icon name="chevron-right" size={13} className={styles.sep} />
        <Link to="/portfolio" className={styles.crumb}>
          Portfolio
        </Link>
        <Icon name="chevron-right" size={13} className={styles.sep} />
        <span className={styles.current}>{decodeURIComponent(stockMatch[1])}</span>
      </nav>
    );
  }

  const match = allNavItems.find(
    (n) => n.to === pathname || (n.to !== "/" && pathname.startsWith(n.to))
  );
  const current = pathname === "/" ? "Dashboard" : match?.label ?? "Dashboard";

  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      <Link to="/" className={styles.crumb}>
        ArgosQuant
      </Link>
      <Icon name="chevron-right" size={13} className={styles.sep} />
      <span className={styles.current}>{current}</span>
    </nav>
  );
}
