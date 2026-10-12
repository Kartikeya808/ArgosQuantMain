import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Select,
  Table,
  Tabs,
  type Column,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/state/AppContext";
import { portfolioService, scenarioService } from "@/services";
import type {
  ScenarioImpactRow,
  ScenarioInput,
  ScenarioResult,
  ScenarioType,
} from "@/types";
import { formatCurrency, formatPct, formatSignedCurrency, valueClass } from "@/lib/format";
import styles from "./Scenarios.module.css";

const typeTabs = [
  { value: "STOCK", label: "Stock" },
  { value: "SECTOR", label: "Sector" },
  { value: "MARKET", label: "Market" },
  { value: "ALLOCATION", label: "Allocation" },
  { value: "HISTORICAL", label: "Historical" },
];

const historicalEvents = [
  { value: "covid-2020", label: "COVID crash (Mar 2020) · −23%", shock: -23 },
  { value: "gfc-2008", label: "Global financial crisis (2008) · −18%", shock: -18 },
  { value: "taper-2013", label: "Taper tantrum (2013) · −9%", shock: -9 },
];

export function Scenarios() {
  const { activePortfolio } = useApp();
  const holdings = portfolioService.getHoldings();
  const sectors = scenarioService.getSectors();
  const presets = scenarioService.getPresets();

  const [type, setType] = useState<ScenarioType>("SECTOR");
  const [symbol, setSymbol] = useState(holdings[0].symbol);
  const [sector, setSector] = useState(sectors[0]);
  const [event, setEvent] = useState(historicalEvents[0].value);
  const [shock, setShock] = useState(-10);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const currentInput: ScenarioInput = useMemo(() => {
    switch (type) {
      case "STOCK":
        return { type, target: symbol, shockPct: shock, label: `${symbol} ${shock}%` };
      case "SECTOR":
        return { type, target: sector, shockPct: shock, label: `${sector} sector ${shock}%` };
      case "HISTORICAL": {
        const ev = historicalEvents.find((e) => e.value === event)!;
        return { type, target: event, shockPct: ev.shock, label: ev.label.split(" · ")[0] };
      }
      case "ALLOCATION":
        return { type, shockPct: shock, label: `Portfolio reallocation ${shock}%` };
      case "MARKET":
      default:
        return { type: "MARKET", shockPct: shock, label: `Market ${shock}%` };
    }
  }, [type, symbol, sector, event, shock]);

  function run(input: ScenarioInput) {
    setResult(scenarioService.runScenario(input));
  }

  const impactColumns: Column<ScenarioImpactRow>[] = [
    {
      key: "symbol",
      header: "Symbol",
      render: (r) => (
        <div className={styles.symCell}>
          <span className={styles.sym}>{r.symbol}</span>
          <Badge tone="neutral" size="sm">
            {r.sector}
          </Badge>
        </div>
      ),
    },
    { key: "weight", header: "Weight", align: "right", mono: true, render: (r) => formatPct(r.weight, { signed: false, decimals: 1 }) },
    { key: "shock", header: "Shock", align: "right", mono: true, render: (r) => <span className={valueClass(r.shockPct)}>{formatPct(r.shockPct)}</span> },
    { key: "current", header: "Current", align: "right", mono: true, render: (r) => formatCurrency(r.currentValue, { decimals: 0 }) },
    { key: "new", header: "Stressed", align: "right", mono: true, render: (r) => formatCurrency(r.newValue, { decimals: 0 }) },
    {
      key: "impact",
      header: "Impact",
      align: "right",
      mono: true,
      render: (r) => <span className={valueClass(r.impact)}>{formatSignedCurrency(r.impact, { decimals: 0 })}</span>,
    },
  ];

  const riskRows = result
    ? ([
        ["Volatility", formatPct(result.before.volatility, { signed: false }), formatPct(result.after.volatility, { signed: false })],
        ["VaR (95%)", formatPct(result.before.var95), formatPct(result.after.var95)],
        ["Beta", result.before.beta.toFixed(2), result.after.beta.toFixed(2)],
        ["Risk Score", `${result.before.riskScore}`, `${result.after.riskScore}`],
      ] as const)
    : [];

  return (
    <div className="page">
      <PageHeader
        eyebrow={activePortfolio.name}
        title="Stress Testing"
        subtitle="Model hypothetical shocks against your real portfolio. Read-only — holdings are never changed."
      />

      <div className={styles.layout}>
        {/* ---- builder ---- */}
        <Card className={styles.builder}>
          <CardHeader eyebrow="Scenario Builder" title="Configure Shock" />

          <div className={styles.builderBody}>
            <div className={styles.field}>
              <span className={styles.label}>Scenario Type</span>
              <Tabs
                size="sm"
                variant="segmented"
                items={typeTabs}
                value={type}
                onChange={(v) => setType(v as ScenarioType)}
              />
            </div>

            {type === "STOCK" && (
              <div className={styles.field}>
                <span className={styles.label}>Asset</span>
                <Select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  options={holdings.map((h) => ({ value: h.symbol, label: `${h.symbol} · ${h.company}` }))}
                />
              </div>
            )}

            {type === "SECTOR" && (
              <div className={styles.field}>
                <span className={styles.label}>Sector</span>
                <Select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  options={sectors.map((s) => ({ value: s, label: s }))}
                />
              </div>
            )}

            {type === "HISTORICAL" && (
              <div className={styles.field}>
                <span className={styles.label}>Event</span>
                <Select
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  options={historicalEvents.map((e) => ({ value: e.value, label: e.label }))}
                />
              </div>
            )}

            {type !== "HISTORICAL" && (
              <div className={styles.field}>
                <span className={styles.label}>
                  Shock <span className={`${styles.shockVal} mono ${valueClass(shock)}`}>{formatPct(shock)}</span>
                </span>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={shock}
                  onChange={(e) => setShock(Number(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderScale}>
                  <span>−50%</span>
                  <span>0</span>
                  <span>+50%</span>
                </div>
              </div>
            )}

            <Button variant="primary" icon="play" onClick={() => run(currentInput)}>
              Run Scenario
            </Button>
          </div>

          <div className={styles.presets}>
            <span className={styles.label}>Presets</span>
            <div className={styles.presetList}>
              {presets.map((p) => (
                <button key={p.id} className={styles.preset} onClick={() => run(p.input)}>
                  <span className={styles.presetLabel}>{p.label}</span>
                  <span className={styles.presetDesc}>{p.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ---- results ---- */}
        <div className={styles.results}>
          {!result ? (
            <Card>
              <EmptyState
                icon="scenario"
                title="No scenario run yet"
                description="Configure a shock or pick a preset, then run it to see the estimated impact on your portfolio."
              />
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader
                  eyebrow="Result"
                  title={result.input.label}
                  actions={
                    <Badge tone={result.estimatedImpact >= 0 ? "pos" : "neg"} size="md">
                      {formatPct(result.impactPct)} impact
                    </Badge>
                  }
                />
                <div className={styles.outcome}>
                  <div className={styles.outcomeCell}>
                    <span className={styles.outcomeLabel}>Current Value</span>
                    <span className={`${styles.outcomeValue} mono`}>{formatCurrency(result.currentValue, { decimals: 0 })}</span>
                  </div>
                  <Icon name="chevron-right" size={18} className={styles.outcomeArrow} />
                  <div className={styles.outcomeCell}>
                    <span className={styles.outcomeLabel}>{result.estimatedImpact >= 0 ? "Estimated Gain" : "Estimated Loss"}</span>
                    <span className={`${styles.outcomeValue} mono ${valueClass(result.estimatedImpact)}`}>
                      {formatSignedCurrency(result.estimatedImpact, { decimals: 0 })}
                    </span>
                  </div>
                  <Icon name="chevron-right" size={18} className={styles.outcomeArrow} />
                  <div className={styles.outcomeCell}>
                    <span className={styles.outcomeLabel}>Stressed Value</span>
                    <span className={`${styles.outcomeValue} mono`}>{formatCurrency(result.newValue, { decimals: 0 })}</span>
                  </div>
                </div>

                <div className={styles.riskCompare}>
                  <div className={`${styles.riskRow} ${styles.riskHead}`}>
                    <span>Risk metric</span>
                    <span>Before</span>
                    <span>After</span>
                  </div>
                  {riskRows.map(([label, before, after]) => (
                    <div key={label} className={styles.riskRow}>
                      <span className={styles.riskLabel}>{label}</span>
                      <span className="mono">{before}</span>
                      <span className="mono val-neg">{after}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card padded={false} className={styles.impactCard}>
                <div className={styles.impactHeader}>
                  <CardHeader
                    eyebrow="Breakdown"
                    title="Affected Holdings"
                    subtitle={`${result.rows.length} positions impacted by this shock`}
                  />
                </div>
                <Table columns={impactColumns} rows={result.rows} rowKey={(r) => r.symbol} dense emptyLabel="No holdings were affected by this shock." />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
