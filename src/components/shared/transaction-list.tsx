import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { Transaction } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";

export function TransactionListItem({
  transaction,
  showDate = false,
}: {
  transaction: Transaction;
  showDate?: boolean;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Avatar data={transaction.avatar} name={transaction.title} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-foreground truncate text-[13px] font-medium">{transaction.title}</p>
          {showDate ? (
            <span className="text-subtle-foreground shrink-0 text-[11px]">
              {formatDate(transaction.date)}
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
          {formatCurrency(
            { amount: transaction.amount, currency: transaction.currency, fractionDigits: 0 },
            { showSymbol: false, useGrouping: false },
          )}
        </span>
        <Badge tone={statusTone(transaction.status)} className="px-2 py-0.5 text-[10px]">
          {transaction.status}
        </Badge>
      </div>
    </Card>
  );
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionListItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}