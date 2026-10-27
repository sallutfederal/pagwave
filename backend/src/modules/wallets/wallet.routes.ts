import type { FastifyInstance } from "fastify";

import { authGuard } from "../../middleware/auth.js";
import {
  createWalletSchema,
  depositSchema,
  exchangeSchema,
  transferSchema,
  withdrawalSchema,
} from "./wallet.schema.js";
import {
  createDeposit,
  createWallet,
  createWithdrawal,
  exchangeCurrency,
  getUserWallets,
  getWallet,
  internalTransfer,
} from "./wallet.service.js";

export async function walletRoutes(app: FastifyInstance) {
  // All wallet routes require auth
  app.addHook("preHandler", authGuard);

  // ─── GET /wallets ──────────────────────────────────────────────────────
  app.get("/", async (request) => {
    const user = request.user as { id: string };
    return getUserWallets(user.id);
  });

  // ─── GET /wallets/:id ──────────────────────────────────────────────────
  app.get("/:id", async (request) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };
    return getWallet(user.id, id);
  });

  // ─── POST /wallets ────────────────────────────────────────────────────
  app.post("/", async (request, reply) => {
    const user = request.user as { id: string };
    const body = createWalletSchema.parse(request.body);
    const result = await createWallet(user.id, body);
    reply.status(201).send(result);
  });

  // ─── POST /wallets/transfer ───────────────────────────────────────────
  app.post("/transfer", async (request) => {
    const user = request.user as { id: string };
    const body = transferSchema.parse(request.body);
    return internalTransfer(user.id, body);
  });

  // ─── POST /wallets/deposit ────────────────────────────────────────────
  app.post("/deposit", async (request) => {
    const user = request.user as { id: string };
    const body = depositSchema.parse(request.body);
    return createDeposit(user.id, body);
  });

  // ─── POST /wallets/withdraw ───────────────────────────────────────────
  app.post("/withdraw", async (request) => {
    const user = request.user as { id: string };
    const body = withdrawalSchema.parse(request.body);
    return createWithdrawal(user.id, body);
  });

  // ─── POST /wallets/exchange ───────────────────────────────────────────
  app.post("/exchange", async (request) => {
    const user = request.user as { id: string };
    const body = exchangeSchema.parse(request.body);
    return exchangeCurrency(user.id, body);
  });
}
