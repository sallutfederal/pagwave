import { getCustomers } from "@/server/dashboard-data";

/**
 * GET /api/customers
 * Customer base with plan, status and lifetime value.
 */
export async function GET() {
  const { customers } = await getCustomers();

  return Response.json({ customers });
}