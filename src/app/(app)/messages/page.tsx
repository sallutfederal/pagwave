import type { Metadata } from "next";

import { MessagesView } from "@/components/messages/messages-view";
import { getCurrentUser } from "@/server/auth";
import { getConversations } from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Suporte & Mensagens — pagwave",
};

export default async function MessagesPage() {
  const user = await getCurrentUser();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const { conversations } = await getConversations(isAdmin ? "admin" : "user");

  return <MessagesView initialConversations={conversations} isAdmin={isAdmin} />;
}
