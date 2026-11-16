import { z } from 'zod';

import { BackendError, backendFetch } from '@/lib/backend';

const bodySchema = z.object({
  token: z.string().min(1).max(256),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

/** POST /api/auth/reset-password */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'Choose a stronger password.' },
      { status: 400 }
    );
  }

  try {
    await backendFetch('/auth/reset-password', { method: 'POST', body: parsed.data, auth: false });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.code, message: error.message }, { status: error.status });
    }

    throw error;
  }
}
