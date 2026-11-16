import { privateJson } from "@/server/api";
import { getDashboardSummary } from "@/server/dashboard-data";

/**
 * GET /api/dashboard/summary
 * Greeting + account button + bank cards + quick actions.
 */
export async function GET() {
  return privateJson(() => getDashboardSummary());
}
