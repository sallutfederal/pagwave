import { getDashboardSummary } from "@/server/dashboard-data";

/**
 * GET /api/dashboard/summary
 * Greeting + account button + bank cards + quick actions.
 */
export async function GET() {
  const summary = await getDashboardSummary();

  return Response.json(summary, {
    headers: { "cache-control": "public, max-age=0, must-revalidate" },
  });
}