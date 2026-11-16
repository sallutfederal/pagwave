import "server-only";
import crypto from "node:crypto";
import {
  translateXPagError,
  type XPagCurrency,
} from "@/lib/xpag/currencies";

const DEFAULT_BASE_URL = "https://api.xpag.global";
const DEFAULT_SANDBOX_ID = "xpagsandbox_00000000";
const DEFAULT_SANDBOX_SECRET = "202620262026202620262026";

export function getXPagConfig() {
  const baseUrl = (process.env.XPAG_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const clientId = process.env.XPAG_CLIENT_ID || DEFAULT_SANDBOX_ID;
  const clientSecret = process.env.XPAG_CLIENT_SECRET || DEFAULT_SANDBOX_SECRET;
  const isSandbox = clientId.startsWith("xpagsandbox") || baseUrl.includes("sandbox");
  return { baseUrl, clientId, clientSecret, isSandbox };
}

export function resolveWebhookUrl(origin?: string): string | undefined {
  const configured = process.env.XPAG_WEBHOOK_URL?.trim();
  if (configured) return configured;
  if (origin && origin.startsWith("https://") && !origin.includes("localhost")) {
    return `${origin.replace(/\/+$/, "")}/api/webhooks/xpag`;
  }
  return undefined;
}

export class XPagError extends Error {
  status: number;
  errorCode: string;
  raw?: unknown;

  constructor(message: string, status: number, errorCode = "xpag_error", raw?: unknown) {
    super(message);
    this.name = "XPagError";
    this.status = status;
    this.errorCode = errorCode;
    this.raw = raw;
  }
}

export type XPagBalanceEntry = {
  available: number;
  blocked: number;
};

export type XPagBalanceResponse = {
  ok: boolean;
  sandbox?: boolean;
  balances: Partial<Record<XPagCurrency, XPagBalanceEntry>> &
    Record<string, XPagBalanceEntry>;
  blocked_currencies?: string[];
  updated_at?: string;
};

export type XPagConversionResult = {
  ok: boolean;
  sandbox?: boolean;
  simulated?: boolean;
  from: XPagCurrency;
  to: XPagCurrency;
  amount: number;
  rate: number;
  fee?: number;
  fee_currency?: string;
  converted_amount?: number;
  estimated_amount?: number;
  net_amount?: number;
  transaction_id?: string;
  external_id?: string;
  balances?: XPagBalanceResponse["balances"];
};

export async function xpagRequest<T = Record<string, unknown>>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    query?: Record<string, string | undefined>;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const { baseUrl, clientId, clientSecret } = getXPagConfig();
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    const res = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Client-Id": clientId,
        "X-Client-Secret": clientSecret,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text) as Record<string, unknown>;
      } catch {
        json = { error: text };
      }
    }

    if (!res.ok || json.ok === false) {
      const errorCode =
        typeof json.error_code === "string" ? json.error_code : `http_${res.status}`;
      const apiMsg =
        typeof json.error === "string"
          ? json.error
          : typeof json.message === "string"
            ? json.message
            : undefined;
      throw new XPagError(
        translateXPagError(errorCode, apiMsg),
        res.status >= 400 ? res.status : 400,
        errorCode,
        json,
      );
    }

    return json as T;
  } catch (err) {
    if (err instanceof XPagError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new XPagError("Tempo limite excedido ao comunicar com a XPag.", 504, "timeout");
    }
    throw new XPagError(
      err instanceof Error ? err.message : "Falha de conexão com a XPag.",
      502,
      "network_error",
    );
  } finally {
    clearTimeout(timer);
  }
}

export function getXPagBalance() {
  return xpagRequest<XPagBalanceResponse>("/balance", { method: "GET" });
}

export function createXPagCashin(payload: Record<string, unknown>) {
  return xpagRequest<Record<string, unknown>>("/cashin", {
    method: "POST",
    body: payload,
  });
}

export function createXPagCashout(payload: Record<string, unknown>) {
  return xpagRequest<Record<string, unknown>>("/cashout", {
    method: "POST",
    body: payload,
  });
}

export function simulateXPagConversion(payload: {
  amount: number;
  from: XPagCurrency;
  to: XPagCurrency;
}) {
  return xpagRequest<XPagConversionResult>("/conversion/simulate", {
    method: "POST",
    body: payload,
  });
}

export function executeXPagConversion(payload: {
  amount: number;
  from: XPagCurrency;
  to: XPagCurrency;
  external_id?: string;
}) {
  return xpagRequest<XPagConversionResult>("/conversion", {
    method: "POST",
    body: payload,
  });
}

export function consultXPagTransaction(query: {
  request_number?: string;
  transaction_id?: string;
  e2e?: string;
  external_id?: string;
  clabe?: string;
}) {
  return xpagRequest<Record<string, unknown>>("/consult-transaction", {
    method: "GET",
    query,
  });
}

export function consultXPagCashout(query: {
  e2e?: string;
  transaction_id?: string;
  external_id?: string;
}) {
  return xpagRequest<Record<string, unknown>>("/consult-cashout", {
    method: "GET",
    query,
  });
}

export function simulateXPagSandbox(payload: {
  request_number: string;
  status: "paid" | "failed" | "expired";
  amount?: number;
}) {
  return xpagRequest<Record<string, unknown>>("/sandbox/simulate", {
    method: "POST",
    body: payload,
  });
}

export function verifyXPagWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const { clientSecret } = getXPagConfig();
  const normalizedSig = signatureHeader.trim().replace(/^sha256=/i, "").toLowerCase();
  const expected = crypto
    .createHmac("sha256", clientSecret)
    .update(rawBody, "utf8")
    .digest("hex")
    .toLowerCase();

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(normalizedSig, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

