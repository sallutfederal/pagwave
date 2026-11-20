import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

export function GET() {
  return privateJson(async () => {
    const data = await backendFetch<{
      effectiveFees: Array<{
        transactionType: "WITHDRAWAL" | "DEPOSIT" | "TRANSFER_OUT" | "EXCHANGE";
        currencyCode: string;
        flatFee: number;
        percentFee: number;
        minFee: number;
        maxFee: number | null;
        isActive: boolean;
        source: "USER_CUSTOM" | "PLATFORM_DEFAULT";
        customScope?: "CURRENCY" | "GLOBAL";
        defaultFlatFee: number;
        defaultPercentFee: number;
        defaultMinFee: number;
        defaultMaxFee: number | null;
        defaultIsActive: boolean;
      }>;
      customRules: unknown[];
      customUpdatedAt: string | null;
      customNote: string | null;
      hasCustomFees: boolean;
      platformFeeBps: number;
      currencies: Array<{
        code: string;
        name: string;
        symbol: string;
        decimals: number;
        type: string;
      }>;
    }>("/wallets/fees");

    return { ok: true, ...data };
  });
}
