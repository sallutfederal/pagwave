import { getStatistic, parsePeriod } from "@/server/dashboard-data";

/**
 * GET /api/dashboard/statistic?period=this-month
 *
 * `period` is validated with zod and falls back to `this-month`, so the client
 * can never break the chart with a bad query string.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));

  const statistic = await getStatistic(period);

  return Response.json(statistic);
}