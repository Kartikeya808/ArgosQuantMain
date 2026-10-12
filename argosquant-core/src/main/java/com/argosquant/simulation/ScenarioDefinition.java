package com.argosquant.simulation;

import java.util.Map;

/**
 * A what-if price-shock scenario. Shocks are decimal fractions
 * ({@code -0.15} == -15%) and combine <em>additively</em> per holding:
 *
 * <pre>appliedShock = marketShockPct + sectorShock(sector) + symbolShock(symbol)</pre>
 *
 * so a market-wide decline, a sector stress, and a single-name move can be
 * expressed together. All maps may be empty but not null (use the factories).
 */
public record ScenarioDefinition(
        String name,
        double marketShockPct,
        Map<String, Double> sectorShocks,
        Map<String, Double> symbolShocks) {

    public ScenarioDefinition {
        sectorShocks = sectorShocks == null ? Map.of() : Map.copyOf(sectorShocks);
        symbolShocks = symbolShocks == null ? Map.of() : Map.copyOf(symbolShocks);
    }

    /** A uniform market-wide shock applied to every holding. */
    public static ScenarioDefinition market(String name, double shockPct) {
        return new ScenarioDefinition(name, shockPct, Map.of(), Map.of());
    }

    /** A shock applied only to holdings in a given sector. */
    public static ScenarioDefinition sector(String name, String sector, double shockPct) {
        return new ScenarioDefinition(name, 0.0, Map.of(sector.toUpperCase(), shockPct), Map.of());
    }

    /** A shock applied only to a single symbol. */
    public static ScenarioDefinition symbol(String name, String symbol, double shockPct) {
        return new ScenarioDefinition(name, 0.0, Map.of(), Map.of(symbol.toUpperCase(), shockPct));
    }

    /** Resolves the total shock for a holding given its sector (may be null) and symbol. */
    double shockFor(String sector, String symbol) {
        double shock = marketShockPct;
        if (sector != null) {
            shock += sectorShocks.getOrDefault(sector.toUpperCase(), 0.0);
        }
        shock += symbolShocks.getOrDefault(symbol.toUpperCase(), 0.0);
        return shock;
    }
}
