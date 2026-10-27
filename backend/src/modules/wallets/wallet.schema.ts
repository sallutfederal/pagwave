import { z } from "zod";

export const createWalletSchema = z.object({
  currencyCode: z.string().min(1).max(10),
  type: z.enum(["FIAT", "CRYPTO"]),
  label: z.string().max(100).optional(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;

export const transferSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid().optional(), // Internal transfer target
  recipientEmail: z.string().email().optional(), // P2P by email
  recipientAddress: z.string().optional(), // Crypto external address
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be positive"),
  description: z.string().max(500).optional(),
  network: z.enum(["ETHEREUM", "TRON", "BSC", "POLYGON", "SOLANA", "BITCOIN", "ARBITRUM", "OPTIMISM"]).optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;

export const exchangeSchema = z.object({
  fromWalletId: z.string().uuid(),
  toCurrencyCode: z.string().min(1).max(10),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be positive"),
});

export type ExchangeInput = z.infer<typeof exchangeSchema>;

export const depositSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be positive"),
  method: z.enum(["PIX", "WIRE", "CARD", "CRYPTO"]).default("WIRE"),
});

export type DepositInput = z.infer<typeof depositSchema>;

export const withdrawalSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be positive"),
  // Fiat
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftBic: z.string().optional(),
  // Crypto
  address: z.string().optional(),
  network: z.enum(["ETHEREUM", "TRON", "BSC", "POLYGON", "SOLANA", "BITCOIN", "ARBITRUM", "OPTIMISM"]).optional(),
  // Saved beneficiary shortcut
  beneficiaryId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
