import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(6),
  }),
  deviceLabel: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(40).optional(),
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export function GET() {
  return privateJson(() => backendFetch("/notifications/push/status"));
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { ok: false, message: "Subscription Push inválida." },
      { status: 400 },
    );
  }

  return privateJson(() =>
    backendFetch("/notifications/push/subscribe", {
      method: "POST",
      body: parsed.data,
    }),
  );
}

export async function DELETE(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = UnsubscribeSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { ok: false, message: "Endpoint Push inválido." },
      { status: 400 },
    );
  }

  return privateJson(() =>
    backendFetch("/notifications/push/subscribe", {
      method: "DELETE",
      body: parsed.data,
    }),
  );
}
