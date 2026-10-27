import { getProducts } from "@/server/dashboard-data";

/**
 * GET /api/products
 * Subscriptions and products owned by the account.
 */
export async function GET() {
  const { products } = await getProducts();

  return Response.json({ products });
}