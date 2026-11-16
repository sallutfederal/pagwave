'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { SessionUser } from '@/lib/session-user';

const SessionContext = createContext<SessionUser | null>(null);

/**
 * Hands the signed-in user (already resolved on the server) to client
 * components. It carries no tokens: those stay in httpOnly cookies.
 */
export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionContext value={user}>{children}</SessionContext>;
}

export function useSession(): SessionUser {
  const user = useContext(SessionContext);

  if (!user)
    throw new Error('useSession must be used inside <SessionProvider> (the signed-in app shell).');

  return user;
}
