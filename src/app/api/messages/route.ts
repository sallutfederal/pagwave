import { getConversations } from "@/server/dashboard-data";

/**
 * GET /api/messages
 * Threads shown on the Messages page.
 */
export async function GET() {
  const { conversations } = await getConversations();

  return Response.json({ conversations });
}