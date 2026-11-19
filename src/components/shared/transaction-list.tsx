"use client";

import { useI18n } from "@/components/locale-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { formatLocaleDate } from "@/lib/i18n";
import type { Transaction } from "@/lib/schemas";
import { statusTone } from "@/lib/status";

export function TransactionListItem({
  transaction,
  showDate = false,
}: {
  transaction: Transaction;
  showDate?: boolean;
}) {
  const { locale, messages } = useI18n();

  return (
    <Card className="flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-[1px] hover:border-foreground/20">
      <Avatar data={transaction.avatar} name={transaction.title} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-foreground truncate text-[13px] font-medium">{transaction.title}</p>
          {showDate ? (
            <span className="text-subtle-foreground shrink-0 text-[11px]">
              {formatLocaleDate(transaction.date, locale)}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground truncate text-[11px]">{transaction.subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={
            transaction.direction === "in"
              ? "text-success text-[13px] font-semibold tabular-nums"
              : "text-foreground text-[13px] font-semibold tabular-nums"
          }
        >
          {transaction.direction === "in" ? "+" : ""}
          {formatCurrency(
            { amount: transaction.amount, currency: transaction.currency, fractionDigits: 2 },
            { signBeforeSymbol: true },
          )}
        </span>
        <Badge tone={statusTone(transaction.status)} className="px-2 py-0.5 text-[10px]">
          {messages.status[transaction.status]}
        </Badge>
      </div>
    </Card>
  );
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const { messages } = useI18n();

  if (transactions.length === 0) {
    return (
      <Card className="text-muted-foreground p-6 text-center text-xs">
        {messages.dashboard.recentTransactionsEmpty}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionListItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
