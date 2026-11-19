"use client";

import { useI18n } from "@/components/locale-provider";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Wallet } from "@/lib/schemas";

/** One balance per currency: fiat and crypto side by side. */
export function WalletsStrip({ wallets }: { wallets: Wallet[] }) {
  const { messages } = useI18n();

  if (wallets.length === 0) {
    return (
      <Card className="text-muted-foreground p-5 text-sm">
        {messages.dashboard.walletsEmpty}
      </Card>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {wallets.map((wallet) => (
        <li key={wallet.id}>
          <Card className="space-y-1.5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground truncate text-xs">{wallet.currencyName}</span>
              <span className="bg-surface-subtle border-line text-foreground/80 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                {wallet.currency}
              </span>
            </div>
            <p className="text-foreground truncate text-[17px] font-semibold tabular-nums">
              {formatCurrency({
                amount: wallet.available,
                currency: wallet.currency,
                fractionDigits: 2,
              })}
            </p>
            {wallet.frozen > 0 ? (
              <p className="text-muted-foreground text-[11px] tabular-nums">
                {formatCurrency({
                  amount: wallet.frozen,
                  currency: wallet.currency,
                  fractionDigits: 2,
                })}{" "}
                {messages.dashboard.onHold}
              </p>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
