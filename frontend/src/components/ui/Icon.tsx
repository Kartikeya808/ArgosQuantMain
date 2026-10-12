/* =====================================================================
   Icon — single inline-SVG icon system (no external dependency).
   Stroke-based, 24x24 grid, inherits currentColor. Add new glyphs to
   the `paths` map; keeps the whole icon set in one auditable place.
   ===================================================================== */

import type { CSSProperties } from "react";

export type IconName =
  | "dashboard"
  | "portfolio"
  | "markets"
  | "watchlist"
  | "analytics"
  | "risk"
  | "scenario"
  | "assistant"
  | "reports"
  | "settings"
  | "search"
  | "bell"
  | "chevron-down"
  | "chevron-right"
  | "chevron-left"
  | "calendar"
  | "close"
  | "arrow-up"
  | "arrow-down"
  | "trending-up"
  | "alert"
  | "check"
  | "info"
  | "logout"
  | "menu"
  | "refresh"
  | "shield"
  | "plus"
  | "filter"
  | "download"
  | "trash"
  | "star"
  | "star-filled"
  | "send"
  | "sort"
  | "minus"
  | "grid"
  | "sliders"
  | "play"
  | "sparkles"
  | "lock"
  | "mail"
  | "user"
  | "eye";

const paths: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  portfolio: (
    <>
      <path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
      <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M3 12h18" />
    </>
  ),
  markets: (
    <>
      <path d="M3 17l5-5 4 3 6-7" />
      <path d="M16 8h5v5" />
    </>
  ),
  watchlist: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="12" y="7" width="3" height="10" />
      <rect x="17" y="13" width="3" height="4" />
    </>
  ),
  risk: (
    <>
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
      <path d="M12 8v4" />
      <path d="M12 15h.01" />
    </>
  ),
  scenario: (
    <>
      <path d="M3 12h4l3 7 4-14 3 7h4" />
    </>
  ),
  assistant: (
    <>
      <rect x="4" y="7" width="16" height="11" rx="2" />
      <path d="M12 7V4" />
      <circle cx="9" cy="12.5" r="1" />
      <circle cx="15" cy="12.5" r="1" />
      <path d="M4 12H2M22 12h-2" />
    </>
  ),
  reports: (
    <>
      <path d="M6 2h8l4 4v16H6Z" />
      <path d="M14 2v4h4" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  close: <path d="M18 6L6 18M6 6l12 12" />,
  "arrow-up": <path d="M12 19V5M5 12l7-7 7 7" />,
  "arrow-down": <path d="M12 5v14M5 12l7 7 7-7" />,
  "trending-up": (
    <>
      <path d="M3 17l6-6 4 4 7-8" />
      <path d="M17 7h4v4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l9 16H3L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v5h-5" />
    </>
  ),
  shield: (
    <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />,
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  star: (
    <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.1 21l1.1-6.5L2.5 9.8l6.5-.9L12 3Z" />
  ),
  "star-filled": (
    <path
      d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.1 21l1.1-6.5L2.5 9.8l6.5-.9L12 3Z"
      fill="currentColor"
    />
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7Z" />
    </>
  ),
  sort: (
    <>
      <path d="M8 4v16M8 20l-3-3M8 4l3 3" />
      <path d="M16 20V4M16 4l3 3M16 20l-3-3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </>
  ),
  play: <path d="M6 4l14 8-14 8V4Z" />,
  sparkles: (
    <>
      <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16l-1.8-4.5L5 9.7l5.2-1.8L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 18,
  className,
  style,
  strokeWidth = 1.75,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
