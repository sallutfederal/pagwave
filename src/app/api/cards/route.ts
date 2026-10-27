import { getCardSettings } from "@/server/dashboard-data";

/**
 * GET /api/cards
 * Monthly limits, usage and freeze state per card.
 */
export async function GET() {
  const { settings } = await getCardSettings();

  return Response.json({ settings });
}