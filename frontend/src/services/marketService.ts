/* =====================================================================
   Market service — indices, movers, quotes, price history, and the
   searchable stock universe (used by add-position / add-watchlist).
   ===================================================================== */

import type {
  MarketIndex,
  MarketStatus,
  Mover,
  PriceHistory,
  StockQuote,
} from "@/types";
import {
  gainers,
  getMover as getMoverData,
  getPriceHistory as getPriceHistoryData,
  getQuote as getQuoteData,
  marketIndices,
  marketStatus,
  mostActive,
  losers,
  stockUniverse,
} from "@/data/mockData";

export function getIndices(): MarketIndex[] {
  return marketIndices;
}

export function getGainers(): Mover[] {
  return gainers;
}

export function getLosers(): Mover[] {
  return losers;
}

export function getMostActive(): Mover[] {
  return mostActive;
}

/** Full quote-row for any universe symbol (used by watchlist add). */
export function getMover(symbol: string): Mover | undefined {
  return getMoverData(symbol);
}

export function getMarketStatus(): MarketStatus {
  return marketStatus;
}

export function getQuote(symbol: string): StockQuote | undefined {
  return getQuoteData(symbol);
}

export function getPriceHistory(symbol: string): PriceHistory {
  return getPriceHistoryData(symbol);
}

export interface UniverseStock {
  symbol: string;
  company: string;
  sector: string;
  ltp: number;
}

export function searchStocks(query: string): UniverseStock[] {
  const q = query.trim().toLowerCase();
  if (!q) return stockUniverse;
  return stockUniverse.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)
  );
}
