import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Sparkline,
  Table,
  type Column,
} from "@/components/ui";
import { useApp } from "@/state/AppContext";
import { marketService } from "@/services";
import type { WatchlistItem } from "@/types";
import { formatCompact, formatCurrency, formatPct, valueClass } from "@/lib/format";
import styles from "./Watchlist.module.css";

type Sort = "symbol" | "changePct" | "volume" | "ltp";

export function Watchlist() {
  const navigate = useNavigate();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useApp();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("changePct");

  const addable = useMemo(
    () => marketService.searchStocks("").filter((u) => !watchlist.some((w) => w.symbol === u.symbol)),
    [watchlist]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = watchlist.filter(
      (w) => !q || w.symbol.toLowerCase().includes(q) || w.company.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      if (sort === "symbol") return a.symbol.localeCompare(b.symbol);
      return (b[sort] as number) - (a[sort] as number);
    });
  }, [watchlist, query, sort]);

  const columns: Column<WatchlistItem>[] = [
    {
      key: "symbol",
      header: "Symbol",
      render: (w) => (
        <div className={styles.symCell}>
          <span className={styles.sym}>{w.symbol}</span>
          <span className={styles.company}>{w.company}</span>
        </div>
      ),
    },
    {
      key: "sector",
      header: "Sector",
      render: (w) => (
        <Badge tone="neutral" size="sm">
          {w.sector}
        </Badge>
      ),
    },
    { key: "ltp", header: "LTP", align: "right", mono: true, render: (w) => formatCurrency(w.ltp) },
    {
      key: "change",
      header: "Change",
      align: "right",
      mono: true,
      render: (w) => <span className={valueClass(w.change)}>{formatCurrency(w.change)}</span>,
    },
    {
      key: "changePct",
      header: "% Chg",
      align: "right",
      mono: true,
      render: (w) => <span className={valueClass(w.changePct)}>{formatPct(w.changePct)}</span>,
    },
    {
      key: "spark",
      header: "Trend",
      align: "center",
      render: (w) => <Sparkline data={w.spark} width={72} height={24} />,
    },
    { key: "volume", header: "Volume", align: "right", mono: true, render: (w) => formatCompact(w.volume) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (w) => (
        <div className={styles.rowActions}>
          <Button
            variant="ghost"
            size="sm"
            icon="eye"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/stock/${w.symbol}`);
            }}
            aria-label={`View ${w.symbol}`}
          />
          <Button
            variant="ghost"
            size="sm"
            icon="trash"
            onClick={(e) => {
              e.stopPropagation();
              removeFromWatchlist(w.symbol);
            }}
            aria-label={`Remove ${w.symbol}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Markets"
        title="Watchlist"
        subtitle="Track securities you're considering — not part of your portfolio."
        actions={<Badge tone="accent">{watchlist.length} tracked</Badge>}
      />

      <Card padded={false} className={styles.panel}>
        <div className={styles.toolbar}>
          <Input
            icon="search"
            placeholder="Filter watchlist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sizeVariant="sm"
            className={styles.search}
          />
          <Select
            sizeVariant="sm"
            value=""
            onChange={(e) => e.target.value && setSort(e.target.value as Sort)}
            options={[
              { value: "", label: "Sort by…" },
              { value: "changePct", label: "% Change" },
              { value: "volume", label: "Volume" },
              { value: "ltp", label: "Price" },
              { value: "symbol", label: "Symbol" },
            ]}
          />
          <Select
            sizeVariant="sm"
            value=""
            onChange={(e) => e.target.value && addToWatchlist(e.target.value)}
            options={[
              { value: "", label: "+ Add stock…" },
              ...addable.map((u) => ({ value: u.symbol, label: `${u.symbol} · ${u.company}` })),
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon="watchlist"
              title={watchlist.length === 0 ? "Your watchlist is empty" : "No matches"}
              description={
                watchlist.length === 0
                  ? "Add stocks from Markets or the dropdown above to start tracking them."
                  : "Try a different search term."
              }
              action={
                watchlist.length === 0 ? (
                  <Button variant="secondary" icon="markets" onClick={() => navigate("/markets")}>
                    Browse Markets
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(w) => w.symbol}
            dense
            onRowClick={(w) => navigate(`/stock/${w.symbol}`)}
          />
        )}
      </Card>
    </div>
  );
}
