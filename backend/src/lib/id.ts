import { randomInt } from "node:crypto";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomToken(chars: string, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[randomInt(chars.length)];
  }
  return out;
}

/** Generate a short, URL-safe unique ID (default 21 chars). */
export function generateId(): string {
  return randomToken(alphabet, 21);
}

/** Generate a public-facing transaction reference like `TXN-A3kX9mB2pQ`. */
export function generateTxRef(): string {
  return `TXN-${randomToken(alphabet, 10)}`;
}

/** Generate an API key like `pk_live_xxxxxxxxxxxxxxxxxxxxxxxx`. */
export function generateApiKey(prefix: "pk_live" | "pk_test" | "sk_live" | "sk_test"): string {
  return `${prefix}_${randomToken(alphabet, 32)}`;
}

/** Generate a secure random token for email verification / password reset. */
export function generateSecureToken(): string {
  return randomToken("0123456789abcdef", 64);
}
