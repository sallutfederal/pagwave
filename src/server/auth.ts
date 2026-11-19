import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { BackendError, backendFetch } from "@/lib/backend";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n/types";
import type { SessionUser } from "@/lib/session-user";

type MeResponse = {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  locale?: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName: string | null;
    kycStatus: string;
    kycLevel: number;
  } | null;
};

/** Where an invalid/expired session ends up: cookies are cleared, then /login. */
export const SESSION_EXPIRED_PATH = "/api/auth/session-expired";

/**
 * The signed-in user, or a redirect to /login.
 *
 * Deduplicated per request with `cache`, so layouts and pages can both call it
 * without hitting the API twice. Deliberately NOT behind `"use cache"`: it reads
 * the session cookie, and cached output would be shared between users.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  try {
    const me = await backendFetch<MeResponse>("/auth/me");
    const first = me.profile?.firstName ?? "";
    const last = me.profile?.lastName ?? "";
    const name = me.profile?.displayName || `${first} ${last}`.trim() || me.email;

    let cookieLocale: string | undefined;
    try {
      const jar = await cookies();
      cookieLocale = jar.get(`pagwave_lang_${me.id}`)?.value;
    } catch {
      cookieLocale = undefined;
    }

    const locale = me.locale
      ? normalizeLocale(me.locale)
      : cookieLocale
        ? normalizeLocale(cookieLocale)
        : DEFAULT_LOCALE;

    return {
      id: me.id,
      email: me.email,
      name,
      initials: initialsOf(name),
      role: me.role,
      emailVerified: me.emailVerified,
      twoFactorEnabled: me.twoFactorEnabled,
      kycStatus: me.profile?.kycStatus ?? "NOT_STARTED",
      kycLevel: me.profile?.kycLevel ?? 0,
      locale,
    };
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      redirect(SESSION_EXPIRED_PATH);
    }

    throw error;
  }
});

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0] ?? "?").slice(0, 2);

  return letters.toUpperCase();
}
