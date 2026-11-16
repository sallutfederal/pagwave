import "server-only";

import { headers } from "next/headers";

import { getAccessToken } from "@/lib/session";

/** Base URL of the Fastify API, including the version prefix. */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000/api/v1";

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

type BackendOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the session's access token. Turn off for login/register/etc. */
  auth?: boolean;
  /** Explicit token (used right after login, before cookies are readable). */
  token?: string;
};

/** Forwards who is really calling, so the API can rate-limit and audit per client. */
async function forwardedHeaders(): Promise<Record<string, string>> {
  try {
    const incoming = await headers();
    const out: Record<string, string> = {};

    const forwardedFor = incoming.get("x-forwarded-for");
    const userAgent = incoming.get("user-agent");

    if (forwardedFor) out["x-forwarded-for"] = forwardedFor;
    if (userAgent) out["user-agent"] = userAgent;

    return out;
  } catch {
    // Not inside a request scope (e.g. during a build): nothing to forward.
    return {};
  }
}

/**
 * Typed fetch against the Fastify API. Server-side only: the browser never
 * talks to the backend directly and never sees a token.
 */
export async function backendFetch<T>(path: string, options: BackendOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, token } = options;
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(await forwardedHeaders()),
  };

  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  if (auth) {
    const accessToken = token ?? (await getAccessToken());

    if (!accessToken) {
      throw new BackendError("You are not signed in.", 401, "UNAUTHORIZED");
    }

    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new BackendError("The service is unavailable. Please try again shortly.", 503, "BACKEND_UNREACHABLE");
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as { error?: string; message?: string; details?: unknown };

    throw new BackendError(
      error.message ?? `Request failed with status ${response.status}`,
      response.status,
      error.error ?? "REQUEST_FAILED",
      error.details,
    );
  }

  return payload as T;
}

