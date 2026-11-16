import { withPagwaveApiAuth } from "@/lib/pagwave-gateway";
import { getXPagBalance, getXPagConfig } from "@/lib/xpag/client";

export function GET(request: Request) {
  return withPagwaveApiAuth(request, "GET /api/v1/balance", async () => {
    const config = getXPagConfig();
    const balance = await getXPagBalance();
    return {
      status: 200,
      body: {
        ...balance,
        sandbox: balance.sandbox ?? config.isSandbox,
      },
    };
  });
}

