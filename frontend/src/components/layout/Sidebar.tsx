import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { navSections } from "./nav";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className={styles.scrim} onClick={onMobileClose} />
      )}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
          mobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Icon name="trending-up" size={18} />
          </div>
          {!collapsed && (
            <div className={styles.wordmark}>
              <span className={styles.name}>ArgosQuant</span>
              <span className={styles.tagline}>Quant Workstation</span>
            </div>
          )}
          <button
            className={styles.collapseBtn}
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={15} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.heading} className={styles.section}>
              {!collapsed && (
                <span className={styles.sectionHeading}>{section.heading}</span>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ""}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.linkIcon}>
                    <Icon name={item.icon} size={17} />
                  </span>
                  {!collapsed && <span className={styles.linkLabel}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className={styles.footer}>
            <div className={styles.build}>
              <span className="eyebrow">Build</span>
              <span className="mono">v1.0 · Phases 1–5</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
