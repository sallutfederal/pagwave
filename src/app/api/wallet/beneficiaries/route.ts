import { z } from "zod";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import { XPagError } from "@/lib/xpag/client";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  summarizeDestination,
  validateDestinationInput,
} from "@/lib/xpag/currencies";
import { createBeneficiary, listBeneficiaries } from "@/lib/xpag/store";

const CreateBeneficiarySchema = z.object({
  label: z.string().trim().min(2, "Informe um apelido para a chave/carteira.").max(64),
  currency: z.enum(XPAG_CURRENCIES),
  rail: z.string().trim().min(1),
  details: z.record(z.string(), z.string()),
  isDefault: z.boolean().optional(),
});

export function GET() {
  return xpagPrivateJson(async (userId) => {
    const beneficiaries = await listBeneficiaries(userId);
    return { ok: true, beneficiaries };
  });
}

export function POST(request: Request) {
  return xpagPrivateJson(
    async (userId) => {
      const body = await request.json().catch(() => null);
      const parsed = CreateBeneficiarySchema.safeParse(body);
      if (!parsed.success) {
        throw new XPagError(
          parsed.error.issues[0]?.message || "Dados do beneficiário inválidos.",
          400,
          "validation_error",
        );
      }

      const { label, currency, rail, details, isDefault } = parsed.data;
      const spec = CURRENCY_SPECS[currency];
      if (!spec.cashoutRails.some((r) => r.id === rail)) {
        throw new XPagError(
          `Trilho ${rail} não suportado para saques em ${currency}.`,
          400,
          "unsupported_rail",
        );
      }

      const cleanDetails = Object.fromEntries(
        Object.entries(details).map(([k, v]) => [k, v.trim()]),
      );
      const validationError = validateDestinationInput(currency, rail, cleanDetails);
      if (validationError) {
        throw new XPagError(validationError, 400, "invalid_destination");
      }

      const beneficiary = await createBeneficiary({
        userId,
        label,
        currency,
        rail,
        summary: summarizeDestination(currency, rail, cleanDetails),
        details: cleanDetails,
        isDefault,
      });

      return { ok: true, beneficiary };
    },
    { status: 201 },
  );
}

