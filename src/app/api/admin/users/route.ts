import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { XPagError } from "@/lib/xpag/client";
import {
  listAdminUsersWithMetrics,
  updateAdminUserRecord,
} from "@/lib/xpag/store";
import { adminPrivateJson } from "@/server/admin-auth";

const UpdateUserSchema = z.object({
  userId: z.string().trim().min(1).optional(),
  docId: z.string().trim().min(1).optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED", "CLOSED"]).optional(),
  kycStatus: z
    .enum(["NOT_STARTED", "PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "EXPIRED"])
    .optional(),
  kycLevel: z.number().int().min(0).max(3).optional(),
  suspended: z.boolean().optional(),
  reviewNote: z.string().trim().max(500).optional(),
});

export function GET() {
  return adminPrivateJson(async () => {
    try {
      const [usersPayload, kycPayload] = await Promise.all([
        backendFetch<{ users: unknown[] }>("/admin/users"),
        backendFetch<{ documents: unknown[] }>("/admin/kyc"),
      ]);
      return {
        ok: true,
        users: usersPayload.users,
        kycDocuments: kycPayload.documents,
      };
    } catch {
      const users = await listAdminUsersWithMetrics();
      return { ok: true, users, kycDocuments: [] };
    }
  });
}

export function PATCH(request: Request) {
  return adminPrivateJson(async (adminUser) => {
    const raw = await request.json().catch(() => null);
    const parsed = UpdateUserSchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Parâmetros inválidos.",
        400,
        "validation_error",
      );
    }

    const d = parsed.data;

    if (d.docId) {
      const status = d.kycStatus === "REJECTED" ? "REJECTED" : "APPROVED";
      const res = await backendFetch<{ document: unknown }>(`/admin/kyc/${d.docId}`, {
        method: "PATCH",
        body: {
          status,
          kycLevel: d.kycLevel,
          reviewNote: d.reviewNote,
        },
      });
      return { ok: true, document: res.document };
    }

    if (!d.userId) {
      throw new XPagError("Informe userId ou docId.", 400, "missing_id");
    }

    const nextStatus =
      d.status ??
      (d.suspended === true ? "SUSPENDED" : d.suspended === false ? "ACTIVE" : undefined);

    if (d.userId === adminUser.id && (d.suspended === true || nextStatus === "SUSPENDED")) {
      throw new XPagError(
        "Você não pode suspender a própria conta de administrador.",
        400,
        "self_suspend_forbidden",
      );
    }

    try {
      const res = await backendFetch<{ user: unknown }>(`/admin/users/${d.userId}`, {
        method: "PATCH",
        body: {
          ...(d.role ? { role: d.role } : {}),
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(d.kycStatus ? { kycStatus: d.kycStatus } : {}),
          ...(d.kycLevel !== undefined ? { kycLevel: d.kycLevel } : {}),
        },
      });
      return { ok: true, user: res.user };
    } catch {
      const updated = await updateAdminUserRecord(d.userId, {
        kycStatus: d.kycStatus,
        kycLevel: d.kycLevel,
        suspended: d.suspended,
      });
      return { ok: true, user: updated };
    }
  });
}
