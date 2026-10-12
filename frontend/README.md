# ArgosQuant — Frontend

Intelligent Stock Portfolio & Risk Analytics Platform.
**Bloomberg Terminal × Modern Quant Workstation × Premium Fintech** — dark,
terminal-first, amber-accented, data-dense.

This is the modern SPA front end. It is intentionally decoupled from the Java
backend (see `../PRD.md`): all data flows through a typed **service layer**
(`src/services/*`) backed by a deterministic mock today. When the backend lands,
only the service bodies change — component code stays the same.

## Stack

- **React 18 + TypeScript + Vite**
- **React Router** for routing
- **Recharts** for the performance chart; hand-built SVG for sparklines,
  donuts, and the risk gauge
- **Plain CSS + CSS custom properties** for the design-token system
  (`src/styles/tokens.css`), scoped per component via CSS Modules

## Commands

```bash
npm install      # first time (approve esbuild's install script if prompted)
npm run dev      # dev server at http://localhost:5173
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build
```

## Structure

```
src/
├── styles/        tokens.css (design system) + global.css (reset/base)
├── lib/           format.ts (₹ / % formatting) · scenario.ts (stress engine)
├── types/         domain models (mirrors com.argosquant.model)
├── data/          deterministic mock financial data (Indian equities)
├── services/      data-access boundary — portfolio / market / analytics / risk /
│                  scenario / ai / report services (swap bodies for the backend)
├── state/         AppContext — portfolio, timeframe, watchlist, transactions, settings
├── components/
│   ├── ui/        design-system primitives (Button, Table, MetricCard, Modal,
│   │              Drawer, Toast, Tooltip, Badge, Skeleton, Empty/Error states,
│   │              ChartContainer, Sparkline, RiskIndicator, StatusIndicator, …)
│   ├── charts/    PerformanceChart, SeriesChart, ColumnChart, DonutChart,
│   │              RiskGauge, Heatmap, BarList
│   ├── portfolio/ TransactionModal (buy/sell workflow)
│   └── layout/    AppShell, Sidebar, Header, Breadcrumbs, PageHeader, Popover, nav
└── pages/         Dashboard, Portfolio, Markets, Watchlist, StockDetail,
                   Analytics, Risk, Scenarios, Assistant, Reports, Settings
```

## Phase status — all phases complete ✅

- **Phase 1 — Foundation + Dashboard:** design system, component library,
  app shell, main dashboard.
- **Phase 2 — Portfolio + Markets:** holdings (search/sort/sector filter),
  buy/sell transaction modal with validation, transactions ledger, security
  detail pages (tabs + timeframe price chart), markets (indices/movers/status),
  watchlist (add/remove/sort).
- **Phase 3 — Quant Analytics + Stress Testing:** performance analytics
  (returns, monthly, distribution, rolling vol), risk analytics (gauge,
  drawdown, contribution, VaR), correlation heatmap, deterministic scenario
  builder with presets and before/after risk.
- **Phase 4 — AI + Reports + Settings:** constrained AI assistant (explains
  verified metrics only, mock responses), report generation + CSV export,
  settings (account / portfolio / market / appearance).
- **Phase 5 — Polish + Backend Readiness:** `src/services/*` data boundary,
  complete UI states, navigation audit (global search, breadcrumbs, stock
  routing), responsive layouts, vendor-split production build.

> Backend-readiness note: UI components never import mock data directly — they
> go through `src/services/*`, which return the existing `src/types` shapes.
> When the Java backend lands, only the service bodies change.
