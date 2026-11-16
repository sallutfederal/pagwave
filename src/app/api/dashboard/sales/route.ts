import { getRecentSales } from "@/server/dashboard-data";
import { privateJson } from "@/server/api";

/**
 * GET /api/dashboard/sales
 * Rows of the "Recent Sales" table.
 */
export function GET() {
  return privateJson(() => getRecentSales());
}
