import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { getXPagConfig } from "@/lib/xpag/client";
import { XPAG_CURRENCIES } from "@/lib/xpag/currencies";
import { getUserLedgerBalances } from "@/lib/xpag/store";

export function GET() {
  return xpagPrivateJson(async (userId) => {
    const config = getXPagConfig();
    const ledger = await getUserLedgerBalances(userId);

    const balances: Record<string, { available: number; blocked: number }> = {};
    for (const code of XPAG_CURRENCIES) {
      const entry = ledger.balances[code];
      balances[code] = {
        available: entry?.available ?? 0,
        blocked: entry?.blocked ?? 0,
      };
    }

    const isSandbox =
      ledger.environmentMode === "sandbox"
        ? true
        : ledger.environmentMode === "production"
          ? false
          : config.isSandbox;

    return {
      ok: true,
      ledgerScope: "user" as const,
      isSandbox,
      balances,
      blocked_currencies: ledger.blocked_currencies,
      kycLevel: ledger.kycLevel,
      kycStatus: ledger.kycStatus,
      updated_at: ledger.updated_at,
    };
  });
}
