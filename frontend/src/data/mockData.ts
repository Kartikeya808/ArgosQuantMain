/* =====================================================================
   Realistic mock financial data — ArgosQuant (Phase 1)
   Indian equities, INR. Deterministic so the dashboard renders
   identically on every load. The Phase 5 service layer will swap this
   out for live backend data returning the same shapes.
   ===================================================================== */

import type {
  AIMessage,
  AllocationSlice,
  AppNotification,
  AppSettings,
  CorrelationMatrix,
  Holding,
  MarketIndex,
  MarketStatus,
  MonthlyReturn,
  Mover,
  PerformanceAnalytics,
  PerformanceSeries,
  Portfolio,
  PortfolioMetrics,
  PriceHistory,
  Report,
  ReturnBucket,
  RiskContribution,
  RiskMetrics,
  ScenarioPreset,
  SeriesPoint,
  StockQuote,
  Transaction,
  User,
  WatchlistItem,
} from "@/types";

export const currentUser: User = {
  id: "u-001",
  name: "Kartikeya Singh",
  email: "kartikeyasingh8jul2005@gmail.com",
  initials: "KS",
};

export const portfolios: Portfolio[] = [
  {
    id: "pf-core",
    name: "Core Equity",
    baseCurrency: "INR",
    benchmark: "NIFTY 50",
    createdAt: "2024-04-01",
  },
  {
    id: "pf-growth",
    name: "Growth Satellite",
    baseCurrency: "INR",
    benchmark: "NIFTY 50",
    createdAt: "2024-09-12",
  },
  {
    id: "pf-dividend",
    name: "Dividend Income",
    baseCurrency: "INR",
    benchmark: "NIFTY 50",
    createdAt: "2025-01-20",
  },
];

/* ---- deterministic pseudo-random spark generator ---- */
function spark(seed: number, base: number, vol: number, n = 24): number[] {
  const out: number[] = [];
  let v = base;
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = v * (1 + r * vol);
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

interface RawHolding {
  symbol: string;
  company: string;
  sector: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  dayChangePct: number;
  seed: number;
}

const raw: RawHolding[] = [
  { symbol: "TCS", company: "Tata Consultancy Services", sector: "IT", quantity: 60, avgPrice: 3420.0, ltp: 4012.5, dayChangePct: 1.24, seed: 11 },
  { symbol: "INFY", company: "Infosys", sector: "IT", quantity: 110, avgPrice: 1385.0, ltp: 1564.2, dayChangePct: 0.86, seed: 23 },
  { symbol: "RELIANCE", company: "Reliance Industries", sector: "Energy", quantity: 45, avgPrice: 2510.0, ltp: 2398.75, dayChangePct: -0.92, seed: 37 },
  { symbol: "HDFCBANK", company: "HDFC Bank", sector: "Financials", quantity: 80, avgPrice: 1498.0, ltp: 1702.35, dayChangePct: 0.41, seed: 42 },
  { symbol: "ICICIBANK", company: "ICICI Bank", sector: "Financials", quantity: 95, avgPrice: 982.0, ltp: 1188.6, dayChangePct: 1.52, seed: 58 },
  { symbol: "ITC", company: "ITC", sector: "FMCG", quantity: 200, avgPrice: 410.0, ltp: 448.9, dayChangePct: -0.31, seed: 64 },
  { symbol: "LT", company: "Larsen & Toubro", sector: "Industrials", quantity: 30, avgPrice: 3105.0, ltp: 3588.2, dayChangePct: 0.74, seed: 73 },
  { symbol: "SUNPHARMA", company: "Sun Pharmaceutical", sector: "Healthcare", quantity: 70, avgPrice: 1210.0, ltp: 1452.15, dayChangePct: -1.18, seed: 88 },
  { symbol: "MARUTI", company: "Maruti Suzuki", sector: "Auto", quantity: 8, avgPrice: 10450.0, ltp: 11820.0, dayChangePct: 0.63, seed: 95 },
  { symbol: "BHARTIARTL", company: "Bharti Airtel", sector: "Telecom", quantity: 85, avgPrice: 905.0, ltp: 1164.3, dayChangePct: 2.07, seed: 101 },
];

function buildHoldings(): Holding[] {
  const enriched = raw.map((r) => {
    const value = r.quantity * r.ltp;
    const invested = r.quantity * r.avgPrice;
    const pnl = value - invested;
    const pnlPct = (pnl / invested) * 100;
    return {
      ...r,
      value,
      invested,
      pnl,
      pnlPct,
      spark: spark(r.seed, r.ltp, 0.012),
    };
  });
  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  return enriched.map((h) => ({
    symbol: h.symbol,
    company: h.company,
    sector: h.sector,
    quantity: h.quantity,
    avgPrice: h.avgPrice,
    ltp: h.ltp,
    value: h.value,
    invested: h.invested,
    pnl: h.pnl,
    pnlPct: h.pnlPct,
    dayChangePct: h.dayChangePct,
    weight: (h.value / totalValue) * 100,
    spark: h.spark,
  }));
}

export const holdings: Holding[] = buildHoldings();

const totalValue = holdings.reduce((s, h) => s + h.value, 0);
const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
const totalPnl = totalValue - totalInvested;
const dayPnl = holdings.reduce(
  (s, h) => s + h.value * (h.dayChangePct / 100),
  0
);

export const portfolioMetrics: PortfolioMetrics = {
  value: totalValue,
  invested: totalInvested,
  totalPnl,
  totalPnlPct: (totalPnl / totalInvested) * 100,
  dayPnl,
  dayPnlPct: (dayPnl / (totalValue - dayPnl)) * 100,
  volatility: 16.4,
  sharpe: 1.21,
  beta: 0.94,
  maxDrawdown: -12.8,
};

export const riskMetrics: RiskMetrics = {
  score: 58,
  band: "MODERATE",
  volatility: 16.4,
  sharpe: 1.21,
  beta: 0.94,
  maxDrawdown: -12.8,
  var95: -2.9,
  diversification: 72,
};

/* ---- allocation by stock (top holdings) ---- */
const chartVars = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
];

export const stockAllocation: AllocationSlice[] = (() => {
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 7);
  const rest = sorted.slice(7);
  const slices: AllocationSlice[] = top.map((h, i) => ({
    label: h.symbol,
    value: h.value,
    weight: h.weight,
    colorVar: chartVars[i],
  }));
  if (rest.length) {
    const v = rest.reduce((s, h) => s + h.value, 0);
    slices.push({
      label: "Others",
      value: v,
      weight: (v / totalValue) * 100,
      colorVar: "--chart-8",
    });
  }
  return slices;
})();

/* ---- allocation by sector ---- */
export const sectorAllocation: AllocationSlice[] = (() => {
  const map = new Map<string, number>();
  for (const h of holdings) map.set(h.sector, (map.get(h.sector) ?? 0) + h.value);
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return entries.map(([label, value], i) => ({
    label,
    value,
    weight: (value / totalValue) * 100,
    colorVar: chartVars[i % chartVars.length],
  }));
})();

/* ---- performance vs benchmark (6M daily, indexed to portfolio value) ---- */
export const performance: PerformanceSeries = (() => {
  const days = 132;
  const start = new Date("2025-04-07");
  const portfolio = [];
  const benchmark = [];
  let pv = totalInvested;
  let bv = totalInvested;
  let sp = 7;
  let sb = 19;
  for (let i = 0; i < days; i++) {
    sp = (sp * 9301 + 49297) % 233280;
    sb = (sb * 9301 + 49297) % 233280;
    const rp = (sp / 233280 - 0.46) * 0.016;
    const rb = (sb / 233280 - 0.47) * 0.012;
    pv = pv * (1 + rp);
    bv = bv * (1 + rb);
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    portfolio.push({ date: iso, value: Number(pv.toFixed(0)) });
    benchmark.push({ date: iso, value: Number(bv.toFixed(0)) });
  }
  // scale the whole series so it ends exactly at the real current value
  // (avoids a discontinuous spike on the last point)
  const scale = totalValue / pv;
  for (const p of portfolio) p.value = Math.round(p.value * scale);
  return { portfolio, benchmark, benchmarkLabel: "NIFTY 50" };
})();

export const marketStatus: MarketStatus = {
  state: "OPEN",
  label: "Market Open",
  detail: "NSE · Closes 15:30 IST",
  lastUpdate: "15:12:04 IST",
};

export const notifications: AppNotification[] = [
  {
    id: "n1",
    kind: "alert",
    title: "Risk score rose to 58",
    body: "Portfolio volatility up 1.3% w/w — concentration in IT.",
    time: "12m ago",
    unread: true,
  },
  {
    id: "n2",
    kind: "success",
    title: "BHARTIARTL +2.07%",
    body: "Your largest day gainer crossed ₹1,160.",
    time: "48m ago",
    unread: true,
  },
  {
    id: "n3",
    kind: "info",
    title: "Benchmark refreshed",
    body: "NIFTY 50 EOD values synced for 04 Oct.",
    time: "3h ago",
    unread: false,
  },
];

/* =====================================================================
   PHASE 2–5 MOCK DATA
   Still deterministic — a shared seeded generator keeps every view
   stable across reloads. The Phase 5 service layer returns these exact
   shapes from `src/services/*`.
   ===================================================================== */

/** Deterministic PRNG (mulberry32-style) returning [0,1). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- lookup helpers over holdings ---- */
export const holdingBySymbol = new Map(holdings.map((h) => [h.symbol, h]));

export function getHolding(symbol: string): Holding | undefined {
  return holdingBySymbol.get(symbol);
}

/* =====================================================================
   Transactions — the trade history that produced the current holdings.
   ===================================================================== */
function buildTransactions(): Transaction[] {
  const r = rng(4242);
  const out: Transaction[] = [];
  let id = 1;
  for (const h of holdings) {
    // one or two opening buys per holding, spread over the last ~18 months
    const legs = r() > 0.55 ? 2 : 1;
    let remaining = h.quantity;
    for (let i = 0; i < legs; i++) {
      const qty =
        i === legs - 1 ? remaining : Math.max(1, Math.round(h.quantity * (0.35 + r() * 0.2)));
      remaining -= qty;
      const monthsAgo = Math.round(2 + r() * 16);
      const d = new Date("2026-10-08");
      d.setMonth(d.getMonth() - monthsAgo);
      const price = Number((h.avgPrice * (0.9 + r() * 0.2)).toFixed(2));
      const value = qty * price;
      out.push({
        id: `tx-${String(id++).padStart(3, "0")}`,
        date: d.toISOString().slice(0, 10),
        symbol: h.symbol,
        company: h.company,
        type: "BUY",
        quantity: qty,
        price,
        value,
        fees: Number((value * 0.0012 + 20).toFixed(2)),
        status: "SETTLED",
      });
    }
  }
  // a couple of partial sells for realism
  const sells: Array<[string, number, number, string]> = [
    ["ITC", 40, 462.3, "2026-08-14"],
    ["RELIANCE", 10, 2520.0, "2026-09-02"],
  ];
  for (const [symbol, qty, price, date] of sells) {
    const h = holdingBySymbol.get(symbol)!;
    const value = qty * price;
    out.push({
      id: `tx-${String(id++).padStart(3, "0")}`,
      date,
      symbol,
      company: h.company,
      type: "SELL",
      quantity: qty,
      price,
      value,
      fees: Number((value * 0.0012 + 20).toFixed(2)),
      status: "SETTLED",
      notes: "Trimmed position to rebalance weight.",
    });
  }
  // one pending order to exercise the status states
  out.push({
    id: `tx-${String(id++).padStart(3, "0")}`,
    date: "2026-10-08",
    symbol: "INFY",
    company: "Infosys",
    type: "BUY",
    quantity: 15,
    price: 1560.0,
    value: 23400,
    fees: 48.08,
    status: "PENDING",
    notes: "Limit order resting at ₹1,560.",
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const transactions: Transaction[] = buildTransactions();

/* =====================================================================
   Markets — indices, movers, most active.
   ===================================================================== */
export const marketIndices: MarketIndex[] = [
  { symbol: "NIFTY 50", name: "Nifty 50", value: 24218.65, change: 142.3, changePct: 0.59, spark: spark(3, 24076, 0.006) },
  { symbol: "SENSEX", name: "BSE Sensex", value: 79476.19, change: 388.4, changePct: 0.49, spark: spark(9, 79088, 0.006) },
  { symbol: "NIFTY IT", name: "Nifty IT", value: 41882.2, change: -214.8, changePct: -0.51, spark: spark(14, 42097, 0.009) },
  { symbol: "BANK NIFTY", name: "Nifty Bank", value: 52340.75, change: 503.6, changePct: 0.97, spark: spark(21, 51837, 0.008) },
];

interface RawUniverse {
  symbol: string;
  company: string;
  sector: string;
  ltp: number;
  changePct: number;
  volume: number;
  seed: number;
}

const universe: RawUniverse[] = [
  ...raw.map((r) => ({
    symbol: r.symbol,
    company: r.company,
    sector: r.sector,
    ltp: r.ltp,
    changePct: r.dayChangePct,
    volume: Math.round(2_000_000 + r.seed * 90_000),
    seed: r.seed,
  })),
  { symbol: "WIPRO", company: "Wipro", sector: "IT", ltp: 548.3, changePct: -1.42, volume: 8_400_000, seed: 120 },
  { symbol: "AXISBANK", company: "Axis Bank", sector: "Financials", ltp: 1184.6, changePct: 1.88, volume: 6_200_000, seed: 131 },
  { symbol: "TATAMOTORS", company: "Tata Motors", sector: "Auto", ltp: 962.15, changePct: 3.21, volume: 14_800_000, seed: 142 },
  { symbol: "ADANIENT", company: "Adani Enterprises", sector: "Industrials", ltp: 2887.4, changePct: -2.64, volume: 5_100_000, seed: 155 },
  { symbol: "HINDUNILVR", company: "Hindustan Unilever", sector: "FMCG", ltp: 2614.9, changePct: -0.74, volume: 2_900_000, seed: 168 },
  { symbol: "TITAN", company: "Titan Company", sector: "Consumer", ltp: 3498.2, changePct: 2.46, volume: 3_300_000, seed: 177 },
  { symbol: "POWERGRID", company: "Power Grid Corp", sector: "Utilities", ltp: 334.75, changePct: 1.12, volume: 11_200_000, seed: 188 },
  { symbol: "DRREDDY", company: "Dr. Reddy's Labs", sector: "Healthcare", ltp: 1288.5, changePct: -1.96, volume: 1_800_000, seed: 199 },
];

function toMover(u: RawUniverse): Mover {
  const change = Number(((u.ltp * u.changePct) / 100).toFixed(2));
  return {
    symbol: u.symbol,
    company: u.company,
    sector: u.sector,
    ltp: u.ltp,
    change,
    changePct: u.changePct,
    volume: u.volume,
    spark: spark(u.seed, u.ltp, 0.013),
  };
}

const allMovers = universe.map(toMover);
export const moverBySymbol = new Map(allMovers.map((m) => [m.symbol, m]));

export function getMover(symbol: string): Mover | undefined {
  return moverBySymbol.get(symbol);
}

export const gainers: Mover[] = [...allMovers]
  .sort((a, b) => b.changePct - a.changePct)
  .slice(0, 6);

export const losers: Mover[] = [...allMovers]
  .sort((a, b) => a.changePct - b.changePct)
  .slice(0, 6);

export const mostActive: Mover[] = [...allMovers]
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 6);

/* =====================================================================
   Watchlist — a starter set the user can add to / remove from.
   ===================================================================== */
export const initialWatchlist: WatchlistItem[] = [
  "TATAMOTORS",
  "AXISBANK",
  "TITAN",
  "WIPRO",
  "HINDUNILVR",
]
  .map((s) => allMovers.find((m) => m.symbol === s))
  .filter((m): m is Mover => Boolean(m))
  .map((m) => ({ ...m }));

/** The full searchable universe for "add to watchlist" / "add position". */
export const stockUniverse = universe.map((u) => ({
  symbol: u.symbol,
  company: u.company,
  sector: u.sector,
  ltp: u.ltp,
}));

/* =====================================================================
   Stock detail — quote fundamentals + multi-timeframe price history.
   ===================================================================== */
const quoteExtras: Record<string, Partial<StockQuote>> = {
  TCS: { pe: 29.4, marketCap: 1.45e13, dividendYield: 1.3, beta: 0.82 },
  INFY: { pe: 25.1, marketCap: 6.5e12, dividendYield: 2.1, beta: 0.91 },
  RELIANCE: { pe: 22.7, marketCap: 1.62e13, dividendYield: 0.4, beta: 1.08 },
  HDFCBANK: { pe: 18.9, marketCap: 1.29e13, dividendYield: 1.1, beta: 0.95 },
  ICICIBANK: { pe: 17.2, marketCap: 8.3e12, dividendYield: 0.8, beta: 1.12 },
  ITC: { pe: 24.8, marketCap: 5.6e12, dividendYield: 3.2, beta: 0.66 },
  LT: { pe: 33.6, marketCap: 4.9e12, dividendYield: 0.9, beta: 1.21 },
  SUNPHARMA: { pe: 36.2, marketCap: 3.5e12, dividendYield: 0.7, beta: 0.74 },
  MARUTI: { pe: 27.5, marketCap: 3.7e12, dividendYield: 1.0, beta: 0.98 },
  BHARTIARTL: { pe: 62.4, marketCap: 6.9e12, dividendYield: 0.5, beta: 0.69 },
};

export function getQuote(symbol: string): StockQuote | undefined {
  const u = universe.find((x) => x.symbol === symbol);
  if (!u) return undefined;
  const r = rng(u.seed * 7 + 3);
  const change = Number(((u.ltp * u.changePct) / 100).toFixed(2));
  const prevClose = Number((u.ltp - change).toFixed(2));
  const extra = quoteExtras[symbol] ?? {};
  const eps = extra.pe ? Number((u.ltp / extra.pe).toFixed(2)) : Number((u.ltp / 24).toFixed(2));
  return {
    symbol: u.symbol,
    company: u.company,
    sector: u.sector,
    assetType: "EQUITY",
    ltp: u.ltp,
    change,
    changePct: u.changePct,
    open: Number((prevClose * (1 + (r() - 0.5) * 0.01)).toFixed(2)),
    prevClose,
    dayHigh: Number((u.ltp * (1 + r() * 0.012)).toFixed(2)),
    dayLow: Number((u.ltp * (1 - r() * 0.012)).toFixed(2)),
    high52: Number((u.ltp * (1.12 + r() * 0.25)).toFixed(2)),
    low52: Number((u.ltp * (0.62 + r() * 0.12)).toFixed(2)),
    volume: u.volume,
    avgVolume: Math.round(u.volume * (0.8 + r() * 0.3)),
    marketCap: extra.marketCap ?? Number((u.ltp * 1e9).toFixed(0)),
    pe: extra.pe ?? Number((18 + r() * 20).toFixed(1)),
    eps,
    dividendYield: extra.dividendYield ?? Number((r() * 2.5).toFixed(1)),
    beta: extra.beta ?? Number((0.7 + r() * 0.6).toFixed(2)),
  };
}

/** Build a daily close series of `n` points ending exactly at `end`. */
function dailySeries(seed: number, end: number, n: number, vol: number): SeriesPoint[] {
  const r = rng(seed);
  const vals: number[] = [end];
  for (let i = 1; i < n; i++) {
    const prev = vals[0];
    const step = prev * (1 + (r() - 0.5) * vol);
    vals.unshift(Number(step.toFixed(2)));
  }
  const start = new Date("2026-10-08");
  start.setDate(start.getDate() - (n - 1));
  return vals.map((value, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d.toISOString().slice(0, 10), value };
  });
}

export function getPriceHistory(symbol: string): PriceHistory {
  const u = universe.find((x) => x.symbol === symbol);
  if (!u) return {};
  const year = dailySeries(u.seed * 13 + 1, u.ltp, 252, 0.02);
  // intraday for 1D: 26 points over the session, ending at ltp
  const r = rng(u.seed * 29 + 5);
  const open = year[year.length - 2]?.value ?? u.ltp;
  const intraday: SeriesPoint[] = [];
  let v = open;
  for (let i = 0; i < 26; i++) {
    v = i === 25 ? u.ltp : Number((v * (1 + (r() - 0.5) * 0.006)).toFixed(2));
    const hh = 9 + Math.floor((i * 15) / 60);
    const mm = (i * 15) % 60;
    intraday.push({ date: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, value: v });
  }
  return {
    "1D": intraday,
    "1W": year.slice(-5),
    "1M": year.slice(-22),
    "3M": year.slice(-66),
    "6M": year.slice(-132),
    YTD: year.slice(-190),
    "1Y": year,
    ALL: year,
  };
}

/* =====================================================================
   Phase 3 — performance analytics derived from the performance series.
   ===================================================================== */
const pfSeries = performance.portfolio;

function dailyReturns(series: SeriesPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    out.push((series[i].value / series[i - 1].value - 1) * 100);
  }
  return out;
}

const pfReturns = dailyReturns(pfSeries);

export const performanceAnalytics: PerformanceAnalytics = (() => {
  const first = pfSeries[0].value;
  const last = pfSeries[pfSeries.length - 1].value;
  const totalReturn = (last / first - 1) * 100;
  const days = pfSeries.length;
  const years = days / 252;
  const annualized = (Math.pow(last / first, 1 / years) - 1) * 100;
  let best = { date: pfSeries[1].date, value: pfReturns[0] };
  let worst = { date: pfSeries[1].date, value: pfReturns[0] };
  let win = 0;
  let lose = 0;
  pfReturns.forEach((ret, i) => {
    if (ret > best.value) best = { date: pfSeries[i + 1].date, value: ret };
    if (ret < worst.value) worst = { date: pfSeries[i + 1].date, value: ret };
    if (ret > 0) win++;
    else if (ret < 0) lose++;
  });
  const avg = pfReturns.reduce((s, x) => s + x, 0) / pfReturns.length;
  return {
    totalReturn,
    annualizedReturn: annualized,
    cagr: annualized,
    bestDay: { date: best.date, value: Number(best.value.toFixed(2)) },
    worstDay: { date: worst.date, value: Number(worst.value.toFixed(2)) },
    winningDays: win,
    losingDays: lose,
    avgDailyReturn: Number(avg.toFixed(3)),
    positiveMonths: 5,
    totalMonths: 6,
  };
})();

export const cumulativeReturn: SeriesPoint[] = (() => {
  const first = pfSeries[0].value;
  return pfSeries.map((p) => ({ date: p.date, value: Number(((p.value / first - 1) * 100).toFixed(2)) }));
})();

export const monthlyReturns: MonthlyReturn[] = [
  { month: "Apr '25", value: 2.4 },
  { month: "May '25", value: -1.8 },
  { month: "Jun '25", value: 3.1 },
  { month: "Jul '25", value: 1.2 },
  { month: "Aug '25", value: -0.6 },
  { month: "Sep '25", value: 2.9 },
  { month: "Oct '25", value: 1.5 },
];

export const returnDistribution: ReturnBucket[] = (() => {
  const edges = [-3, -2, -1, 0, 1, 2, 3];
  const buckets: ReturnBucket[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const from = edges[i];
    const to = edges[i + 1];
    const count = pfReturns.filter((r) => r >= from && r < to).length;
    buckets.push({
      label: `${from}% to ${to}%`,
      from,
      to,
      count,
      direction: to <= 0 ? "neg" : from >= 0 ? "pos" : "neu",
    });
  }
  return buckets;
})();

export const rollingVolatility: SeriesPoint[] = (() => {
  const window = 21;
  const out: SeriesPoint[] = [];
  for (let i = window; i < pfReturns.length; i++) {
    const slice = pfReturns.slice(i - window, i);
    const mean = slice.reduce((s, x) => s + x, 0) / slice.length;
    const variance = slice.reduce((s, x) => s + (x - mean) ** 2, 0) / slice.length;
    const annualized = Math.sqrt(variance) * Math.sqrt(252);
    out.push({ date: pfSeries[i + 1].date, value: Number(annualized.toFixed(2)) });
  }
  return out;
})();

export const drawdownSeries: SeriesPoint[] = (() => {
  let peak = pfSeries[0].value;
  return pfSeries.map((p) => {
    peak = Math.max(peak, p.value);
    const dd = (p.value / peak - 1) * 100;
    return { date: p.date, value: Number(dd.toFixed(2)) };
  });
})();

export const riskContributions: RiskContribution[] = (() => {
  const r = rng(909);
  const raw = holdings.map((h) => {
    const vol = 14 + r() * 18; // standalone annualized vol
    return { h, vol, raw: h.weight * vol };
  });
  const totalRaw = raw.reduce((s, x) => s + x.raw, 0);
  return raw
    .map(({ h, vol, raw: rc }) => ({
      symbol: h.symbol,
      weight: h.weight,
      volatility: Number(vol.toFixed(1)),
      contribution: Number(((rc / totalRaw) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.contribution - a.contribution);
})();

/* ---- correlation matrix over the top-8 holdings by value ---- */
export const correlationMatrix: CorrelationMatrix = (() => {
  const symbols = [...holdings]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((h) => h.symbol);
  const sectorOf = new Map(holdings.map((h) => [h.symbol, h.sector]));
  const r = rng(555);
  const n = symbols.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      const sameSector = sectorOf.get(symbols[i]) === sectorOf.get(symbols[j]);
      const base = sameSector ? 0.68 : 0.32;
      const val = Number(Math.max(-0.1, Math.min(0.95, base + (r() - 0.5) * 0.3)).toFixed(2));
      matrix[i][j] = val;
      matrix[j][i] = val;
    }
  }
  return { symbols, matrix };
})();

/* =====================================================================
   Stress-testing presets.
   ===================================================================== */
export const scenarioPresets: ScenarioPreset[] = [
  { id: "mkt-5", label: "Market −5%", description: "Broad market correction", input: { type: "MARKET", shockPct: -5, label: "Market −5%" } },
  { id: "mkt-10", label: "Market −10%", description: "Sharp market selloff", input: { type: "MARKET", shockPct: -10, label: "Market −10%" } },
  { id: "it-15", label: "IT −15%", description: "IT sector shock", input: { type: "SECTOR", target: "IT", shockPct: -15, label: "IT Sector −15%" } },
  { id: "bank-20", label: "Banking −20%", description: "Financials crisis", input: { type: "SECTOR", target: "Financials", shockPct: -20, label: "Financials −20%" } },
  { id: "hist-worst", label: "Worst Historical Month", description: "Mar 2020 style −23%", input: { type: "HISTORICAL", target: "covid-2020", shockPct: -23, label: "Worst Historical Month" } },
];

export const sectors: string[] = [...new Set(holdings.map((h) => h.sector))].sort();

/* =====================================================================
   Phase 4 — AI assistant seed, reports, settings.
   ===================================================================== */
export const aiSuggestedPrompts: string[] = [
  "What's my current portfolio return?",
  "Explain my Sharpe ratio.",
  "Which stock has the highest allocation?",
  "How diversified is my portfolio?",
  "What is my current portfolio risk?",
];

export const aiSeedMessages: AIMessage[] = [
  {
    id: "ai-0",
    role: "assistant",
    content:
      "I'm Argos — your portfolio intelligence layer. I explain your verified ArgosQuant metrics in plain language. I don't predict prices, place trades, or make recommendations. Ask me about your returns, risk, allocation, or diversification.",
    time: "now",
  },
];

export const reports: Report[] = [
  { id: "rpt-001", type: "PERFORMANCE", name: "Portfolio Performance — Oct 2026", period: "Apr–Oct 2026", generatedAt: "08 Oct 2026, 14:32", status: "READY", sizeKb: 184 },
  { id: "rpt-002", type: "RISK", name: "Risk Analysis — Q3 2026", period: "Jul–Sep 2026", generatedAt: "01 Oct 2026, 09:05", status: "READY", sizeKb: 142 },
  { id: "rpt-003", type: "TRANSACTIONS", name: "Transaction History — FY26", period: "Apr 2026–Mar 2027", generatedAt: "28 Sep 2026, 18:20", status: "READY", sizeKb: 96 },
  { id: "rpt-004", type: "SUMMARY", name: "Portfolio Summary — Sep 2026", period: "Sep 2026", generatedAt: "30 Sep 2026, 16:00", status: "READY", sizeKb: 78 },
];

export const defaultSettings: AppSettings = {
  account: { name: currentUser.name, email: currentUser.email },
  portfolio: { defaultPortfolioId: portfolios[0].id, baseCurrency: "INR", benchmark: "NIFTY 50" },
  marketData: { refreshSeconds: 15, source: "NSE (mock)", timezone: "Asia/Kolkata (IST)" },
  appearance: { darkMode: true, compact: false, chartStyle: "area" },
};
