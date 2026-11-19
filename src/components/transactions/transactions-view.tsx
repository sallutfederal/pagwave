"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  formatLocaleDate,
  formatLocaleDateTime,
  translateCategory,
} from "@/lib/i18n";
import type { Transaction } from "@/lib/schemas";
import { statusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

const ALL = "all";
const PAGE_SIZE = 15;

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function SummaryTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "in" | "out" | "net" | "neutral";
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl border",
          tone === "in" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
          tone === "out" && "border-rose-500/25 bg-rose-500/10 text-rose-400",
          tone === "net" && "border-accent/25 bg-accent-soft text-accent",
          tone === "neutral" && "border-line bg-surface-subtle text-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground mt-0.5 truncate font-mono text-lg font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-subtle-foreground truncate text-[11px]">{hint}</p>
      </div>
    </Card>
  );
}

function TxDirectionIcon({ tx }: { tx: Transaction }) {
  const isExchange = tx.category === "Exchange";
  if (isExchange) {
    return (
      <span className="border-line bg-surface-subtle text-accent grid size-9 shrink-0 place-items-center rounded-xl border">
        <ArrowLeftRight className="size-4" />
      </span>
    );
  }
  if (tx.direction === "in") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
        <ArrowDownLeft className="size-4" />
      </span>
    );
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
      <ArrowUpRight className="size-4" />
    </span>
  );
}

export function TransactionsView({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const { locale, messages } = useI18n();
  const mt = messages.transactions;

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<"all" | "in" | "out">("all");
  const [status, setStatus] = useState<string>(ALL);
  const [currencyFilter, setCurrencyFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const availableCurrencies = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.currency))).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (direction !== "all" && tx.direction !== direction) return false;
      if (status !== ALL && tx.status !== status) return false;
      if (currencyFilter !== ALL && tx.currency !== currencyFilter) return false;
      if (!needle) return true;

      const translatedCategory = translateCategory(tx.category, locale);
      return [tx.title, tx.subtitle, tx.category, translatedCategory, tx.method, tx.currency]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [transactions, query, direction, status, currencyFilter, locale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const { totalIn, totalOut, netFlow } = useMemo(() => {
    let inSum = 0;
    let outSum = 0;

    for (const item of filtered) {
      if (item.direction === "in") {
        inSum += Math.abs(item.usdAmount ?? 0);
      } else {
        outSum += Math.abs(item.usdAmount ?? 0);
      }
    }

    return {
      totalIn: inSum,
      totalOut: outSum,
      netFlow: inSum - outSum,
    };
  }, [filtered]);

  const hasActiveFilters =
    query.trim().length > 0 || direction !== "all" || status !== ALL || currencyFilter !== ALL;

  function clearFilters() {
    setQuery("");
    setDirection("all");
    setStatus(ALL);
    setCurrencyFilter(ALL);
    setPage(1);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/transactions", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json().catch(() => null)) as {
        transactions?: Transaction[];
      } | null;
      if (json?.transactions) {
        setTransactions(json.transactions);
        setPage(1);
      }
    } finally {
      setRefreshing(false);
    }
  }

  function handleExportCsv() {
    const header = [
      mt.colDate,
      mt.colReference,
      mt.colMovement,
      mt.detailCategory,
      mt.colMethod,
      mt.dirIn + "/" + mt.dirOut,
      "Currency",
      mt.colAmount,
      mt.detailUsdRef,
      mt.colStatus,
    ];
    const rows = filtered.map((tx) => [
      formatLocaleDateTime(tx.date, locale),
      tx.subtitle,
      tx.title,
      translateCategory(tx.category, locale),
      tx.method,
      tx.direction === "in" ? mt.dirIn : mt.dirOut,
      tx.currency,
      tx.amount,
      tx.usdAmount ?? "",
      messages.status[tx.status] ?? tx.status,
    ]);

    const csv = [header, ...rows]
      .map((cols) => cols.map(escapeCsvCell).join(","))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagwave-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copyReference(value: string) {
    await navigator.clipboard?.writeText(value);
    setCopiedRef(value);
    setTimeout(() => setCopiedRef(null), 1500);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mt.title}
        description={mt.subtitle}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              {mt.refresh}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
            >
              <Download className="size-3.5" />
              {mt.exportCsv}
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          icon={<ArrowDownLeft className="size-5" />}
          label={`${mt.kpiInflow} (USD)`}
          value={formatCurrency({ amount: totalIn, currency: "USD", fractionDigits: 2 })}
          hint={mt.kpiInflowHint}
          tone="in"
        />
        <SummaryTile
          icon={<ArrowUpRight className="size-5" />}
          label={`${mt.kpiOutflow} (USD)`}
          value={formatCurrency({ amount: totalOut, currency: "USD", fractionDigits: 2 })}
          hint={mt.kpiOutflowHint}
          tone="out"
        />
        <SummaryTile
          icon={<TrendingUp className="size-5" />}
          label={`${mt.kpiNet} (USD)`}
          value={formatCurrency(
            { amount: netFlow, currency: "USD", fractionDigits: 2 },
            { signBeforeSymbol: true },
          )}
          hint={mt.kpiNetHint}
          tone="net"
        />
        <SummaryTile
          icon={<Receipt className="size-5" />}
          label={mt.kpiCount}
          value={String(filtered.length)}
          hint={`${filtered.length} ${mt.kpiCountOf} ${transactions.length}`}
          tone="neutral"
        />
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <label className="relative min-w-60 flex-1 max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={mt.searchPlaceholder}
              className="bg-surface-subtle border-line text-foreground h-10 rounded-full pl-10 text-xs"
            />
          </label>

          <div className="bg-surface-subtle border-line inline-flex items-center gap-1 rounded-full border p-1">
            {(
              [
                { id: "all", label: mt.dirAll },
                { id: "in", label: mt.dirIn },
                { id: "out", label: mt.dirOut },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setDirection(pill.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  direction === pill.id
                    ? "bg-accent text-accent-fg shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label={mt.allStatuses}
              className="bg-surface-subtle border-line h-10 w-40 rounded-full px-3.5 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{mt.allStatuses}</SelectItem>
              <SelectItem value="Completed">{messages.status.Completed}</SelectItem>
              <SelectItem value="Pending">{messages.status.Pending}</SelectItem>
              <SelectItem value="Failed">{messages.status.Failed}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currencyFilter}
            onValueChange={(value) => {
              setCurrencyFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label={mt.allCurrencies}
              className="bg-surface-subtle border-line h-10 w-40 rounded-full px-3.5 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{mt.allCurrencies}</SelectItem>
              {availableCurrencies.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 rounded-full px-3 text-xs"
            >
              <X className="size-3.5" />
              {mt.clearFilters}
            </Button>
          ) : null}
        </div>

        <span className="text-muted-foreground text-xs tabular-nums">
          {filtered.length} {mt.kpiCountOf} {transactions.length}
        </span>
      </div>

      {/* Table card */}
      <Card className="overflow-hidden p-0">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <span className="bg-surface-subtle border-line text-muted-foreground grid size-12 place-items-center rounded-2xl border">
              <Receipt className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">
                {transactions.length === 0 ? mt.emptyAllTitle : mt.emptyFilteredTitle}
              </p>
              <p className="text-muted-foreground text-xs">
                {transactions.length === 0 ? mt.emptyAllDesc : mt.emptyFilteredDesc}
              </p>
            </div>
            {transactions.length === 0 ? (
              <Link
                href="/wallet"
                className={buttonVariants({ size: "sm", variant: "outline", className: "mt-1" })}
              >
                {mt.goToWallet}
              </Link>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                {mt.clearFilters}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/10 bg-white/[0.02] text-[11px] font-medium uppercase tracking-wide">
                    <th className="px-5 py-3.5">{mt.colMovement}</th>
                    <th className="px-4 py-3.5">{mt.colReference}</th>
                    <th className="px-4 py-3.5">{mt.colDate}</th>
                    <th className="px-4 py-3.5">{mt.colMethod}</th>
                    <th className="px-4 py-3.5">{mt.colStatus}</th>
                    <th className="px-5 py-3.5 text-right">{mt.colAmount}</th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {paginated.map((tx) => {
                    const catLabel = translateCategory(tx.category, locale);
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-surface-subtle/70 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <TxDirectionIcon tx={tx} />
                            <div className="min-w-0">
                              <p className="text-foreground max-w-xs truncate text-[13px] font-medium">
                                {tx.title}
                              </p>
                              <p className="text-muted-foreground text-[11px]">{catLabel}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {tx.subtitle}
                          </span>
                        </td>

                        <td className="text-muted-foreground px-4 py-3.5 whitespace-nowrap">
                          {formatLocaleDate(tx.date, locale)}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="border-line bg-surface-subtle text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px]">
                            <span className="font-mono font-semibold">{tx.currency}</span>
                            <span className="text-muted-foreground">· {tx.method}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge tone={statusTone(tx.status)}>
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                tx.status === "Completed" && "bg-emerald-400",
                                tx.status === "Pending" && "bg-amber-400",
                                tx.status === "Failed" && "bg-rose-400",
                              )}
                            />
                            {messages.status[tx.status] ?? tx.status}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <p
                            className={cn(
                              "font-mono text-[13px] font-semibold tabular-nums",
                              tx.direction === "in" ? "text-emerald-400" : "text-foreground",
                            )}
                          >
                            {tx.direction === "in" ? "+" : ""}
                            {formatCurrency(
                              {
                                amount: tx.amount,
                                currency: tx.currency,
                                fractionDigits: 2,
                              },
                              { signBeforeSymbol: true },
                            )}
                          </p>
                          {tx.usdAmount !== null ? (
                            <p className="text-subtle-foreground font-mono text-[10px] tabular-nums">
                              ≈{" "}
                              {formatCurrency(
                                {
                                  amount: Math.abs(tx.usdAmount),
                                  currency: "USD",
                                  fractionDigits: 2,
                                },
                                { signBeforeSymbol: true },
                              )}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-line divide-y md:hidden">
              {paginated.map((tx) => {
                const catLabel = translateCategory(tx.category, locale);
                return (
                  <li
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-surface-subtle/60 flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <TxDirectionIcon tx={tx} />
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-[13px] font-medium">
                          {tx.title}
                        </p>
                        <p className="text-muted-foreground truncate text-[11px]">
                          {catLabel} · {formatLocaleDate(tx.date, locale)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "font-mono text-[13px] font-semibold tabular-nums",
                          tx.direction === "in" ? "text-emerald-400" : "text-foreground",
                        )}
                      >
                        {tx.direction === "in" ? "+" : ""}
                        {formatCurrency(
                          {
                            amount: tx.amount,
                            currency: tx.currency,
                            fractionDigits: 2,
                          },
                          { signBeforeSymbol: true },
                        )}
                      </p>
                      <Badge tone={statusTone(tx.status)} className="mt-1">
                        {messages.status[tx.status] ?? tx.status}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 ? (
              <div className="border-line flex items-center justify-between border-t px-5 py-3 text-xs">
                <span className="text-muted-foreground tabular-nums">
                  {mt.pageOf} {safePage} {mt.kpiCountOf} {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                    {mt.prev}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {mt.next}
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* Transaction detail modal */}
      <Dialog open={Boolean(selectedTx)} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent>
          {selectedTx ? (
            <>
              <div className="flex items-start gap-3.5 pr-8">
                <TxDirectionIcon tx={selectedTx} />
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base">{selectedTx.title}</DialogTitle>
                  <DialogDescription>
                    {translateCategory(selectedTx.category, locale)} ·{" "}
                    {formatLocaleDateTime(selectedTx.date, locale)}
                  </DialogDescription>
                </div>
              </div>

              <div className="bg-surface-subtle border-line mt-5 flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="text-muted-foreground text-[11px]">{mt.colAmount}</p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-2xl font-semibold tabular-nums",
                      selectedTx.direction === "in" ? "text-emerald-400" : "text-foreground",
                    )}
                  >
                    {selectedTx.direction === "in" ? "+" : ""}
                    {formatCurrency(
                      {
                        amount: selectedTx.amount,
                        currency: selectedTx.currency,
                        fractionDigits: 2,
                      },
                      { signBeforeSymbol: true },
                    )}
                  </p>
                  {selectedTx.usdAmount !== null ? (
                    <p className="text-subtle-foreground mt-0.5 font-mono text-xs tabular-nums">
                      {mt.detailUsdRef}:{" "}
                      {formatCurrency(
                        {
                          amount: Math.abs(selectedTx.usdAmount),
                          currency: "USD",
                          fractionDigits: 2,
                        },
                        { signBeforeSymbol: true },
                      )}
                    </p>
                  ) : null}
                </div>
                <Badge tone={statusTone(selectedTx.status)}>
                  {messages.status[selectedTx.status] ?? selectedTx.status}
                </Badge>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="border-line bg-surface-subtle flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground">{mt.detailReference}</span>
                  <button
                    type="button"
                    onClick={() => void copyReference(selectedTx.subtitle)}
                    className="text-foreground inline-flex items-center gap-1.5 font-mono hover:underline"
                  >
                    {selectedTx.subtitle}
                    {copiedRef === selectedTx.subtitle ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5 opacity-60" />
                    )}
                  </button>
                </div>

                <div className="border-line bg-surface-subtle flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground">{mt.detailMethod}</span>
                  <span className="text-foreground font-medium">
                    {selectedTx.currency} · {selectedTx.method}
                  </span>
                </div>

                <div className="border-line bg-surface-subtle flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5">
                  <span className="text-muted-foreground">{mt.detailCategory}</span>
                  <span className="text-foreground font-medium">
                    {translateCategory(selectedTx.category, locale)}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
