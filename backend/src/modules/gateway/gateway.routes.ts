import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { generateTxRef } from "../../lib/id.js";

function verifyInternalSecret(request: FastifyRequest, reply: FastifyReply) {
  const header = String(request.headers["x-internal-secret"] ?? "");
  const expected = env.INTERNAL_SERVICE_SECRET;
  const a = Buffer.from(header, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    reply.status(401).send({ error: "UNAUTHORIZED", message: "Invalid internal secret." });
  }
}

async function ensureUserWallet(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  currencyCode: string,
) {
  const existing = await tx.wallet.findFirst({
    where: { userId, currency: { code: currencyCode }, isActive: true },
  });
  if (existing) return existing;

  const currency = await tx.currency.findUnique({ where: { code: currencyCode } });
  if (!currency) return null;

  return tx.wallet.create({
    data: {
      userId,
      currencyId: currency.id,
      type: currency.type === "CRYPTO" ? "CRYPTO" : "FIAT",
      label: `${currencyCode} Wallet`,
      balance: new Decimal(0),
      availableBalance: new Decimal(0),
      frozenBalance: new Decimal(0),
      isDefault: false,
    },
  });
}

export async function gatewayRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req, reply) => {
    verifyInternalSecret(req, reply);
  });

  // ── Saved Payout Keys (Beneficiaries) ──
  app.get("/beneficiaries/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const rows = await prisma.savedPayoutKey.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return {
      beneficiaries: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  });

  app.get("/beneficiaries/:userId/:id", async (request) => {
    const { userId, id } = request.params as { userId: string; id: string };
    const row = await prisma.savedPayoutKey.findFirst({ where: { id, userId } });
    return {
      beneficiary: row
        ? {
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          }
        : null,
    };
  });

  app.post("/beneficiaries", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        label: z.string().min(2),
        currency: z.string().min(2),
        rail: z.string().min(1),
        summary: z.string(),
        details: z.record(z.string(), z.string()),
        isDefault: z.boolean().optional(),
      })
      .parse(request.body);

    const existingCount = await prisma.savedPayoutKey.count({
      where: { userId: body.userId, currency: body.currency },
    });
    const shouldDefault = body.isDefault ?? existingCount === 0;

    const record = await prisma.$transaction(async (tx) => {
      if (shouldDefault) {
        await tx.savedPayoutKey.updateMany({
          where: { userId: body.userId, currency: body.currency },
          data: { isDefault: false },
        });
      }
      return tx.savedPayoutKey.create({
        data: {
          userId: body.userId,
          label: body.label.trim(),
          currency: body.currency,
          rail: body.rail,
          summary: body.summary,
          details: body.details,
          isDefault: shouldDefault,
        },
      });
    });

    return {
      beneficiary: {
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
    };
  });

  app.patch("/beneficiaries/:userId/:id/default", async (request) => {
    const { userId, id } = request.params as { userId: string; id: string };
    const target = await prisma.savedPayoutKey.findFirst({ where: { id, userId } });
    if (!target) return { beneficiary: null };

    const updated = await prisma.$transaction(async (tx) => {
      await tx.savedPayoutKey.updateMany({
        where: { userId, currency: target.currency },
        data: { isDefault: false },
      });
      return tx.savedPayoutKey.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return {
      beneficiary: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  });

  app.delete("/beneficiaries/:userId/:id", async (request) => {
    const { userId, id } = request.params as { userId: string; id: string };
    const res = await prisma.savedPayoutKey.deleteMany({ where: { id, userId } });
    return { deleted: res.count > 0 };
  });

  // ── Gateway Credentials ──
  app.post("/credentials/ensure", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        label: z.string(),
        clientId: z.string(),
        secretHash: z.string(),
        secretEncrypted: z.string(),
        secretPreview: z.string(),
      })
      .parse(request.body);

    const existing = await prisma.gatewayCredential.findUnique({
      where: { userId: body.userId },
    });
    if (existing) {
      return {
        credential: {
          ...existing,
          lastUsedAt: existing.lastUsedAt?.toISOString() ?? null,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
        },
      };
    }

    const created = await prisma.gatewayCredential.create({ data: body });
    return {
      credential: {
        ...created,
        lastUsedAt: null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  });

  app.post("/credentials/rotate", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        clientId: z.string(),
        secretHash: z.string(),
        secretEncrypted: z.string(),
        secretPreview: z.string(),
      })
      .parse(request.body);

    const updated = await prisma.gatewayCredential.upsert({
      where: { userId: body.userId },
      update: {
        clientId: body.clientId,
        secretHash: body.secretHash,
        secretEncrypted: body.secretEncrypted,
        secretPreview: body.secretPreview,
        requestCount: 0,
        lastUsedAt: null,
      },
      create: {
        userId: body.userId,
        label: "Chave Principal de Produção",
        clientId: body.clientId,
        secretHash: body.secretHash,
        secretEncrypted: body.secretEncrypted,
        secretPreview: body.secretPreview,
      },
    });

    return {
      credential: {
        ...updated,
        lastUsedAt: null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  });

  app.patch("/credentials/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const body = z
      .object({
        label: z.string().optional(),
        webhookUrl: z.string().optional(),
      })
      .parse(request.body);

    const updated = await prisma.gatewayCredential.update({
      where: { userId },
      data: {
        ...(body.label !== undefined ? { label: body.label.trim() } : {}),
        ...(body.webhookUrl !== undefined
          ? { webhookUrl: body.webhookUrl.trim() || null }
          : {}),
      },
    });

    return {
      credential: {
        ...updated,
        lastUsedAt: updated.lastUsedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  });

  app.get("/credentials/by-client/:clientId", async (request) => {
    const { clientId } = request.params as { clientId: string };
    const cred = await prisma.gatewayCredential.findUnique({
      where: { clientId },
      include: { user: { select: { status: true } } },
    });
    if (!cred) return { credential: null, suspended: false };
    return {
      credential: {
        ...cred,
        lastUsedAt: cred.lastUsedAt?.toISOString() ?? null,
        createdAt: cred.createdAt.toISOString(),
        updatedAt: cred.updatedAt.toISOString(),
      },
      suspended: cred.user.status === "SUSPENDED" || cred.user.status === "BLOCKED" || cred.user.status === "CLOSED",
    };
  });

  app.post("/credentials/:id/hit", async (request) => {
    const { id } = request.params as { id: string };
    const updated = await prisma.gatewayCredential.update({
      where: { id },
      data: { requestCount: { increment: 1 }, lastUsedAt: new Date() },
    });
    return { requestCount: updated.requestCount };
  });

  // ── Activities, Feed & Ledger Settlement ──
  app.post("/activities", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        kind: z.string(),
        currency: z.string(),
        toCurrency: z.string().optional(),
        amount: z.number().optional(),
        convertedAmount: z.number().optional(),
        rail: z.string().optional(),
        status: z.string(),
        externalId: z.string().optional(),
        transactionId: z.string().optional(),
        requestNumber: z.string().optional(),
        e2e: z.string().optional(),
        origin: z.string().optional(),
        destinationSummary: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(request.body);

    const created = await prisma.gatewayActivity.create({
      data: {
        userId: body.userId,
        kind: body.kind,
        currency: body.currency,
        toCurrency: body.toCurrency,
        amount: body.amount !== undefined ? new Decimal(body.amount) : null,
        convertedAmount:
          body.convertedAmount !== undefined ? new Decimal(body.convertedAmount) : null,
        rail: body.rail,
        status: body.status,
        externalId: body.externalId,
        transactionId: body.transactionId,
        requestNumber: body.requestNumber,
        e2e: body.e2e,
        origin: body.origin,
        destinationSummary: body.destinationSummary,
        metadata: body.metadata as object | undefined,
      },
    });

    return {
      activity: {
        ...created,
        amount: created.amount ? Number(created.amount) : undefined,
        convertedAmount: created.convertedAmount
          ? Number(created.convertedAmount)
          : undefined,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  });

  app.get("/feed/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const [activities, webhooks] = await Promise.all([
      prisma.gatewayActivity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.gatewayWebhookEvent.findMany({
        orderBy: { receivedAt: "desc" },
        take: 40,
      }),
    ]);

    return {
      activities: activities.map((a) => ({
        ...a,
        amount: a.amount ? Number(a.amount) : undefined,
        convertedAmount: a.convertedAmount ? Number(a.convertedAmount) : undefined,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      webhooks: webhooks.map((w) => ({
        ...w,
        amount: w.amount ? Number(w.amount) : undefined,
        receivedAt: w.receivedAt.toISOString(),
      })),
    };
  });

  app.post("/webhooks/record", async (request) => {
    const body = z
      .object({
        dedupKey: z.string(),
        type: z.string(),
        status: z.string(),
        currency: z.string().optional(),
        amount: z.number().optional(),
        e2e: z.string().optional(),
        externalId: z.string().optional(),
        transactionId: z.string().optional(),
        requestNumber: z.string().optional(),
        origin: z.string().optional(),
        verifiedSignature: z.boolean(),
        payload: z.record(z.string(), z.unknown()),
      })
      .parse(request.body);

    const existing = await prisma.gatewayWebhookEvent.findUnique({
      where: { dedupKey: body.dedupKey },
    });
    if (existing) {
      return {
        duplicate: true,
        event: {
          ...existing,
          amount: existing.amount ? Number(existing.amount) : undefined,
          receivedAt: existing.receivedAt.toISOString(),
        },
        forwardTargets: [],
      };
    }

    const event = await prisma.gatewayWebhookEvent.create({
      data: {
        dedupKey: body.dedupKey,
        type: body.type,
        status: body.status,
        currency: body.currency,
        amount: body.amount !== undefined ? new Decimal(body.amount) : null,
        e2e: body.e2e,
        externalId: body.externalId,
        transactionId: body.transactionId,
        requestNumber: body.requestNumber,
        origin: body.origin,
        verifiedSignature: body.verifiedSignature,
        payload: body.payload as object,
      },
    });

    const nextStatus =
      body.type === "med"
        ? "med_blocked"
        : body.type === "med_closed"
          ? "med_closed"
          : body.status;

    const matchingActivities = await prisma.gatewayActivity.findMany({
      where: {
        OR: [
          ...(body.requestNumber ? [{ requestNumber: body.requestNumber }] : []),
          ...(body.transactionId ? [{ transactionId: body.transactionId }] : []),
          ...(body.origin !== "static" && body.externalId
            ? [{ externalId: body.externalId }]
            : []),
        ],
      },
    });

    const settings = await prisma.platformSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    const forwardTargets: Array<{ webhookUrl: string; secretEncrypted: string }> = [];
    const seenUrls = new Set<string>();

    for (const act of matchingActivities) {
      await prisma.$transaction(async (tx) => {
        await tx.gatewayActivity.update({
          where: { id: act.id },
          data: {
            status: nextStatus,
            e2e: body.e2e ?? act.e2e,
          },
        });

        // Credit user's internal Wallet ledger atomically when cash-in settles for the first time.
        const isSettledPaid = nextStatus === "paid" || nextStatus === "completed";
        const settlementAmount = body.amount ?? (act.amount ? Number(act.amount) : 0);
        if (
          act.kind === "cashin" &&
          isSettledPaid &&
          !act.settledInLedger &&
          settlementAmount > 0
        ) {
          const wallet = await ensureUserWallet(tx, act.userId, act.currency);
          if (wallet) {
            const gross = new Decimal(settlementAmount);
            const fee = gross.mul(settings.feeBps).div(10_000);
            const net = gross.sub(fee);
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: { increment: net },
                availableBalance: { increment: net },
              },
            });
            await tx.transaction.create({
              data: {
                referenceId: generateTxRef(),
                userId: act.userId,
                type: "DEPOSIT",
                status: "COMPLETED",
                toWalletId: wallet.id,
                amount: gross,
                fee,
                netAmount: net,
                currencyCode: act.currency,
                externalId: act.externalId ?? body.e2e,
                description: `Depósito XPag (${act.rail ?? act.currency})`,
                completedAt: new Date(),
              },
            });
            await tx.gatewayActivity.update({
              where: { id: act.id },
              data: {
                settledInLedger: true,
                feeAmount: fee,
              },
            });
          }
        }
      });

      const cred = await prisma.gatewayCredential.findUnique({
        where: { userId: act.userId },
      });
      const metaUrl =
        act.metadata && typeof (act.metadata as Record<string, unknown>).clientWebhookUrl === "string"
          ? ((act.metadata as Record<string, unknown>).clientWebhookUrl as string)
          : undefined;
      const targetUrl = metaUrl || cred?.webhookUrl;
      if (targetUrl && cred && !seenUrls.has(targetUrl)) {
        seenUrls.add(targetUrl);
        forwardTargets.push({
          webhookUrl: targetUrl,
          secretEncrypted: cred.secretEncrypted,
        });
      }
    }

    return {
      duplicate: false,
      event: {
        ...event,
        amount: event.amount ? Number(event.amount) : undefined,
        receivedAt: event.receivedAt.toISOString(),
      },
      forwardTargets,
    };
  });

  app.post("/activities/update-by-ref", async (request) => {
    const body = z
      .object({
        requestNumber: z.string().optional(),
        transactionId: z.string().optional(),
        externalId: z.string().optional(),
        status: z.string(),
        e2e: z.string().optional(),
      })
      .parse(request.body);

    const matched = await prisma.gatewayActivity.findMany({
      where: {
        OR: [
          ...(body.requestNumber ? [{ requestNumber: body.requestNumber }] : []),
          ...(body.transactionId ? [{ transactionId: body.transactionId }] : []),
          ...(body.externalId ? [{ externalId: body.externalId }] : []),
        ],
      },
    });

    for (const act of matched) {
      await prisma.gatewayActivity.update({
        where: { id: act.id },
        data: { status: body.status, e2e: body.e2e ?? act.e2e },
      });
    }
    return { updated: matched.length > 0 };
  });

  // ── API Logs ──
  app.post("/logs", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        clientId: z.string(),
        method: z.string(),
        endpoint: z.string(),
        currency: z.string().optional(),
        statusCode: z.number().int(),
        ok: z.boolean(),
        errorCode: z.string().optional(),
        latencyMs: z.number().int(),
      })
      .parse(request.body);

    await prisma.gatewayApiLog.create({ data: body });
    return { ok: true };
  });

  app.get("/logs/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const logs = await prisma.gatewayApiLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return {
      logs: logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    };
  });

  // ── Platform Settings & Global Admin Aggregates ──
  app.get("/admin/settings", async () => {
    const settings = await prisma.platformSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    return {
      config: {
        ...settings,
        disabledCurrencies: Array.isArray(settings.disabledCurrencies)
          ? (settings.disabledCurrencies as string[])
          : [],
        updatedAt: settings.updatedAt.toISOString(),
      },
    };
  });

  app.patch("/admin/settings", async (request) => {
    const body = z
      .object({
        environmentMode: z.enum(["auto", "sandbox", "production"]).optional(),
        feeBps: z.number().int().min(0).max(2000).optional(),
        disabledCurrencies: z.array(z.string()).optional(),
        maintenanceNotice: z.string().optional(),
        globalWebhookUrl: z.string().optional(),
      })
      .parse(request.body);

    const settings = await prisma.platformSetting.upsert({
      where: { id: "default" },
      update: {
        ...(body.environmentMode !== undefined ? { environmentMode: body.environmentMode } : {}),
        ...(body.feeBps !== undefined ? { feeBps: body.feeBps } : {}),
        ...(body.disabledCurrencies !== undefined
          ? { disabledCurrencies: body.disabledCurrencies }
          : {}),
        ...(body.maintenanceNotice !== undefined
          ? { maintenanceNotice: body.maintenanceNotice }
          : {}),
        ...(body.globalWebhookUrl !== undefined
          ? { globalWebhookUrl: body.globalWebhookUrl }
          : {}),
      },
      create: {
        id: "default",
        environmentMode: body.environmentMode ?? "auto",
        feeBps: body.feeBps ?? 90,
        disabledCurrencies: body.disabledCurrencies ?? [],
        maintenanceNotice: body.maintenanceNotice ?? "",
        globalWebhookUrl: body.globalWebhookUrl ?? "",
      },
    });

    return {
      config: {
        ...settings,
        disabledCurrencies: Array.isArray(settings.disabledCurrencies)
          ? (settings.disabledCurrencies as string[])
          : [],
        updatedAt: settings.updatedAt.toISOString(),
      },
    };
  });

  app.get("/admin/overview", async () => {
    const [
      totalUsers,
      activeApiKeys,
      totalBeneficiaries,
      activities,
      webhookCount,
      creds,
      recentWebhooks,
      settings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gatewayCredential.count(),
      prisma.savedPayoutKey.count(),
      prisma.gatewayActivity.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.gatewayWebhookEvent.count(),
      prisma.gatewayCredential.findMany({ select: { requestCount: true } }),
      prisma.gatewayWebhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 8 }),
      prisma.platformSetting.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default" },
      }),
    ]);

    const volumeByCurrency: Record<
      string,
      { cashin: number; cashout: number; count: number }
    > = {};

    for (const a of activities) {
      if (!volumeByCurrency[a.currency]) {
        volumeByCurrency[a.currency] = { cashin: 0, cashout: 0, count: 0 };
      }
      volumeByCurrency[a.currency].count += 1;
      const amt = a.amount ? Number(a.amount) : 0;
      if (a.kind === "cashin") volumeByCurrency[a.currency].cashin += amt;
      if (a.kind === "cashout") volumeByCurrency[a.currency].cashout += amt;
    }

    return {
      totalUsers,
      activeApiKeys,
      totalApiRequests: creds.reduce((s, c) => s + c.requestCount, 0),
      totalBeneficiaries,
      totalActivities: activities.length,
      cashinCount: activities.filter((a) => a.kind === "cashin").length,
      cashoutCount: activities.filter((a) => a.kind === "cashout").length,
      conversionCount: activities.filter((a) => a.kind === "conversion").length,
      medActiveCount: activities.filter((a) => a.status === "med_blocked").length,
      webhookCount,
      volumeByCurrency,
      recentActivities: activities.slice(0, 10).map((a) => ({
        ...a,
        amount: a.amount ? Number(a.amount) : undefined,
        createdAt: a.createdAt.toISOString(),
      })),
      recentWebhooks: recentWebhooks.map((w) => ({
        ...w,
        amount: w.amount ? Number(w.amount) : undefined,
        receivedAt: w.receivedAt.toISOString(),
      })),
      adminConfig: {
        ...settings,
        disabledCurrencies: Array.isArray(settings.disabledCurrencies)
          ? (settings.disabledCurrencies as string[])
          : [],
        updatedAt: settings.updatedAt.toISOString(),
      },
    };
  });

  app.get("/admin/transactions", async () => {
    const [activities, webhooks] = await Promise.all([
      prisma.gatewayActivity.findMany({
        include: {
          user: {
            select: {
              email: true,
              profile: { select: { displayName: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.gatewayWebhookEvent.findMany({
        orderBy: { receivedAt: "desc" },
        take: 80,
      }),
    ]);

    return {
      activities: activities.map((a) => ({
        id: a.id,
        userId: a.userId,
        ownerEmail: a.user.email,
        ownerName:
          a.user.profile?.displayName ||
          `${a.user.profile?.firstName ?? ""} ${a.user.profile?.lastName ?? ""}`.trim() ||
          a.user.email,
        kind: a.kind,
        currency: a.currency,
        toCurrency: a.toCurrency ?? undefined,
        amount: a.amount ? Number(a.amount) : undefined,
        rail: a.rail ?? undefined,
        status: a.status,
        externalId: a.externalId ?? undefined,
        transactionId: a.transactionId ?? undefined,
        requestNumber: a.requestNumber ?? undefined,
        e2e: a.e2e ?? undefined,
        origin: a.origin ?? undefined,
        createdAt: a.createdAt.toISOString(),
      })),
      webhooks: webhooks.map((w) => ({
        ...w,
        amount: w.amount ? Number(w.amount) : undefined,
        receivedAt: w.receivedAt.toISOString(),
      })),
    };
  });

  app.patch("/admin/transactions/:id", async (request) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({ status: z.string() }).parse(request.body);
    const updated = await prisma.gatewayActivity.update({
      where: { id },
      data: { status },
    });
    return {
      activity: {
        ...updated,
        amount: updated.amount ? Number(updated.amount) : undefined,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  });

  app.get("/admin/integrations", async () => {
    const [keys, logs, webhooks] = await Promise.all([
      prisma.gatewayCredential.findMany({
        include: {
          user: {
            select: {
              email: true,
              profile: { select: { displayName: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.gatewayApiLog.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.gatewayWebhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 60 }),
    ]);

    return {
      keys: keys.map((k) => ({
        id: k.id,
        userId: k.userId,
        ownerEmail: k.user.email,
        ownerName:
          k.user.profile?.displayName ||
          `${k.user.profile?.firstName ?? ""} ${k.user.profile?.lastName ?? ""}`.trim() ||
          k.user.email,
        label: k.label,
        clientId: k.clientId,
        secretPreview: k.secretPreview,
        webhookUrl: k.webhookUrl ?? "",
        requestCount: k.requestCount,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      })),
      logs: logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
      webhooks: webhooks.map((w) => ({
        ...w,
        amount: w.amount ? Number(w.amount) : undefined,
        receivedAt: w.receivedAt.toISOString(),
      })),
    };
  });
}
