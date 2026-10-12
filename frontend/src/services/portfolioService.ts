/* =====================================================================
   Portfolio service — the single access point for portfolio, holdings,
   transactions and aggregate metrics. UI components call these instead
   of importing mock data directly. When the Java backend lands, only
   the bodies here change; the return shapes (src/types) stay identical.
   ===================================================================== */

import type {
  AllocationSlice,
  Holding,
  PerformanceSeries,
  PortfolioMetrics,
  Transaction,
  TransactionDraft,
} from "@/types";
import {
  getHolding as getHoldingData,
  holdings,
  performance,
  portfolioMetrics,
  sectorAllocation,
  stockAllocation,
  transactions,
} from "@/data/mockData";
import {
  isLive,
  liveHoldings,
  liveMetrics,
  liveSectorAllocation,
  liveStockAllocation,
  liveTransactions,
} from "@/services/session";

export function getHoldings(): Holding[] {
  return isLive() ? liveHoldings() : holdings;
}

export function getHolding(symbol: string): Holding | undefined {
  if (isLive()) return liveHoldings().find((h) => h.symbol === symbol);
  return getHoldingData(symbol);
}

export function getMetrics(): PortfolioMetrics {
  return isLive() ? liveMetrics() : portfolioMetrics;
}

export function getPerformance(): PerformanceSeries {
  // Equity-curve series is not exposed by the backend yet — kept on mock.
  return performance;
}

export function getStockAllocation(): AllocationSlice[] {
  return isLive() ? liveStockAllocation() : stockAllocation;
}

export function getSectorAllocation(): AllocationSlice[] {
  return isLive() ? liveSectorAllocation() : sectorAllocation;
}

export function getTransactions(): Transaction[] {
  return isLive() ? liveTransactions() : transactions;
}

/** Turn a modal draft into a persisted-looking transaction (mock). */
export function createTransaction(draft: TransactionDraft): Transaction {
  const h = getHoldingData(draft.symbol);
  const value = draft.quantity * draft.price;
  return {
    id: `tx-${Date.now().toString(36)}`,
    date: draft.date,
    symbol: draft.symbol,
    company: h?.company ?? draft.symbol,
    type: draft.type,
    quantity: draft.quantity,
    price: draft.price,
    value,
    fees: draft.fees,
    status: "SETTLED",
    notes: draft.notes,
  };
}
