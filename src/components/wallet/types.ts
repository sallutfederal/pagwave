import type { XPagCurrency } from "@/lib/xpag/currencies";

export type BalanceEntry = {
  available: number;
  blocked: number;
};

export type BalancePayload = {
  ok: boolean;
  isSandbox: boolean;
  ledgerScope?: "user";
  kycLevel?: number;
  kycStatus?: string;
  balances: Partial<Record<XPagCurrency, BalanceEntry>> & Record<string, BalanceEntry>;
  blocked_currencies?: string[];
  updated_at?: string;
};

export type CashinIntent = "self_deposit" | "charge";

export type ClientBeneficiary = {
  id: string;
  label: string;
  currency: XPagCurrency;
  rail: string;
  summary: string;
  details: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientWalletActivity = {
  id: string;
  kind: "cashin" | "cashout" | "conversion" | "med";
  currency: string;
  toCurrency?: string;
  amount?: number;
  convertedAmount?: number;
  rail?: string;
  status: string;
  externalId?: string;
  transactionId?: string;
  requestNumber?: string;
  e2e?: string;
  origin?: string;
  destinationSummary?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ClientWebhookEvent = {
  id: string;
  type: string;
  status: string;
  currency?: string;
  amount?: number;
  e2e?: string;
  externalId?: string;
  transactionId?: string;
  requestNumber?: string;
  origin?: string;
  verifiedSignature: boolean;
  receivedAt: string;
  payload: Record<string, unknown>;
};

export type WalletTab = "cashout" | "cashin" | "beneficiaries" | "convert" | "history";

