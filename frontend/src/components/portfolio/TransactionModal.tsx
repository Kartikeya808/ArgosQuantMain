import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/state/AppContext";
import { marketService } from "@/services";
import { getHolding } from "@/services/portfolioService";
import type { TransactionType } from "@/types";
import { formatCurrency } from "@/lib/format";
import styles from "./TransactionModal.module.css";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  defaultSymbol?: string;
}

const today = new Date().toISOString().slice(0, 10);

export function TransactionModal({ open, onClose, defaultSymbol }: TransactionModalProps) {
  const toast = useToast();
  const { addTransaction } = useApp();
  const universe = marketService.searchStocks("");

  const [type, setType] = useState<TransactionType>("BUY");
  const [symbol, setSymbol] = useState(defaultSymbol ?? universe[0].symbol);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today);
  const [fees, setFees] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const selected = universe.find((u) => u.symbol === symbol);
  const held = getHolding(symbol);

  // prefill price with LTP when switching symbol if blank
  const qtyNum = Number(quantity);
  const priceNum = Number(price);
  const feesNum = Number(fees) || 0;
  const gross = qtyNum > 0 && priceNum > 0 ? qtyNum * priceNum : 0;
  const net = type === "BUY" ? gross + feesNum : gross - feesNum;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!quantity || qtyNum <= 0 || !Number.isInteger(qtyNum))
      e.quantity = "Enter a whole quantity greater than 0.";
    if (!price || priceNum <= 0) e.price = "Enter a price greater than 0.";
    if (date > today) e.date = "Trade date can't be in the future.";
    if (type === "SELL" && held && qtyNum > held.quantity)
      e.quantity = `You only hold ${held.quantity} ${symbol}.`;
    if (type === "SELL" && !held) e.quantity = `No open position in ${symbol} to sell.`;
    return e;
  }, [quantity, price, date, type, qtyNum, priceNum, held, symbol]);

  const valid = Object.keys(errors).length === 0;

  function reset() {
    setType("BUY");
    setSymbol(defaultSymbol ?? universe[0].symbol);
    setQuantity("");
    setPrice("");
    setDate(today);
    setFees("");
    setNotes("");
    setTouched(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    setTouched(true);
    if (!valid) {
      toast.error("Check the highlighted fields", "The order couldn't be placed.");
      return;
    }
    addTransaction({
      symbol,
      type,
      quantity: qtyNum,
      price: priceNum,
      date,
      fees: feesNum,
      notes: notes.trim() || undefined,
    });
    toast.success(
      `${type === "BUY" ? "Bought" : "Sold"} ${qtyNum} ${symbol}`,
      `${formatCurrency(net, { decimals: 0 })} ${type === "BUY" ? "deployed" : "realised"} · settled (mock).`
    );
    handleClose();
  }

  const show = (field: string) => touched && errors[field];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Transaction"
      subtitle="Record a buy or sell against your portfolio"
      width={520}
      footer={
        <div className={styles.footer}>
          <div className={styles.footerSummary}>
            <span className={styles.footerLabel}>
              {type === "BUY" ? "Net outlay" : "Net proceeds"}
            </span>
            <span className={`${styles.footerValue} mono`}>
              {formatCurrency(net, { decimals: 0 })}
            </span>
          </div>
          <div className={styles.footerActions}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant={type === "SELL" ? "danger" : "primary"}
              icon={type === "BUY" ? "plus" : "minus"}
              onClick={handleSubmit}
              disabled={touched && !valid}
            >
              {type === "BUY" ? "Place Buy" : "Place Sell"}
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.form}>
        <Tabs
          variant="segmented"
          items={[
            { value: "BUY", label: "Buy" },
            { value: "SELL", label: "Sell" },
          ]}
          value={type}
          onChange={(v) => setType(v as TransactionType)}
        />

        <label className={styles.field}>
          <span className={styles.label}>Stock</span>
          <Select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            options={universe.map((u) => ({
              value: u.symbol,
              label: `${u.symbol} · ${u.company}`,
            }))}
          />
          {selected && (
            <span className={styles.hint}>
              LTP {formatCurrency(selected.ltp)} · {selected.sector}
              {held && (
                <Badge tone="neutral" size="sm">
                  Holding {held.quantity}
                </Badge>
              )}
            </span>
          )}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Quantity</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={quantity}
              invalid={Boolean(show("quantity"))}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {show("quantity") && <span className={styles.error}>{errors.quantity}</span>}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Price (₹)</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={selected ? String(selected.ltp) : "0.00"}
              value={price}
              invalid={Boolean(show("price"))}
              onChange={(e) => setPrice(e.target.value)}
            />
            {show("price") && <span className={styles.error}>{errors.price}</span>}
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Date</span>
            <Input
              type="date"
              value={date}
              max={today}
              invalid={Boolean(show("date"))}
              onChange={(e) => setDate(e.target.value)}
            />
            {show("date") && <span className={styles.error}>{errors.date}</span>}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Fees &amp; taxes (₹)</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Notes (optional)</span>
          <Input
            placeholder="e.g. rebalancing, SIP tranche…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Gross value</span>
            <span className="mono">{formatCurrency(gross, { decimals: 0 })}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>{type === "BUY" ? "+ Fees" : "− Fees"}</span>
            <span className="mono">{formatCurrency(feesNum, { decimals: 0 })}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
