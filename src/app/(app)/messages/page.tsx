import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { MessagesView } from "@/components/messages/messages-view";
import { Button } from "@/components/ui/button";
import { getConversations } from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Messages — pagwave",
};

export default async function MessagesPage() {
  const { conversations } = await getConversations();

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Support, partners and internal conversations."
        actions={<Button>New message</Button>}
      />

      <MessagesView conversations={conversations} />
    </div>
  );
}