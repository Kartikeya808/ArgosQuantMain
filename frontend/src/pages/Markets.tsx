import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Sparkline,
  StatusIndicator,
  Table,
  Tabs,
  type Column,
} from "@/components/ui";
import { useApp } from "@/state/AppContext";
import { marketService } from "@/services";
import type { Mover } from "@/types";
import { formatCompact, formatCurrency, formatPct, valueClass } from "@/lib/format";
import styles from "./Markets.module.css";

const statusMap = {
  OPEN: "live",
  CLOSED: "closed",
  PRE_OPEN: "warn",
  POST_CLOSE: "closed",
} as const;

export function Markets() {
  const navigate = useNavigate();
  const { marketStatus } = useApp();
  const [tab, setTab] = useState("gainers");

  const indices = marketService.getIndices();
  const movers: Record<string, Mover[]> = {
    gainers: marketService.getGainers(),
    losers: marketService.getLosers(),
    active: marketService.getMostActive(),
  };

  const columns: Column<Mover>[] = [
    {
      key: "symbol",
      header: "Symbol",
      render: (m) => (
        <div className={styles.symCell}>
          <span className={styles.sym}>{m.symbol}</span>
          <span className={styles.company}>{m.company}</span>
        </div>
      ),
    },
    {
      key: "sector",
      header: "Sector",
      render: (m) => (
        <Badge tone="neutral" size="sm">
          {m.sector}
        </Badge>
      ),
    },
    { key: "ltp", header: "LTP", align: "right", mono: true, render: (m) => formatCurrency(m.ltp) },
    {
      key: "change",
      header: "Change",
      align: "right",
      mono: true,
      render: (m) => (
        <span className={valueClass(m.change)}>{formatCurrency(m.change)}</span>
      ),
    },
    {
      key: "changePct",
      header: "% Chg",
      align: "right",
      mono: true,
      render: (m) => <span className={valueClass(m.changePct)}>{formatPct(m.changePct)}</span>,
    },
    {
      key: "spark",
      header: "Trend",
      align: "center",
      render: (m) => <Sparkline data={m.spark} width={72} height={24} />,
    },
    {
      key: "volume",
      header: "Volume",
      align: "right",
      mono: true,
      render: (m) => formatCompact(m.volume),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Markets"
        title="Market Overview"
        subtitle="Indian indices, movers and most-active securities."
        actions={
          <StatusIndicator
            status={statusMap[marketStatus.state]}
            label={`${marketStatus.label} · ${marketStatus.detail}`}
          />
        }
      />

      <section className={styles.indices}>
        {indices.map((idx) => (
          <Card key={idx.symbol} className={styles.indexCard}>
            <div className={styles.indexTop}>
              <div>
                <span className={styles.indexName}>{idx.symbol}</span>
                <span className={styles.indexFull}>{idx.name}</span>
              </div>
              <Badge tone={idx.changePct >= 0 ? "pos" : "neg"} size="sm">
                {formatPct(idx.changePct)}
              </Badge>
            </div>
            <div className={`${styles.indexValue} mono`}>
              {idx.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className={styles.indexBottom}>
              <span className={`${styles.indexChange} mono ${valueClass(idx.change)}`}>
                {idx.change >= 0 ? "+" : ""}
                {idx.change.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <Sparkline
                data={idx.spark}
                width={96}
                height={28}
                color={idx.changePct >= 0 ? "--pos" : "--neg"}
              />
            </div>
          </Card>
        ))}
      </section>

      <Card padded={false} className={styles.panel}>
        <div className={styles.panelHeader}>
          <CardHeader eyebrow="Market Movers" title="Top Movers" />
          <div className={styles.panelActions}>
            <Tabs
              items={[
                { value: "gainers", label: "Gainers" },
                { value: "losers", label: "Losers" },
                { value: "active", label: "Most Active" },
              ]}
              value={tab}
              onChange={setTab}
            />
            <Button
              variant="ghost"
              size="sm"
              iconRight="chevron-right"
              onClick={() => navigate("/watchlist")}
            >
              Watchlist
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          rows={movers[tab]}
          rowKey={(m) => m.symbol}
          dense
          onRowClick={(m) => navigate(`/stock/${m.symbol}`)}
        />
      </Card>
    </div>
  );
}
