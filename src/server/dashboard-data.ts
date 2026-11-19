import { redirect } from "next/navigation";
import { cache } from "react";
import type { z } from "zod";

import { BackendError, backendFetch } from "@/lib/backend";
import {
  cardSettingsSchema,
  currencySchema,
  dashboardSummarySchema,
  periodSchema,
  recentSalesSchema,
  statisticSchema,
  transactionSchema,
  transactionsSchema,
  walletSchema,
  walletsSchema,
  type BankCard,
  type CardSetting,
  type Period,
  type Sale,
  type Transaction,
  type Wallet,
} from "@/lib/schemas";
import { SESSION_EXPIRED_PATH, getCurrentUser } from "@/server/auth";

/* -------------------------------------------------------------------------- */
/*                               Backend access                               */
/*                                                                            */
/* Everything below talks to the Fastify API with the signed-in user's token. */
/* None of it may use `"use cache"`: the data is per-user, and a shared cache */
/* entry would leak one account's balances to another.                        */
/* -------------------------------------------------------------------------- */

/** A rejected session ends the visit: clear the cookies and go to /login. */
async function authed<T>(path: string): Promise<T> {
  try {
    return await backendFetch<T>(path);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      redirect(SESSION_EXPIRED_PATH);
    }

    throw error;
  }
}

/** Keeps the valid rows. One unknown currency must not blank a whole page. */
function parseRows<S extends z.ZodType>(schema: S, rows: unknown[], what: string): z.output<S>[] {
  const valid: z.output<S>[] = [];

  for (const row of rows) {
    const result = schema.safeParse(row);

    if (result.success) valid.push(result.data);
    else console.warn(`[dashboard-data] skipped an invalid ${what}:`, result.error.issues[0]?.message);
  }

  return valid;
}

/* ---------------------------------- wallets -------------------------------- */

type BackendWallet = {
  id: string;
  label: string | null;
  type: "FIAT" | "CRYPTO";
  currencyCode: string;
  currencyName: string;
  balance: string;
  frozenBalance: string;
  availableBalance: string;
  isDefault: boolean;
};

const loadWallets = cache(async (): Promise<Wallet[]> => {
  const rows = await authed<BackendWallet[]>("/wallets");

  return parseRows(
    walletSchema,
    rows.map((wallet) => ({
      id: wallet.id,
      label: wallet.label ?? `${wallet.currencyCode} Wallet`,
      currency: wallet.currencyCode,
      currencyName: wallet.currencyName,
      type: wallet.type,
      balance: Number(wallet.balance),
      available: Number(wallet.availableBalance),
      frozen: Number(wallet.frozenBalance),
      isDefault: wallet.isDefault,
    })),
    "wallet",
  );
});

export async function getWallets() {
  return walletsSchema.parse({ wallets: await loadWallets() });
}

/* ----------------------------------- cards --------------------------------- */

type BackendCard = {
  id: string;
  status: string;
  brand: "VISA" | "MASTERCARD";
  variant: "DARK" | "LIGHT";
  label: string | null;
  last4: string;
  expiry: string;
  holderName: string;
  currencyCode: string;
  transactionCount: number;
  linkedWalletId: string | null;
  monthlyLimit: string;
  monthlySpent: string;
  activatedAt: string | null;
  createdAt: string;
};

const loadCards = cache(async () => {
  const [cards, wallets] = await Promise.all([authed<BackendCard[]>("/cards"), loadWallets()]);
  const balanceOf = new Map(wallets.map((wallet) => [wallet.id, wallet.available]));

  const bankCards: BankCard[] = [];
  const settings: CardSetting[] = [];

  for (const card of cards) {
    const currency = currencySchema.safeParse(card.currencyCode);
    if (!currency.success) continue;

    bankCards.push({
      id: card.id,
      variant: card.variant === "LIGHT" ? "light" : "dark",
      // A card spends from its linked wallet: that balance is the card's balance.
      balance: card.linkedWalletId ? (balanceOf.get(card.linkedWalletId) ?? 0) : 0,
      currency: currency.data,
      last4: card.last4,
      expiry: card.expiry,
      brand: card.brand === "MASTERCARD" ? "mastercard" : "visa",
      holder: card.holderName,
      label: card.label ?? undefined,
      frozen: card.status === "FROZEN",
    });

    settings.push({
      cardId: card.id,
      label: card.label ?? card.holderName,
      monthlyLimit: Number(card.monthlyLimit),
      spent: Number(card.monthlySpent),
      transactions: card.transactionCount,
      frozen: card.status === "FROZEN",
      linkedAt: card.activatedAt ?? card.createdAt,
    });
  }

  return { bankCards, settings };
});

export async function getDashboardSummary() {
  const [user, { bankCards }] = await Promise.all([getCurrentUser(), loadCards()]);

  return dashboardSummarySchema.parse({
    greeting: {
      name: user.name,
      email: user.email,
      title: "Painel",
      subtitle: "Visão geral",
      avatar: { url: "", initials: user.initials },
      accountLabel: "Minha conta",
    },
    cards: bankCards,
    quickActions,
  });
}

export async function getCardSettings() {
  const { settings } = await loadCards();

  return cardSettingsSchema.parse({ settings });
}

/* -------------------------------- transactions ----------------------------- */

type BackendTransaction = {
  id: string;
  referenceId: string;
  type: string;
  status: string;
  amount: string;
  usdAmount: string | null;
  currencyCode: string;
  toCurrencyCode: string | null;
  description: string | null;
  createdAt: string;
};

type TransactionKind = { label: string; badge: string; direction: "in" | "out" };

const TRANSACTION_KINDS: Record<string, TransactionKind> = {
  DEPOSIT: { label: "Deposit", badge: "DP", direction: "in" },
  WITHDRAWAL: { label: "Withdrawal", badge: "WD", direction: "out" },
  TRANSFER_IN: { label: "Transfer received", badge: "IN", direction: "in" },
  TRANSFER_OUT: { label: "Transfer sent", badge: "OUT", direction: "out" },
  EXCHANGE: { label: "Exchange", badge: "FX", direction: "out" },
  CARD_PAYMENT: { label: "Card payment", badge: "CP", direction: "out" },
  CARD_REFUND: { label: "Card refund", badge: "RF", direction: "in" },
  FEE: { label: "Fee", badge: "FE", direction: "out" },
  INTEREST: { label: "Interest", badge: "IR", direction: "in" },
  AIRDROP: { label: "Airdrop", badge: "AD", direction: "in" },
  STAKING_REWARD: { label: "Staking reward", badge: "SR", direction: "in" },
};

function transactionStatus(status: string): Transaction["status"] {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "PENDING":
    case "PROCESSING":
    case "FROZEN":
      return "Pending";
    default:
      return "Failed"; // FAILED, CANCELLED, REVERSED
  }
}

function toTransaction(tx: BackendTransaction): unknown {
  const kind = TRANSACTION_KINDS[tx.type] ?? { label: tx.type, badge: "TX", direction: "out" as const };
  const amount = Number(tx.amount);
  const usd = tx.usdAmount === null ? null : Number(tx.usdAmount);
  const sign = kind.direction === "in" ? 1 : -1;

  return {
    id: tx.id,
    title: tx.description ?? kind.label,
    subtitle: tx.referenceId,
    avatar: { url: "", initials: kind.badge },
    amount: sign * amount,
    currency: tx.currencyCode,
    usdAmount: usd === null ? null : sign * usd,
    date: tx.createdAt,
    category: kind.label,
    method: tx.toCurrencyCode ? `${tx.currencyCode} → ${tx.toCurrencyCode}` : `${tx.currencyCode} wallet`,
    status: transactionStatus(tx.status),
    direction: kind.direction,
  };
}

export async function getTransactions(limit?: number) {
  // The API caps a page at 100 rows.
  const take = Math.min(limit ?? 100, 100);
  const { data } = await authed<{ data: BackendTransaction[] }>(`/transactions?limit=${take}`);

  return transactionsSchema.parse({
    transactions: parseRows(transactionSchema, data.map(toTransaction), "transaction"),
  });
}

/* --------------------------------- statistic ------------------------------- */

type BackendStatistic = {
  total: number;
  segments: { id: string; label: string; value: number }[];
};

export async function getStatistic(period: Period) {
  const stat = await authed<BackendStatistic>(`/transactions/statistic?period=${period}`);

  return statisticSchema.parse({
    total: stat.total,
    currency: "USD",
    period,
    label: "Saídas",
    segments: stat.segments.map((segment) => ({
      ...segment,
      // Share of the 360° ring. With nothing spent every arc collapses to 0.
      degrees: stat.total > 0 ? (segment.value / stat.total) * 360 : 0,
    })),
  });
}

const quickActions = [
  { id: "transfer", label: "Transferir P2P", active: true },
  { id: "utility", label: "Depositar", active: false },
  { id: "transport", label: "Sacar", active: false },
  { id: "taxes", label: "Extrato", active: false },
] as const;

export async function getRecentSales() {
  const { data } = await authed<{ data: BackendTransaction[] }>("/transactions?limit=30");

  const rows = data
    .filter((tx) => {
      const kind = TRANSACTION_KINDS[tx.type];
      return kind?.direction === "in";
    })
    .slice(0, 6)
    .map((tx) => {
      const kind = TRANSACTION_KINDS[tx.type] ?? {
        label: tx.type,
        badge: "IN",
        direction: "in" as const,
      };
      return {
        id: tx.id,
        customer: {
          name: tx.description ?? kind.label,
          email: tx.referenceId,
          avatar: { url: "", initials: tx.currencyCode.slice(0, 2) },
        },
        date: tx.createdAt,
        status:
          tx.status === "COMPLETED"
            ? ("Success" as const)
            : tx.status === "PENDING" || tx.status === "PROCESSING" || tx.status === "FROZEN"
              ? ("Process" as const)
              : ("Failed" as const),
        amount: Number(tx.amount),
        currency: tx.currencyCode as Sale["currency"],
      };
    })
    .filter((row) => currencySchema.safeParse(row.currency).success);

  return recentSalesSchema.parse({ sales: rows });
}

/* -------------------------------------------------------------------------- */
/*                                   utils                                    */
/* -------------------------------------------------------------------------- */

export function parsePeriod(value: unknown): Period {
  return periodSchema.catch("this-month").parse(value);
}
