import type { FastifyInstance } from "fastify";
import { randomInt } from "node:crypto";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { authGuard } from "../../middleware/auth.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";

const createCardSchema = z.object({
  type: z.enum(["VIRTUAL", "PHYSICAL"]),
  brand: z.enum(["VISA", "MASTERCARD"]).default("VISA"),
  variant: z.enum(["DARK", "LIGHT"]).default("DARK"),
  label: z.string().max(100).optional(),
  holderName: z.string().min(2).max(100),
  currencyCode: z.string().default("USD"),
  dailyLimit: z.coerce.number().min(0).default(5000),
  monthlyLimit: z.coerce.number().min(0).default(50000),
  linkedWalletId: z.string().uuid().optional(),
});

const updateCardSchema = z.object({
  label: z.string().max(100).optional(),
  dailyLimit: z.coerce.number().min(0).optional(),
  monthlyLimit: z.coerce.number().min(0).optional(),
  singleTxLimit: z.coerce.number().min(0).optional(),
  onlineEnabled: z.boolean().optional(),
  contactless: z.boolean().optional(),
  internationalEnabled: z.boolean().optional(),
});

export async function cardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // ─── GET /cards ────────────────────────────────────────────────────────
  app.get("/", async (request) => {
    const user = request.user as { id: string };

    const cards = await prisma.card.findMany({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      include: { _count: { select: { transactions: true } } },
      orderBy: { createdAt: "desc" },
    });

    return cards.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      brand: c.brand,
      variant: c.variant,
      label: c.label,
      last4: c.last4,
      expiry: `${String(c.expiryMonth).padStart(2, "0")}/${String(c.expiryYear).slice(-2)}`,
      holderName: c.holderName,
      currencyCode: c.currencyCode,
      transactionCount: c._count.transactions,
      linkedWalletId: c.linkedWalletId,
      dailyLimit: c.dailyLimit.toString(),
      monthlyLimit: c.monthlyLimit.toString(),
      dailySpent: c.dailySpent.toString(),
      monthlySpent: c.monthlySpent.toString(),
      onlineEnabled: c.onlineEnabled,
      contactless: c.contactless,
      internationalEnabled: c.internationalEnabled,
      frozenAt: c.frozenAt?.toISOString() ?? null,
      activatedAt: c.activatedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    }));
  });

  // ─── GET /cards/:id ────────────────────────────────────────────────────
  app.get("/:id", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    const card = await prisma.card.findFirst({
      where: { id, userId: user.id },
    });

    if (!card) throw new NotFoundError("Card");

    // Get recent card transactions
    const recentTxs = await prisma.cardTransaction.findMany({
      where: { cardId: card.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      id: card.id,
      type: card.type,
      status: card.status,
      brand: card.brand,
      variant: card.variant,
      label: card.label,
      last4: card.last4,
      expiry: `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`,
      holderName: card.holderName,
      currencyCode: card.currencyCode,
      dailyLimit: card.dailyLimit.toString(),
      monthlyLimit: card.monthlyLimit.toString(),
      dailySpent: card.dailySpent.toString(),
      monthlySpent: card.monthlySpent.toString(),
      singleTxLimit: card.singleTxLimit.toString(),
      onlineEnabled: card.onlineEnabled,
      contactless: card.contactless,
      internationalEnabled: card.internationalEnabled,
      linkedWalletId: card.linkedWalletId,
      frozenAt: card.frozenAt?.toISOString() ?? null,
      activatedAt: card.activatedAt?.toISOString() ?? null,
      createdAt: card.createdAt.toISOString(),
      recentTransactions: recentTxs.map((tx) => ({
        id: tx.id,
        amount: tx.amount.toString(),
        currencyCode: tx.currencyCode,
        merchantName: tx.merchantName,
        merchantCategory: tx.merchantCategory,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
      })),
    };
  });

  // ─── POST /cards ───────────────────────────────────────────────────────
  app.post("/", async (request, reply) => {
    const user = request.user as { id: string };
    const body = createCardSchema.parse(request.body);

    // Generate virtual card details
    const last4 = String(randomInt(1000, 10000));
    const now = new Date();
    const expiryMonth = now.getMonth() + 1;
    const expiryYear = now.getFullYear() + 4; // 4 year validity

    // A card spends from a wallet. Never trust a client-supplied wallet id:
    // it must belong to the caller. Without one, use the wallet of the card currency.
    const linkedWallet = body.linkedWalletId
      ? await prisma.wallet.findFirst({
          where: { id: body.linkedWalletId, userId: user.id, isActive: true },
        })
      : await prisma.wallet.findFirst({
          where: { userId: user.id, isActive: true, type: "FIAT", currency: { code: body.currencyCode } },
        });

    if (!linkedWallet) {
      throw new BadRequestError(
        body.linkedWalletId
          ? "Linked wallet not found."
          : `You need a ${body.currencyCode} wallet before issuing a ${body.currencyCode} card.`,
      );
    }

    const card = await prisma.card.create({
      data: {
        userId: user.id,
        type: body.type,
        brand: body.brand,
        variant: body.variant,
        label: body.label ?? `${body.brand} ${body.type}`,
        last4,
        expiryMonth,
        expiryYear,
        holderName: body.holderName,
        currencyCode: body.currencyCode,
        dailyLimit: body.dailyLimit,
        monthlyLimit: body.monthlyLimit,
        linkedWalletId: linkedWallet.id,
        status: body.type === "VIRTUAL" ? "ACTIVE" : "PENDING_ACTIVATION",
        activatedAt: body.type === "VIRTUAL" ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CARD_CREATE",
        resource: "card",
        resourceId: card.id,
        details: { type: body.type, brand: body.brand, last4 },
      },
    });

    reply.status(201).send({
      id: card.id,
      type: card.type,
      status: card.status,
      brand: card.brand,
      variant: card.variant,
      label: card.label,
      last4: card.last4,
      expiry: `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}`,
      holderName: card.holderName,
    });
  });

  // ─── PATCH /cards/:id ──────────────────────────────────────────────────
  app.patch("/:id", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };
    const body = updateCardSchema.parse(request.body);

    const card = await prisma.card.findFirst({ where: { id, userId: user.id } });
    if (!card) throw new NotFoundError("Card");

    const updated = await prisma.card.update({
      where: { id },
      data: body,
    });

    return { message: "Card updated", id: updated.id };
  });

  // ─── POST /cards/:id/freeze ────────────────────────────────────────────
  app.post("/:id/freeze", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    const card = await prisma.card.findFirst({ where: { id, userId: user.id } });
    if (!card) throw new NotFoundError("Card");

    if (card.status === "FROZEN") {
      throw new BadRequestError("Card is already frozen.");
    }

    await prisma.card.update({
      where: { id },
      data: { status: "FROZEN", frozenAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CARD_FREEZE",
        resource: "card",
        resourceId: id,
      },
    });

    return { message: "Card frozen successfully." };
  });

  // ─── POST /cards/:id/unfreeze ──────────────────────────────────────────
  app.post("/:id/unfreeze", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    const card = await prisma.card.findFirst({ where: { id, userId: user.id } });
    if (!card) throw new NotFoundError("Card");

    if (card.status !== "FROZEN") {
      throw new BadRequestError("Card is not frozen.");
    }

    await prisma.card.update({
      where: { id },
      data: { status: "ACTIVE", frozenAt: null },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CARD_UNFREEZE",
        resource: "card",
        resourceId: id,
      },
    });

    return { message: "Card unfrozen." };
  });

  // ─── DELETE /cards/:id ─────────────────────────────────────────────────
  app.delete("/:id", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    const card = await prisma.card.findFirst({ where: { id, userId: user.id } });
    if (!card) throw new NotFoundError("Card");

    await prisma.card.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CARD_CANCEL",
        resource: "card",
        resourceId: id,
      },
    });

    return { message: "Card cancelled." };
  });
}
