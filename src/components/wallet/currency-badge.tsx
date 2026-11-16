"use client";

import { CountryFlag } from "@/components/landing/country-flag";
import { CURRENCY_SPECS, type XPagCurrency } from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type CurrencyBadgeProps = {
  currency: XPagCurrency;
  className?: string;
  showNetwork?: boolean;
};

function UsdtIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
    >
      <circle cx="12" cy="12" r="11" fill="#26A17B" />
      <circle cx="12" cy="12" r="10.5" stroke="white" strokeOpacity="0.18" />
      <path
        d="M7.25 7.4h9.5v2.2h-3.45v2.15c2.45.14 4.25.63 4.25 1.22 0 .61-1.85 1.11-4.35 1.24V18.2h-2.4v-3.99c-2.5-.13-4.35-.63-4.35-1.24 0-.59 1.8-1.08 4.25-1.22V9.6H7.25V7.4Zm4.75 5.05c2.2 0 3.72-.34 3.72-.68 0-.31-1.22-.6-3.05-.67v1.11c-.22.02-.44.03-.67.03-.23 0-.45-.01-.67-.03v-1.11c-1.83.07-3.05.36-3.05.67 0 .34 1.52.68 3.72.68Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function UsdcIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
    >
      <circle cx="12" cy="12" r="11" fill="#2775CA" />
      <circle cx="12" cy="12" r="10.5" stroke="white" strokeOpacity="0.18" />
      <path
        d="M9.1 6.65A5.8 5.8 0 0 0 6.2 12a5.8 5.8 0 0 0 2.9 5.35"
        stroke="#FFFFFF"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M14.9 6.65A5.8 5.8 0 0 1 17.8 12a5.8 5.8 0 0 1-2.9 5.35"
        stroke="#FFFFFF"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M12 6.8v10.4M14.05 9.65c0-.9-.88-1.5-2.05-1.5-1.18 0-2 .58-2 1.45 0 .88.74 1.24 2.02 1.52 1.32.28 2.15.72 2.15 1.72 0 .95-.9 1.66-2.17 1.66-1.25 0-2.15-.64-2.22-1.6"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CurrencyIcon({
  currency,
  className,
}: {
  currency: XPagCurrency;
  className?: string;
}) {
  const spec = CURRENCY_SPECS[currency];

  return (
    <span
      className={cn(
        "bg-surface-subtle border-line inline-flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-xs",
        className,
      )}
    >
      {spec.flag ? (
        <CountryFlag code={spec.flag} className="h-[15px] w-5 rounded-[3px]" />
      ) : currency === "USDT" ? (
        <UsdtIcon />
      ) : (
        <UsdcIcon />
      )}
    </span>
  );
}

export function CurrencyBadge({
  currency,
  className,
  showNetwork = true,
}: CurrencyBadgeProps) {
  const spec = CURRENCY_SPECS[currency];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <CurrencyIcon currency={currency} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground text-sm font-semibold">{spec.code}</span>
          {spec.cryptoBadge ? (
            <span className="border-line bg-surface-subtle text-muted-foreground shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
              {spec.cryptoBadge}
            </span>
          ) : null}
        </div>
        {showNetwork ? (
          <p className="text-muted-foreground truncate text-[11px]">{spec.railSummary}</p>
        ) : null}
      </div>
    </div>
  );
}
