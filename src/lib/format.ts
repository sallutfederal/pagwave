type Currency = {
  amount: number;
  currency: string;
  /** Keeps the reference formatting: `$ 15,780.0` / `₺ 123,424.0` */
  fractionDigits?: 0 | 1 | 2;
};

type CurrencyOptions = {
  /** `$ 15,780.0` (default) vs `$15,780.0` */
  symbolSpacing?: boolean;
  /** `-$1,910.0` (default) vs `$-1,910.0` */
  signBeforeSymbol?: boolean;
  /** Hide the symbol entirely — the reference transaction column shows `-3215`. */
  showSymbol?: boolean;
  /** Reference money columns keep raw digits: `-$1910.0`, not `-$1,910.0`. */
  useGrouping?: boolean;
};

/** Formats money with symbol, thousands separator and (by default) one decimal. */
export function formatCurrency(
  { amount, currency, fractionDigits = 1 }: Currency,
  {
    symbolSpacing = true,
    signBeforeSymbol = false,
    showSymbol = true,
    useGrouping = true,
  }: CurrencyOptions = {},
) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? "-" : "";
  const symbol = showSymbol ? currencySymbol(currency, symbolSpacing) : "";

  return signBeforeSymbol ? `${sign}${symbol}${formatted}` : `${symbol}${sign}${formatted}`;
}

export function currencySymbol(currency: string, spaced = true) {
  switch (currency) {
    case "USD":
      return spaced ? "$ " : "$";
    case "EUR":
      return spaced ? "€ " : "€";
    case "BRL":
      return spaced ? "R$ " : "R$";
    case "USDT":
    case "USDC":
      // No single-glyph convention that renders everywhere: the code is unambiguous.
      return spaced ? `${currency} ` : currency;
    default:
      return spaced ? `${currency} ` : currency;
  }
}

/** `Mar 18, 2023` — matches the date column of the reference. */
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** `•••• 1810` */
export function formatCardNumber(last4: string) {
  return `•••• ${last4}`;
}