import { backendFetch } from '@/lib/backend';
import { clearSessionCookies, getRefreshToken } from '@/lib/session';

/** POST /api/auth/logout — revokes the session on the API and drops the cookies. */
export async function POST() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await backendFetch('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false });
    } catch {
      // The cookies are cleared either way; an unreachable API must not trap the user signed in.
    }
  }

  await clearSessionCookies();

  return Response.json({ ok: true });
}
