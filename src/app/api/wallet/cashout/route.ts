import crypto from "node:crypto";
import { z } from "zod";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import {
  XPagError,
  createXPagCashout,
  resolveWebhookUrl,
} from "@/lib/xpag/client";
import {
  XPAG_CURRENCIES,
  buildCashoutPayload,
  summarizeDestination,
  validateDestinationInput,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { getBeneficiaryById, recordWalletActivity } from "@/lib/xpag/store";

const CashoutSchema = z.object({
  beneficiaryId: z.string().trim().optional(),
  currency: z.enum(XPAG_CURRENCIES).optional(),
  rail: z.string().trim().optional(),
  details: z.record(z.string(), z.string()).optional(),
  amount: z.number().positive("Informe um valor maior que zero."),
  externalId: z.string().trim().max(128).optional(),
  description: z.string().trim().max(140).optional(),
});

export function POST(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const body = await request.json().catch(() => null);
    const parsed = CashoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Dados inválidos para solicitação de saque.",
        400,
        "validation_error",
      );
    }

    const { beneficiaryId, amount, description } = parsed.data;
    let currency: XPagCurrency;
    let rail: string;
    let details: Record<string, string>;

    if (beneficiaryId) {
      const saved = await getBeneficiaryById(userId, beneficiaryId);
      if (!saved) {
        throw new XPagError("Chave/endereço salvo não encontrado.", 404, "not_found");
      }
      currency = saved.currency;
      rail = saved.rail;
      details = saved.details;
    } else {
      if (!parsed.data.currency || !parsed.data.rail || !parsed.data.details) {
        throw new XPagError(
          "Selecione uma chave salva ou preencha os dados de destino.",
          400,
          "missing_destination",
        );
      }
      currency = parsed.data.currency;
      rail = parsed.data.rail;
      details = parsed.data.details;
    }

    const validationError = validateDestinationInput(currency, rail, details);
    if (validationError) {
      throw new XPagError(validationError, 400, "invalid_destination");
    }

    const externalId =
      parsed.data.externalId || `pw_out_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const origin = request.headers.get("origin") ?? undefined;
    const webhookUrl = resolveWebhookUrl(origin);

    const payload = buildCashoutPayload({
      currency,
      rail,
      amount,
      externalId,
      webhookUrl,
      description,
      details,
    });

    const result = await createXPagCashout(payload);

    await recordWalletActivity({
      userId,
      kind: "cashout",
      currency,
      amount: currency === "CLP" ? Math.round(amount) : amount,
      rail,
      status: String(result.status ?? "processing"),
      externalId,
      transactionId:
        typeof result.transaction_id === "string" ? result.transaction_id : undefined,
      e2e: typeof result.e2e === "string" ? result.e2e : undefined,
      destinationSummary: summarizeDestination(currency, rail, details),
      metadata: result,
    });

    return { ok: true, externalId, result };
  });
}

