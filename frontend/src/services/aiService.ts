/* =====================================================================
   AI assistant service (mock). Deliberately constrained: it ONLY maps a
   question to pre-computed, verified metrics and returns a natural-language
   explanation plus the verified metric blocks. It never predicts prices,
   places trades, or invents figures — mirroring the backend contract where
   the LLM receives only ContextBuilder output.
   ===================================================================== */

import type { AIMessage, AIMetric } from "@/types";
import { aiSeedMessages, aiSuggestedPrompts } from "@/data/mockData";
import { getMetrics, getHoldings } from "./portfolioService";
import { getRiskMetrics } from "./riskService";
import { getPerformanceAnalytics } from "./analyticsService";
import {
  formatCurrency,
  formatPct,
} from "@/lib/format";

export function getSuggestedPrompts(): string[] {
  return aiSuggestedPrompts;
}

export function getSeedMessages(): AIMessage[] {
  return aiSeedMessages;
}

const now = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

interface Answer {
  content: string;
  metrics?: AIMetric[];
}

/** Compose a grounded answer from verified metrics only. */
function compose(question: string): Answer {
  const q = question.toLowerCase();
  const m = getMetrics();
  const risk = getRiskMetrics();
  const perf = getPerformanceAnalytics();
  const holdings = getHoldings();

  if (q.includes("return") || q.includes("performance") || q.includes("profit")) {
    return {
      content: `Your portfolio currently has a ${formatPct(m.totalPnlPct)} total return since inception, worth ${formatCurrency(
        m.value,
        { decimals: 0 }
      )} against ${formatCurrency(m.invested, { decimals: 0 })} invested. Annualised, that works out to roughly ${formatPct(
        perf.annualizedReturn
      )}.`,
      metrics: [
        { label: "Portfolio Value", value: formatCurrency(m.value, { decimals: 0 }) },
        { label: "Invested", value: formatCurrency(m.invested, { decimals: 0 }) },
        { label: "Total Return", value: formatPct(m.totalPnlPct), direction: m.totalPnl >= 0 ? "pos" : "neg" },
        { label: "Annualised", value: formatPct(perf.annualizedReturn), direction: perf.annualizedReturn >= 0 ? "pos" : "neg" },
      ],
    };
  }

  if (q.includes("sharpe")) {
    return {
      content: `Your Sharpe ratio is ${m.sharpe.toFixed(
        2
      )}. That means for every unit of total risk you take, the portfolio has earned about ${m.sharpe.toFixed(
        2
      )} units of excess return above the risk-free rate. Above 1.0 is generally considered solid risk-adjusted performance.`,
      metrics: [
        { label: "Sharpe Ratio", value: m.sharpe.toFixed(2), direction: "pos" },
        { label: "Volatility", value: formatPct(m.volatility, { signed: false }) },
        { label: "Beta", value: m.beta.toFixed(2) },
      ],
    };
  }

  if (q.includes("allocation") || q.includes("highest") || q.includes("largest") || q.includes("concentrat")) {
    const top = [...holdings].sort((a, b) => b.weight - a.weight)[0];
    return {
      content: `Your largest allocation is ${top.company} (${top.symbol}) at ${formatPct(
        top.weight,
        { signed: false, decimals: 1 }
      )} of portfolio value — ${formatCurrency(top.value, { decimals: 0 })}. Keep an eye on single-name concentration above ~15%.`,
      metrics: [
        { label: top.symbol + " Weight", value: formatPct(top.weight, { signed: false, decimals: 1 }) },
        { label: top.symbol + " Value", value: formatCurrency(top.value, { decimals: 0 }) },
        { label: "P&L", value: formatPct(top.pnlPct), direction: top.pnl >= 0 ? "pos" : "neg" },
      ],
    };
  }

  if (q.includes("diversif")) {
    const sectors = new Set(holdings.map((h) => h.sector)).size;
    return {
      content: `Your diversification score is ${risk.diversification}/100 across ${sectors} sectors and ${holdings.length} positions. The score reflects how evenly risk is spread — concentration in a single sector or name pulls it down.`,
      metrics: [
        { label: "Diversification", value: `${risk.diversification}/100` },
        { label: "Sectors", value: `${sectors}` },
        { label: "Positions", value: `${holdings.length}` },
      ],
    };
  }

  if (q.includes("risk") || q.includes("volatil") || q.includes("drawdown") || q.includes("var")) {
    return {
      content: `Your portfolio risk score is ${risk.score}/100 — a ${risk.band.toLowerCase()} profile. Annualised volatility is ${formatPct(
        risk.volatility,
        { signed: false }
      )}, with a 1-day 95% Value-at-Risk of ${formatPct(risk.var95)} and a maximum drawdown of ${formatPct(
        risk.maxDrawdown
      )} over the period.`,
      metrics: [
        { label: "Risk Score", value: `${risk.score}/100` },
        { label: "Volatility", value: formatPct(risk.volatility, { signed: false }) },
        { label: "VaR (95%, 1-day)", value: formatPct(risk.var95), direction: "neg" },
        { label: "Max Drawdown", value: formatPct(risk.maxDrawdown), direction: "neg" },
      ],
    };
  }

  // Fallback — stay in scope, decline politely, no fabrication.
  return {
    content:
      "I can explain your verified ArgosQuant metrics — returns, risk, Sharpe ratio, allocation and diversification. I can't predict prices, recommend trades, or make forecasts. Try one of the suggested questions below.",
  };
}

/** Simulated async round-trip so the UI can show a typing state. */
export function sendMessage(question: string): Promise<AIMessage> {
  const answer = compose(question);
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        id: `ai-${Date.now().toString(36)}`,
        role: "assistant",
        content: answer.content,
        metrics: answer.metrics,
        time: now(),
      });
    }, 650);
  });
}
