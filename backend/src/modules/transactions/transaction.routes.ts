import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { authGuard } from "../../middleware/auth.js";
import { NotFoundError } from "../../lib/errors.js";

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // ─── GET /transactions ─────────────────────────────────────────────────
  app.get("/", async (request) => {
    const user = request.user as { id: string };
    const query = request.query as Record<string, string>;

    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };

    // Filters
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.currencyCode) where.currencyCode = query.currencyCode;
    if (query.from) where.createdAt = { ...where.createdAt, gte: new Date(query.from) };
    if (query.to) where.createdAt = { ...where.createdAt, lte: new Date(query.to) };
    if (query.search) {
      where.OR = [
        { referenceId: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((tx) => ({
        id: tx.id,
        referenceId: tx.referenceId,
        type: tx.type,
        status: tx.status,
        amount: tx.amount.toString(),
        fee: tx.fee.toString(),
        netAmount: tx.netAmount.toString(),
        currencyCode: tx.currencyCode,
        exchangeRate: tx.exchangeRate?.toString() ?? null,
        toCurrencyCode: tx.toCurrencyCode,
        toAmount: tx.toAmount?.toString() ?? null,
        txHash: tx.txHash,
        network: tx.network,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
        completedAt: tx.completedAt?.toISOString() ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // ─── GET /transactions/:id ─────────────────────────────────────────────
  app.get("/:id", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    const tx = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });

    if (!tx) throw new NotFoundError("Transaction");

    return {
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      status: tx.status,
      amount: tx.amount.toString(),
      fee: tx.fee.toString(),
      netAmount: tx.netAmount.toString(),
      currencyCode: tx.currencyCode,
      exchangeRate: tx.exchangeRate?.toString() ?? null,
      toCurrencyCode: tx.toCurrencyCode,
      toAmount: tx.toAmount?.toString() ?? null,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber?.toString() ?? null,
      confirmations: tx.confirmations,
      network: tx.network,
      description: tx.description,
      riskScore: tx.riskScore,
      flagged: tx.flagged,
      metadata: tx.metadata,
      processedAt: tx.processedAt?.toISOString() ?? null,
      completedAt: tx.completedAt?.toISOString() ?? null,
      failedAt: tx.failedAt?.toISOString() ?? null,
      createdAt: tx.createdAt.toISOString(),
    };
  });

  // ─── GET /transactions/summary ─────────────────────────────────────────
  app.get("/summary", async (request) => {
    const user = request.user as { id: string };
    const query = request.query as Record<string, string>;

    const period = query.period ?? "this-month";
    let dateFrom: Date;

    const now = new Date();
    switch (period) {
      case "today":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "this-week":
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - now.getDay());
        break;
      case "this-month":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last-month":
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case "this-year":
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
        createdAt: { gte: dateFrom },
      },
    });

    let totalIn = 0;
    let totalOut = 0;
    let totalFees = 0;
    const byType: Record<string, number> = {};
    const byCurrency: Record<string, { in: number; out: number }> = {};

    for (const tx of transactions) {
      const amount = Number(tx.netAmount);
      const fee = Number(tx.fee);
      totalFees += fee;

      byType[tx.type] = (byType[tx.type] ?? 0) + 1;

      if (!byCurrency[tx.currencyCode]) {
        byCurrency[tx.currencyCode] = { in: 0, out: 0 };
      }

      if (
        tx.type === "DEPOSIT" ||
        tx.type === "TRANSFER_IN" ||
        tx.type === "AIRDROP" ||
        tx.type === "STAKING_REWARD"
      ) {
        totalIn += amount;
        byCurrency[tx.currencyCode].in += amount;
      } else {
        totalOut += amount;
        byCurrency[tx.currencyCode].out += amount;
      }
    }

    return {
      period,
      totalTransactions: transactions.length,
      totalIn: totalIn.toFixed(2),
      totalOut: totalOut.toFixed(2),
      totalFees: totalFees.toFixed(2),
      net: (totalIn - totalOut).toFixed(2),
      byType,
      byCurrency,
    };
  });
}
