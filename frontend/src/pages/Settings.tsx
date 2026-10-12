import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, CardHeader, Input, Select, useToast } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/state/AppContext";
import type { AppSettings } from "@/types";
import styles from "./Settings.module.css";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

export function Settings() {
  const toast = useToast();
  const { settings, updateSettings, portfolios } = useApp();
  const [draft, setDraft] = useState<AppSettings>(settings);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  function patch<K extends keyof AppSettings>(section: K, value: Partial<AppSettings[K]>) {
    setDraft((prev) => ({ ...prev, [section]: { ...prev[section], ...value } }));
  }

  function save() {
    updateSettings(draft);
    toast.success("Settings saved", "Your preferences have been updated.");
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="More"
        title="Settings"
        subtitle="Account, portfolio defaults, market data and appearance."
        actions={
          <>
            {dirty && <Badge tone="accent">Unsaved changes</Badge>}
            <Button variant="secondary" onClick={() => setDraft(settings)} disabled={!dirty}>
              Reset
            </Button>
            <Button variant="primary" icon="check" onClick={save} disabled={!dirty}>
              Save
            </Button>
          </>
        }
      />

      <div className={styles.sections}>
        {/* ---- Account ---- */}
        <Card>
          <CardHeader eyebrow="Account" title="Profile & Security" />
          <div className={styles.grid}>
            <Field label="Full Name">
              <Input
                icon="user"
                value={draft.account.name}
                onChange={(e) => patch("account", { name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                icon="mail"
                type="email"
                value={draft.account.email}
                onChange={(e) => patch("account", { email: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <Button
                variant="secondary"
                icon="lock"
                onClick={() => toast.info("Password change", "This would open a secure flow on the backend.")}
              >
                Change Password
              </Button>
            </Field>
          </div>
        </Card>

        {/* ---- Portfolio ---- */}
        <Card>
          <CardHeader eyebrow="Portfolio" title="Defaults" />
          <div className={styles.grid}>
            <Field label="Default Portfolio">
              <Select
                value={draft.portfolio.defaultPortfolioId}
                onChange={(e) => patch("portfolio", { defaultPortfolioId: e.target.value })}
                options={portfolios.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
            <Field label="Base Currency">
              <Select
                value={draft.portfolio.baseCurrency}
                onChange={(e) => patch("portfolio", { baseCurrency: e.target.value })}
                options={[
                  { value: "INR", label: "₹ Indian Rupee (INR)" },
                  { value: "USD", label: "$ US Dollar (USD)" },
                  { value: "EUR", label: "€ Euro (EUR)" },
                ]}
              />
            </Field>
            <Field label="Benchmark">
              <Select
                value={draft.portfolio.benchmark}
                onChange={(e) => patch("portfolio", { benchmark: e.target.value })}
                options={[
                  { value: "NIFTY 50", label: "NIFTY 50" },
                  { value: "SENSEX", label: "BSE SENSEX" },
                  { value: "NIFTY IT", label: "NIFTY IT" },
                  { value: "BANK NIFTY", label: "BANK NIFTY" },
                ]}
              />
            </Field>
          </div>
        </Card>

        {/* ---- Market Data ---- */}
        <Card>
          <CardHeader eyebrow="Market Data" title="Feed" />
          <div className={styles.grid}>
            <Field label="Refresh Frequency">
              <Select
                value={String(draft.marketData.refreshSeconds)}
                onChange={(e) => patch("marketData", { refreshSeconds: Number(e.target.value) })}
                options={[
                  { value: "5", label: "Every 5 seconds" },
                  { value: "15", label: "Every 15 seconds" },
                  { value: "30", label: "Every 30 seconds" },
                  { value: "60", label: "Every minute" },
                ]}
              />
            </Field>
            <Field label="Data Source">
              <Select
                value={draft.marketData.source}
                onChange={(e) => patch("marketData", { source: e.target.value })}
                options={[
                  { value: "NSE (mock)", label: "NSE (mock)" },
                  { value: "BSE (mock)", label: "BSE (mock)" },
                ]}
              />
            </Field>
            <Field label="Market Timezone">
              <Select
                value={draft.marketData.timezone}
                onChange={(e) => patch("marketData", { timezone: e.target.value })}
                options={[
                  { value: "Asia/Kolkata (IST)", label: "Asia/Kolkata (IST)" },
                  { value: "UTC", label: "UTC" },
                ]}
              />
            </Field>
          </div>
        </Card>

        {/* ---- Appearance ---- */}
        <Card>
          <CardHeader eyebrow="Appearance" title="Interface" />
          <div className={styles.rows}>
            <div className={styles.row}>
              <div>
                <span className={styles.rowTitle}>Dark Mode</span>
                <span className={styles.rowHint}>ArgosQuant is terminal-first; dark is the primary theme.</span>
              </div>
              <Toggle
                label="Dark mode"
                checked={draft.appearance.darkMode}
                onChange={(v) => patch("appearance", { darkMode: v })}
              />
            </div>
            <div className={styles.row}>
              <div>
                <span className={styles.rowTitle}>Compact Mode</span>
                <span className={styles.rowHint}>Tighter table density for high-information screens.</span>
              </div>
              <Toggle
                label="Compact mode"
                checked={draft.appearance.compact}
                onChange={(v) => patch("appearance", { compact: v })}
              />
            </div>
            <div className={styles.row}>
              <div>
                <span className={styles.rowTitle}>Chart Style</span>
                <span className={styles.rowHint}>Default rendering for price & performance charts.</span>
              </div>
              <Select
                sizeVariant="sm"
                value={draft.appearance.chartStyle}
                onChange={(e) => patch("appearance", { chartStyle: e.target.value as "area" | "line" })}
                options={[
                  { value: "area", label: "Area" },
                  { value: "line", label: "Line" },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.footerNote}>
        <Icon name="info" size={14} />
        <span>Preferences are stored in-session (mock). The Java backend will persist them per user.</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}
