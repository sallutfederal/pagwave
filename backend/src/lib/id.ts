import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Generate a short, URL-safe unique ID (default 21 chars). */
export const generateId = customAlphabet(alphabet, 21);

/** Generate a public-facing transaction reference like `TXN-A3kX9mB2pQ`. */
export function generateTxRef(): string {
  return `TXN-${customAlphabet(alphabet, 10)()}`;
}

/** Generate an API key like `pk_live_xxxxxxxxxxxxxxxxxxxxxxxx`. */
export function generateApiKey(prefix: "pk_live" | "pk_test" | "sk_live" | "sk_test"): string {
  return `${prefix}_${customAlphabet(alphabet, 32)()}`;
}

/** Generate a secure random token for email verification / password reset. */
export function generateSecureToken(): string {
  return customAlphabet("0123456789abcdef", 64)();
}
