import "server-only";
import { BackendError } from "@/lib/backend";
import { XPagError } from "@/lib/xpag/client";
import { getCurrentUser } from "@/server/auth";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
} as const;

export async function xpagPrivateJson(
  produce: (userId: string) => Promise<unknown>,
  init: { status?: number } = {},
) {
  try {
    const user = await getCurrentUser();
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isAdmin && user.kycStatus !== "APPROVED") {
      throw new XPagError(
        "Acesso bloqueado: envie seus documentos de KYC e aguarde a aprovação do administrador.",
        403,
        "KYC_REQUIRED",
      );
    }
    const data = await produce(user.id);
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

