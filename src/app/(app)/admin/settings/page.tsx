import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";

export const metadata: Metadata = {
  title: "Admin · Configurações & Moedas — pagwave",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · Configurações & Moedas"
        description="Gerencie taxas operacionais, modo de ambiente, kill switch por moeda/rede e parâmetros XPag."
      />
      <AdminSettingsView />
    </div>
  );
}

