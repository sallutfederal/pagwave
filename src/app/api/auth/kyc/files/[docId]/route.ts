import { getBackendBaseUrl } from "@/lib/backend";
import { getAccessToken } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ docId: string }> },
) {
  const token = await getAccessToken();
  if (!token) {
    return Response.json({ error: "UNAUTHORIZED", message: "Não autenticado." }, { status: 401 });
  }

  const { docId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(docId)) {
    return Response.json({ error: "BAD_REQUEST", message: "ID de documento inválido." }, { status: 400 });
  }

  const targetUrl = new URL(`auth/kyc/${docId}/file`, `${getBackendBaseUrl()}/`).toString();

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "BACKEND_UNREACHABLE", message: "Serviço indisponível." }, { status: 503 });
  }

  if (!upstream.ok) {
    const payload = await upstream.json().catch(() => ({ error: "NOT_FOUND" }));
    return Response.json(payload, { status: upstream.status });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? "inline",
      "Cache-Control": "private, no-store",
    },
  });
}

