import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { XPagError, getXPagConfig } from "@/lib/xpag/client";
import { XPAG_CURRENCIES } from "@/lib/xpag/currencies";
import { getAdminConfig, updateAdminConfig } from "@/lib/xpag/store";
import { adminPrivateJson } from "@/server/admin-auth";

const SettingsSchema = z.object({
  environmentMode: z.enum(["auto", "sandbox", "production"]).optional(),
  feeBps: z.number().int().min(0).max(2000).optional(),
  disabledCurrencies: z.array(z.enum(XPAG_CURRENCIES)).optional(),
  maintenanceNotice: z.string().trim().max(240).optional(),
  globalWebhookUrl: z.string().trim().max(300).optional(),
});

export function GET() {
  return adminPrivateJson(async () => {
    const config = await getAdminConfig();
    const xpag = getXPagConfig();
    return {
      ok: true,
      config,
      xpag: {
        baseUrl: xpag.baseUrl,
        isSandbox: xpag.isSandbox,
        clientIdMasked: `${xpag.clientId.slice(0, 8)}...${xpag.clientId.slice(-4)}`,
        envWebhookConfigured: Boolean(process.env.XPAG_WEBHOOK_URL?.trim()),
      },
    };
  });
}

export function PATCH(request: Request) {
  return adminPrivateJson(async () => {
    const raw = await request.json().catch(() => null);
    const parsed = SettingsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Configurações inválidas.",
        400,
        "validation_error",
      );
    }

    const webhook = parsed.data.globalWebhookUrl;
    if (webhook && !/^https?:\/\/.+/i.test(webhook)) {
      throw new XPagError(
        "Informe uma URL http:// ou https:// válida para o webhook global.",
        400,
        "invalid_webhook_url",
      );
    }

    const updated = await updateAdminConfig(parsed.data);
    return { ok: true, config: updated };
  });
}

export function POST() {
  return adminPrivateJson(async () => {
    const result = await backendFetch<{
      ok: boolean;
      deletedTransactions: number;
      adjustedWallets: number;
    }>("/admin/purge-seed-data", { method: "POST", body: {} });
    return result;
  });
}

