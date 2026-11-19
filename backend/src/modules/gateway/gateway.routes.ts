import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { calculateFee, decimalSub, decimalZero, toDecimal } from "../../lib/decimal.js";
import { BadRequestError, InsufficientFundsError, NotFoundError } from "../../lib/errors.js";
import { generateTxRef } from "../../lib/id.js";
import { dispatchUserNotification } from "../../lib/notifications.js";
import { assertWithdrawalLimits } from "../wallets/wallet.service.js";

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

async function settleActivityInLedger(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  act: {
    id: string;
    userId: string;
    kind: string;
    currency: string;
    rail: string | null;
    amount: Decimal | null;
    externalId: string | null;
    transactionId: string | null;
    e2e: string | null;
    settledInLedger: boolean;
    metadata: unknown;
  },
  opts: {
    nextStatus: string;
    settlementAmount?: number;
    e2e?: string;
    feeBps: number;
  },
) {
  const normalizedStatus = opts.nextStatus.toLowerCase();
  await tx.gatewayActivity.update({
    where: { id: act.id },
    data: {
      status: opts.nextStatus,
      e2e: opts.e2e ?? act.e2e,
    },
  });

  if (act.settledInLedger) return;

  const isSettledPaid = normalizedStatus === "paid" || normalizedStatus === "completed";
  const isCashoutFailed =
    normalizedStatus === "failed" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "expired" ||
    normalizedStatus === "rejected" ||
    normalizedStatus === "returned";

  if (act.kind === "cashin" && isSettledPaid) {
    const grossNum = opts.settlementAmount ?? (act.amount ? Number(act.amount) : 0);
    if (grossNum <= 0) return;

    const claimed = await tx.gatewayActivity.updateMany({
      where: { id: act.id, settledInLedger: false },
      data: { settledInLedger: true },
    });
    if (claimed.count === 0) return;

    const wallet = await ensureUserWallet(tx, act.userId, act.currency);
    if (!wallet) return;

    const metaObj =
      act.metadata && typeof act.metadata === "object"
        ? (act.metadata as Record<string, unknown>)
        : undefined;
    const isSelfDeposit = metaObj?.purpose === "self_deposit";

    const gross = new Decimal(grossNum);
    // Keep fee calculation consistent with platform feeBps (self deposits use 0 only if feeBps is 0).
    const fee = gross.mul(opts.feeBps).div(10_000);
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
        externalId: act.externalId ?? opts.e2e,
        description: isSelfDeposit
          ? `Depósito na conta (${act.rail ?? act.currency})`
          : `Depósito XPag (${act.rail ?? act.currency})`,
        completedAt: new Date(),
      },
    });
    await tx.gatewayActivity.update({
      where: { id: act.id },
      data: { feeAmount: fee },
    });
    return {
      userId: act.userId,
      title: isSelfDeposit
        ? `Depósito confirmado: +${net.toFixed(2)} ${act.currency}`
        : `Pagamento recebido: +${net.toFixed(2)} ${act.currency}`,
      body: `Crédito líquido liberado na sua carteira (${act.rail ?? act.currency}).`,
      url: "/wallet",
    };
  }

  if (act.kind === "cashout" && (isSettledPaid || isCashoutFailed)) {
    const claimed = await tx.gatewayActivity.updateMany({
      where: { id: act.id, settledInLedger: false },
      data: { settledInLedger: true },
    });
    if (claimed.count === 0) return null;

    if (!act.externalId) return null;
    const reservedTx = await tx.transaction.findFirst({
      where: {
        userId: act.userId,
        externalId: act.externalId,
        type: "WITHDRAWAL",
        status: "PROCESSING",
      },
    });
    if (!reservedTx || !reservedTx.fromWalletId) return null;

    const now = new Date();
    if (isSettledPaid) {
      await tx.wallet.update({
        where: { id: reservedTx.fromWalletId },
        data: {
          balance: { decrement: reservedTx.amount },
          frozenBalance: { decrement: reservedTx.amount },
        },
      });
      await tx.transaction.update({
        where: { id: reservedTx.id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          txHash: opts.e2e ?? reservedTx.txHash,
        },
      });
      return {
        userId: act.userId,
        title: `Saque concluído: ${reservedTx.amount.toString()} ${act.currency}`,
        body: `Liquidação confirmada (${act.rail ?? act.currency}).`,
        url: "/transactions",
      };
    } else {
      await tx.wallet.update({
        where: { id: reservedTx.fromWalletId },
        data: {
          frozenBalance: { decrement: reservedTx.amount },
          availableBalance: { increment: reservedTx.amount },
        },
      });
      await tx.transaction.update({
        where: { id: reservedTx.id },
        data: {
          status: "FAILED",
          failedAt: now,
          flagReason: `Cashout ${normalizedStatus} by provider`,
        },
      });
      return {
        userId: act.userId,
        title: `Saque estornado: ${reservedTx.amount.toString()} ${act.currency}`,
        body: `O valor foi devolvido para o seu saldo disponível.`,
        url: "/wallet",
      };
    }
  }

  return null;
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

    void dispatchUserNotification({
      userId: body.userId,
      category: "securityNotices",
      type: "SECURITY",
      title: "Chave de API rotacionada",
      body: `Uma nova credencial (${body.clientId}) foi gerada para sua conta.`,
      url: "/integrations",
      emailSubject: "Pagwave · Chave de API rotacionada",
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

  app.post("/notifications/webhook-failure", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        url: z.string().max(500),
      })
      .parse(request.body);

    const res = await dispatchUserNotification({
      userId: body.userId,
      category: "productRenewals",
      type: "SYSTEM",
      title: "Falha ao entregar webhook",
      body: `Não foi possível entregar o evento após múltiplas tentativas para ${body.url}.`,
      url: "/integrations",
      emailSubject: "Pagwave · Falha na entrega de Webhook",
    });

    return { ok: true, ...res };
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

    const forwardTargets: Array<{ userId: string; webhookUrl: string; secretEncrypted: string }> = [];
    const seenUrls = new Set<string>();

    for (const act of matchingActivities) {
      const notif = await prisma.$transaction(async (tx) => {
        return settleActivityInLedger(tx, act, {
          nextStatus,
          settlementAmount: body.amount,
          e2e: body.e2e,
          feeBps: settings.feeBps,
        });
      });

      if (notif) {
        void dispatchUserNotification({
          userId: notif.userId,
          category: "paymentAlerts",
          type: "TRANSACTION",
          title: notif.title,
          body: notif.body,
          url: notif.url,
          emailSubject: `Pagwave · ${notif.title}`,
        });
      }

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
          userId: act.userId,
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

    const settings = await prisma.platformSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    for (const act of matched) {
      const notif = await prisma.$transaction(async (tx) => {
        return settleActivityInLedger(tx, act, {
          nextStatus: body.status,
          e2e: body.e2e,
          feeBps: settings.feeBps,
        });
      });
      if (notif) {
        void dispatchUserNotification({
          userId: notif.userId,
          category: "paymentAlerts",
          type: "TRANSACTION",
          title: notif.title,
          body: notif.body,
          url: notif.url,
          emailSubject: `Pagwave · ${notif.title}`,
        });
      }
    }
    return { updated: matched.length > 0 };
  });

  // ── User Ledger (per-user balances, cashout reservation, conversion settlement) ──
  app.get("/ledger/:userId/balances", async (request) => {
    const { userId } = request.params as { userId: string };
    const [wallets, settings, profile] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId, isActive: true },
        include: { currency: { select: { code: true } } },
      }),
      prisma.platformSetting.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default" },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { kycLevel: true, kycStatus: true },
      }),
    ]);

    const balances: Record<string, { available: number; blocked: number }> = {};
    for (const w of wallets) {
      const code = w.currency.code;
      const cur = balances[code] ?? { available: 0, blocked: 0 };
      cur.available += Number(w.availableBalance);
      cur.blocked += Number(w.frozenBalance);
      balances[code] = cur;
    }

    const blockedCurrencies = Array.isArray(settings.disabledCurrencies)
      ? (settings.disabledCurrencies as string[])
      : [];

    return {
      balances,
      blocked_currencies: blockedCurrencies,
      environmentMode: settings.environmentMode,
      kycLevel: profile?.kycLevel ?? 0,
      kycStatus: profile?.kycStatus ?? "NOT_STARTED",
      updated_at: new Date().toISOString(),
    };
  });

  app.post("/ledger/reserve-cashout", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        currency: z.string().trim().min(2).max(10),
        amount: z.number().positive(),
        externalId: z.string().trim().min(3).max(128),
        rail: z.string().trim().optional(),
        description: z.string().trim().max(255).optional(),
      })
      .parse(request.body);

    const amount = toDecimal(body.amount);
    await assertWithdrawalLimits(body.userId, body.currency, amount);

    const feeConfig = await prisma.feeConfig.findUnique({
      where: {
        transactionType_currencyCode: {
          transactionType: "WITHDRAWAL",
          currencyCode: body.currency,
        },
      },
    });
    const fee = feeConfig
      ? calculateFee(amount, feeConfig.flatFee, feeConfig.percentFee, feeConfig.minFee, feeConfig.maxFee)
      : decimalZero();
    const netAmount = decimalSub(amount, fee);
    const refId = generateTxRef();

    const reserved = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { userId: body.userId, currency: { code: body.currency }, isActive: true },
      });
      if (!wallet) {
        throw new InsufficientFundsError(`Saldo insuficiente em ${body.currency}. Deposite antes de sacar.`);
      }

      const debited = await tx.wallet.updateMany({
        where: { id: wallet.id, availableBalance: { gte: amount } },
        data: {
          availableBalance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      });
      if (debited.count === 0) {
        throw new InsufficientFundsError(`Saldo disponível insuficiente em ${body.currency}.`);
      }

      const txRow = await tx.transaction.create({
        data: {
          referenceId: refId,
          userId: body.userId,
          type: "WITHDRAWAL",
          status: "PROCESSING",
          fromWalletId: wallet.id,
          amount,
          fee,
          netAmount,
          currencyCode: body.currency,
          externalId: body.externalId,
          description: body.description ?? `Saque XPag (${body.rail ?? body.currency})`,
          processedAt: new Date(),
        },
      });

      return { txId: txRow.id, referenceId: refId };
    });

    return { ok: true, ...reserved };
  });

  app.post("/ledger/release-cashout", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        externalId: z.string().trim().min(3).max(128),
        reason: z.string().trim().max(255).optional(),
      })
      .parse(request.body);

    const released = await prisma.$transaction(async (tx) => {
      const row = await tx.transaction.findFirst({
        where: {
          userId: body.userId,
          externalId: body.externalId,
          type: "WITHDRAWAL",
          status: "PROCESSING",
        },
      });
      if (!row || !row.fromWalletId) return false;

      const updated = await tx.transaction.updateMany({
        where: { id: row.id, status: "PROCESSING" },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          flagReason: body.reason ?? "Provider rejected cashout",
        },
      });
      if (updated.count === 0) return false;

      await tx.wallet.update({
        where: { id: row.fromWalletId },
        data: {
          frozenBalance: { decrement: row.amount },
          availableBalance: { increment: row.amount },
        },
      });
      return true;
    });

    return { ok: true, released };
  });

  app.post("/ledger/settle-conversion", async (request) => {
    const body = z
      .object({
        userId: z.string().uuid(),
        fromCurrency: z.string().trim().min(2).max(10),
        toCurrency: z.string().trim().min(2).max(10),
        fromAmount: z.number().positive(),
        toAmount: z.number().positive(),
        rate: z.number().positive().optional(),
        externalId: z.string().trim().min(3).max(128),
      })
      .parse(request.body);

    const fromDec = toDecimal(body.fromAmount);
    const toDec = toDecimal(body.toAmount);

    if (body.fromCurrency === body.toCurrency) {
      throw new BadRequestError("Moedas de origem e destino devem ser diferentes.");
    }

    await prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findFirst({
        where: { userId: body.userId, currency: { code: body.fromCurrency }, isActive: true },
      });
      if (!fromWallet) {
        throw new InsufficientFundsError(`Saldo insuficiente em ${body.fromCurrency}.`);
      }

      const debited = await tx.wallet.updateMany({
        where: { id: fromWallet.id, availableBalance: { gte: fromDec } },
        data: {
          balance: { decrement: fromDec },
          availableBalance: { decrement: fromDec },
        },
      });
      if (debited.count === 0) {
        throw new InsufficientFundsError(`Saldo disponível insuficiente em ${body.fromCurrency}.`);
      }

      const toWallet = await ensureUserWallet(tx, body.userId, body.toCurrency);
      if (!toWallet) {
        throw new NotFoundError(`Currency ${body.toCurrency}`);
      }

      await tx.wallet.update({
        where: { id: toWallet.id },
        data: {
          balance: { increment: toDec },
          availableBalance: { increment: toDec },
        },
      });

      await tx.transaction.create({
        data: {
          referenceId: generateTxRef(),
          userId: body.userId,
          type: "EXCHANGE",
          status: "COMPLETED",
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          amount: fromDec,
          fee: decimalZero(),
          netAmount: fromDec,
          currencyCode: body.fromCurrency,
          exchangeRate: body.rate ? toDecimal(body.rate) : null,
          toCurrencyCode: body.toCurrency,
          toAmount: toDec,
          externalId: body.externalId,
          description: `Conversão ${body.fromCurrency} → ${body.toCurrency}`,
          completedAt: new Date(),
        },
      });
    });

    void dispatchUserNotification({
      userId: body.userId,
      category: "paymentAlerts",
      type: "TRANSACTION",
      title: `Conversão FX: ${body.fromAmount} ${body.fromCurrency} → ${body.toAmount} ${body.toCurrency}`,
      body: "Saldo convertido e disponível imediatamente na sua carteira.",
      url: "/transactions",
    });

    return { ok: true };
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

  app.get("/users/:userId/status", async (request) => {
    const { userId } = request.params as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    const suspended =
      !user ||
      user.status === "SUSPENDED" ||
      user.status === "BLOCKED" ||
      user.status === "CLOSED";
    return {
      suspended,
      status: user?.status ?? "NOT_FOUND",
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
