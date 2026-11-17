import { z } from "zod";

import { backendFetch } from "@/lib/backend";
import { privateJson } from "@/server/api";

const CreateSchema = z.object({
  action: z.literal("create"),
  subject: z.string().trim().min(3, "Informe um assunto.").max(160),
  category: z.enum(["Suporte", "KYC", "Financeiro", "Técnico"]).default("Suporte"),
  message: z.string().trim().min(1, "Escreva a mensagem.").max(2000),
});

const ReplySchema = z.object({
  action: z.literal("reply"),
  threadId: z.string().uuid(),
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(2000),
});

const PatchSchema = z.object({
  threadId: z.string().uuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  markRead: z.boolean().optional(),
});

export function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "admin" ? "?scope=admin" : "";
  return privateJson(() => backendFetch(`/support/threads${scope}`));
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = z.discriminatedUnion("action", [CreateSchema, ReplySchema]).safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.action === "create") {
    return privateJson(() =>
      backendFetch("/support/threads", {
        method: "POST",
        body: {
          subject: data.subject,
          category: data.category,
          message: data.message,
        },
      }),
    );
  }

  return privateJson(() =>
    backendFetch(`/support/threads/${data.threadId}/messages`, {
      method: "POST",
      body: { message: data.message },
    }),
  );
}

export async function PATCH(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: "Parâmetros inválidos." },
      { status: 400 },
    );
  }

  return privateJson(() =>
    backendFetch(`/support/threads/${parsed.data.threadId}`, {
      method: "PATCH",
      body: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.markRead !== undefined ? { markRead: parsed.data.markRead } : {}),
      },
    }),
  );
}
