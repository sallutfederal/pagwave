import crypto from "node:crypto";
import { z } from "zod";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import {
  XPagError,
  createXPagCashin,
  resolveWebhookUrl,
} from "@/lib/xpag/client";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
} from "@/lib/xpag/currencies";
import { listWalletFeed, recordWalletActivity } from "@/lib/xpag/store";
import { getCurrentUser } from "@/server/auth";

const CashinSchema = z.object({
  purpose: z.enum(["self_deposit", "charge"]).default("charge"),
  currency: z.enum(XPAG_CURRENCIES),
  method: z.string().trim().optional(),
  mode: z.enum(["dynamic", "static"]).default("dynamic"),
  amount: z.number().positive().optional(),
  externalId: z.string().trim().max(128).optional(),
  description: z.string().trim().max(140).optional(),
  payer: z.record(z.string(), z.string()).optional(),
});

export function GET(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const url = new URL(request.url);
    const requestNumber = url.searchParams.get("request_number")?.trim();
    const externalId = url.searchParams.get("external_id")?.trim();

    if (!requestNumber && !externalId) {
      throw new XPagError("Informe request_number ou external_id.", 400, "missing_ref");
    }

    const { activities } = await listWalletFeed(userId);
    const match = activities.find(
      (a) =>
        (requestNumber && a.requestNumber === requestNumber) ||
        (externalId && a.externalId === externalId),
    );

    return {
      ok: true,
      status: match?.status ?? "pending",
      e2e: match?.e2e,
      updatedAt: match?.updatedAt,
    };
  });
}

export function POST(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const body = await request.json().catch(() => null);
    const parsed = CashinSchema.safeParse(body);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Dados inválidos para criação de cobrança.",
        400,
        "validation_error",
      );
    }

    const { purpose, currency, mode, description } = parsed.data;
    const spec = CURRENCY_SPECS[currency];
    const method = parsed.data.method || spec.cashinMethods[0]?.id;

    if (mode === "static") {
      if (!spec.supportsOpenValueCashin || method === "OXXO") {
        throw new XPagError(
          `Cobrança em valor aberto (estática) está disponível apenas para BRL (Pix) e MXN (SPEI).`,
          400,
          "static_not_supported",
        );
      }
    } else if (!parsed.data.amount || parsed.data.amount <= 0) {
      throw new XPagError("Informe o valor do depósito.", 400, "missing_amount");
    }

    const amount =
      mode === "static" || !parsed.data.amount
        ? undefined
        : currency === "CLP"
          ? Math.round(parsed.data.amount)
          : parsed.data.amount;

    if (currency === "MXN" && method === "OXXO" && amount !== undefined) {
      if (amount < 10 || amount > 10_000) {
        throw new XPagError(
          "OXXO Pay aceita valores entre 10 e 10.000 MXN.",
          400,
          "amount_out_of_range",
        );
      }
    }

    const payer = Object.fromEntries(
      Object.entries(parsed.data.payer ?? {})
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => v !== ""),
    );

    if (purpose === "self_deposit") {
      const currentUser = await getCurrentUser();
      if (!payer.name) payer.name = currentUser.name;
      if (!payer.email) payer.email = currentUser.email;
    }

    for (const field of spec.cashinPayerFields) {
      if (field.required && !payer[field.key]) {
        throw new XPagError(
          `Campo obrigatório para ${currency}: ${field.label}.`,
          400,
          "payer_required",
        );
      }
    }

    const externalId =
      parsed.data.externalId ||
      `${purpose === "self_deposit" ? "pw_dep" : "pw_in"}_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const originHeader = request.headers.get("origin") ?? undefined;
    const webhookUrl = resolveWebhookUrl(originHeader);

    const payload: Record<string, unknown> = {
      currency,
      external_id: externalId,
      ...(amount !== undefined ? { amount } : {}),
      ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
      ...(description
        ? { description }
        : purpose === "self_deposit"
          ? { description: `Depósito na conta Pagwave (${currency})` }
          : {}),
      ...payer,
    };

    if (spec.kind === "fiat" && method) {
      if (currency !== "BRL") {
        payload.method = method;
      }
      if ((currency === "MXN" && method === "OXXO") || currency === "ARS") {
        payload.generateCheckout = false;
      }
    }

    const result = await createXPagCashin(payload);

    await recordWalletActivity({
      userId,
      kind: "cashin",
      currency,
      amount,
      rail: method,
      status: String(result.status ?? (mode === "static" ? "active" : "pending")),
      externalId,
      origin: mode === "static" ? "static" : undefined,
      transactionId:
        typeof result.transaction_id === "string" ? result.transaction_id : undefined,
      requestNumber:
        typeof result.request_number === "string" ? result.request_number : undefined,
      destinationSummary:
        typeof result.clabe === "string"
          ? `CLABE ${result.clabe}`
          : typeof result.deposit_address === "string"
            ? result.deposit_address
            : purpose === "self_deposit"
              ? `Depósito próprio (${method})`
              : method,
      metadata: { ...result, purpose },
    });

    return { ok: true, externalId, mode, purpose, result };
  });
}
