"use client";

import { ArrowDownLeft, ArrowUpRight, Receipt, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { Transaction } from "@/lib/schemas";

const ALL = "all";

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "in" | "out" | "neutral";
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={
          tone === "in"
            ? "bg-success-soft text-success grid size-11 shrink-0 place-items-center rounded-2xl"
            : tone === "out"
              ? "bg-danger-soft text-danger grid size-11 shrink-0 place-items-center rounded-2xl"
              : "bg-accent-soft text-accent grid size-11 shrink-0 place-items-center rounded-2xl"
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground truncate text-[15px] font-semibold tabular-nums">{value}</p>
      </div>
    </Card>
  );
}

export function TransactionsView({ transactions }: { transactions: Transaction[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesStatus = status === ALL || transaction.status === status;
      const matchesQuery =
        needle.length === 0 ||
        [transaction.title, transaction.subtitle, transaction.category, transaction.method]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesStatus && matchesQuery;
    });
  }, [query, status, transactions]);

  const { totalIn, totalOut, count } = useMemo(
    () => ({
      totalIn: transactions
        .filter((item) => item.direction === "in")
        .reduce((sum, item) => sum + Math.abs(item.amount), 0),
      totalOut: transactions
        .filter((item) => item.direction === "out")
        .reduce((sum, item) => sum + Math.abs(item.amount), 0),
      count: transactions.length,
    }),
    [transactions],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile
          icon={<ArrowDownLeft className="size-5" />}
          label="Money in"
          value={formatCurrency({ amount: totalIn, currency: "USD", fractionDigits: 0 })}
          tone="in"
        />
        <SummaryTile
          icon={<ArrowUpRight className="size-5" />}
          label="Money out"
          value={formatCurrency({ amount: totalOut, currency: "USD", fractionDigits: 0 })}
          tone="out"
        />
        <SummaryTile
          icon={<Receipt className="size-5" />}
          label="Transactions"
          value={String(count)}
          tone="neutral"
        />
      </div>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <Search className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by merchant, category or method"
              className="pl-10"
            />
          </label>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by status" className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-muted-foreground text-xs tabular-nums">
            {filtered.length} of {transactions.length}
          </span>
        </div>

        <div className="text-muted-foreground hidden grid-cols-[minmax(0,1fr)_130px_140px_110px_90px] gap-4 border-b pb-3 text-[11px] font-medium md:grid">
          <span>Transaction</span>
          <span>Date</span>
          <span>Method</span>
          <span>Status</span>
          <span>Amount</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No transactions match your filters.
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {filtered.map((transaction) => (
              <li
                key={transaction.id}
                className="hover:bg-surface-subtle/60 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-xl px-2 py-3 transition-colors md:grid-cols-[minmax(0,1fr)_130px_140px_110px_90px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar data={transaction.avatar} name={transaction.title} size="sm" />
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-[13px] font-medium">
                      {transaction.title}
                    </p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {transaction.category} · {transaction.subtitle}
                    </p>
                  </div>
                </div>

                <span className="text-muted-foreground hidden text-xs md:block">
                  {formatDate(transaction.date)}
                </span>

                <span className="text-muted-foreground hidden text-xs md:block">
                  {transaction.method}
                </span>

                <div className="col-start-2 row-start-1 justify-self-end md:col-start-4 md:row-start-1 md:justify-self-start">
                  <Badge tone={statusTone(transaction.status)}>{transaction.status}</Badge>
                </div>

                <span
                  className={
                    transaction.direction === "in"
                      ? "text-success col-start-2 row-start-2 justify-self-end text-[13px] font-semibold tabular-nums md:col-start-5 md:row-start-1 md:justify-self-start"
                      : "text-foreground col-start-2 row-start-2 justify-self-end text-[13px] font-semibold tabular-nums md:col-start-5 md:row-start-1 md:justify-self-start"
                  }
                >
                  {transaction.direction === "in" ? "+" : ""}
                  {formatCurrency(
                    {
                      amount: transaction.amount,
                      currency: transaction.currency,
                      fractionDigits: 0,
                    },
                    { showSymbol: false, useGrouping: false },
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}