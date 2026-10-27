import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "../../config/database.js";
import { calculateFee, decimalGte, decimalSub, decimalZero, toDecimal } from "../../lib/decimal.js";
import {
  BadRequestError,
  ConflictError,
  InsufficientFundsError,
  KycRequiredError,
  NotFoundError,
  WithdrawalLimitError,
} from "../../lib/errors.js";
import { generateTxRef } from "../../lib/id.js";
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
  const fromWallet = await prisma.wallet.findFirst({
    where: { id: input.fromWalletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!fromWallet) throw new NotFoundError("Source wallet");

  const amount = toDecimal(input.amount);

  // Check balance
  if (!decimalGte(fromWallet.availableBalance, amount)) {
    throw new InsufficientFundsError();
  }

  // Find target wallet
  let toWallet;

  if (input.toWalletId) {
    // Direct wallet-to-wallet
    toWallet = await prisma.wallet.findFirst({
      where: { id: input.toWalletId, isActive: true },
      include: { currency: true },
    });
  } else if (input.recipientEmail) {
    // P2P by email
    const recipientUser = await prisma.user.findUnique({
      where: { email: input.recipientEmail },
    });

    if (!recipientUser) throw new NotFoundError("Recipient");

    toWallet = await prisma.wallet.findFirst({
      where: {
        userId: recipientUser.id,
        currencyId: fromWallet.currencyId,
        type: fromWallet.type,
        isActive: true,
      },
      include: { currency: true },
    });

    if (!toWallet) {
      throw new BadRequestError("Recipient does not have a matching wallet.");
    }
  }

  if (!toWallet) throw new BadRequestError("No valid transfer destination.");

  // Get fee config
  const feeConfig = await prisma.feeConfig.findUnique({
    where: {
      transactionType_currencyCode: {
        transactionType: "TRANSFER_OUT",
        currencyCode: fromWallet.currency.code,
      },
    },
  });

  const fee = feeConfig
    ? calculateFee(amount, feeConfig.flatFee, feeConfig.percentFee, feeConfig.minFee, feeConfig.maxFee)
    : decimalZero();

  const netAmount = decimalSub(amount, fee);
  const refId = generateTxRef();

  // Execute in a transaction (ACID)
  const [txOut, txIn] = await prisma.$transaction([
    // Debit sender
    prisma.wallet.update({
      where: { id: fromWallet.id },
      data: {
        balance: { decrement: amount },
        availableBalance: { decrement: amount },
      },
    }),
    // Credit receiver
    prisma.wallet.update({
      where: { id: toWallet.id },
      data: {
        balance: { increment: netAmount },
        availableBalance: { increment: netAmount },
      },
    }),
    // Transaction record — OUT
    prisma.transaction.create({
      data: {
        referenceId: refId,
        userId,
        type: "TRANSFER_OUT",
        status: "COMPLETED",
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        amount,
        fee,
        netAmount,
        currencyCode: fromWallet.currency.code,
        description: input.description ?? "Internal transfer",
        completedAt: new Date(),
      },
    }),
    // Transaction record — IN (for recipient's history)
    prisma.transaction.create({
      data: {
        referenceId: `${refId}-IN`,
        userId: toWallet.userId,
        type: "TRANSFER_IN",
        status: "COMPLETED",
        fromWalletId: fromWallet.id,
        toWalletId: toWallet.id,
        amount: netAmount,
        fee: decimalZero(),
        netAmount,
        currencyCode: fromWallet.currency.code,
        description: input.description ?? "Received transfer",
        completedAt: new Date(),
      },
    }),
  ]);

  // Audit
  await prisma.auditLog.create({
    data: {
      userId,
      action: "TRANSFER",
      resource: "transaction",
      resourceId: refId,
      details: {
        amount: amount.toString(),
        fee: fee.toString(),
        currency: fromWallet.currency.code,
        toWalletId: toWallet.id,
      },
    },
  });

  return {
    referenceId: refId,
    amount: amount.toString(),
    fee: fee.toString(),
    netAmount: netAmount.toString(),
    currencyCode: fromWallet.currency.code,
    status: "COMPLETED",
  };
}

// ─── Deposit (simulated — real implementation connects to payment gateway) ──

export async function createDeposit(userId: string, input: DepositInput) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: input.walletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!wallet) throw new NotFoundError("Wallet");

  const amount = toDecimal(input.amount);
  const refId = generateTxRef();

  // In production this would create a pending deposit and wait for webhook
  // For now we simulate instant completion
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        availableBalance: { increment: amount },
      },
    }),
    prisma.transaction.create({
      data: {
        referenceId: refId,
        userId,
        type: "DEPOSIT",
        status: "COMPLETED",
        toWalletId: wallet.id,
        amount,
        fee: decimalZero(),
        netAmount: amount,
        currencyCode: wallet.currency.code,
        description: `Deposit via ${input.method}`,
        completedAt: new Date(),
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId,
      action: "DEPOSIT",
      resource: "transaction",
      resourceId: refId,
      details: { amount: amount.toString(), currency: wallet.currency.code, method: input.method },
    },
  });

  return {
    referenceId: refId,
    amount: amount.toString(),
    currencyCode: wallet.currency.code,
    status: "COMPLETED",
  };
}

// ─── Withdrawal ─────────────────────────────────────────────────────────────

export async function createWithdrawal(userId: string, input: WithdrawalInput) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: input.walletId, userId, isActive: true },
    include: { currency: true },
  });

  if (!wallet) throw new NotFoundError("Wallet");

  const amount = toDecimal(input.amount);

  // Check KYC level
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const kycLevel = profile?.kycLevel ?? 0;

  const limit = await prisma.withdrawalLimit.findUnique({
    where: { kycLevel_currencyCode: { kycLevel, currencyCode: wallet.currency.code } },
  });

  if (limit) {
    if (amount.gt(limit.singleTxMax)) {
      throw new WithdrawalLimitError("single", limit.singleTxMax.toString());
    }
    // TODO: check daily/monthly accumulated withdrawals
  }

  // Check balance
  if (!decimalGte(wallet.availableBalance, amount)) {
    throw new InsufficientFundsError();
  }

  // Get fee
  const feeConfig = await prisma.feeConfig.findUnique({
    where: {
      transactionType_currencyCode: {
        transactionType: "WITHDRAWAL",
        currencyCode: wallet.currency.code,
      },
    },
  });

  const fee = feeConfig
    ? calculateFee(amount, feeConfig.flatFee, feeConfig.percentFee, feeConfig.minFee, feeConfig.maxFee)
    : decimalZero();

  const netAmount = decimalSub(amount, fee);
  const refId = generateTxRef();

  // Freeze the amount (pending withdrawal)
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: amount },
        frozenBalance: { increment: amount },
      },
    }),
    prisma.transaction.create({
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
    }),
  ]);

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
  const toAmount = amount.mul(exchangeRate);

  // Fee
  const feeConfig = await prisma.feeConfig.findUnique({
    where: {
      transactionType_currencyCode: {
        transactionType: "EXCHANGE",
        currencyCode: fromWallet.currency.code,
      },
    },
  });

  const fee = feeConfig
    ? calculateFee(amount, feeConfig.flatFee, feeConfig.percentFee, feeConfig.minFee, feeConfig.maxFee)
    : decimalZero();

  const netAmount = decimalSub(amount, fee);
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
