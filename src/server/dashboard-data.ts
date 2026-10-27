import { cacheLife } from "next/cache";

import { userProfile } from "@/data/user-profile";
import {
  cardSettingsSchema,
  conversationsSchema,
  customersSchema,
  dashboardSummarySchema,
  periodSchema,
  productsSchema,
  recentSalesSchema,
  statisticSchema,
  transactionsSchema,
  type BankCard,
  type CardSetting,
  type Conversation,
  type Customer,
  type Period,
  type Product,
  type Sale,
  type Transaction,
} from "@/lib/schemas";

/* -------------------------------------------------------------------------- */
/*                                Data source                                 */
/*                                                                            */
/* Containers are intentionally empty: the UI renders its own empty states    */
/* until real records are wired in here.                                      */
/* -------------------------------------------------------------------------- */

const greeting = userProfile;

const cards: BankCard[] = [];

const cardSettings: CardSetting[] = [];

const quickActions = [
  { id: "transfer", label: "Transfer", active: true },
  { id: "utility", label: "Utility", active: false },
  { id: "taxes", label: "Taxes", active: false },
  { id: "transport", label: "Transport", active: false },
] as const;

const sales: Sale[] = [];

const transactions: Transaction[] = [];

const conversations: Conversation[] = [];

const products: Product[] = [];

const customers: Customer[] = [];

/** Ring layout per period: [bills, money transactions] in degrees. */
const statisticByPeriod = {
  "this-month": {
    total: 0,
    label: "Usage",
    segments: [{ id: "bills", label: "Payment of the bills", value: 0, degrees: 0 }],
  },
  "last-month": {
    total: 0,
    label: "Usage",
    segments: [{ id: "bills", label: "Payment of the bills", value: 0, degrees: 0 }],
  },
  "last-year": {
    total: 0,
    label: "Usage",
    segments: [{ id: "bills", label: "Payment of the bills", value: 0, degrees: 0 }],
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                          Shared service layer                             */
/*                                                                            */
/* The UI talks to these functions. Route handlers expose them over HTTP      */
/* (src/app/api/**) and Server Components call them directly — the same       */
/* Backend-for-Frontend pattern Next recommends, so there is no self-fetch.  */
/*                                                                            */
/* Swap the empty containers for real queries and the whole app keeps working.*/
/* -------------------------------------------------------------------------- */

export async function getDashboardSummary() {
  "use cache";
  cacheLife("hours");

  return dashboardSummarySchema.parse({ greeting, cards, quickActions });
}

export async function getCardSettings() {
  "use cache";
  cacheLife("hours");

  return cardSettingsSchema.parse({ settings: cardSettings.map((item) => ({ ...item })) });
}

export async function getRecentSales() {
  "use cache";
  cacheLife("hours");

  return recentSalesSchema.parse({ sales: sales.map((item) => ({ ...item })) });
}

export async function getTransactions(limit?: number) {
  "use cache";
  cacheLife("hours");

  const all = transactions.map((item) => ({ ...item }));
  return transactionsSchema.parse({ transactions: typeof limit === "number" ? all.slice(0, limit) : all });
}

export async function getConversations() {
  "use cache";
  cacheLife("hours");

  return conversationsSchema.parse({ conversations: conversations.map((item) => ({ ...item })) });
}

export async function getProducts() {
  "use cache";
  cacheLife("hours");

  return productsSchema.parse({ products: products.map((item) => ({ ...item })) });
}

export async function getCustomers() {
  "use cache";
  cacheLife("hours");

  return customersSchema.parse({ customers: customers.map((item) => ({ ...item })) });
}

export async function getStatistic(period: Period) {
  "use cache";
  cacheLife("hours");

  const preset = statisticByPeriod[period];

  return statisticSchema.parse({
    total: preset.total,
    currency: "USD",
    period,
    label: preset.label,
    segments: preset.segments.map((segment) => ({ ...segment })),
  });
}

/* -------------------------------------------------------------------------- */
/*                                   utils                                    */
/* -------------------------------------------------------------------------- */

export function parsePeriod(value: unknown): Period {
  return periodSchema.catch("this-month").parse(value);
}
