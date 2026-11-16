import { z } from "zod";

import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({ frozen: z.boolean() });

/**
 * POST /api/cards/:id/freeze   body: { "frozen": true | false }
 * Freezes or unfreezes a card. Ownership is enforced by the API.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  const body = bodySchema.safeParse(await request.json().catch(() => null));

  if (!params.success || !body.success) {
    return Response.json({ error: "VALIDATION_ERROR", message: "Invalid request." }, { status: 400 });
  }

  const action = body.data.frozen ? "freeze" : "unfreeze";

  return privateJson(() => backendFetch(`/cards/${params.data.id}/${action}`, { method: "POST" }));
}

