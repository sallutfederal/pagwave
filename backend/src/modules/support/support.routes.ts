import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { authGuard } from "../../middleware/auth.js";

const createThreadSchema = z.object({
  subject: z.string().trim().min(3, "Informe um assunto.").max(160),
  category: z.enum(["Suporte", "KYC", "Financeiro", "Técnico"]).default("Suporte"),
  message: z.string().trim().min(1, "Escreva a mensagem inicial.").max(2000),
});

const replySchema = z.object({
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(2000),
});

const patchThreadSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  markRead: z.boolean().optional(),
});

function formatTime(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PW";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts.at(-1)![0] ?? ""}`.toUpperCase();
}

type ThreadRow = {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: string;
  user: {
    email: string;
    profile: { displayName: string | null; firstName: string; lastName: string } | null;
  };
  messages: {
    id: string;
    senderRole: string;
    body: string;
    readByUser: boolean;
    readByAdmin: boolean;
    createdAt: Date;
  }[];
};

function toConversation(thread: ThreadRow, viewerMode: "user" | "admin") {
  const userName =
    thread.user.profile?.displayName ||
    `${thread.user.profile?.firstName ?? ""} ${thread.user.profile?.lastName ?? ""}`.trim() ||
    thread.user.email;

  const isAdminViewer = viewerMode === "admin";
  const unread = thread.messages.filter((m) =>
    isAdminViewer ? m.senderRole === "USER" && !m.readByAdmin : m.senderRole === "ADMIN" && !m.readByUser,
  ).length;

  return {
    id: thread.id,
    name: isAdminViewer ? `${userName} · ${thread.subject}` : thread.subject,
    role: isAdminViewer ? `${thread.category} · ${thread.user.email}` : `${thread.category} · Suporte Pagwave`,
    subject: thread.subject,
    status: thread.status,
    userEmail: thread.user.email,
    avatar: {
      url: "",
      initials: isAdminViewer ? initialsFrom(userName) : "PW",
    },
    online: thread.status !== "CLOSED" && thread.status !== "RESOLVED",
    unread,
    messages: thread.messages.map((m) => ({
      id: m.id,
      from:
        isAdminViewer
          ? m.senderRole === "ADMIN"
            ? ("me" as const)
            : ("them" as const)
          : m.senderRole === "USER"
            ? ("me" as const)
            : ("them" as const),
      text: m.body,
      time: formatTime(m.createdAt),
    })),
  };
}

export async function supportRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  app.get("/threads", async (request) => {
    const user = request.user as { id: string; role?: string };
    const query = request.query as { scope?: string };
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const adminScope = isAdmin && query.scope === "admin";

    const threads = await prisma.supportThread.findMany({
      where: adminScope ? undefined : { userId: user.id },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { displayName: true, firstName: true, lastName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return {
      conversations: threads.map((t) => toConversation(t, adminScope ? "admin" : "user")),
    };
  });

  app.post("/threads", async (request, reply) => {
    const user = request.user as { id: string };
    const body = createThreadSchema.parse(request.body);

    const created = await prisma.supportThread.create({
      data: {
        userId: user.id,
        subject: body.subject,
        category: body.category,
        status: "OPEN",
        messages: {
          create: {
            senderId: user.id,
            senderRole: "USER",
            body: body.message,
            readByUser: true,
            readByAdmin: false,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { displayName: true, firstName: true, lastName: true } },
          },
        },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_ACTION",
        resource: "support_thread",
        resourceId: created.id,
        details: { category: body.category, subject: body.subject },
      },
    });

    reply.status(201).send({
      conversation: toConversation(created, "user"),
    });
  });

  app.post("/threads/:id/messages", async (request, reply) => {
    const user = request.user as { id: string; role?: string };
    const { id } = request.params as { id: string };
    const body = replySchema.parse(request.body);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    const thread = await prisma.supportThread.findUnique({ where: { id } });
    if (!thread) throw new NotFoundError("Support thread");

    if (thread.userId !== user.id && !isAdmin) {
      throw new ForbiddenError("You do not have access to this conversation.");
    }

    if (thread.status === "CLOSED" && !isAdmin) {
      throw new BadRequestError("Este chamado foi encerrado. Abra uma nova conversa.");
    }

    const senderRole = isAdmin && thread.userId !== user.id ? "ADMIN" : "USER";

    const [msg] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: {
          threadId: thread.id,
          senderId: user.id,
          senderRole,
          body: body.message,
          readByUser: senderRole === "USER",
          readByAdmin: senderRole === "ADMIN",
        },
      }),
      prisma.supportThread.update({
        where: { id: thread.id },
        data: {
          status:
            senderRole === "ADMIN"
              ? thread.status === "OPEN"
                ? "IN_PROGRESS"
                : thread.status
              : thread.status === "RESOLVED"
                ? "OPEN"
                : thread.status,
          updatedAt: new Date(),
        },
      }),
    ]);

    if (senderRole === "ADMIN") {
      await prisma.notification.create({
        data: {
          userId: thread.userId,
          type: "SYSTEM",
          title: `Resposta no chamado: ${thread.subject}`,
          body: body.message.slice(0, 180),
        },
      });
    }

    reply.status(201).send({
      message: {
        id: msg.id,
        from: "me" as const,
        text: msg.body,
        time: formatTime(msg.createdAt),
      },
    });
  });

  app.patch("/threads/:id", async (request) => {
    const user = request.user as { id: string; role?: string };
    const { id } = request.params as { id: string };
    const body = patchThreadSchema.parse(request.body ?? {});
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    const thread = await prisma.supportThread.findUnique({ where: { id } });
    if (!thread) throw new NotFoundError("Support thread");

    if (thread.userId !== user.id && !isAdmin) {
      throw new ForbiddenError("You do not have access to this conversation.");
    }

    if (body.markRead !== false) {
      await prisma.supportMessage.updateMany({
        where: isAdmin && thread.userId !== user.id
          ? { threadId: id, senderRole: "USER", readByAdmin: false }
          : { threadId: id, senderRole: "ADMIN", readByUser: false },
        data: isAdmin && thread.userId !== user.id ? { readByAdmin: true } : { readByUser: true },
      });
    }

    if (body.status) {
      if (!isAdmin && body.status !== "RESOLVED" && body.status !== "OPEN") {
        throw new ForbiddenError("Only administrators can set this ticket status.");
      }
      await prisma.supportThread.update({
        where: { id },
        data: { status: body.status },
      });
    }

    return { ok: true };
  });
}

