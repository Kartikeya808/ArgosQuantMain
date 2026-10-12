/* =====================================================================
   Service layer barrel. Components import from here (or the individual
   modules) and never reach into `src/data` directly — keeping a clean
   seam for the Java backend. Grouped namespaces keep call-sites readable
   (portfolioService.getHoldings(), marketService.getIndices(), …).
   ===================================================================== */

export * as portfolioService from "./portfolioService";
export * as marketService from "./marketService";
export * as analyticsService from "./analyticsService";
export * as riskService from "./riskService";
export * as scenarioService from "./scenarioService";
export * as aiService from "./aiService";
export * as reportService from "./reportService";

export type { UniverseStock } from "./marketService";
