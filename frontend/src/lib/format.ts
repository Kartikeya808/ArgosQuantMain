/* =====================================================================
   Financial number formatting — ArgosQuant
   Indian numbering (lakh/crore) for INR, consistent precision, and
   sign-aware helpers. All UI should format through these so numbers
   read identically across every page.
   ===================================================================== */

import type { Direction } from "@/types";

/** ₹ amount with Indian grouping. compact=true -> ₹8.42L / ₹1.24Cr. */
export function formatCurrency(
  value: number,
  opts: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals } = opts;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (compact) {
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
    if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  }

  const n = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals ?? 2,
    maximumFractionDigits: decimals ?? 2,
  }).format(abs);
  return `${sign}₹${n}`;
}

/** Plain number with Indian grouping (no currency symbol). */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Percent with explicit sign. e.g. +10.85% / -2.14% */
export function formatPct(
  value: number,
  opts: { decimals?: number; signed?: boolean } = {}
): string {
  const { decimals = 2, signed = true } = opts;
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Signed currency. e.g. +₹82,500 / -₹1,240 */
export function formatSignedCurrency(
  value: number,
  opts: { compact?: boolean; decimals?: number } = {}
): string {
  const base = formatCurrency(Math.abs(value), opts);
  if (value > 0) return `+${base}`;
  if (value < 0) return `-${base}`;
  return base;
}

/** Large count: 1.2M, 842K, 12.4Cr-style for volume. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs}`;
}

/** Direction classifier for coloring. */
export function directionOf(value: number): Direction {
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "neu";
}

/** Maps a direction to the matching value-color utility class. */
export function valueClass(value: number): string {
  const d = directionOf(value);
  return d === "pos" ? "val-pos" : d === "neg" ? "val-neg" : "val-neu";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
