/* =====================================================================
   Report service — list, generate (mock async) and CSV export.
   CSV export is a real client-side download built from verified data.
   ===================================================================== */

import type { Report, ReportType, Transaction } from "@/types";
import { reports } from "@/data/mockData";
import { getTransactions, getHoldings, getMetrics } from "./portfolioService";

const typeMeta: Record<ReportType, string> = {
  PERFORMANCE: "Portfolio Performance",
  RISK: "Risk Analysis",
  TRANSACTIONS: "Transaction History",
  SUMMARY: "Portfolio Summary",
};

export function listReports(): Report[] {
  return reports;
}

export function reportTypeLabel(type: ReportType): string {
  return typeMeta[type];
}

/** Mock async generation so the UI can show a GENERATING → READY flow. */
export function generateReport(type: ReportType): Promise<Report> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        id: `rpt-${Date.now().toString(36)}`,
        type,
        name: `${typeMeta[type]} — ${new Date().toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        })}`,
        period: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        generatedAt: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "READY",
        sizeKb: 80 + Math.round(Math.random() * 140),
      });
    }, 1400);
  });
}

function toCsv(rows: Array<Record<string, string | number>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
}

function download(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function transactionsCsv(txns: Transaction[]): string {
  return toCsv(
    txns.map((t) => ({
      Date: t.date,
      Symbol: t.symbol,
      Company: t.company,
      Type: t.type,
      Quantity: t.quantity,
      Price: t.price,
      Value: t.value.toFixed(2),
      Fees: t.fees.toFixed(2),
      Status: t.status,
    }))
  );
}

/** Export a report type to a downloaded CSV from verified data. */
export function exportCsv(type: ReportType): void {
  const stamp = new Date().toISOString().slice(0, 10);
  if (type === "TRANSACTIONS") {
    download(`argosquant-transactions-${stamp}.csv`, transactionsCsv(getTransactions()));
    return;
  }
  if (type === "SUMMARY" || type === "PERFORMANCE") {
    const holdings = getHoldings();
    const csv = toCsv(
      holdings.map((h) => ({
        Symbol: h.symbol,
        Company: h.company,
        Sector: h.sector,
        Qty: h.quantity,
        AvgPrice: h.avgPrice,
        LTP: h.ltp,
        Value: h.value.toFixed(2),
        PnL: h.pnl.toFixed(2),
        "PnL%": h.pnlPct.toFixed(2),
        "Weight%": h.weight.toFixed(2),
      }))
    );
    download(`argosquant-${type.toLowerCase()}-${stamp}.csv`, csv);
    return;
  }
  // RISK — export the aggregate metric sheet
  const m = getMetrics();
  const csv = toCsv([
    { Metric: "Portfolio Value", Value: m.value.toFixed(2) },
    { Metric: "Invested", Value: m.invested.toFixed(2) },
    { Metric: "Total P&L", Value: m.totalPnl.toFixed(2) },
    { Metric: "Volatility %", Value: m.volatility },
    { Metric: "Sharpe", Value: m.sharpe },
    { Metric: "Beta", Value: m.beta },
    { Metric: "Max Drawdown %", Value: m.maxDrawdown },
  ]);
  download(`argosquant-risk-${stamp}.csv`, csv);
}
