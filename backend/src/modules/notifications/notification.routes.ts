import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import {
  deactivatePushDevice,
  dispatchUserNotification,
  getOrCreateVapidKeys,
  listActivePushDevices,
  sendWeeklyDigestForUser,
  upsertPushDevice,
} from "../../lib/notifications.js";
import { authGuard } from "../../middleware/auth.js";

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

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // ── GET /notifications ─────────────────────────────────────────────────
  app.get("/", async (request) => {
    const user = request.user as { id: string };
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return {
      ok: true,
      unreadCount,
      notifications: items.map((n) => ({
        id: n.id,
        type: n.type,
        channel: n.channel,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  });

  // ── PATCH /notifications/:id/read ──────────────────────────────────────
  app.patch("/:id/read", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    await prisma.notification.updateMany({
      where: { id, userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { ok: true };
  });

  // ── POST /notifications/read-all ───────────────────────────────────────
  app.post("/read-all", async (request) => {
    const user = request.user as { id: string };
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  });

  // ── GET /notifications/push/status ─────────────────────────────────────
  app.get("/push/status", async (request) => {
    const user = request.user as { id: string };
    const [vapid, devices] = await Promise.all([
      getOrCreateVapidKeys(user.id),
      listActivePushDevices(user.id),
    ]);

    return {
      ok: true,
      publicKey: vapid.publicKey,
      devices: devices.map((d) => ({
        id: d.id,
        endpoint: d.endpoint,
        deviceLabel: d.deviceLabel ?? "Navegador",
        platform: d.platform ?? "web",
        updatedAt: d.updatedAt,
      })),
    };
  });

  // ── POST /notifications/push/subscribe ─────────────────────────────────
  app.post("/push/subscribe", async (request) => {
    const user = request.user as { id: string };
    const body = SubscribeSchema.parse(request.body);
    const device = await upsertPushDevice(user.id, {
      ...body,
      userAgent: request.headers["user-agent"],
    });
    return {
      ok: true,
      device: {
        id: device.id,
        endpoint: device.endpoint,
        deviceLabel: device.deviceLabel,
        platform: device.platform,
        updatedAt: device.updatedAt,
      },
    };
  });

  // ── DELETE /notifications/push/subscribe ───────────────────────────────
  app.delete("/push/subscribe", async (request) => {
    const user = request.user as { id: string };
    const body = UnsubscribeSchema.parse(request.body);
    await deactivatePushDevice(user.id, body.endpoint, "user_disabled");
    return { ok: true };
  });

  // ── POST /notifications/test ───────────────────────────────────────────
  app.post("/test", async (request) => {
    const user = request.user as { id: string };
    const result = await dispatchUserNotification({
      userId: user.id,
      category: "always",
      type: "SYSTEM",
      title: "Alerta pagwave ativo!",
      body: "Suas notificações em tempo real e push neste aparelho estão funcionando.",
      url: "/settings",
      force: true,
    });

    return { ok: true, ...result };
  });

  // ── POST /notifications/weekly-digest ──────────────────────────────────
  app.post("/weekly-digest", async (request) => {
    const user = request.user as { id: string };
    const result = await sendWeeklyDigestForUser(user.id, true);
    return { ok: true, ...result };
  });
}
