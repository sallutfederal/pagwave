import {
  createCipheriv,
  createECDH,
  createHash,
  createPrivateKey,
  createSign,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import type { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { sendNotificationEmail } from "./mailer.js";

function generateVapidKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const pubJwk = publicKey.export({ format: "jwk" }) as { x?: string; y?: string };
  const privJwk = privateKey.export({ format: "jwk" }) as { d?: string };
  if (!pubJwk.x || !pubJwk.y || !privJwk.d) {
    throw new Error("Failed to export VAPID P-256 keypair.");
  }
  const pubRaw = Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(pubJwk.x, "base64url"),
    Buffer.from(pubJwk.y, "base64url"),
  ]);
  return {
    publicKey: pubRaw.toString("base64url"),
    privateKey: privJwk.d,
  };
}

function decodeBase64UrlFlexible(value: string): Buffer {
  const normalized = value.trim().replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return Buffer.from(normalized, "base64url");
}

function buildVapidAuthHeader(
  endpoint: string,
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string,
): string {
  const audience = new URL(endpoint).origin;
  const pubBuf = decodeBase64UrlFlexible(publicKeyB64);
  if (pubBuf.length !== 65 || pubBuf[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format.");
  }
  const keyObj = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: pubBuf.subarray(1, 33).toString("base64url"),
      y: pubBuf.subarray(33, 65).toString("base64url"),
      d: decodeBase64UrlFlexible(privateKeyB64).toString("base64url"),
    },
    format: "jwk",
  });

  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
      sub: subject,
    }),
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const sig = createSign("SHA256")
    .update(signingInput)
    .sign({ key: keyObj, dsaEncoding: "ieee-p1363" })
    .toString("base64url");

  return `vapid t=${signingInput}.${sig}, k=${pubBuf.toString("base64url")}`;
}

/** Encrypts a UTF-8 Web Push payload per RFC 8291 / RFC 8188 (aes128gcm). */
function encryptWebPushPayload(
  payloadJson: string,
  p256dh: string,
  auth: string,
): Buffer {
  const uaPublic = decodeBase64UrlFlexible(p256dh);
  const authSecret = decodeBase64UrlFlexible(auth);
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(uaPublic);
  const salt = randomBytes(16);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", sharedSecret, authSecret, keyInfo, 32));
  const cek = Buffer.from(
    hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16),
  );
  const nonce = Buffer.from(
    hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12),
  );

  const plaintext = Buffer.concat([Buffer.from(payloadJson, "utf8"), Buffer.from([0x02])]);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header.writeUInt8(asPublic.length, 20);

  return Buffer.concat([header, asPublic, ciphertext]);
}

async function sendWebPushMessage(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payloadJson: string,
  vapid: { publicKey: string; privateKey: string },
  subject: string,
): Promise<{ ok: boolean; statusCode: number }> {
  const body = encryptWebPushPayload(payloadJson, subscription.keys.p256dh, subscription.keys.auth);
  const authorization = buildVapidAuthHeader(
    subscription.endpoint,
    subject,
    vapid.publicKey,
    vapid.privateKey,
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      TTL: "86400",
      Urgency: "high",
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      Authorization: authorization,
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(5000),
  });

  return { ok: response.ok, statusCode: response.status };
}

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

  const generated = generateVapidKeyPair();
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
      const rawFrom = env.SMTP_FROM?.match(/<([^>]+)>/)?.[1] ?? env.SMTP_FROM ?? "noreply@pagwave.com";
      const subject =
        process.env.VAPID_SUBJECT?.trim() ||
        (rawFrom.includes("@") ? `mailto:${rawFrom.trim()}` : "mailto:noreply@pagwave.com");

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
            const res = await sendWebPushMessage(
              { endpoint: device.endpoint, keys: device.keys },
              pushPayload,
              vapid,
              subject,
            );
            if (res.ok) {
              pushDelivered += 1;
            } else {
              pushFailed += 1;
              if (res.statusCode === 404 || res.statusCode === 410) {
                await deactivatePushDevice(
                  input.userId,
                  device.endpoint,
                  `http_${res.statusCode}`,
                ).catch(() => undefined);
              }
            }
          } catch {
            pushFailed += 1;
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
