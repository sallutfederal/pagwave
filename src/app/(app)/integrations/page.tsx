import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationsView } from "@/components/integrations/integrations-view";

export const metadata: Metadata = {
  title: "Integrações — pagwave",
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Integrações"
        description="Gerencie suas credenciais únicas de API, configure webhooks assinados e teste o roteamento multi-moeda."
      />
      <IntegrationsView />
    </div>
  );
}

