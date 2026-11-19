import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), id: z.string().uuid() }),
  z.object({ action: z.literal("read_all") }),
  z.object({ action: z.literal("test") }),
  z.object({ action: z.literal("weekly_digest") }),
]);

export function GET() {
  return privateJson(() => backendFetch("/notifications"));
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = ActionSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { ok: false, message: "Ação de notificação inválida." },
      { status: 400 },
    );
  }

  return privateJson(() => {
    switch (parsed.data.action) {
      case "read":
        return backendFetch(`/notifications/${parsed.data.id}/read`, {
          method: "PATCH",
          body: {},
        });
      case "read_all":
        return backendFetch("/notifications/read-all", { method: "POST", body: {} });
      case "test":
        return backendFetch("/notifications/test", { method: "POST", body: {} });
      case "weekly_digest":
        return backendFetch("/notifications/weekly-digest", { method: "POST", body: {} });
    }
  });
}
