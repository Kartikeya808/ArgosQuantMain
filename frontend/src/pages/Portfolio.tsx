import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  MetricCard,
  Select,
  Sparkline,
  Table,
  Tabs,
  type Column,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { TransactionModal } from "@/components/portfolio/TransactionModal";
import { useApp } from "@/state/AppContext";
import { portfolioService } from "@/services";
import type { Holding, Transaction, TransactionStatus } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPct,
  formatSignedCurrency,
  valueClass,
} from "@/lib/format";
import styles from "./Portfolio.module.css";

type HoldingSort = "weight" | "pnl" | "pnlPct" | "value" | "symbol" | "dayChangePct";

const statusTone: Record<TransactionStatus, "pos" | "accent" | "neg"> = {
  SETTLED: "pos",
  PENDING: "accent",
  FAILED: "neg",
};

export function Portfolio() {
  const navigate = useNavigate();
  const { activePortfolio, sessionTransactions } = useApp();

  const [tab, setTab] = useState("holdings");
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("ALL");
  const [sort, setSort] = useState<HoldingSort>("weight");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const holdings = portfolioService.getHoldings();
  const metrics = portfolioService.getMetrics();
  const allTransactions = useMemo(
    () => [...sessionTransactions, ...portfolioService.getTransactions()],
    [sessionTransactions]
  );

  const sectors = useMemo(
    () => ["ALL", ...new Set(holdings.map((h) => h.sector))],
    [holdings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = holdings.filter(
      (h) =>
        (sector === "ALL" || h.sector === sector) &&
        (!q || h.symbol.toLowerCase().includes(q) || h.company.toLowerCase().includes(q))
    );
    rows = [...rows].sort((a, b) => {
      const av = sort === "symbol" ? a.symbol : (a[sort] as number);
      const bv = sort === "symbol" ? b.symbol : (b[sort] as number);
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [holdings, query, sector, sort, dir]);

  function toggleSort(key: HoldingSort) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "symbol" ? "asc" : "desc");
    }
  }

  const sortHeader = (label: string, key: HoldingSort, align: "left" | "right" = "right") => (
    <button
      className={`${styles.sortBtn} ${align === "right" ? styles.sortRight : ""}`}
      onClick={() => toggleSort(key)}
      data-active={sort === key}
    >
      {label}
      <Icon
        name={sort === key ? (dir === "asc" ? "arrow-up" : "arrow-down") : "sort"}
        size={12}
      />
    </button>
  );

  const holdingColumns: Column<Holding>[] = [
    {
      key: "symbol",
      header: sortHeader("Symbol", "symbol", "left"),
      render: (h) => (
        <div className={styles.symCell}>
          <span className={styles.sym}>{h.symbol}</span>
          <span className={styles.company}>{h.company}</span>
        </div>
      ),
    },
    {
      key: "sector",
      header: "Sector",
      render: (h) => (
        <Badge tone="neutral" size="sm">
          {h.sector}
        </Badge>
      ),
    },
    { key: "qty", header: "Qty", align: "right", mono: true, render: (h) => formatNumber(h.quantity) },
    { key: "avg", header: "Avg", align: "right", mono: true, render: (h) => formatCurrency(h.avgPrice) },
    {
      key: "ltp",
      header: sortHeader("LTP", "dayChangePct"),
      align: "right",
      mono: true,
      render: (h) => (
        <div className={styles.ltpCell}>
          <span>{formatCurrency(h.ltp)}</span>
          <span className={`${styles.dayChg} ${valueClass(h.dayChangePct)}`}>
            {formatPct(h.dayChangePct)}
          </span>
        </div>
      ),
    },
    {
      key: "spark",
      header: "7D",
      align: "center",
      render: (h) => <Sparkline data={h.spark} width={64} height={22} />,
    },
    {
      key: "value",
      header: sortHeader("Value", "value"),
      align: "right",
      mono: true,
      render: (h) => formatCurrency(h.value, { decimals: 0 }),
    },
    {
      key: "pnl",
      header: sortHeader("P&L", "pnl"),
      align: "right",
      mono: true,
      render: (h) => (
        <span className={valueClass(h.pnl)}>{formatSignedCurrency(h.pnl, { decimals: 0 })}</span>
      ),
    },
    {
      key: "pnlpct",
      header: sortHeader("P&L %", "pnlPct"),
      align: "right",
      mono: true,
      render: (h) => <span className={valueClass(h.pnlPct)}>{formatPct(h.pnlPct)}</span>,
    },
    {
      key: "weight",
      header: sortHeader("Weight", "weight"),
      align: "right",
      render: (h) => (
        <div className={styles.weightCell}>
          <span className="mono">{formatPct(h.weight, { signed: false, decimals: 1 })}</span>
          <span className={styles.weightTrack}>
            <span className={styles.weightFill} style={{ width: `${Math.min(h.weight * 2.4, 100)}%` }} />
          </span>
        </div>
      ),
    },
  ];

  const txColumns: Column<Transaction>[] = [
    { key: "date", header: "Date", mono: true, render: (t) => formatDate(t.date) },
    {
      key: "symbol",
      header: "Symbol",
      render: (t) => (
        <div className={styles.symCell}>
          <span className={styles.sym}>{t.symbol}</span>
          <span className={styles.company}>{t.company}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (t) => (
        <Badge tone={t.type === "BUY" ? "pos" : "neg"} size="sm">
          {t.type}
        </Badge>
      ),
    },
    { key: "qty", header: "Qty", align: "right", mono: true, render: (t) => formatNumber(t.quantity) },
    { key: "price", header: "Price", align: "right", mono: true, render: (t) => formatCurrency(t.price) },
    {
      key: "value",
      header: "Value",
      align: "right",
      mono: true,
      render: (t) => formatCurrency(t.value, { decimals: 0 }),
    },
    { key: "fees", header: "Fees", align: "right", mono: true, render: (t) => formatCurrency(t.fees) },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (t) => (
        <Badge tone={statusTone[t.status]} size="sm" dot>
          {t.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow={activePortfolio.name}
        title="Portfolio"
        subtitle="Manage holdings, review transactions, and record trades."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
            Add Transaction
          </Button>
        }
      />

      <section className={styles.metrics}>
        <MetricCard
          label="Market Value"
          value={formatCurrency(metrics.value, { decimals: 0 })}
          delta={formatPct(metrics.totalPnlPct)}
          deltaDirection={metrics.totalPnl >= 0 ? "pos" : "neg"}
          icon="portfolio"
          accent
        />
        <MetricCard
          label="Invested"
          value={formatCurrency(metrics.invested, { decimals: 0 })}
          delta="Cost basis"
          deltaDirection="neu"
          icon="portfolio"
        />
        <MetricCard
          label="Unrealised P&L"
          value={formatSignedCurrency(metrics.totalPnl, { decimals: 0 })}
          delta={formatPct(metrics.totalPnlPct)}
          deltaDirection={metrics.totalPnl >= 0 ? "pos" : "neg"}
          icon="trending-up"
        />
        <MetricCard
          label="Positions"
          value={`${holdings.length}`}
          delta={`${sectors.length - 1} sectors`}
          deltaDirection="neu"
          icon="grid"
        />
      </section>

      <Card padded={false} className={styles.panel}>
        <div className={styles.panelHeader}>
          <CardHeader
            eyebrow="Positions"
            title={tab === "holdings" ? "Holdings" : "Transactions"}
            subtitle={
              tab === "holdings"
                ? `${filtered.length} of ${holdings.length} positions`
                : `${allTransactions.length} transactions`
            }
          />
          <Tabs
            items={[
              { value: "holdings", label: "Holdings" },
              { value: "transactions", label: "Transactions" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "holdings" && (
          <>
            <div className={styles.toolbar}>
              <Input
                icon="search"
                placeholder="Search symbol or company…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sizeVariant="sm"
                className={styles.search}
              />
              <Select
                sizeVariant="sm"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                options={sectors.map((s) => ({ value: s, label: s === "ALL" ? "All sectors" : s }))}
              />
            </div>
            <Table
              columns={holdingColumns}
              rows={filtered}
              rowKey={(h) => h.symbol}
              dense
              onRowClick={(h) => navigate(`/stock/${h.symbol}`)}
              emptyLabel="No holdings match your filters."
            />
          </>
        )}

        {tab === "transactions" && (
          <Table
            columns={txColumns}
            rows={allTransactions}
            rowKey={(t) => t.id}
            dense
            onRowClick={(t) => navigate(`/stock/${t.symbol}`)}
            emptyLabel="No transactions yet."
          />
        )}
      </Card>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
