import type { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../config/database.js";
import { authGuard } from "../../middleware/auth.js";
import { NotFoundError } from "../../lib/errors.js";
import { getUsdRates } from "../../lib/rates.js";

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authGuard);

  // ─── GET /transactions ─────────────────────────────────────────────────
  app.get("/", async (request) => {
    const user = request.user as { id: string };
    const query = request.query as Record<string, string>;

    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = { userId: user.id };

    // Filters
    if (query.status) where.status = query.status as TransactionStatus;
    if (query.type) where.type = query.type as TransactionType;
    if (query.currencyCode) where.currencyCode = query.currencyCode;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { referenceId: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [transactions, total, usdRates] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      getUsdRates(),
    ]);

    return {
      data: transactions.map((tx) => {
        const rate = usdRates.get(tx.currencyCode);

        return {
          id: tx.id,
          referenceId: tx.referenceId,
          type: tx.type,
          status: tx.status,
          amount: tx.amount.toString(),
          /** Same amount priced in USD, so mixed-currency lists can be totalled. Null without a rate. */
          usdAmount: rate ? tx.amount.mul(rate).toFixed(2) : null,
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
        };
      }),
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

  // ─── GET /transactions/statistic ───────────────────────────────────────
  // Outgoing money for the dashboard donut, converted to USD so different
  // currencies can be added together.
  app.get("/statistic", async (request) => {
    const user = request.user as { id: string };
    const { period: rawPeriod } = request.query as { period?: string };
    const period = (["this-month", "last-month", "last-year"] as const).find((p) => p === rawPeriod) ?? "this-month";

    const now = new Date();
    let from: Date;
    let to: Date;

    switch (period) {
      case "last-month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last-year":
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
    }

    const [transactions, usdRates] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          status: "COMPLETED",
          type: { in: ["CARD_PAYMENT", "FEE", "TRANSFER_OUT", "WITHDRAWAL", "EXCHANGE"] },
          createdAt: { gte: from, lt: to },
        },
        select: { type: true, amount: true, currencyCode: true },
      }),
      getUsdRates(),
    ]);

    let bills = 0;
    let money = 0;

    for (const tx of transactions) {
      const rate = usdRates.get(tx.currencyCode);
      if (!rate) continue; // No price for this currency: leave it out rather than guess.

      const usd = Number(tx.amount.mul(rate));
      if (tx.type === "CARD_PAYMENT" || tx.type === "FEE") bills += usd;
      else money += usd;
    }

    return {
      period,
      currency: "USD",
      total: Number((bills + money).toFixed(2)),
      segments: [
        { id: "bills", label: "Card payments & fees", value: Number(bills.toFixed(2)) },
        { id: "money", label: "Money transfers", value: Number(money.toFixed(2)) },
      ],
    };
  });
}
