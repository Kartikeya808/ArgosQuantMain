import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Phase this route is fully built in — Phase 1 ships the shell + dashboard. */
  phase: number;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    heading: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: "dashboard", phase: 1 }],
  },
  {
    heading: "Manage",
    items: [
      { to: "/portfolio", label: "Portfolio", icon: "portfolio", phase: 2 },
      { to: "/markets", label: "Markets", icon: "markets", phase: 2 },
      { to: "/watchlist", label: "Watchlist", icon: "watchlist", phase: 2 },
    ],
  },
  {
    heading: "Quant",
    items: [
      { to: "/analytics", label: "Analytics", icon: "analytics", phase: 3 },
      { to: "/risk", label: "Risk", icon: "risk", phase: 3 },
      { to: "/scenarios", label: "Stress Testing", icon: "scenario", phase: 3 },
    ],
  },
  {
    heading: "More",
    items: [
      { to: "/assistant", label: "AI Assistant", icon: "assistant", phase: 4 },
      { to: "/reports", label: "Reports", icon: "reports", phase: 4 },
      { to: "/settings", label: "Settings", icon: "settings", phase: 4 },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);
