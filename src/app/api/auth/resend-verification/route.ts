import { BackendError, backendFetch } from '@/lib/backend';

/** POST /api/auth/resend-verification — sends a fresh confirmation link to the signed-in user. */
export async function POST() {
  try {
    await backendFetch('/auth/resend-verification', { method: 'POST' });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.code, message: error.message }, { status: error.status });
    }

    throw error;
  }
}
