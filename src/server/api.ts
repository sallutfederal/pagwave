import "server-only";

import { BackendError } from "@/lib/backend";

const PRIVATE_HEADERS = {
  // Per-user money data: never let a CDN, proxy or shared cache keep a copy.
  "cache-control": "private, no-store",
} as const;

/**
 * Wraps a route handler that returns per-user data.
 *
 * - Always marks the response private/no-store.
 * - Turns the API's errors into JSON with the right status.
 * - Turns the data layer's "session expired" redirect into a 401, because a
 *   `fetch()` from the browser cannot do anything useful with an HTML redirect.
 */
export async function privateJson(produce: () => Promise<unknown>, init: { status?: number } = {}) {
  try {
    return Response.json(await produce(), { status: init.status ?? 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    if (error instanceof BackendError) {
      let detailMessage: string | undefined;
      if (Array.isArray(error.details) && error.details.length > 0) {
        const first = error.details[0] as { message?: unknown } | undefined;
        if (typeof first?.message === "string" && first.message.trim()) {
          detailMessage = first.message;
        }
      }
      return Response.json(
        {
          error: error.code,
          message: detailMessage ?? error.message,
          details: error.details,
        },
        { status: error.status, headers: PRIVATE_HEADERS },
      );
    }

    // `redirect()` throws a NEXT_REDIRECT error; the data layer uses it for expired sessions.
    const digest = (error as { digest?: unknown } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      return Response.json(
        { error: "UNAUTHORIZED", message: "Your session has expired." },
        { status: 401, headers: PRIVATE_HEADERS },
      );
    }

    throw error;
  }
}
