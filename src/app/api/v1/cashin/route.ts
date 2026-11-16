import crypto from "node:crypto";
import { z } from "zod";
import { withPagwaveApiAuth } from "@/lib/pagwave-gateway";
import {
  XPagError,
  createXPagCashin,
  resolveWebhookUrl,
} from "@/lib/xpag/client";
import { CURRENCY_SPECS, XPAG_CURRENCIES } from "@/lib/xpag/currencies";
import { getAdminConfig, recordWalletActivity } from "@/lib/xpag/store";

const PublicCashinSchema = z
  .object({
    currency: z.enum(XPAG_CURRENCIES),
    amount: z.number().positive().optional(),
    method: z.string().trim().optional(),
    external_id: z.string().trim().max(128).optional(),
    description: z.string().trim().max(140).optional(),
    webhook_url: z.string().trim().url().optional(),
    generateCheckout: z.boolean().optional(),
    splits: z
      .array(
        z.object({
          account_id: z.string().trim().min(1),
          percentage: z.number().positive().max(90),
        }),
      )
      .optional(),
    name: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    document: z.string().trim().optional(),
    document_type: z.string().trim().optional(),
    payer: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

export function POST(request: Request) {
  return withPagwaveApiAuth(request, "POST /api/v1/cashin", async ({ userId, key }) => {
    const raw = await request.json().catch(() => null);
    const parsed = PublicCashinSchema.safeParse(raw);
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
        `Operações em ${data.currency} estão temporariamente desabilitadas pelo administrador.`,
        403,
        "currency_disabled",
      );
    }

    const spec = CURRENCY_SPECS[data.currency];
    const method = data.method || spec.cashinMethods[0]?.id;
    const isStatic = data.amount === undefined;

    if (isStatic && (!spec.supportsOpenValueCashin || method === "OXXO")) {
      throw new XPagError(
        `Cobrança sem amount (valor aberto) é suportada apenas em BRL (Pix) e MXN (SPEI).`,
        400,
        "missing_amount",
      );
    }

    const amount =
      data.amount === undefined
        ? undefined
        : data.currency === "CLP"
          ? Math.round(data.amount)
          : data.amount;

    if (data.currency === "MXN" && method === "OXXO" && amount !== undefined) {
      if (amount < 10 || amount > 10_000) {
        throw new XPagError(
          "Em MXN com método OXXO, o valor deve estar entre 10 e 10.000 MXN.",
          400,
          "amount_out_of_range",
        );
      }
    }

    const mergedPayer: Record<string, string> = {
      ...(data.payer ?? {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.document ? { document: data.document } : {}),
      ...(data.document_type ? { document_type: data.document_type } : {}),
    };

    for (const field of spec.cashinPayerFields) {
      if (field.required && !mergedPayer[field.key]?.trim()) {
        throw new XPagError(
          `Campo obrigatório ausente para ${data.currency}: ${field.key}.`,
          400,
          "payer_required",
        );
      }
    }

    const externalId =
      data.external_id || `pw_api_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const originHeader = request.headers.get("origin") ?? undefined;
    const xpagWebhookUrl = resolveWebhookUrl(originHeader);

    const payload: Record<string, unknown> = {
      currency: data.currency,
      external_id: externalId,
      ...(amount !== undefined ? { amount } : {}),
      ...(xpagWebhookUrl ? { webhook_url: xpagWebhookUrl } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.splits ? { splits: data.splits } : {}),
      ...mergedPayer,
    };

    if (spec.kind === "fiat" && method && data.currency !== "BRL") {
      payload.method = method;
    }

    if (data.generateCheckout !== undefined) {
      payload.generateCheckout = data.generateCheckout;
    } else if ((data.currency === "MXN" && method === "OXXO") || data.currency === "ARS") {
      payload.generateCheckout = false;
    }

    const result = await createXPagCashin(payload);
    const clientWebhookUrl = data.webhook_url || key.webhookUrl;

    await recordWalletActivity({
      userId,
      kind: "cashin",
      currency: data.currency,
      amount,
      rail: method,
      status: String(result.status ?? (isStatic ? "active" : "pending")),
      externalId,
      origin: isStatic ? "static" : "api_v1",
      transactionId:
        typeof result.transaction_id === "string" ? result.transaction_id : undefined,
      requestNumber:
        typeof result.request_number === "string" ? result.request_number : undefined,
      destinationSummary:
        typeof result.clabe === "string"
          ? `CLABE ${result.clabe}`
          : typeof result.deposit_address === "string"
            ? result.deposit_address
            : method,
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
        mode: isStatic ? "static" : "dynamic",
        currency: data.currency,
        method: method ?? null,
        external_id: externalId,
        ...result,
      },
    };
  });
}

