import { z } from "zod";
import { XPagError } from "@/lib/xpag/client";
import {
  adminUpdateActivityStatusById,
  listAdminGlobalTransactions,
} from "@/lib/xpag/store";
import { adminPrivateJson } from "@/server/admin-auth";

const PatchTxSchema = z.object({
  activityId: z.string().trim().min(1),
  status: z.enum([
    "pending",
    "processing",
    "completed",
    "paid",
    "failed",
    "expired",
    "med_blocked",
    "med_closed",
  ]),
});

export function GET() {
  return adminPrivateJson(async () => {
    const data = await listAdminGlobalTransactions();
    return { ok: true, ...data };
  });
}

export function PATCH(request: Request) {
  return adminPrivateJson(async () => {
    const raw = await request.json().catch(() => null);
    const parsed = PatchTxSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Parâmetros inválidos.",
        400,
        "validation_error",
      );
    }

    const updated = await adminUpdateActivityStatusById(
      parsed.data.activityId,
      parsed.data.status,
    );
    if (!updated) {
      throw new XPagError("Transação não encontrada.", 404, "not_found");
    }

    return { ok: true, activity: updated };
  });
}

