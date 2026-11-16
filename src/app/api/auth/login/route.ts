import { z } from 'zod';

import { BackendError, backendFetch } from '@/lib/backend';
import { setSessionCookies } from '@/lib/session';

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
  twoFactorCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
});

type LoginResponse =
  | { requiresTwoFactor: true }
  | {
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    };

/** POST /api/auth/login — exchanges credentials for httpOnly session cookies. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'Enter a valid e-mail and password.' },
      { status: 400 }
    );
  }

  try {
    const result = await backendFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: parsed.data,
      auth: false,
    });

    if ('requiresTwoFactor' in result) {
      return Response.json({ requiresTwoFactor: true });
    }

    await setSessionCookies(result.accessToken, result.refreshToken);

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.code, message: error.message }, { status: error.status });
    }

    throw error;
  }
}
