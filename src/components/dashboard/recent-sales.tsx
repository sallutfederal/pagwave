import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Sale, SaleStatus } from "@/lib/schemas";

const statusConfig: Record<SaleStatus, { tone: "success" | "warning" | "danger"; icon: typeof CheckCircle2 }> = {
  Success: { tone: "success", icon: CheckCircle2 },
  Process: { tone: "warning", icon: Clock },
  Failed: { tone: "danger", icon: XCircle },
};

export function RecentSales({ sales }: { sales: Sale[] }) {
  if (sales.length === 0) {
    return (
      <Card className="border-dashed px-4 py-8 text-center text-xs text-muted-foreground">
        No sales recorded yet. Merchant checkouts and customer payments will appear here.
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="border-line text-muted-foreground hidden grid-cols-[minmax(0,1fr)_110px_120px_100px] gap-4 border-b px-2 pb-3 text-[11px] font-medium sm:grid">
        <span>Customer</span>
        <span>Date</span>
        <span>Status</span>
        <span>Amount</span>
      </div>

      <ul className="divide-line divide-y">
        {sales.map((sale) => {
          const status = statusConfig[sale.status];
          const StatusIcon = status.icon;

          return (
            <li
              key={sale.id}
              className="hover:bg-surface-hover/70 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-xl px-2 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_110px_120px_100px]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar data={sale.customer.avatar} name={sale.customer.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-foreground truncate text-[13px] font-medium">{sale.customer.name}</p>
                  <p className="text-muted-foreground truncate text-[11px]">{sale.customer.email}</p>
                </div>
              </div>

              <span className="text-muted-foreground hidden text-xs sm:block">
                {formatDate(sale.date)}
              </span>

              {/* Mobile: badge above amount on the right. Desktop: its own column. */}
              <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3 sm:row-start-1 sm:justify-self-start">
                <Badge tone={status.tone}>
                  <StatusIcon className="size-3" />
                  {sale.status}
                </Badge>
              </div>

              <span className="text-foreground col-start-2 row-start-2 justify-self-end text-[13px] font-semibold tabular-nums sm:col-start-4 sm:row-start-1 sm:justify-self-start">
                {formatCurrency(
                  { amount: sale.amount, currency: sale.currency },
                  { signBeforeSymbol: true, useGrouping: false },
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}