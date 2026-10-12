/* =====================================================================
   ArgosQuant — Core domain types (frontend)
   Mirrors the planned Java backend model (com.argosquant.model).
   Phase 1 establishes the shapes the dashboard consumes; later phases
   extend these. The service layer (Phase 5) will return exactly these.
   ===================================================================== */

export type AssetType = "EQUITY" | "ETF" | "INDEX";

export type Trend = "up" | "down" | "flat";

export type Direction = "pos" | "neg" | "neu";

/** A point in a time series (ISO date + value). */
export interface SeriesPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string; // ISO 4217, e.g. "INR"
  benchmark: string; // e.g. "NIFTY 50"
  createdAt: string;
}

export interface Stock {
  symbol: string;
  company: string;
  sector: string;
  assetType: AssetType;
}

/** Live-ish market snapshot for a symbol. */
export interface MarketPrice {
  symbol: string;
  ltp: number; // last traded price
  change: number; // absolute change on the day
  changePct: number; // percent change on the day
  spark: number[]; // intraday sparkline values
}

/** A position held in a portfolio, enriched with market data. */
export interface Holding {
  symbol: string;
  company: string;
  sector: string;
  quantity: number;
  avgPrice: number; // average cost
  ltp: number; // last traded price
  value: number; // quantity * ltp
  invested: number; // quantity * avgPrice
  pnl: number; // value - invested
  pnlPct: number;
  dayChangePct: number;
  weight: number; // % of portfolio value
  spark: number[];
}

/** Aggregate portfolio-level metrics (computed by analytics/ on backend). */
export interface PortfolioMetrics {
  value: number;
  invested: number;
  totalPnl: number;
  totalPnlPct: number;
  dayPnl: number;
  dayPnlPct: number;
  volatility: number; // annualized %
  sharpe: number;
  beta: number;
  maxDrawdown: number; // %
}

export type RiskBand = "LOW" | "MODERATE" | "ELEVATED" | "HIGH";

export interface RiskMetrics {
  score: number; // 0-100
  band: RiskBand;
  volatility: number;
  sharpe: number;
  beta: number;
  maxDrawdown: number;
  var95: number; // 1-day 95% VaR, as % of portfolio
  diversification: number; // 0-100
}

export interface AllocationSlice {
  label: string;
  value: number; // absolute value
  weight: number; // %
  colorVar: string; // css var name for the slice color
}

/** Portfolio performance vs benchmark over a window. */
export interface PerformanceSeries {
  portfolio: SeriesPoint[];
  benchmark: SeriesPoint[];
  benchmarkLabel: string;
}

export interface MarketStatus {
  state: "OPEN" | "CLOSED" | "PRE_OPEN" | "POST_CLOSE";
  label: string;
  detail: string; // e.g. "Closes 15:30 IST"
  lastUpdate: string; // display string
}

export type NotificationKind = "info" | "alert" | "success";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL";

/* =====================================================================
   Phase 2 — Portfolio, Markets, Watchlist, Stock Detail
   ===================================================================== */

export type TransactionType = "BUY" | "SELL";
export type TransactionStatus = "SETTLED" | "PENDING" | "FAILED";

export interface Transaction {
  id: string;
  date: string; // ISO
  symbol: string;
  company: string;
  type: TransactionType;
  quantity: number;
  price: number;
  value: number; // quantity * price
  fees: number;
  status: TransactionStatus;
  notes?: string;
}

/** A draft transaction coming out of the buy/sell modal (pre-persist). */
export interface TransactionDraft {
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
  fees: number;
  notes?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number; // absolute
  changePct: number;
  spark: number[];
}

/** A row in the market movers / most-active lists. */
export interface Mover {
  symbol: string;
  company: string;
  sector: string;
  ltp: number;
  change: number;
  changePct: number;
  volume: number;
  spark: number[];
}

export interface WatchlistItem {
  symbol: string;
  company: string;
  sector: string;
  ltp: number;
  change: number;
  changePct: number;
  volume: number;
  spark: number[];
}

/** Fundamentals + quote shown on a stock detail page. */
export interface StockQuote {
  symbol: string;
  company: string;
  sector: string;
  assetType: AssetType;
  ltp: number;
  change: number;
  changePct: number;
  open: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  high52: number;
  low52: number;
  volume: number;
  avgVolume: number;
  marketCap: number; // in INR
  pe: number;
  eps: number;
  dividendYield: number; // %
  beta: number;
}

/** Price history for a security, keyed by timeframe. */
export type PriceHistory = Partial<Record<Timeframe, SeriesPoint[]>>;

/* =====================================================================
   Phase 3 — Analytics, Risk, Correlation, Stress Testing
   ===================================================================== */

export interface PerformanceAnalytics {
  totalReturn: number; // %
  annualizedReturn: number; // %
  cagr: number; // %
  bestDay: { date: string; value: number };
  worstDay: { date: string; value: number };
  winningDays: number;
  losingDays: number;
  avgDailyReturn: number; // %
  positiveMonths: number;
  totalMonths: number;
}

export interface MonthlyReturn {
  month: string; // e.g. "Apr '25"
  value: number; // % return
}

/** A bucket in the daily-return histogram. */
export interface ReturnBucket {
  label: string; // e.g. "-2% to -1%"
  from: number;
  to: number;
  count: number;
  direction: Direction;
}

export interface RiskContribution {
  symbol: string;
  weight: number; // % of portfolio
  volatility: number; // standalone annualized %
  contribution: number; // % of total portfolio risk
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][]; // square, symbols x symbols, values in [-1, 1]
}

export type ScenarioType =
  | "STOCK"
  | "SECTOR"
  | "MARKET"
  | "ALLOCATION"
  | "HISTORICAL";

export interface ScenarioInput {
  type: ScenarioType;
  /** symbol (STOCK), sector name (SECTOR), or event id (HISTORICAL) */
  target?: string;
  shockPct: number; // e.g. -15
  label: string;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  input: ScenarioInput;
}

export interface ScenarioImpactRow {
  symbol: string;
  company: string;
  sector: string;
  weight: number;
  currentValue: number;
  shockPct: number;
  newValue: number;
  impact: number; // newValue - currentValue (negative = loss)
}

export interface ScenarioResult {
  input: ScenarioInput;
  currentValue: number;
  newValue: number;
  estimatedImpact: number; // absolute, signed
  impactPct: number; // % of portfolio
  rows: ScenarioImpactRow[];
  before: { volatility: number; var95: number; beta: number; riskScore: number };
  after: { volatility: number; var95: number; beta: number; riskScore: number };
}

/* =====================================================================
   Phase 4 — AI Assistant, Reports, Settings
   ===================================================================== */

export type AIRole = "user" | "assistant";

/** A verified metric block rendered beneath an assistant message. */
export interface AIMetric {
  label: string;
  value: string;
  direction?: Direction;
}

export interface AIMessage {
  id: string;
  role: AIRole;
  content: string;
  metrics?: AIMetric[];
  time: string;
}

export type ReportType =
  | "PERFORMANCE"
  | "RISK"
  | "TRANSACTIONS"
  | "SUMMARY";

export type ReportStatus = "READY" | "GENERATING" | "FAILED";

export interface Report {
  id: string;
  type: ReportType;
  name: string;
  period: string; // e.g. "Apr–Oct 2025"
  generatedAt: string; // display string
  status: ReportStatus;
  sizeKb: number;
}

export interface AppSettings {
  account: { name: string; email: string };
  portfolio: { defaultPortfolioId: string; baseCurrency: string; benchmark: string };
  marketData: { refreshSeconds: number; source: string; timezone: string };
  appearance: { darkMode: boolean; compact: boolean; chartStyle: "area" | "line" };
}
