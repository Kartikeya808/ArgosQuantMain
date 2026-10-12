import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Drawer,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/ui/Icon";
import { reportService, portfolioService, analyticsService } from "@/services";
import type { Report, ReportStatus, ReportType } from "@/types";
import { formatCurrency, formatPct } from "@/lib/format";
import styles from "./Reports.module.css";

const reportTypes: Array<{ type: ReportType; icon: IconName; blurb: string }> = [
  { type: "PERFORMANCE", icon: "trending-up", blurb: "Returns, benchmark delta and monthly P&L." },
  { type: "RISK", icon: "shield", blurb: "Volatility, drawdown, VaR and contribution." },
  { type: "TRANSACTIONS", icon: "reports", blurb: "Full buy/sell ledger with fees and status." },
  { type: "SUMMARY", icon: "portfolio", blurb: "Holdings snapshot with weights and P&L." },
];

const statusTone: Record<ReportStatus, "pos" | "accent" | "neg"> = {
  READY: "pos",
  GENERATING: "accent",
  FAILED: "neg",
};

export function Reports() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>(() => reportService.listReports());
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [preview, setPreview] = useState<Report | null>(null);

  const metrics = portfolioService.getMetrics();
  const analytics = analyticsService.getPerformanceAnalytics();

  async function generate(type: ReportType) {
    setGenerating(type);
    const placeholder: Report = {
      id: `rpt-tmp-${Date.now().toString(36)}`,
      type,
      name: `${reportService.reportTypeLabel(type)} — generating…`,
      period: "—",
      generatedAt: "—",
      status: "GENERATING",
      sizeKb: 0,
    };
    setReports((prev) => [placeholder, ...prev]);
    const report = await reportService.generateReport(type);
    setReports((prev) => prev.map((r) => (r.id === placeholder.id ? report : r)));
    setGenerating(null);
    toast.success("Report ready", `${report.name} generated.`);
  }

  function exportReport(type: ReportType) {
    reportService.exportCsv(type);
    toast.success("Exported CSV", "Download started from verified data.");
  }

  const columns: Column<Report>[] = [
    {
      key: "name",
      header: "Report",
      render: (r) => (
        <div className={styles.nameCell}>
          <span className={styles.name}>{r.name}</span>
          <span className={styles.period}>{r.period}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge tone="neutral" size="sm">
          {reportService.reportTypeLabel(r.type)}
        </Badge>
      ),
    },
    { key: "generatedAt", header: "Generated", mono: true, render: (r) => r.generatedAt },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge tone={statusTone[r.status]} size="sm" dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className={styles.rowActions}>
          <Button
            variant="ghost"
            size="sm"
            icon="eye"
            disabled={r.status !== "READY"}
            onClick={() => setPreview(r)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="download"
            disabled={r.status !== "READY"}
            onClick={() => exportReport(r.type)}
          >
            CSV
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reports"
        title="Reports & Exports"
        subtitle="Generate and export portfolio reports from verified data."
      />

      <section className={styles.typeGrid}>
        {reportTypes.map(({ type, icon, blurb }) => (
          <Card key={type} className={styles.typeCard}>
            <span className={styles.typeIcon}>
              <Icon name={icon} size={18} />
            </span>
            <div className={styles.typeBody}>
              <h3 className={styles.typeTitle}>{reportService.reportTypeLabel(type)}</h3>
              <p className={styles.typeBlurb}>{blurb}</p>
            </div>
            <div className={styles.typeActions}>
              <Button
                variant="secondary"
                size="sm"
                icon="refresh"
                loading={generating === type}
                onClick={() => generate(type)}
              >
                Generate
              </Button>
              <Button variant="ghost" size="sm" icon="download" onClick={() => exportReport(type)}>
                CSV
              </Button>
            </div>
          </Card>
        ))}
      </section>

      <Card padded={false} className={styles.panel}>
        <div className={styles.panelHeader}>
          <CardHeader eyebrow="History" title="Generated Reports" subtitle={`${reports.length} reports`} />
        </div>
        <Table columns={columns} rows={reports} rowKey={(r) => r.id} dense />
      </Card>

      <Drawer open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.name} width={440}>
        {preview && (
          <div className={styles.preview}>
            <div className={styles.previewMeta}>
              <Badge tone="neutral" size="sm">
                {reportService.reportTypeLabel(preview.type)}
              </Badge>
              <span>{preview.period}</span>
              <span>{preview.sizeKb} KB</span>
            </div>
            <div className={styles.previewBlock}>
              <div className={styles.previewRow}>
                <span>Portfolio Value</span>
                <span className="mono">{formatCurrency(metrics.value, { decimals: 0 })}</span>
              </div>
              <div className={styles.previewRow}>
                <span>Total Return</span>
                <span className={`mono ${metrics.totalPnl >= 0 ? "val-pos" : "val-neg"}`}>
                  {formatPct(metrics.totalPnlPct)}
                </span>
              </div>
              <div className={styles.previewRow}>
                <span>Annualised</span>
                <span className="mono">{formatPct(analytics.annualizedReturn)}</span>
              </div>
              <div className={styles.previewRow}>
                <span>Volatility</span>
                <span className="mono">{formatPct(metrics.volatility, { signed: false })}</span>
              </div>
              <div className={styles.previewRow}>
                <span>Sharpe</span>
                <span className="mono">{metrics.sharpe.toFixed(2)}</span>
              </div>
            </div>
            <p className={styles.previewNote}>
              This is a preview of the report header. Export to CSV for the full dataset.
            </p>
            <Button variant="primary" icon="download" onClick={() => exportReport(preview.type)}>
              Export CSV
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
