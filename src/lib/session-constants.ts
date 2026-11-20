/**
 * Session cookie contract, shared by the proxy (edge of the app), route
 * handlers and server components. No server-only imports here on purpose:
 * `proxy.ts` needs these values too.
 */
export const ACCESS_COOKIE = "pw_access";
export const REFRESH_COOKIE = "pw_refresh";

/** Mirrors the lifetimes the backend signs the JWTs with (15m / 7d). */
export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function sessionCookieOptions(maxAge: number) {
  return {
    // Never readable from JavaScript: an XSS bug cannot exfiltrate the tokens.
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Routes that need a signed-in user. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/wallet",
  "/cards",
  "/transactions",
  "/integrations",
  "/settings",
  "/admin",
] as const;

/** Pages for visitors; a signed-in user is sent to the dashboard instead. */
export const GUEST_ONLY_PAGES = ["/login", "/create"] as const;

/** Only same-site paths are valid redirect targets (blocks open redirects). */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}

