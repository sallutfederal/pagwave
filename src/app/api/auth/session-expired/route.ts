import { NextResponse } from 'next/server';

import { clearSessionCookies } from '@/lib/session';

/**
 * GET /api/auth/session-expired — landing spot when the API rejects the
 * session. Clears the stale cookies (so /login does not bounce back to the
 * dashboard) and sends the user to sign in again.
 */
export async function GET(request: Request) {
  await clearSessionCookies();

  return NextResponse.redirect(new URL('/login', request.url));
}
