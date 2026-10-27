import { getTransactions } from "@/server/dashboard-data";

/**
 * GET /api/dashboard/transactions?limit=5
 *
 * `limit` is optional and clamped, so the dashboard column can ask for the five
 * most recent rows while the Transactions page asks for the full history.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 100) : undefined;

  const { transactions } = await getTransactions(limit);

  return Response.json({ transactions });
}