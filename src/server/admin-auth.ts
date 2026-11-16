import "server-only";
import { redirect } from "next/navigation";
import { BackendError } from "@/lib/backend";
import { isAdminRole } from "@/lib/admin-auth";
import type { SessionUser } from "@/lib/session-user";
import { XPagError } from "@/lib/xpag/client";
import { getCurrentUser } from "@/server/auth";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
} as const;

/**
 * Ensures the current signed-in user holds an Admin role; redirects non-admins.
 */
export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Wraps /api/admin/* route handlers with strict server-side role verification.
 */
export async function adminPrivateJson(
  produce: (adminUser: SessionUser) => Promise<unknown>,
  init: { status?: number } = {},
) {
  try {
    const user = await getCurrentUser();
    if (!isAdminRole(user.role)) {
      return Response.json(
        {
          ok: false,
          error_code: "forbidden",
          message: "Acesso restrito a administradores.",
        },
        { status: 403, headers: PRIVATE_HEADERS },
      );
    }

    const data = await produce(user);
    return Response.json(data, { status: init.status ?? 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    if (error instanceof XPagError) {
      return Response.json(
        { ok: false, error_code: error.errorCode, message: error.message },
        { status: error.status, headers: PRIVATE_HEADERS },
      );
    }

    if (error instanceof BackendError) {
      return Response.json(
        { ok: false, error_code: error.code, message: error.message },
        { status: error.status, headers: PRIVATE_HEADERS },
      );
    }

    const digest = (error as { digest?: unknown } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      return Response.json(
        { ok: false, error_code: "UNAUTHORIZED", message: "Your session has expired." },
        { status: 401, headers: PRIVATE_HEADERS },
      );
    }

    throw error;
  }
}

