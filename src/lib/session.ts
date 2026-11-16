import "server-only";

import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/session-constants";

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();

  store.set(ACCESS_COOKIE, accessToken, sessionCookieOptions(ACCESS_MAX_AGE));
  store.set(REFRESH_COOKIE, refreshToken, sessionCookieOptions(REFRESH_MAX_AGE));
}

export async function clearSessionCookies() {
  const store = await cookies();

  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

