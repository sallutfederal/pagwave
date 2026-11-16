import { z } from 'zod';

import { BackendError, backendFetch } from '@/lib/backend';
import { setSessionCookies } from '@/lib/session';

/** Same rules as the backend, so the user hears about problems before a round trip. */
const bodySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  accountType: z.enum(['PERSONAL', 'BUSINESS']).default('PERSONAL'),
  companyName: z.string().trim().max(255).optional(),
});

type LoginResponse = { accessToken: string; refreshToken: string };

/** POST /api/auth/register — creates the account and signs the user straight in. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'Check the highlighted fields.' },
      { status: 400 }
    );
  }

  try {
    await backendFetch('/auth/register', { method: 'POST', body: parsed.data, auth: false });

    const session = await backendFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email: parsed.data.email, password: parsed.data.password },
      auth: false,
    });

    await setSessionCookies(session.accessToken, session.refreshToken);

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.code, message: error.message }, { status: error.status });
    }

    throw error;
  }
}
