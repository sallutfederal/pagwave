import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { XPagError } from "@/lib/xpag/client";
import { XPAG_CURRENCIES } from "@/lib/xpag/currencies";

const TransferSchema = z.object({
  currency: z.enum(XPAG_CURRENCIES),
  recipientEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido do destinatário."),
  amount: z.number().positive("Informe um valor maior que zero."),
  description: z.string().trim().max(140).optional(),
});

type BackendTransferResult = {
  referenceId: string;
  amount: string;
  fee: string;
  netAmount: string;
  currencyCode: string;
  recipientEmail: string;
  recipientName: string;
  status: string;
};

export function POST(request: Request) {
  return xpagPrivateJson(async () => {
    const body = await request.json().catch(() => null);
    const parsed = TransferSchema.safeParse(body);

    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Dados inválidos para transferência.",
        400,
        "validation_error",
      );
    }

    const { currency, recipientEmail, amount, description } = parsed.data;
    const normalizedAmount = currency === "CLP" ? Math.round(amount) : amount;

    if (currency === "CLP" && !Number.isInteger(amount)) {
      throw new XPagError("CLP exige valor inteiro sem casas decimais.", 400, "validation_error");
    }

    const transfer = await backendFetch<BackendTransferResult>("/wallets/transfer", {
      method: "POST",
      body: {
        currencyCode: currency,
        recipientEmail,
        amount: String(normalizedAmount),
        description: description || undefined,
      },
    });

    return { ok: true, transfer };
  });
}
