import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  GUEST_ONLY_PAGES,
  PROTECTED_PREFIXES,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/session-constants";

function resolveRefreshUrl(requestUrl: string): string {
  const explicit = process.env.BACKEND_URL?.trim();
  if (explicit) {
    return new URL("auth/refresh", `${explicit.replace(/\/+$/, "")}/`).toString();
  }
  // In Vercel Services mode, bindings resolve in Functions (not Middleware),
  // so middleware delegates to our Next.js Function `/api/auth/refresh`.
  return new URL("/api/auth/refresh", requestUrl).toString();
}

type Tokens = { accessToken: string; refreshToken: string };

/**
 * Refresh tokens rotate (single use). When the access cookie expires, a page
 * and its API calls often arrive together; if each tried to refresh, all but
 * one would fail and sign the user out. Concurrent requests carrying the same
 * refresh token therefore share one in-flight refresh.
 */
const inflight = new Map<string, Promise<Tokens | null>>();

function refreshTokens(
  refreshToken: string,
  headers: Headers,
  requestUrl: string,
): Promise<Tokens | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;

  const attempt = (async () => {
    try {
      const response = await fetch(resolveRefreshUrl(requestUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(headers.get("x-forwarded-for") ? { "x-forwarded-for": headers.get("x-forwarded-for")! } : {}),
          ...(headers.get("user-agent") ? { "user-agent": headers.get("user-agent")! } : {}),
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (!response.ok) return null;

      const tokens = (await response.json()) as Partial<Tokens>;
      return tokens.accessToken && tokens.refreshToken
        ? { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
        : null;
    } catch {
      return null;
    } finally {
      // Keep the entry briefly so requests that arrive right behind reuse the result.
      setTimeout(() => inflight.delete(refreshToken), 10_000);
    }
  })();

  inflight.set(refreshToken, attempt);
  return attempt;
}

function isPrefetch(request: NextRequest) {
  return request.headers.has("next-router-prefetch") || request.headers.get("purpose") === "prefetch";
}

function redirectToLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  /* Visitors-only pages: a signed-in user has nothing to do here. */
  if (GUEST_ONLY_PAGES.some((page) => pathname === page)) {
    if (access) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");
  const isProtectedPage = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isApi && !isProtectedPage) return NextResponse.next();

  /* Valid access token: nothing to do. */
  if (access) return NextResponse.next();

  /* No session at all. API routes answer 401 themselves. */
  if (!refresh) return isApi ? NextResponse.next() : redirectToLogin(request);

  /* A prefetch must not spend the single-use refresh token. */
  if (isPrefetch(request)) return NextResponse.next();

  const tokens = await refreshTokens(refresh, request.headers, request.url);

  if (!tokens) {
    return isApi
      ? Response.json({ error: "UNAUTHORIZED", message: "Your session has expired." }, { status: 401 })
      : redirectToLogin(request);
  }

  /* Make the new tokens visible to this very request, then persist them. */
  request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);

  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, sessionCookieOptions(ACCESS_MAX_AGE));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, sessionCookieOptions(REFRESH_MAX_AGE));

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/create",
    "/dashboard/:path*",
    "/wallet/:path*",
    "/cards/:path*",
    "/transactions/:path*",
    "/fees/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/dashboard/:path*",
    "/api/cards/:path*",
    "/api/fees/:path*",
  ],
};

