import { z } from "zod";
import { XPagError } from "@/lib/xpag/client";
import {
  listAdminGlobalIntegrations,
  rotateUserApiKey,
} from "@/lib/xpag/store";
import { adminPrivateJson } from "@/server/admin-auth";

const RevokeKeySchema = z.object({
  action: z.literal("revoke"),
  userId: z.string().trim().min(1),
});

export function GET() {
  return adminPrivateJson(async () => {
    const data = await listAdminGlobalIntegrations();
    return { ok: true, ...data };
  });
}

export function POST(request: Request) {
  return adminPrivateJson(async () => {
    const raw = await request.json().catch(() => null);
    const parsed = RevokeKeySchema.safeParse(raw);
    if (!parsed.success) {
      throw new XPagError("Parâmetros inválidos.", 400, "validation_error");
    }

    const rotated = await rotateUserApiKey(parsed.data.userId);
    return {
      ok: true,
      clientId: rotated.clientId,
    };
  });
}

