import crypto from "node:crypto";
import { z } from "zod";
import { xpagPrivateJson } from "@/lib/xpag/api-helper";
import {
  XPagError,
  executeXPagConversion,
  simulateXPagConversion,
} from "@/lib/xpag/client";
import { CURRENCY_SPECS, XPAG_CURRENCIES } from "@/lib/xpag/currencies";
import {
  getUserLedgerBalances,
  recordWalletActivity,
  settleConversionInLedger,
} from "@/lib/xpag/store";

const ConversionSchema = z.object({
  action: z.enum(["simulate", "execute"]),
  from: z.enum(XPAG_CURRENCIES),
  to: z.enum(XPAG_CURRENCIES),
  amount: z.number().positive("Informe um valor maior que zero."),
  externalId: z.string().trim().max(128).optional(),
});

export function POST(request: Request) {
  return xpagPrivateJson(async (userId) => {
    const body = await request.json().catch(() => null);
    const parsed = ConversionSchema.safeParse(body);
    if (!parsed.success) {
      throw new XPagError(
        parsed.error.issues[0]?.message || "Dados de conversão inválidos.",
        400,
        "validation_error",
      );
    }

    const { action, from, to, amount } = parsed.data;
    if (from === to) {
      throw new XPagError(
        "Selecione moedas de origem e destino diferentes.",
        400,
        "same_currency",
      );
    }

    if (!CURRENCY_SPECS[from].convertible || !CURRENCY_SPECS[to].convertible) {
      throw new XPagError(
        "USDC não participa de conversões internas na XPag.",
        400,
        "currency_not_convertible",
      );
    }

    if (from === "COP" && amount < 50_000) {
      throw new XPagError(
        "Conversões com origem em COP exigem no mínimo COP$ 50.000.",
        400,
        "amount_below_minimum",
      );
    }

    const normalizedAmount = from === "CLP" ? Math.round(amount) : amount;

    if (action === "simulate") {
      const simulation = await simulateXPagConversion({
        amount: normalizedAmount,
        from,
        to,
      });
      return { ok: true, simulation };
    }

    const ledger = await getUserLedgerBalances(userId);
    const available = ledger.balances[from]?.available ?? 0;
    if (available < normalizedAmount) {
      throw new XPagError(
        `Saldo disponível insuficiente em ${from} para realizar a conversão.`,
        422,
        "insufficient_funds",
      );
    }

    const externalId =
      parsed.data.externalId || `pw_fx_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const conversion = await executeXPagConversion({
      amount: normalizedAmount,
      from,
      to,
      external_id: externalId,
    });

    const convertedAmount =
      conversion.converted_amount ??
      conversion.net_amount ??
      conversion.estimated_amount ??
      normalizedAmount * conversion.rate;

    if (convertedAmount > 0) {
      await settleConversionInLedger({
        userId,
        fromCurrency: from,
        toCurrency: to,
        fromAmount: normalizedAmount,
        toAmount: convertedAmount,
        rate: conversion.rate,
        externalId,
      });
    }

    await recordWalletActivity({
      userId,
      kind: "conversion",
      currency: from,
      toCurrency: to,
      amount: normalizedAmount,
      convertedAmount,
      status: "completed",
      externalId,
      transactionId: conversion.transaction_id,
      metadata: conversion as unknown as Record<string, unknown>,
    });

    return { ok: true, externalId, conversion };
  });
}
