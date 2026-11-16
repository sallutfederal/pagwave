import { z } from "zod";

import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateCardSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  dailyLimit: z.number().min(0).optional(),
  monthlyLimit: z.number().min(0).optional(),
  singleTxLimit: z.number().min(0).optional(),
  onlineEnabled: z.boolean().optional(),
  contactless: z.boolean().optional(),
  internationalEnabled: z.boolean().optional(),
});

/**
 * PATCH /api/cards/:id
 * Updates limits or card channel flags.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);
  const body = updateCardSchema.safeParse(await request.json().catch(() => null));

  if (!params.success || !body.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: "Dados inválidos para atualizar cartão." },
      { status: 400 },
    );
  }

  return privateJson(() =>
    backendFetch(`/cards/${params.data.id}`, {
      method: "PATCH",
      body: body.data,
    }),
  );
}

/**
 * DELETE /api/cards/:id
 * Cancels/removes a card owned by the signed-in user.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: "Invalid card id." },
      { status: 400 },
    );
  }

  return privateJson(() =>
    backendFetch(`/cards/${params.data.id}`, { method: "DELETE" }),
  );
}
