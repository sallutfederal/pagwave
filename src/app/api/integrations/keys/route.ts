import { z } from "zod";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { XPagError, getXPagConfig } from "@/lib/xpag/client";
import {
  getOrCreateUserApiKey,
  listUserApiGatewayLogs,
  revealUserApiSecret,
  rotateUserApiKey,
  updateUserApiKeyConfig,
} from "@/lib/xpag/store";

const PatchKeySchema = z.object({
  action: z.enum(["rotate", "update"]),
  label: z.string().trim().min(2).max(64).optional(),
  webhookUrl: z.string().trim().max(300).optional(),
});

function sanitizeKey(
  record: Awaited<ReturnType<typeof getOrCreateUserApiKey>>,
  plainSecret?: string,
) {
  return {
    id: record.id,
    label: record.label,
    clientId: record.clientId,
    secretPreview: record.secretPreview,
    secret: plainSecret,
    webhookUrl: record.webhookUrl ?? "",
    requestCount: record.requestCount,
    lastUsedAt: record.lastUsedAt ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function GET(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const { searchParams } = new URL(request.url);
    const reveal = searchParams.get("reveal") === "1";

    const key = await getOrCreateUserApiKey(userId);
    const logs = await listUserApiGatewayLogs(userId);
    const plainSecret = reveal ? await revealUserApiSecret(userId) : undefined;
    const xpagConfig = getXPagConfig();

    return {
      ok: true,
      isSandbox: xpagConfig.isSandbox,
      credential: sanitizeKey(key, plainSecret),
      logs,
    };
  });
}

export function POST(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const body = await request.json().catch(() => null);
    const parsed = PatchKeySchema.safeParse(body);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Parâmetros inválidos.",
        400,
        "validation_error",
      );
    }

    if (parsed.data.action === "rotate") {
      const rotated = await rotateUserApiKey(userId);
      const plainSecret = await revealUserApiSecret(userId);
      return {
        ok: true,
        credential: sanitizeKey(rotated, plainSecret),
      };
    }

    const webhookUrl = parsed.data.webhookUrl ?? "";
    if (webhookUrl && !/^https?:\/\/.+/i.test(webhookUrl)) {
      throw new XPagError(
        "Informe uma URL http:// ou https:// válida para o webhook.",
        400,
        "invalid_webhook_url",
      );
    }

    const updated = await updateUserApiKeyConfig(userId, {
      label: parsed.data.label,
      webhookUrl,
    });
    return {
      ok: true,
      credential: sanitizeKey(updated),
    };
  });
}

