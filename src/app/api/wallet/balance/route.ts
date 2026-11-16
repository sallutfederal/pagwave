import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { getXPagBalance, getXPagConfig } from "@/lib/xpag/client";

export function GET() {
  return xpagPrivateJson(async () => {
    const config = getXPagConfig();
    const balance = await getXPagBalance();
    return {
      ...balance,
      isSandbox: balance.sandbox ?? config.isSandbox,
    };
  });
}

