import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { clearSessionCookies } from "@/lib/session";
import { privateJson } from "@/server/api";

const SecurityActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("change-password"),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
  z.object({ action: z.literal("logout-all") }),
  z.object({ action: z.literal("2fa-setup") }),
  z.object({
    action: z.literal("2fa-confirm"),
    code: z.string().trim().min(6).max(8),
  }),
  z.object({
    action: z.literal("2fa-disable"),
    password: z.string().min(1),
  }),
  z.object({
    action: z.literal("delete-account"),
    password: z.string().min(1),
  }),
]);

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = SecurityActionSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Parâmetros inválidos." },
      { status: 400 },
    );
  }

  return privateJson(async () => {
    const data = parsed.data;
    switch (data.action) {
      case "change-password":
        return backendFetch("/auth/change-password", {
          method: "POST",
          body: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        });
      case "logout-all": {
        const res = await backendFetch("/auth/logout-all", { method: "POST" });
        await clearSessionCookies();
        return res;
      }
      case "2fa-setup":
        return backendFetch("/auth/2fa/setup", { method: "POST" });
      case "2fa-confirm":
        return backendFetch("/auth/2fa/confirm", {
          method: "POST",
          body: { code: data.code },
        });
      case "2fa-disable":
        return backendFetch("/auth/2fa/disable", {
          method: "POST",
          body: { password: data.password },
        });
      case "delete-account": {
        const res = await backendFetch("/auth/account", {
          method: "DELETE",
          body: { password: data.password },
        });
        await clearSessionCookies();
        return res;
      }
    }
  });
}

