import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Shared                                    */
/* -------------------------------------------------------------------------- */

export const currencySchema = z.enum([
  "USD",
  "EUR",
  "BRL",
  "MXN",
  "COP",
  "ARS",
  "BOB",
  "CLP",
  "VES",
  "USDT",
  "USDC",
]);

/** Currencies a card can be issued in (cards spend from fiat wallets). */
export const cardCurrencySchema = z.enum(["USD", "EUR", "BRL"]);

export const avatarSchema = z.object({
  /** Remote photo. Empty means "no photo": the UI renders the initials instead. */
  url: z.string(),
  initials: z.string().min(1).max(3),
});

/* -------------------------------------------------------------------------- */
/*                                  Wallets                                   */
/* -------------------------------------------------------------------------- */

export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  currency: currencySchema,
  currencyName: z.string(),
  type: z.enum(["FIAT", "CRYPTO"]),
  balance: z.number(),
  available: z.number(),
  /** Held for pending operations, e.g. a withdrawal still processing. */
  frozen: z.number(),
  isDefault: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/*                                 Bank cards                                 */
/* -------------------------------------------------------------------------- */

export const bankCardSchema = z.object({
  id: z.string(),
  variant: z.enum(["dark", "light"]),
  balance: z.number(),
  currency: currencySchema,
  last4: z.string().length(4),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  brand: z.enum(["visa", "mastercard"]),
  holder: z.string(),
  /** User-given name, e.g. "Travel card". Falls back to the holder when absent. */
  label: z.string().optional(),
  frozen: z.boolean().optional(),
});

/** Per-card controls rendered on the Cards page. */
export const cardSettingSchema = z.object({
  cardId: z.string(),
  label: z.string(),
  monthlyLimit: z.number(),
  spent: z.number(),
  transactions: z.number(),
  frozen: z.boolean(),
  linkedAt: z.string(),
});

/* -------------------------------------------------------------------------- */
/*                               Quick actions                                */
/* -------------------------------------------------------------------------- */

export const quickActionSchema = z.object({
  id: z.enum(["transfer", "utility", "taxes", "transport"]),
  label: z.string(),
  active: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/*                                  Statistic                                 */
/* -------------------------------------------------------------------------- */

export const periodSchema = z.enum(["this-month", "last-month", "last-year"]);

export const statisticSchema = z.object({
  total: z.number(),
  currency: currencySchema,
  period: periodSchema,
  label: z.string(),
  segments: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.number(),
        /** Degrees of the 360° ring used by this segment. */
        degrees: z.number().min(0).max(360),
      }),
    )
    .min(1),
});

/* -------------------------------------------------------------------------- */
/*                                Recent sales                                */
/* -------------------------------------------------------------------------- */

export const saleStatusSchema = z.enum(["Success", "Process", "Failed"]);

export const saleSchema = z.object({
  id: z.string(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: avatarSchema,
  }),
  date: z.string(),
  status: saleStatusSchema,
  amount: z.number(),
  currency: currencySchema,
});

/* -------------------------------------------------------------------------- */
/*                               Transactions                                 */
/* -------------------------------------------------------------------------- */

export const transactionStatusSchema = z.enum(["Completed", "Pending", "Failed"]);

export const transactionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  avatar: avatarSchema,
  amount: z.number(),
  currency: currencySchema,
  /** The same amount priced in USD, for totals across currencies. `null` when no rate is known. */
  usdAmount: z.number().nullable(),
  date: z.string(),
  category: z.string(),
  /** How the money moved, e.g. `Card ••1810`. */
  method: z.string(),
  status: transactionStatusSchema,
  /** Incomes carry a positive amount. */
  direction: z.enum(["in", "out"]),
});

/* -------------------------------------------------------------------------- */
/*                                 Messages                                   */
/* -------------------------------------------------------------------------- */

export const conversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  avatar: avatarSchema,
  online: z.boolean(),
  unread: z.number().min(0),
  messages: z.array(
    z.object({
      id: z.string(),
      from: z.enum(["me", "them"]),
      text: z.string(),
      time: z.string(),
    }),
  ),
});

/* -------------------------------------------------------------------------- */
/*                               New card form                                */
/* -------------------------------------------------------------------------- */

/** What the "Request a new card" form collects; reused by client validation. */
export const newCardSchema = z.object({
  label: z.string().trim().min(2, "Give the card a label").max(40, "Label is too long"),
  holder: z.string().trim().min(2, "Cardholder is required").max(60, "Name is too long"),
  brand: z.enum(["visa", "mastercard"]),
  currency: cardCurrencySchema,
  variant: z.enum(["dark", "light"]),
});

/* -------------------------------------------------------------------------- */
/*                                 Contracts                                  */
/* -------------------------------------------------------------------------- */

export const dashboardSummarySchema = z.object({
  greeting: z.object({
    name: z.string(),
    email: z.string().email(),
    title: z.string(),
    subtitle: z.string(),
    avatar: avatarSchema,
    accountLabel: z.string(),
  }),
  cards: z.array(bankCardSchema),
  quickActions: z.array(quickActionSchema),
});

export const cardSettingsSchema = z.object({ settings: z.array(cardSettingSchema) });
export const walletsSchema = z.object({ wallets: z.array(walletSchema) });
export const recentSalesSchema = z.object({ sales: z.array(saleSchema) });
export const transactionsSchema = z.object({ transactions: z.array(transactionSchema) });
export const conversationsSchema = z.object({ conversations: z.array(conversationSchema) });

/* --------------------------------- types ---------------------------------- */

export type Currency = z.infer<typeof currencySchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Avatar = z.infer<typeof avatarSchema>;
export type BankCard = z.infer<typeof bankCardSchema>;
export type NewCard = z.infer<typeof newCardSchema>;
export type CardSetting = z.infer<typeof cardSettingSchema>;
export type QuickAction = z.infer<typeof quickActionSchema>;
export type Period = z.infer<typeof periodSchema>;
export type Statistic = z.infer<typeof statisticSchema>;
export type Sale = z.infer<typeof saleSchema>;
export type SaleStatus = z.infer<typeof saleStatusSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;