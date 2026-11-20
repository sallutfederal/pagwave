import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { XPagError } from "@/lib/xpag/client";
import { adminPrivateJson } from "@/server/admin-auth";

const GlobalFeeSchema = z.object({
  transactionType: z.enum(["DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT", "EXCHANGE"]),
  currencyCode: z.string().trim().min(1).max(10),
  flatFee: z.coerce.number().min(0),
  percentFee: z.coerce.number().min(0).max(1),
  minFee: z.coerce.number().min(0).optional(),
  maxFee: z.coerce.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

const UserFeeRuleSchema = z.object({
  transactionType: z.enum(["WITHDRAWAL", "DEPOSIT", "TRANSFER_OUT", "EXCHANGE"]),
  currencyCode: z.string().trim().min(1).max(10),
  flatFee: z.coerce.number().min(0),
  percentFee: z.coerce.number().min(0).max(1),
  minFee: z.coerce.number().min(0).default(0),
  maxFee: z.coerce.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

const PutUserFeesSchema = z.object({
  userId: z.string().trim().min(1),
  rules: z.array(UserFeeRuleSchema).max(60),
  note: z.string().trim().max(240).optional(),
});

const DeleteUserFeesSchema = z.object({
  userId: z.string().trim().min(1),
});

export function GET() {
  return adminPrivateJson(async () => {
    const payload = await backendFetch<{
      fees: unknown[];
      platformFeeBps: number;
      currencies: string[];
      userOverrides: unknown[];
    }>("/admin/fees");

    return { ok: true, ...payload };
  });
}

export function PATCH(request: Request) {
  return adminPrivateJson(async () => {
    const raw = await request.json().catch(() => null);
    const parsed = GlobalFeeSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Dados de taxa global inválidos.",
        400,
        "validation_error",
      );
    }

    const res = await backendFetch<{ fee: unknown }>("/admin/fees", {
      method: "PATCH",
      body: parsed.data,
    });
    return { ok: true, fee: res.fee };
  });
}

export function PUT(request: Request) {
  return adminPrivateJson(async () => {
    const raw = await request.json().catch(() => null);
    const parsed = PutUserFeesSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Dados inválidos para taxas do usuário.",
        400,
        "validation_error",
      );
    }

    const res = await backendFetch<{ ok: boolean; userId: string; rules: unknown[]; note?: string; updatedAt: string }>(
      `/admin/fees/user/${encodeURIComponent(parsed.data.userId)}`,
      {
        method: "PUT",
        body: {
          rules: parsed.data.rules,
          note: parsed.data.note,
        },
      },
    );
    return res;
  });
}

export function DELETE(request: Request) {
  return adminPrivateJson(async () => {
    const raw = await request.json().catch(() => null);
    const parsed = DeleteUserFeesSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError("Informe userId para restaurar as taxas padrão.", 400, "validation_error");
    }

    const res = await backendFetch<{ ok: boolean; userId: string; rules: unknown[] }>(
      `/admin/fees/user/${encodeURIComponent(parsed.data.userId)}`,
      { method: "DELETE" },
    );
    return res;
  });
}
