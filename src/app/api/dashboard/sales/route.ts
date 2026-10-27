import { getRecentSales } from "@/server/dashboard-data";

/**
 * GET /api/dashboard/sales
 * Rows of the "Recent Sales" table.
 */
export async function GET() {
  const { sales } = await getRecentSales();

  return Response.json({ sales });
}