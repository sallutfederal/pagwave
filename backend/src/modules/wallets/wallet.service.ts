import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "../../config/database.js";
import { decimalAdd, decimalGte, decimalSub, decimalZero, toDecimal } from "../../lib/decimal.js";
import { computeEffectiveFee, resolveEffectiveFeeForUser } from "../../lib/fees.js";
import {
  BadRequestError,
  ConflictError,
  InsufficientFundsError,
  KycRequiredError,
  NotFoundError,
  WithdrawalLimitError,
} from "../../lib/errors.js";
import { generateTxRef } from "../../lib/id.js";
import { dispatchUserNotification } from "../../lib/notifications.js";
import type { CreateWalletInput, DepositInput, ExchangeInput, TransferInput, WithdrawalInput } from "./wallet.schema.js";

// ─── List Wallets ───────────────────────────────────────────────────────────

export async function getUserWallets(userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { userId, isActive: true },
    include: { currency: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return wallets.map((w) => ({
    id: w.id,
    label: w.label,
    type: w.type,
    currencyCode: w.currency.code,
    currencyName: w.currency.name,
    currencySymbol: w.currency.symbol,
    balance: w.balance.toString(),
    frozenBalance: w.frozenBalance.toString(),
    availableBalance: w.availableBalance.toString(),
    address: w.address,
    isDefault: w.isDefault,
    createdAt: w.createdAt.toISOString(),
  }));
}

// ─── Get Single Wallet ──────────────────────────────────────────────────────

export async function getWallet(userId: string, walletId: string) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!wallet) throw new NotFoundError("Wallet");

  return {
    id: wallet.id,
    label: wallet.label,
    type: wallet.type,
    currencyCode: wallet.currency.code,
    currencyName: wallet.currency.name,
    currencySymbol: wallet.currency.symbol,
    balance: wallet.balance.toString(),
    frozenBalance: wallet.frozenBalance.toString(),
    availableBalance: wallet.availableBalance.toString(),
    address: wallet.address,
    isDefault: wallet.isDefault,
    createdAt: wallet.createdAt.toISOString(),
  };
}

// ─── Create Wallet ──────────────────────────────────────────────────────────

export async function createWallet(userId: string, input: CreateWalletInput) {
  const currency = await prisma.currency.findUnique({
    where: { code: input.currencyCode },
  });

  if (!currency || !currency.isActive) {
    throw new BadRequestError(`Currency ${input.currencyCode} is not supported.`);
  }

  // Check if user already has a wallet for this currency+type
  const existing = await prisma.wallet.findFirst({
    where: { userId, currencyId: currency.id, type: input.type },
  });

  if (existing) {
    throw new ConflictError(`You already have a ${input.currencyCode} ${input.type} wallet.`);
  }

  const wallet = await prisma.wallet.create({
    data: {
      userId,
      currencyId: currency.id,
      type: input.type,
      label: input.label ?? `${currency.code} Wallet`,
    },
    include: { currency: true },
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      userId,
      action: "WALLET_CREATE",
      resource: "wallet",
      resourceId: wallet.id,
      details: { currencyCode: currency.code, type: input.type },
    },
  });

  return {
    id: wallet.id,
    label: wallet.label,
    type: wallet.type,
    currencyCode: wallet.currency.code,
    balance: "0",
  };
}

// ─── Internal Transfer (pagwave-to-pagwave) ─────────────────────────────────

export async function internalTransfer(userId: string, input: TransferInput) {
  const fromWallet = input.fromWalletId
    ? await prisma.wallet.findFirst({
        where: { id: input.fromWalletId, userId, isActive: true },
        include: { currency: true },
      })
    : await prisma.wallet.findFirst({
        where: { userId, currency: { code: input.currencyCode!.toUpperCase() }, isActive: true },
        include: { currency: true },
      });

  if (!fromWallet) {
    throw new InsufficientFundsError(
      input.currencyCode
        ? `Você ainda não possui saldo disponível em ${input.currencyCode.toUpperCase()}.`
        : "Carteira de origem não encontrada.",
    );
  }

  const amount = toDecimal(input.amount);
  if (fromWallet.currency.code === "CLP" && !amount.isInteger()) {
    throw new BadRequestError("CLP exige valor inteiro sem casas decimais.");
  }

  if (!decimalGte(fromWallet.availableBalance, amount)) {
    throw new InsufficientFundsError(
      `Saldo disponível insuficiente em ${fromWallet.currency.code}.`,
    );
  }

  const senderUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, firstName: true, lastName: true } },
    },
  });

  let recipientInfo: {
    id: string;
    email: string;
    name: string;
  } | null = null;
  let explicitToWalletId: string | null = null;

  if (input.toWalletId) {
    const targetWallet = await prisma.wallet.findFirst({
      where: {
        id: input.toWalletId,
        currencyId: fromWallet.currencyId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            profile: { select: { displayName: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!targetWallet) {
      throw new NotFoundError("Carteira de destino compatível não encontrada.");
    }
    if (targetWallet.userId === userId) {
      throw new BadRequestError("Você não pode transferir para a sua própria conta.");
    }
    if (
      targetWallet.user.status === "SUSPENDED" ||
      targetWallet.user.status === "BLOCKED" ||
      targetWallet.user.status === "CLOSED"
    ) {
      throw new BadRequestError("A conta destinatária não está ativa para receber transferências.");
    }
    explicitToWalletId = targetWallet.id;
    recipientInfo = {
      id: targetWallet.user.id,
      email: targetWallet.user.email,
      name:
        targetWallet.user.profile?.displayName ||
        `${targetWallet.user.profile?.firstName ?? ""} ${targetWallet.user.profile?.lastName ?? ""}`.trim() ||
        targetWallet.user.email,
    };
  } else if (input.recipientEmail) {
    const normalizedEmail = input.recipientEmail.trim().toLowerCase();
    const recipientUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        status: true,
        profile: { select: { displayName: true, firstName: true, lastName: true } },
      },
    });

    if (!recipientUser) {
      throw new NotFoundError("Nenhuma conta PagWave encontrada com esse e-mail.");
    }
    if (recipientUser.id === userId) {
      throw new BadRequestError("Você não pode transferir para a sua própria conta.");
    }
    if (
      recipientUser.status === "SUSPENDED" ||
      recipientUser.status === "BLOCKED" ||
      recipientUser.status === "CLOSED"
    ) {
      throw new BadRequestError("A conta destinatária não está ativa para receber transferências.");
    }

    recipientInfo = {
      id: recipientUser.id,
      email: recipientUser.email,
      name:
        recipientUser.profile?.displayName ||
        `${recipientUser.profile?.firstName ?? ""} ${recipientUser.profile?.lastName ?? ""}`.trim() ||
        recipientUser.email,
    };
  } else {
    throw new BadRequestError("Informe o e-mail do usuário PagWave ou a carteira de destino.");
  }

  // Get effective fee (per-user custom override first, then global FeeConfig)
  const feeRule = await resolveEffectiveFeeForUser(userId, "TRANSFER_OUT", fromWallet.currency.code);
  const { fee, netAmount } = computeEffectiveFee(amount, feeRule);
  if (netAmount.lte(0)) {
    throw new BadRequestError("O valor líquido após a taxa de transferência deve ser maior que zero.");
  }
  const refId = generateTxRef();
  const senderLabel =
    senderUser?.profile?.displayName ||
    `${senderUser?.profile?.firstName ?? ""} ${senderUser?.profile?.lastName ?? ""}`.trim() ||
    senderUser?.email ||
    "Usuário PagWave";
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const debited = await tx.wallet.updateMany({
      where: {
        id: fromWallet.id,
        isActive: true,
        availableBalance: { gte: amount },
      },
      data: {
        balance: { decrement: amount },
        availableBalance: { decrement: amount },
      },
    });

    if (debited.count === 0) {
      throw new InsufficientFundsError(
        `Saldo disponível insuficiente em ${fromWallet.currency.code}.`,
      );
    }

    let destinationWallet = explicitToWalletId
      ? await tx.wallet.findUnique({ where: { id: explicitToWalletId } })
      : await tx.wallet.findFirst({
          where: {
            userId: recipientInfo.id,
            currencyId: fromWallet.currencyId,
            type: fromWallet.type,
            isActive: true,
          },
        });

    if (!destinationWallet) {
      destinationWallet = await tx.wallet.create({
        data: {
          userId: recipientInfo.id,
          currencyId: fromWallet.currencyId,
          type: fromWallet.type,
          label: `${fromWallet.currency.code} Wallet`,
          balance: decimalZero(),
          availableBalance: decimalZero(),
          frozenBalance: decimalZero(),
          isDefault: false,
        },
      });
    }

    await tx.wallet.update({
      where: { id: destinationWallet.id },
      data: {
        balance: { increment: netAmount },
        availableBalance: { increment: netAmount },
      },
    });

    await tx.transaction.create({
      data: {
        referenceId: refId,
        userId,
        type: "TRANSFER_OUT",
        status: "COMPLETED",
        fromWalletId: fromWallet.id,
        toWalletId: destinationWallet.id,
        amount,
        fee,
        netAmount,
        currencyCode: fromWallet.currency.code,
        description: input.description
          ? `${input.description} (${recipientInfo.email})`
          : `Transferência para ${recipientInfo.email}`,
        completedAt: now,
      },
    });

    await tx.transaction.create({
      data: {
        referenceId: `${refId}-IN`,
        userId: recipientInfo.id,
        type: "TRANSFER_IN",
        status: "COMPLETED",
        fromWalletId: fromWallet.id,
        toWalletId: destinationWallet.id,
        amount: netAmount,
        fee: decimalZero(),
        netAmount,
        currencyCode: fromWallet.currency.code,
        description: input.description
          ? `${input.description} (de ${senderUser?.email ?? senderLabel})`
          : `Recebido de ${senderUser?.email ?? senderLabel}`,
        completedAt: now,
      },
    });

    await tx.gatewayActivity.create({
      data: {
        userId,
        kind: "transfer_out",
        currency: fromWallet.currency.code,
        amount: new Decimal(amount.toString()),
        rail: "PagWave P2P",
        status: "completed",
        externalId: refId,
        destinationSummary: `Para ${recipientInfo.email}`,
        settledInLedger: true,
        metadata: {
          recipientId: recipientInfo.id,
          recipientEmail: recipientInfo.email,
          description: input.description ?? null,
        },
      },
    });

    await tx.gatewayActivity.create({
      data: {
        userId: recipientInfo.id,
        kind: "transfer_in",
        currency: fromWallet.currency.code,
        amount: new Decimal(netAmount.toString()),
        rail: "PagWave P2P",
        status: "completed",
        externalId: `${refId}-IN`,
        destinationSummary: `De ${senderUser?.email ?? senderLabel}`,
        settledInLedger: true,
        metadata: {
          senderId: userId,
          senderEmail: senderUser?.email ?? null,
          description: input.description ?? null,
        },
      },
    });

    return { toWalletId: destinationWallet.id };
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "TRANSFER",
      resource: "transaction",
      resourceId: refId,
      details: {
        amount: amount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        currency: fromWallet.currency.code,
        recipientEmail: recipientInfo.email,
        toWalletId: result.toWalletId,
      },
    },
  });

  void dispatchUserNotification({
    userId,
    category: "paymentAlerts",
    type: "TRANSACTION",
    title: `Transferência enviada: ${amount.toString()} ${fromWallet.currency.code}`,
    body: `Enviado para ${recipientInfo.email} · Ref: ${refId}`,
    url: "/transactions",
    data: { referenceId: refId, currency: fromWallet.currency.code, amount: amount.toString() },
  });

  void dispatchUserNotification({
    userId: recipientInfo.id,
    category: "paymentAlerts",
    type: "TRANSACTION",
    title: `Você recebeu +${netAmount.toString()} ${fromWallet.currency.code}`,
    body: `Transferência P2P de ${senderUser?.email ?? senderLabel} · Ref: ${refId}-IN`,
    url: "/transactions",
    data: { referenceId: `${refId}-IN`, currency: fromWallet.currency.code, amount: netAmount.toString() },
    emailSubject: `Pagwave · Você recebeu +${netAmount.toString()} ${fromWallet.currency.code}`,
  });

  return {
    referenceId: refId,
    amount: amount.toString(),
    fee: fee.toString(),
    netAmount: netAmount.toString(),
    currencyCode: fromWallet.currency.code,
    recipientEmail: recipientInfo.email,
    recipientName: recipientInfo.name,
    status: "COMPLETED",
  };
}

// ─── Deposit (creates PENDING request; balance is only credited on confirmation) ─

export async function createDeposit(userId: string, input: DepositInput) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: input.walletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!wallet) throw new NotFoundError("Wallet");

  const amount = toDecimal(input.amount);
  if (wallet.currency.minimumDeposit && amount.lt(wallet.currency.minimumDeposit)) {
    throw new BadRequestError(
      `Minimum deposit for ${wallet.currency.code} is ${wallet.currency.minimumDeposit.toString()}.`,
    );
  }

  const refId = generateTxRef();

  await prisma.transaction.create({
    data: {
      referenceId: refId,
      userId,
      type: "DEPOSIT",
      status: "PENDING",
      toWalletId: wallet.id,
      amount,
      fee: decimalZero(),
      netAmount: amount,
      currencyCode: wallet.currency.code,
      description: `Deposit via ${input.method}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "DEPOSIT",
      resource: "transaction",
      resourceId: refId,
      details: { amount: amount.toString(), currency: wallet.currency.code, method: input.method, status: "PENDING" },
    },
  });

  return {
    referenceId: refId,
    amount: amount.toString(),
    currencyCode: wallet.currency.code,
    status: "PENDING",
  };
}

export async function confirmDeposit(
  referenceId: string,
  reviewerId: string,
  options?: { externalId?: string },
) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { referenceId },
    });

    if (!existing || existing.type !== "DEPOSIT") {
      throw new NotFoundError("Deposit transaction");
    }

    if (!existing.toWalletId) {
      throw new BadRequestError("Deposit transaction has no destination wallet.");
    }

    // Claim transition atomically so concurrent confirmations cannot double-credit.
    const claimed = await tx.transaction.updateMany({
      where: {
        id: existing.id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        status: "COMPLETED",
        completedAt: now,
        reviewedBy: reviewerId,
        reviewedAt: now,
        ...(options?.externalId ? { externalId: options.externalId } : {}),
      },
    });

    if (claimed.count === 0) {
      throw new ConflictError("Deposit was already settled or cancelled.");
    }

    await tx.wallet.update({
      where: { id: existing.toWalletId },
      data: {
        balance: { increment: existing.netAmount },
        availableBalance: { increment: existing.netAmount },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: reviewerId,
        action: "DEPOSIT",
        resource: "transaction",
        resourceId: existing.referenceId,
        details: {
          status: "COMPLETED",
          targetUserId: existing.userId,
          credited: existing.netAmount.toString(),
          currency: existing.currencyCode,
        },
      },
    });

    return {
      referenceId: existing.referenceId,
      status: "COMPLETED",
      credited: existing.netAmount.toString(),
      currencyCode: existing.currencyCode,
    };
  });
}

export async function rejectDeposit(referenceId: string, reviewerId: string, reason?: string) {
  const now = new Date();

  const existing = await prisma.transaction.findUnique({ where: { referenceId } });
  if (!existing || existing.type !== "DEPOSIT") {
    throw new NotFoundError("Deposit transaction");
  }

  const claimed = await prisma.transaction.updateMany({
    where: {
      id: existing.id,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    data: {
      status: "FAILED",
      failedAt: now,
      reviewedBy: reviewerId,
      reviewedAt: now,
      flagReason: reason ?? "Deposit not confirmed.",
    },
  });

  if (claimed.count === 0) {
    throw new ConflictError("Deposit was already settled or cancelled.");
  }

  await prisma.auditLog.create({
    data: {
      userId: reviewerId,
      action: "ADMIN_ACTION",
      resource: "transaction",
      resourceId: existing.referenceId,
      details: { status: "FAILED", reason: reason ?? "Deposit not confirmed." },
    },
  });

  return {
    referenceId: existing.referenceId,
    status: "FAILED",
  };
}

// ─── Withdrawal ─────────────────────────────────────────────────────────────

const ACTIVE_WITHDRAWAL_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FROZEN"] as const;

export async function assertWithdrawalLimits(
  userId: string,
  currencyCode: string,
  amount: Decimal,
) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const kycLevel = profile?.kycLevel ?? 0;

  const limit = await prisma.withdrawalLimit.findUnique({
    where: { kycLevel_currencyCode: { kycLevel, currencyCode } },
  });

  if (!limit) return;

  if (amount.gt(limit.singleTxMax)) {
    throw new WithdrawalLimitError("single", limit.singleTxMax.toString());
  }

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [dailyAgg, monthlyAgg] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "WITHDRAWAL",
        currencyCode,
        status: { in: [...ACTIVE_WITHDRAWAL_STATUSES] },
        createdAt: { gte: dayStart },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "WITHDRAWAL",
        currencyCode,
        status: { in: [...ACTIVE_WITHDRAWAL_STATUSES] },
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  const dailyUsed = dailyAgg._sum.amount ?? decimalZero();
  if (decimalAdd(dailyUsed, amount).gt(limit.dailyLimit)) {
    throw new WithdrawalLimitError("daily", limit.dailyLimit.toString());
  }

  const monthlyUsed = monthlyAgg._sum.amount ?? decimalZero();
  if (decimalAdd(monthlyUsed, amount).gt(limit.monthlyLimit)) {
    throw new WithdrawalLimitError("monthly", limit.monthlyLimit.toString());
  }
}

export async function createWithdrawal(userId: string, input: WithdrawalInput) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: input.walletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!wallet) throw new NotFoundError("Wallet");

  const amount = toDecimal(input.amount);

  // Check KYC level & withdrawal limits (single, daily, monthly)
  await assertWithdrawalLimits(userId, wallet.currency.code, amount);

  // Check balance
  if (!decimalGte(wallet.availableBalance, amount)) {
    throw new InsufficientFundsError();
  }

  // Get effective withdrawal fee (per-user override first, then global FeeConfig)
  const feeRule = await resolveEffectiveFeeForUser(userId, "WITHDRAWAL", wallet.currency.code);
  const { fee, netAmount } = computeEffectiveFee(amount, feeRule);
  if (netAmount.lte(0)) {
    throw new BadRequestError("O valor líquido após a taxa de saque deve ser maior que zero.");
  }
  const refId = generateTxRef();

  // Freeze the amount atomically (guarded against concurrent overdraft)
  await prisma.$transaction(async (tx) => {
    const debited = await tx.wallet.updateMany({
      where: { id: wallet.id, availableBalance: { gte: amount } },
      data: {
        availableBalance: { decrement: amount },
        frozenBalance: { increment: amount },
      },
    });
    if (debited.count === 0) {
      throw new InsufficientFundsError();
    }

    await tx.transaction.create({
      data: {
        referenceId: refId,
        userId,
        type: "WITHDRAWAL",
        status: "PROCESSING",
        fromWalletId: wallet.id,
        amount,
        fee,
        netAmount,
        currencyCode: wallet.currency.code,
        description: input.description ?? "Withdrawal",
        network: input.network ?? null,
        processedAt: new Date(),
      },
    });
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      userId,
      action: "WITHDRAWAL",
      resource: "transaction",
      resourceId: refId,
      details: {
        amount: amount.toString(),
        fee: fee.toString(),
        currency: wallet.currency.code,
        destination: input.address ?? input.iban ?? input.accountNumber ?? "bank",
      },
    },
  });

  void dispatchUserNotification({
    userId,
    category: "paymentAlerts",
    type: "TRANSACTION",
    title: `Saque solicitado: ${amount.toString()} ${wallet.currency.code}`,
    body: `Liquidação em processamento · Ref: ${refId}`,
    url: "/transactions",
    data: { referenceId: refId, currency: wallet.currency.code, amount: amount.toString() },
  });

  return {
    referenceId: refId,
    amount: amount.toString(),
    fee: fee.toString(),
    netAmount: netAmount.toString(),
    currencyCode: wallet.currency.code,
    status: "PROCESSING",
  };
}

// ─── Exchange (Currency Conversion) ─────────────────────────────────────────

export async function exchangeCurrency(userId: string, input: ExchangeInput) {
  const fromWallet = await prisma.wallet.findFirst({
    where: { id: input.fromWalletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!fromWallet) throw new NotFoundError("Source wallet");

  const toCurrency = await prisma.currency.findUnique({
    where: { code: input.toCurrencyCode },
  });

  if (!toCurrency || !toCurrency.isActive) {
    throw new BadRequestError(`Currency ${input.toCurrencyCode} not supported.`);
  }

  // Find or create target wallet
  let toWallet = await prisma.wallet.findFirst({
    where: { userId, currencyId: toCurrency.id, isActive: true },
  });

  if (!toWallet) {
    toWallet = await prisma.wallet.create({
      data: {
        userId,
        currencyId: toCurrency.id,
        type: toCurrency.type === "CRYPTO" ? "CRYPTO" : "FIAT",
        label: `${toCurrency.code} Wallet`,
      },
    });
  }

  const amount = toDecimal(input.amount);

  if (!decimalGte(fromWallet.availableBalance, amount)) {
    throw new InsufficientFundsError();
  }

  // Get exchange rate
  const rate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrencyId: fromWallet.currencyId,
      toCurrencyId: toCurrency.id,
    },
    orderBy: { validAt: "desc" },
  });

  if (!rate) {
    throw new BadRequestError(`No exchange rate available for ${fromWallet.currency.code} → ${toCurrency.code}.`);
  }

  const exchangeRate = rate.rate;

  // Effective exchange fee (per-user override first, then global FeeConfig)
  const feeRule = await resolveEffectiveFeeForUser(userId, "EXCHANGE", fromWallet.currency.code);
  const { fee, netAmount } = computeEffectiveFee(amount, feeRule);
  if (netAmount.lte(0)) {
    throw new BadRequestError("O valor líquido após a taxa de conversão deve ser maior que zero.");
  }

  const toAmount = netAmount.mul(exchangeRate);
  const refId = generateTxRef();

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: fromWallet.id },
      data: {
        balance: { decrement: amount },
        availableBalance: { decrement: amount },
      },
    }),
    prisma.wallet.update({
      where: { id: toWallet.id },
      data: {
        balance: { increment: toAmount },
        availableBalance: { increment: toAmount },
      },
    }),
    prisma.transaction.create({
      data: {
        referenceId: refId,
        userId,
        type: "EXCHANGE",
        status: "COMPLETED",
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        amount,
        fee,
        netAmount,
        currencyCode: fromWallet.currency.code,
        exchangeRate,
        toCurrencyCode: toCurrency.code,
        toAmount,
        description: `Exchange ${fromWallet.currency.code} → ${toCurrency.code}`,
        completedAt: new Date(),
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId,
      action: "EXCHANGE",
      resource: "transaction",
      resourceId: refId,
      details: {
        from: fromWallet.currency.code,
        to: toCurrency.code,
        amount: amount.toString(),
        rate: exchangeRate.toString(),
        received: toAmount.toString(),
      },
    },
  });

  void dispatchUserNotification({
    userId,
    category: "paymentAlerts",
    type: "TRANSACTION",
    title: `Conversão concluída: ${amount.toString()} ${fromWallet.currency.code} → ${toCurrency.code}`,
    body: `Creditado +${toAmount.toString()} ${toCurrency.code} · Ref: ${refId}`,
    url: "/transactions",
    data: { referenceId: refId, from: fromWallet.currency.code, to: toCurrency.code },
  });

  return {
    referenceId: refId,
    fromAmount: amount.toString(),
    fromCurrency: fromWallet.currency.code,
    toAmount: toAmount.toString(),
    toCurrency: toCurrency.code,
    exchangeRate: exchangeRate.toString(),
    fee: fee.toString(),
    status: "COMPLETED",
  };
}
