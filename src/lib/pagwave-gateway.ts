import "server-only";
import { checkRateLimit } from "@/lib/rate-limit";
import { XPagError } from "@/lib/xpag/client";
import {
  authenticatePagwaveApiKey,
  isAccountSuspended,
  recordApiGatewayLog,
  type UserApiKeyRecord,
} from "@/lib/xpag/store";

export type GatewayAuthContext = {
  userId: string;
  key: UserApiKeyRecord;
};

export async function withPagwaveApiAuth(
  request: Request,
  endpoint: string,
  handler: (
    ctx: GatewayAuthContext,
  ) => Promise<{ status?: number; currency?: string; body: Record<string, unknown> }>,
): Promise<Response> {
  const startedAt = Date.now();
  const clientId = request.headers.get("x-client-id") ?? "";
  const clientSecret = request.headers.get("x-client-secret") ?? "";

  if (!clientId.trim() || !clientSecret.trim()) {
    return Response.json(
      {
        ok: false,
        error_code: "missing_credentials",
        message: "Envie os headers X-Client-Id e X-Client-Secret gerados em /integrations.",
      },
      { status: 401 },
    );
  }

  const auth = await authenticatePagwaveApiKey(clientId, clientSecret);
  if (!auth) {
    return Response.json(
      {
        ok: false,
        error_code: "invalid_credentials",
        message: "Credenciais X-Client-Id / X-Client-Secret inválidas ou rotacionadas.",
      },
      { status: 401 },
    );
  }

  const rate = checkRateLimit(`api_v1:${auth.key.clientId}`, 120, 60_000);
  if (!rate.allowed) {
    return Response.json(
      {
        ok: false,
        error_code: "rate_limited",
        message: "Limite de requisições excedido para esta credencial. Aguarde antes de reenviar.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  if (await isAccountSuspended(auth.userId)) {
    return Response.json(
      {
        ok: false,
        error_code: "account_suspended",
        message: "Esta conta está temporariamente suspensa pelo administrador.",
      },
      { status: 403 },
    );
  }

  try {
    const out = await handler(auth);
    const statusCode = out.status ?? 200;
    await recordApiGatewayLog({
      userId: auth.userId,
      clientId: auth.key.clientId,
      method: request.method,
      endpoint,
      currency: out.currency,
      statusCode,
      ok: statusCode < 400,
      latencyMs: Date.now() - startedAt,
    });
    return Response.json(out.body, { status: statusCode });
  } catch (err) {
    const isXPag = err instanceof XPagError;
    const statusCode = isXPag ? err.status : 500;
    const errorCode = isXPag ? err.errorCode : "internal_error";
    const message =
      err instanceof Error ? err.message : "Erro interno ao processar requisição na API Pagwave.";

    await recordApiGatewayLog({
      userId: auth.userId,
      clientId: auth.key.clientId,
      method: request.method,
      endpoint,
      statusCode,
      ok: false,
      errorCode,
      latencyMs: Date.now() - startedAt,
    });

    return Response.json(
      {
        ok: false,
        error_code: errorCode,
        message,
      },
      { status: statusCode },
    );
  }
}

