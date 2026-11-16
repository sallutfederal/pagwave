import { z } from 'zod';

import { BackendError, backendFetch } from '@/lib/backend';

const bodySchema = z.object({ token: z.string().min(1).max(256) });

/** POST /api/auth/verify-email */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'This link is incomplete.' },
      { status: 400 }
    );
  }

  try {
    await backendFetch('/auth/verify-email', { method: 'POST', body: parsed.data, auth: false });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.code, message: error.message }, { status: error.status });
    }

    throw error;
  }
}
