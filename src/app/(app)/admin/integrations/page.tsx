import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { AdminIntegrationsView } from "@/components/admin/admin-integrations-view";

export const metadata: Metadata = {
  title: "Admin · API Keys & Webhooks — pagwave",
};

export default function AdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="adminIntegrations" />
      <AdminIntegrationsView />
    </div>
  );
}
