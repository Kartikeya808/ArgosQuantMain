/* =====================================================================
   Session store — the live bridge between the React UI and the Java
   backend.

   The page components read the data services (portfolioService, …)
   synchronously during render. To keep that contract while serving real
   backend data, we hydrate this module-level store *before* the app's
   routed pages mount (the AppProvider gates on it), then the services
   read from here. When the store is empty (not logged in / not yet
   hydrated) the services fall back to their mock data.

   Backend DTO shapes are mirrored below and adapted to the frontend
   `src/types` shapes. Fields the backend doesn't expose yet (intraday
   sparklines, day-change, benchmark series) are filled with safe
   defaults so the existing components render unchanged.
   ===================================================================== */

import { api, getToken, setToken } from "@/lib/apiClient";
import type {
  AllocationSlice,
  CorrelationMatrix,
  Holding,
  Portfolio,
  PortfolioMetrics,
  RiskBand,
  RiskContribution,
  RiskMetrics,
  Transaction,
  User,
} from "@/types";

/* ---------------------------- backend DTOs ---------------------------- */

interface AuthResult {
  token: string;
  expiresInSeconds: number;
  userId: number;
  email: string;
  displayName: string;
}

interface ApiPortfolio {
  id: number;
  userId: number;
  name: string;
  baseCurrency: string;
  createdAt: string;
}

interface ApiDashboardHolding {
  symbol: string;
  name: string;
  sector: string | null;
  assetType: "EQUITY" | "ETF" | null;
  quantity: number;
  avgCost: number;
  costBasis: number;
  currentPrice: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number;
  weight: number;
}

interface ApiDashboard {
  portfolioId: number;
  name: string;
  baseCurrency: string;
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPct: number;
  positions: number;
  holdings: ApiDashboardHolding[];
}

interface ApiTransactionView {
  id: number;
  symbol: string;
  name: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  value: number;
  executedAt: string;
}

interface ApiRiskReport {
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  historicalVar95: number;
  parametricVar95: number;
  maxDrawdown: number;
  beta: number;
}

interface ApiHoldingRisk {
  symbol: string;
  weight: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  beta: number;
}

interface ApiAnalytics {
  portfolioId: number;
  positions: number;
  risk: ApiRiskReport | null;
  score: { score: number; rating: string; rationale: string } | null;
  benchmarkSymbol: string;
  benchmarkAnnualizedReturn: number;
  excessReturn: number;
  holdings: ApiHoldingRisk[];
  correlationSymbols: string[];
  correlationMatrix: number[][];
}

/* ------------------------------- store -------------------------------- */

interface LiveState {
  user: User;
  portfolios: Portfolio[];
  activePortfolioId: string;
  dashboard: ApiDashboard | null;
  analytics: ApiAnalytics | null;
  transactions: Transaction[];
}

let state: LiveState | null = null;

/** True once the user is authenticated and the active portfolio is hydrated. */
export function isLive(): boolean {
  return state !== null && state.dashboard !== null;
}

export function currentState(): LiveState | null {
  return state;
}

/* --------------------------- auth + hydrate --------------------------- */

const CHART_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

const USER_KEY = "argos.user";

function applyAuth(result: AuthResult): void {
  setToken(result.token);
  const user: User = {
    id: String(result.userId),
    name: result.displayName,
    email: result.email,
    initials: initials(result.displayName).toUpperCase() || "U",
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  state = {
    user,
    portfolios: [],
    activePortfolioId: "",
    dashboard: null,
    analytics: null,
    transactions: [],
  };
}

/**
 * Re-establish a session from a persisted token after a page reload.
 * Returns false (and clears any stale token) if there's no valid session.
 */
export async function restore(): Promise<boolean> {
  const token = getToken();
  const raw =
    typeof localStorage !== "undefined" ? localStorage.getItem(USER_KEY) : null;
  if (!token || !raw) return false;
  try {
    const user = JSON.parse(raw) as User;
    state = {
      user,
      portfolios: [],
      activePortfolioId: "",
      dashboard: null,
      analytics: null,
      transactions: [],
    };
    await bootstrap();
    return true;
  } catch {
    logout();
    return false;
  }
}

export async function login(email: string, password: string): Promise<void> {
  const result = await api.post<AuthResult>("/auth/login", { email, password });
  applyAuth(result);
  await bootstrap();
}

export async function register(
  displayName: string,
  email: string,
  password: string,
): Promise<void> {
  const result = await api.post<AuthResult>("/auth/register", {
    displayName,
    email,
    password,
  });
  applyAuth(result);
  await bootstrap();
}

export function logout(): void {
  setToken(null);
  if (typeof localStorage !== "undefined") localStorage.removeItem(USER_KEY);
  state = null;
}

export function getUser(): User | null {
  return state?.user ?? null;
}

export function getPortfolios(): Portfolio[] {
  return state?.portfolios ?? [];
}

export function getActivePortfolioId(): string {
  return state?.activePortfolioId ?? "";
}

/** Load portfolios; create an empty starter one if the user has none yet. */
async function bootstrap(): Promise<void> {
  if (!state) return;
  let apiPortfolios = await api.get<ApiPortfolio[]>("/portfolios");
  if (apiPortfolios.length === 0) {
    await createEmptyPortfolio();
    apiPortfolios = await api.get<ApiPortfolio[]>("/portfolios");
  }
  state.portfolios = apiPortfolios.map(adaptPortfolio);
  state.activePortfolioId = state.portfolios[0]?.id ?? "";
  await hydrate();
}

/**
 * Give a brand-new user a single empty portfolio to build into — no seeded
 * holdings. They record their own trades through the New Transaction modal,
 * which hit the real backend and are valued at live market quotes.
 */
async function createEmptyPortfolio(): Promise<void> {
  await api.post<ApiPortfolio>("/portfolios", {
    name: "My Portfolio",
    baseCurrency: "INR",
  });
}

/** Refresh the active portfolio's dashboard, analytics and transactions. */
export async function hydrate(): Promise<void> {
  if (!state || !state.activePortfolioId) return;
  const id = state.activePortfolioId;
  const [dashboard, transactions, analytics] = await Promise.all([
    api.get<ApiDashboard>(`/portfolios/${id}/dashboard`),
    api.get<ApiTransactionView[]>(`/portfolios/${id}/transactions`),
    api
      .get<ApiAnalytics>(`/portfolios/${id}/analytics`)
      .catch(() => null), // analytics needs price history; tolerate failure
  ]);
  state.dashboard = dashboard;
  state.analytics = analytics;
  state.transactions = transactions.map(adaptTransaction);
}

export async function setActivePortfolio(id: string): Promise<void> {
  if (!state) return;
  state.activePortfolioId = id;
  await hydrate();
}

/** Execute a buy/sell against the backend, then refresh the store. */
export async function executeTrade(
  portfolioId: string,
  side: "BUY" | "SELL",
  symbol: string,
  quantity: number,
  price: number,
): Promise<void> {
  await api.post(`/portfolios/${portfolioId}/transactions`, {
    side,
    symbol,
    quantity,
    price,
  });
  await hydrate();
}

/* ------------------------------ adapters ------------------------------ */

function adaptPortfolio(p: ApiPortfolio): Portfolio {
  return {
    id: String(p.id),
    name: p.name,
    baseCurrency: p.baseCurrency,
    benchmark: "NIFTY 50",
    createdAt: p.createdAt,
  };
}

function adaptTransaction(t: ApiTransactionView): Transaction {
  return {
    id: String(t.id),
    date: t.executedAt,
    symbol: t.symbol,
    company: t.name,
    type: t.side,
    quantity: t.quantity,
    price: t.price,
    value: t.value,
    fees: 0,
    status: "SETTLED",
  };
}

function adaptHolding(h: ApiDashboardHolding): Holding {
  const value = h.marketValue ?? 0;
  const invested = h.costBasis ?? 0;
  const pnl = h.unrealizedPnl ?? 0;
  return {
    symbol: h.symbol,
    company: h.name,
    sector: h.sector ?? "—",
    quantity: h.quantity,
    avgPrice: h.avgCost,
    ltp: h.currentPrice ?? 0,
    value,
    invested,
    pnl,
    pnlPct: h.unrealizedPnlPct * 100,
    dayChangePct: 0,
    weight: h.weight * 100,
    spark: [],
  };
}

export function liveHoldings(): Holding[] {
  return state?.dashboard?.holdings.map(adaptHolding) ?? [];
}

export function liveTransactions(): Transaction[] {
  return state?.transactions ?? [];
}

export function liveMetrics(): PortfolioMetrics {
  const d = state?.dashboard;
  const r = state?.analytics?.risk ?? null;
  return {
    value: d?.totalValue ?? 0,
    invested: d?.totalCost ?? 0,
    totalPnl: d?.totalPnl ?? 0,
    totalPnlPct: (d?.totalPnlPct ?? 0) * 100,
    dayPnl: 0,
    dayPnlPct: 0,
    volatility: r ? r.annualizedVolatility * 100 : 0,
    sharpe: r?.sharpeRatio ?? 0,
    beta: r?.beta ?? 0,
    maxDrawdown: r ? r.maxDrawdown * 100 : 0,
  };
}

function mapBand(rating: string | undefined): RiskBand {
  switch (rating) {
    case "LOW":
      return "LOW";
    case "MODERATE":
      return "MODERATE";
    case "HIGH":
      return "ELEVATED";
    case "VERY_HIGH":
      return "HIGH";
    default:
      return "MODERATE";
  }
}

function diversification(matrix: number[][] | undefined): number {
  if (!matrix || matrix.length < 2) return 50;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix.length; j++) {
      sum += Math.abs(matrix[i][j]);
      count++;
    }
  }
  if (count === 0) return 50;
  const avg = sum / count;
  return Math.round(Math.max(0, Math.min(1, 1 - avg)) * 100);
}

export function liveRiskMetrics(): RiskMetrics {
  const a = state?.analytics;
  const r = a?.risk ?? null;
  return {
    score: a?.score?.score ?? 0,
    band: mapBand(a?.score?.rating),
    volatility: r ? r.annualizedVolatility * 100 : 0,
    sharpe: r?.sharpeRatio ?? 0,
    beta: r?.beta ?? 0,
    maxDrawdown: r ? r.maxDrawdown * 100 : 0,
    var95: r ? r.historicalVar95 * 100 : 0,
    diversification: diversification(a?.correlationMatrix),
  };
}

export function liveRiskContributions(): RiskContribution[] {
  return (
    state?.analytics?.holdings.map((h) => ({
      symbol: h.symbol,
      weight: h.weight * 100,
      volatility: h.annualizedVolatility * 100,
      contribution: h.weight * 100,
    })) ?? []
  );
}

export function liveCorrelationMatrix(): CorrelationMatrix | null {
  const a = state?.analytics;
  if (!a || a.correlationSymbols.length === 0) return null;
  return { symbols: a.correlationSymbols, matrix: a.correlationMatrix };
}

function allocation(by: (h: ApiDashboardHolding) => string): AllocationSlice[] {
  const d = state?.dashboard;
  if (!d) return [];
  const groups = new Map<string, number>();
  for (const h of d.holdings) {
    const key = by(h);
    groups.set(key, (groups.get(key) ?? 0) + (h.marketValue ?? 0));
  }
  const total = [...groups.values()].reduce((s, v) => s + v, 0) || 1;
  return [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      weight: (value / total) * 100,
      colorVar: CHART_VARS[i % CHART_VARS.length],
    }));
}

export function liveStockAllocation(): AllocationSlice[] {
  return allocation((h) => h.symbol);
}

export function liveSectorAllocation(): AllocationSlice[] {
  return allocation((h) => h.sector ?? "Other");
}
