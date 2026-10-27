import { CardBrandMark, CardMenu } from "@/components/dashboard/card-menu";
import { formatCardNumber, formatCurrency } from "@/lib/format";
import type { BankCard } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function BankCardTile({ card, className }: { card: BankCard; className?: string }) {
  const isDark = card.variant === "dark";

  return (
    <article
      className={cn(
        "relative flex aspect-[1.68/1] flex-col justify-between overflow-hidden rounded-card p-5 transition-transform duration-300 hover:-translate-y-0.5",
        isDark ? "bank-card-dark text-white" : "bank-card-light bg-surface shadow-card text-foreground",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("text-[13px] font-medium", isDark ? "text-white/50" : "text-muted-foreground")}>
          {card.label ?? card.holder}
        </span>
        <CardMenu />
      </div>

      <div>
        <p
          className={cn(
            "text-[26px] leading-none font-semibold tracking-tight tabular-nums",
            isDark ? "text-white" : "text-foreground",
          )}
        >
          {formatCurrency({ amount: card.balance, currency: card.currency })}
        </p>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[15px] font-medium tracking-wide">{formatCardNumber(card.last4)}</p>
          <p className={cn("text-[11px]", isDark ? "text-white/50" : "text-muted-foreground")}>
            {card.expiry}
          </p>
        </div>
        <CardBrandMark brand={card.brand} />
      </div>
    </article>
  );
}

export function BankCardSkeleton() {
  return (
    <div className="bg-surface-subtle aspect-[1.68/1] animate-pulse rounded-card" />
  );
}