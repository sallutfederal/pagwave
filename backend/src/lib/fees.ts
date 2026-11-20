import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "../config/database.js";
import { calculateFee, decimalSub, decimalZero } from "./decimal.js";

export const FEE_TRANSACTION_TYPES = [
  "WITHDRAWAL",
  "DEPOSIT",
  "TRANSFER_OUT",
  "EXCHANGE",
] as const;

export type FeeTransactionType = (typeof FEE_TRANSACTION_TYPES)[number];

export const SUPPORTED_FEE_CURRENCIES = [
  "BRL",
  "USD",
  "USDT",
  "USDC",
  "MXN",
  "COP",
  "CLP",
  "EUR",
] as const;

export interface UserFeeOverrideRule {
  transactionType: FeeTransactionType;
  currencyCode: string; // Currency code (e.g. "BRL") or "*" for all currencies
  flatFee: number;
  percentFee: number; // Decimal ratio: 0.015 = 1.5%
  minFee: number;
  maxFee: number | null;
  isActive: boolean;
}

export interface StoredUserFeeOverride {
  rules: UserFeeOverrideRule[];
  updatedBy: string;
  updatedAt: string;
  note?: string;
}

export interface EffectiveFeeRule {
  transactionType: FeeTransactionType;
  currencyCode: string;
  flatFee: number;
  percentFee: number;
  minFee: number;
  maxFee: number | null;
  isActive: boolean;
  source: "USER_CUSTOM" | "PLATFORM_DEFAULT";
  customScope?: "CURRENCY" | "GLOBAL";
  defaultFlatFee: number;
  defaultPercentFee: number;
  defaultMinFee: number;
  defaultMaxFee: number | null;
  defaultIsActive: boolean;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

const USER_FEE_RESOURCE = "user_fee_override";

export function normalizeFeeCurrency(code: string): string {
  const trimmed = code.trim().toUpperCase();
  return trimmed === "*" || trimmed === "ALL" ? "*" : trimmed;
}

function parseOverrideDetails(details: unknown): StoredUserFeeOverride | null {
  if (!details || typeof details !== "object") return null;
  const raw = details as Record<string, unknown>;
  const rawRules = Array.isArray(raw.rules) ? raw.rules : [];
  const rules: UserFeeOverrideRule[] = [];

  for (const item of rawRules) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const txType = String(r.transactionType ?? "").toUpperCase();
    if (!FEE_TRANSACTION_TYPES.includes(txType as FeeTransactionType)) continue;
    const currencyCode = normalizeFeeCurrency(String(r.currencyCode ?? ""));
    if (!currencyCode) continue;

    const flatFee = Math.max(0, Number(r.flatFee ?? 0) || 0);
    const percentFee = Math.min(1, Math.max(0, Number(r.percentFee ?? 0) || 0));
    const minFee = Math.max(0, Number(r.minFee ?? 0) || 0);
    const maxRaw = r.maxFee;
    const maxFee =
      maxRaw === null || maxRaw === undefined || maxRaw === ""
        ? null
        : Math.max(0, Number(maxRaw) || 0);
    const isActive = r.isActive === undefined ? true : Boolean(r.isActive);

    rules.push({
      transactionType: txType as FeeTransactionType,
      currencyCode,
      flatFee,
      percentFee,
      minFee,
      maxFee,
      isActive,
    });
  }

  return {
    rules,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : "",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    note: typeof raw.note === "string" && raw.note.trim() ? raw.note.trim() : undefined,
  };
}

export async function getUserFeeOverrides(
  userId: string,
  db: DbClient = prisma,
): Promise<StoredUserFeeOverride> {
  const latest = await db.auditLog.findFirst({
    where: { userId, resource: USER_FEE_RESOURCE },
    orderBy: { createdAt: "desc" },
    select: { details: true, createdAt: true },
  });

  if (!latest) {
    return { rules: [], updatedBy: "", updatedAt: "" };
  }

  const parsed = parseOverrideDetails(latest.details);
  if (!parsed) {
    return { rules: [], updatedBy: "", updatedAt: latest.createdAt.toISOString() };
  }
  return {
    ...parsed,
    updatedAt: parsed.updatedAt || latest.createdAt.toISOString(),
  };
}

export async function setUserFeeOverrides(
  userId: string,
  rules: UserFeeOverrideRule[],
  adminId: string,
  note?: string,
): Promise<StoredUserFeeOverride> {
  // Deduplicate by (transactionType, normalized currencyCode), last wins
  const dedupedMap = new Map<string, UserFeeOverrideRule>();
  for (const r of rules) {
    const currencyCode = normalizeFeeCurrency(r.currencyCode);
    if (!currencyCode) continue;
    dedupedMap.set(`${r.transactionType}:${currencyCode}`, {
      transactionType: r.transactionType,
      currencyCode,
      flatFee: Math.max(0, Number(r.flatFee) || 0),
      percentFee: Math.min(1, Math.max(0, Number(r.percentFee) || 0)),
      minFee: Math.max(0, Number(r.minFee) || 0),
      maxFee: r.maxFee !== null && r.maxFee !== undefined ? Math.max(0, Number(r.maxFee) || 0) : null,
      isActive: r.isActive,
    });
  }

  const normalizedRules = Array.from(dedupedMap.values());
  const payload: StoredUserFeeOverride = {
    rules: normalizedRules,
    updatedBy: adminId,
    updatedAt: new Date().toISOString(),
    ...(note?.trim() ? { note: note.trim() } : {}),
  };

  await prisma.auditLog.create({
    data: {
      userId,
      action: "ADMIN_ACTION",
      resource: USER_FEE_RESOURCE,
      resourceId: userId,
      details: JSON.parse(JSON.stringify(payload)),
    },
  });

  return payload;
}

export async function getAllUsersFeeOverridesMap(): Promise<Map<string, StoredUserFeeOverride>> {
  const logs = await prisma.auditLog.findMany({
    where: { resource: USER_FEE_RESOURCE },
    orderBy: { createdAt: "desc" },
    select: { userId: true, details: true, createdAt: true },
  });

  const map = new Map<string, StoredUserFeeOverride>();
  for (const log of logs) {
    if (!log.userId || map.has(log.userId)) continue;
    const parsed = parseOverrideDetails(log.details);
    if (!parsed) continue;
    map.set(log.userId, {
      ...parsed,
      updatedAt: parsed.updatedAt || log.createdAt.toISOString(),
    });
  }
  return map;
}

function buildEffectiveRuleFromSources(
  transactionType: FeeTransactionType,
  currencyCode: string,
  customRules: UserFeeOverrideRule[],
  feeConfigs: Array<{
    transactionType: string;
    currencyCode: string;
    flatFee: Decimal | number;
    percentFee: Decimal | number;
    minFee: Decimal | number;
    maxFee: Decimal | number | null;
    isActive: boolean;
  }>,
  platformFeeBps: number,
): EffectiveFeeRule {
  const code = currencyCode.toUpperCase();

  // Resolve platform default for this (transactionType, currencyCode)
  const exactGlobal = feeConfigs.find(
    (c) => c.transactionType === transactionType && c.currencyCode.toUpperCase() === code,
  );
  const wildcardGlobal = feeConfigs.find(
    (c) => c.transactionType === transactionType && c.currencyCode === "*",
  );
  const matchedGlobal = exactGlobal ?? wildcardGlobal;

  let defaultFlatFee = 0;
  let defaultPercentFee = 0;
  let defaultMinFee = 0;
  let defaultMaxFee: number | null = null;
  let defaultIsActive = true;

  if (matchedGlobal) {
    defaultFlatFee = Number(matchedGlobal.flatFee);
    defaultPercentFee = Number(matchedGlobal.percentFee);
    defaultMinFee = Number(matchedGlobal.minFee);
    defaultMaxFee = matchedGlobal.maxFee !== null ? Number(matchedGlobal.maxFee) : null;
    defaultIsActive = matchedGlobal.isActive;
  } else if (transactionType === "DEPOSIT" && platformFeeBps > 0) {
    defaultPercentFee = platformFeeBps / 10_000;
  }

  // Resolve user-specific override (exact currency first, then "*" wildcard)
  const exactCustom = customRules.find(
    (r) => r.transactionType === transactionType && r.currencyCode === code,
  );
  const globalCustom = customRules.find(
    (r) => r.transactionType === transactionType && r.currencyCode === "*",
  );
  const matchedCustom = exactCustom ?? globalCustom;

  if (matchedCustom) {
    return {
      transactionType,
      currencyCode: code,
      flatFee: matchedCustom.flatFee,
      percentFee: matchedCustom.percentFee,
      minFee: matchedCustom.minFee,
      maxFee: matchedCustom.maxFee,
      isActive: matchedCustom.isActive,
      source: "USER_CUSTOM",
      customScope: exactCustom ? "CURRENCY" : "GLOBAL",
      defaultFlatFee,
      defaultPercentFee,
      defaultMinFee,
      defaultMaxFee,
      defaultIsActive,
    };
  }

  return {
    transactionType,
    currencyCode: code,
    flatFee: defaultFlatFee,
    percentFee: defaultPercentFee,
    minFee: defaultMinFee,
    maxFee: defaultMaxFee,
    isActive: defaultIsActive,
    source: "PLATFORM_DEFAULT",
    defaultFlatFee,
    defaultPercentFee,
    defaultMinFee,
    defaultMaxFee,
    defaultIsActive,
  };
}

export async function resolveEffectiveFeeForUser(
  userId: string,
  transactionType: FeeTransactionType,
  currencyCode: string,
  db: DbClient = prisma,
): Promise<EffectiveFeeRule> {
  const code = currencyCode.toUpperCase();
  const [userOverrides, feeConfigs, settings] = await Promise.all([
    getUserFeeOverrides(userId, db),
    db.feeConfig.findMany({
      where: {
        transactionType,
        currencyCode: { in: [code, "*"] },
      },
    }),
    transactionType === "DEPOSIT"
      ? db.platformSetting.findUnique({ where: { id: "default" }, select: { feeBps: true } })
      : Promise.resolve(null),
  ]);

  return buildEffectiveRuleFromSources(
    transactionType,
    code,
    userOverrides.rules,
    feeConfigs,
    settings?.feeBps ?? 90,
  );
}

export function computeEffectiveFee(amount: Decimal, rule: EffectiveFeeRule): {
  fee: Decimal;
  netAmount: Decimal;
} {
  if (!rule.isActive) {
    return { fee: decimalZero(), netAmount: amount };
  }
  const fee = calculateFee(
    amount,
    new Decimal(rule.flatFee),
    new Decimal(rule.percentFee),
    new Decimal(rule.minFee),
    rule.maxFee !== null ? new Decimal(rule.maxFee) : null,
  );
  return { fee, netAmount: decimalSub(amount, fee) };
}

export async function getUserEffectiveFeesOverview(userId: string) {
  const [userOverrides, feeConfigs, settings, dbCurrencies] = await Promise.all([
    getUserFeeOverrides(userId),
    prisma.feeConfig.findMany({
      orderBy: [{ currencyCode: "asc" }, { transactionType: "asc" }],
    }),
    prisma.platformSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
    prisma.currency.findMany({
      where: { isActive: true },
      select: { code: true, name: true, symbol: true, decimals: true, type: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const currencyMap = new Map(dbCurrencies.map((c) => [c.code.toUpperCase(), c]));
  const currencyCodes: string[] = [];
  for (const code of SUPPORTED_FEE_CURRENCIES) {
    currencyCodes.push(code);
  }
  for (const c of dbCurrencies) {
    const upper = c.code.toUpperCase();
    if (!currencyCodes.includes(upper)) {
      currencyCodes.push(upper);
    }
  }

  const effectiveFees: EffectiveFeeRule[] = [];
  for (const currencyCode of currencyCodes) {
    for (const transactionType of FEE_TRANSACTION_TYPES) {
      effectiveFees.push(
        buildEffectiveRuleFromSources(
          transactionType,
          currencyCode,
          userOverrides.rules,
          feeConfigs,
          settings.feeBps,
        ),
      );
    }
  }

  return {
    effectiveFees,
    customRules: userOverrides.rules,
    customUpdatedAt: userOverrides.updatedAt || null,
    customNote: userOverrides.note ?? null,
    hasCustomFees: userOverrides.rules.length > 0,
    platformFeeBps: settings.feeBps,
    currencies: currencyCodes.map((code) => {
      const info = currencyMap.get(code);
      return {
        code,
        name: info?.name ?? code,
        symbol: info?.symbol ?? code,
        decimals: info?.decimals ?? (code === "CLP" ? 0 : 2),
        type: info?.type ?? (code === "USDT" || code === "USDC" ? "CRYPTO" : "FIAT"),
      };
    }),
  };
}
