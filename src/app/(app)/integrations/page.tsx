import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { IntegrationsView } from "@/components/integrations/integrations-view";

export const metadata: Metadata = {
  title: "Integrações — pagwave",
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-7">
      <LocalizedPageHeader section="integrations" />
      <IntegrationsView />
    </div>
  );
}
