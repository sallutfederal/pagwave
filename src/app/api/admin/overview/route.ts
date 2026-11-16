import { getXPagBalance, getXPagConfig } from "@/lib/xpag/client";
import { getAdminOverviewSnapshot } from "@/lib/xpag/store";
import { adminPrivateJson } from "@/server/admin-auth";

export function GET() {
  return adminPrivateJson(async () => {
    const config = getXPagConfig();
    const [overview, xpagBalance] = await Promise.all([
      getAdminOverviewSnapshot(),
      getXPagBalance().catch(() => null),
    ]);

    return {
      ok: true,
      isSandbox: xpagBalance?.sandbox ?? config.isSandbox,
      xpagBaseUrl: config.baseUrl,
      xpagClientIdMasked: `${config.clientId.slice(0, 8)}...${config.clientId.slice(-4)}`,
      xpagBalance,
      overview,
    };
  });
}

