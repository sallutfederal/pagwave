import { enqueueWebhookDeliveries } from "@/lib/webhook-dispatch";
import { verifyXPagWebhookSignature } from "@/lib/xpag/client";
import { recordXPagWebhook } from "@/lib/xpag/store";

export async function POST(request: Request) {
  // Always inspect exact raw body bytes before parsing JSON.
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  if (!verifyXPagWebhookSignature(rawBody, signature)) {
    return Response.json(
      { ok: false, error: "Assinatura de webhook inválida." },
      { status: 401 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return Response.json(
      { ok: false, error: "Corpo JSON inválido." },
      { status: 400 },
    );
  }

  const { duplicate, event, forwardTargets } = await recordXPagWebhook({
    payload,
    verifiedSignature: true,
  });

  if (!duplicate && forwardTargets && forwardTargets.length > 0) {
    enqueueWebhookDeliveries(forwardTargets, rawBody);
  }

  return Response.json(
    {
      ok: true,
      duplicate,
      eventId: event.id,
    },
    { status: 200 },
  );
}
