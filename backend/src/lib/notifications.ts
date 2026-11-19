import { createHash } from "node:crypto";
import type { NotificationType, Prisma } from "@prisma/client";
import webpush from "web-push";

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { sendNotificationEmail } from "./mailer.js";

export type NotificationPreferenceCategory =
  | "paymentAlerts"
  | "weeklyDigest"
  | "productRenewals"
  | "securityNotices"
  | "always";

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceLabel?: string;
  platform?: string;
  userAgent?: string;
};

export type StoredPushDevice = PushSubscriptionPayload & {
  id: string;
  active: boolean;
  updatedAt: string;
};

const VAPID_RESOURCE = "system_vapid_v1";
const PUSH_RESOURCE = "push_subscription";

let cachedVapid: { publicKey: string; privateKey: string } | null = null;

function hashEndpoint(endpoint: string): string {
  return createHash("sha256").update(endpoint, "utf8").digest("hex").slice(0, 32);
}

/**
 * Resolves a persistent VAPID keypair across serverless instances:
 * uses env vars when configured, otherwise creates & persists one in Postgres.
 */
export async function getOrCreateVapidKeys(actorUserId?: string): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const envPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPublic && envPrivate) {
    cachedVapid = { publicKey: envPublic, privateKey: envPrivate };
    return cachedVapid;
  }

  if (cachedVapid) return cachedVapid;

  const existing = await prisma.auditLog.findFirst({
    where: { resource: VAPID_RESOURCE },
    orderBy: { createdAt: "asc" },
    select: { details: true },
  });

  if (existing?.details && typeof existing.details === "object") {
    const d = existing.details as Record<string, unknown>;
    if (typeof d.publicKey === "string" && typeof d.privateKey === "string") {
      cachedVapid = { publicKey: d.publicKey, privateKey: d.privateKey };
      return cachedVapid;
    }
  }

  const generated = webpush.generateVAPIDKeys();
  const owner =
    actorUserId ??
    (await prisma.user.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }))?.id;

  if (owner) {
    await prisma.auditLog.create({
      data: {
        userId: owner,
        action: "SETTINGS_UPDATE",
        resource: VAPID_RESOURCE,
        resourceId: "default",
        details: {
          publicKey: generated.publicKey,
          privateKey: generated.privateKey,
        },
      },
    });
  }

  cachedVapid = generated;
  return cachedVapid;
}

export async function listActivePushDevices(userId: string): Promise<StoredPushDevice[]> {
  const rows = await prisma.auditLog.findMany({
    where: { userId, resource: PUSH_RESOURCE },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const seen = new Set<string>();
  const active: StoredPushDevice[] = [];

  for (const row of rows) {
    const key = row.resourceId ?? row.id;
    if (seen.has(key)) continue;
    seen.add(key);

    const details = (row.details ?? {}) as Record<string, unknown>;
    if (details.active !== true || typeof details.endpoint !== "string") continue;

    const keys = details.keys as Record<string, unknown> | undefined;
    if (!keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") continue;

    active.push({
      id: key,
      active: true,
      endpoint: details.endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      deviceLabel: typeof details.deviceLabel === "string" ? details.deviceLabel : undefined,
      platform: typeof details.platform === "string" ? details.platform : undefined,
      userAgent: row.userAgent ?? undefined,
      updatedAt: row.createdAt.toISOString(),
    });
  }

  return active;
}

export async function upsertPushDevice(
  userId: string,
  sub: PushSubscriptionPayload,
): Promise<StoredPushDevice> {
  const endpointHash = hashEndpoint(sub.endpoint);
  const now = new Date();

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SETTINGS_UPDATE",
      resource: PUSH_RESOURCE,
      resourceId: endpointHash,
      userAgent: sub.userAgent?.slice(0, 500) ?? null,
      details: {
        active: true,
        endpoint: sub.endpoint,
        keys: sub.keys,
        deviceLabel: sub.deviceLabel ?? "Navegador",
        platform: sub.platform ?? "web",
        updatedAt: now.toISOString(),
      },
    },
  });

  return {
    id: endpointHash,
    active: true,
    endpoint: sub.endpoint,
    keys: sub.keys,
    deviceLabel: sub.deviceLabel ?? "Navegador",
    platform: sub.platform ?? "web",
    userAgent: sub.userAgent,
    updatedAt: now.toISOString(),
  };
}

export async function deactivatePushDevice(userId: string, endpoint: string, reason = "unsubscribed") {
  const endpointHash = hashEndpoint(endpoint);
  await prisma.auditLog.create({
    data: {
      userId,
      action: "SETTINGS_UPDATE",
      resource: PUSH_RESOURCE,
      resourceId: endpointHash,
      details: {
        active: false,
        endpoint,
        reason,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export async function dispatchUserNotification(input: {
  userId: string;
  category: NotificationPreferenceCategory;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  data?: Prisma.InputJsonValue;
  emailSubject?: string;
  emailText?: string;
  force?: boolean;
}) {
  try {
    const [user, prefs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true, status: true },
      }),
      prisma.userPreference.findUnique({
        where: { userId: input.userId },
      }),
    ]);

    if (!user || user.status === "CLOSED") {
      return { created: false, pushDelivered: 0, pushFailed: 0, pushTotal: 0 };
    }

    const effectivePrefs = {
      paymentAlerts: prefs?.paymentAlerts ?? true,
      weeklyDigest: prefs?.weeklyDigest ?? true,
      productRenewals: prefs?.productRenewals ?? false,
      securityNotices: prefs?.securityNotices ?? true,
    };

    if (!input.force && input.category !== "always" && !effectivePrefs[input.category]) {
      return { created: false, pushDelivered: 0, pushFailed: 0, pushTotal: 0 };
    }

    const now = new Date();
    const targetUrl = input.url ?? "/dashboard";
    const payloadData: Prisma.InputJsonValue = {
      ...(typeof input.data === "object" && input.data !== null && !Array.isArray(input.data)
        ? (input.data as Record<string, unknown>)
        : {}),
      url: targetUrl,
      category: input.category,
    } as Prisma.InputJsonValue;

    const notif = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: "IN_APP",
        title: input.title.slice(0, 255),
        body: input.body,
        data: payloadData,
        sentAt: now,
      },
    });

    const devices = await listActivePushDevices(input.userId);
    let pushDelivered = 0;
    let pushFailed = 0;

    if (devices.length > 0) {
      const vapid = await getOrCreateVapidKeys(input.userId);
      const subject = process.env.VAPID_SUBJECT?.trim() || `mailto:${env.SMTP_FROM || "noreply@pagwave.com"}`;
      webpush.setVapidDetails(subject, vapid.publicKey, vapid.privateKey);

      const pushPayload = JSON.stringify({
        id: notif.id,
        title: input.title,
        body: input.body,
        url: targetUrl,
        tag: `pagwave-${input.type.toLowerCase()}-${notif.id.slice(0, 8)}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });

      await Promise.all(
        devices.map(async (device) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: device.endpoint,
                keys: device.keys,
              },
              pushPayload,
              { TTL: 86_400, urgency: "high" },
            );
            pushDelivered += 1;
          } catch (err: unknown) {
            pushFailed += 1;
            const statusCode =
              typeof err === "object" && err !== null && "statusCode" in err
                ? Number((err as { statusCode?: unknown }).statusCode)
                : 0;
            if (statusCode === 404 || statusCode === 410) {
              await deactivatePushDevice(input.userId, device.endpoint, `http_${statusCode}`).catch(
                () => undefined,
              );
            }
          }
        }),
      );
    }

    if (input.emailSubject || input.emailText) {
      void sendNotificationEmail(
        user.email,
        input.emailSubject ?? input.title,
        input.emailText ?? input.body,
      );
    }

    return {
      created: true,
      notificationId: notif.id,
      pushDelivered,
      pushFailed,
      pushTotal: devices.length,
    };
  } catch (error) {
    console.error("[notifications] dispatch failed", error);
    return { created: false, pushDelivered: 0, pushFailed: 0, pushTotal: 0 };
  }
}

export async function sendWeeklyDigestForUser(userId: string, force = false) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    select: {
      type: true,
      currencyCode: true,
      amount: true,
    },
  });

  let inflows = 0;
  let outflows = 0;
  const byCurrency = new Map<string, { in: number; out: number }>();

  for (const tx of txs) {
    const entry = byCurrency.get(tx.currencyCode) ?? { in: 0, out: 0 };
    const val = Number(tx.amount);
    if (
      tx.type === "DEPOSIT" ||
      tx.type === "TRANSFER_IN" ||
      tx.type === "CARD_REFUND" ||
      tx.type === "INTEREST" ||
      tx.type === "AIRDROP" ||
      tx.type === "STAKING_REWARD"
    ) {
      inflows += 1;
      entry.in += val;
    } else {
      outflows += 1;
      entry.out += val;
    }
    byCurrency.set(tx.currencyCode, entry);
  }

  const summaryParts = Array.from(byCurrency.entries())
    .slice(0, 3)
    .map(([code, v]) => `${code}: +${v.in.toFixed(2)} / -${v.out.toFixed(2)}`);

  const body =
    txs.length === 0
      ? "Nos últimos 7 dias você não teve movimentações concluídas."
      : `Últimos 7 dias: ${inflows} entrada(s) e ${outflows} saída(s). ${summaryParts.join(" · ")}`;

  return dispatchUserNotification({
    userId,
    category: "weeklyDigest",
    type: "SYSTEM",
    title: "Resumo semanal pagwave",
    body,
    url: "/transactions",
    emailSubject: "Pagwave · Resumo semanal de movimentações",
    emailText: `${body}\n\nAcesse seu extrato completo em: ${env.APP_URL}/transactions`,
    force,
  });
}
