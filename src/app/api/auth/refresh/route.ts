import { z } from "zod";
import { BackendError, backendFetch } from "@/lib/backend";

const bodySchema = z.object({
  refreshToken: z.string().min(1),
});

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

/**
 * POST /api/auth/refresh
 * Runtime Vercel Function proxy used by middleware (`src/proxy.ts`) so token
 * refresh resolves Vercel Service Bindings (`BACKEND_ORIGIN`), since bindings
 * are not injected into Edge/Middleware contexts.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "VALIDATION_ERROR", message: "Refresh token is required." },
      { status: 400 },
    );
  }

  try {
    const tokens = await backendFetch<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken: parsed.data.refreshToken },
      auth: false,
    });
    return Response.json(tokens, { status: 200 });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    return Response.json(
      { error: "INTERNAL_ERROR", message: "Failed to refresh session." },
      { status: 500 },
    );
  }
}

