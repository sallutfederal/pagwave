import { z } from 'zod';

import { BackendError, backendFetch } from '@/lib/backend';

const bodySchema = z.object({ email: z.string().trim().email() });

/**
 * POST /api/auth/forgot-password
 * Always answers 200 for a well-formed e-mail, so the form can never be used
 * to find out which addresses have an account.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'Enter a valid e-mail.' },
      { status: 400 }
    );
  }

  try {
    await backendFetch('/auth/forgot-password', { method: 'POST', body: parsed.data, auth: false });
  } catch (error) {
    // Rate limiting is the one failure worth surfacing; everything else looks like success.
    if (error instanceof BackendError && error.status === 429) {
      return Response.json({ error: error.code, message: error.message }, { status: 429 });
    }
  }

  return Response.json({ ok: true });
}
