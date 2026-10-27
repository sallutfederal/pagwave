import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Sale, SaleStatus } from "@/lib/schemas";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const statusConfig: Record<SaleStatus, { tone: "success" | "warning" | "danger"; icon: typeof CheckCircle2 }> = {
  Success: { tone: "success", icon: CheckCircle2 },
  Process: { tone: "warning", icon: Clock },
  Failed: { tone: "danger", icon: XCircle },
};

export function RecentSales({ sales }: { sales: Sale[] }) {
  return (
    <section>
      <div className="text-muted-foreground hidden grid-cols-[minmax(0,1fr)_110px_120px_100px] gap-4 px-1 pb-3 text-[11px] font-medium sm:grid">
        <span>Customer</span>
        <span>Date</span>
        <span>Status</span>
        <span>Amount</span>
      </div>

      <ul className="space-y-1">
        {sales.map((sale) => {
          const status = statusConfig[sale.status];
          const StatusIcon = status.icon;

          return (
            <li
              key={sale.id}
              className="hover:bg-surface/70 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-2xl px-1 py-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_110px_120px_100px]"
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
    </section>
  );
}