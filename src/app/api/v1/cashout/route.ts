import crypto from "node:crypto";
import { z } from "zod";
import { withPagwaveApiAuth } from "@/lib/pagwave-gateway";
import {
  XPagError,
  createXPagCashout,
  resolveWebhookUrl,
} from "@/lib/xpag/client";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  buildCashoutPayload,
  summarizeDestination,
  validateDestinationInput,
} from "@/lib/xpag/currencies";
import {
  getAdminConfig,
  getBeneficiaryById,
  recordWalletActivity,
} from "@/lib/xpag/store";

const PublicCashoutSchema = z
  .object({
    currency: z.enum(XPAG_CURRENCIES),
    amount: z.number().positive("Informe um valor maior que zero."),
    beneficiary_id: z.string().trim().optional(),
    method: z.string().trim().optional(),
    external_id: z.string().trim().max(128).optional(),
    description: z.string().trim().max(140).optional(),
    webhook_url: z.string().trim().url().optional(),
  })
  .passthrough();

export function POST(request: Request) {
  return withPagwaveApiAuth(request, "POST /api/v1/cashout", async ({ userId, key }) => {
    const raw = await request.json().catch(() => null);
    const parsed = PublicCashoutSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Corpo da requisição inválido.",
        400,
        "validation_error",
      );
    }

    const data = parsed.data;
    const adminConfig = await getAdminConfig();
    if (adminConfig.disabledCurrencies.includes(data.currency)) {
      throw new XPagError(
        `Saques em ${data.currency} estão temporariamente desabilitados pelo administrador.`,
        403,
        "currency_disabled",
      );
    }

    let rail = data.method || CURRENCY_SPECS[data.currency].cashoutRails[0].id;
    let details: Record<string, string> = {};

    if (data.beneficiary_id) {
      const saved = await getBeneficiaryById(userId, data.beneficiary_id);
      if (!saved || saved.currency !== data.currency) {
        throw new XPagError(
          "Beneficiário informado não encontrado para esta moeda.",
          404,
          "not_found",
        );
      }
      rail = saved.rail;
      details = saved.details;
    } else {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v === "string") details[k] = v;
      }
      if (data.currency === "BRL" && details.pix_copia_cola) {
        rail = "BRCODE";
      }
    }

    const destError = validateDestinationInput(data.currency, rail, details);
    if (destError) {
      throw new XPagError(destError, 400, "invalid_destination");
    }

    const externalId =
      data.external_id || `pw_out_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const originHeader = request.headers.get("origin") ?? undefined;
    const xpagWebhookUrl = resolveWebhookUrl(originHeader);
    const clientWebhookUrl = data.webhook_url || key.webhookUrl;

    const payload = buildCashoutPayload({
      currency: data.currency,
      rail,
      amount: data.amount,
      externalId,
      webhookUrl: xpagWebhookUrl,
      description: data.description,
      details,
    });

    const result = await createXPagCashout(payload);

    await recordWalletActivity({
      userId,
      kind: "cashout",
      currency: data.currency,
      amount: data.currency === "CLP" ? Math.round(data.amount) : data.amount,
      rail,
      status: String(result.status ?? "processing"),
      externalId,
      origin: "api_v1",
      transactionId:
        typeof result.transaction_id === "string" ? result.transaction_id : undefined,
      e2e: typeof result.e2e === "string" ? result.e2e : undefined,
      destinationSummary: summarizeDestination(data.currency, rail, details),
      metadata: {
        ...result,
        ...(clientWebhookUrl ? { clientWebhookUrl } : {}),
      },
    });

    return {
      status: 200,
      currency: data.currency,
      body: {
        ok: true,
        external_id: externalId,
        ...result,
      },
    };
  });
}

