import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AdminIntegrationsView } from "@/components/admin/admin-integrations-view";

export const metadata: Metadata = {
  title: "Admin · API Keys & Webhooks — pagwave",
};

export default function AdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · API Keys & Webhooks"
        description="Supervisão global das credenciais de API dos clientes, revogação emergencial, tráfego /api/v1/* e webhooks."
      />
      <AdminIntegrationsView />
    </div>
  );
}

