import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AdminOverviewView } from "@/components/admin/admin-overview-view";

export const metadata: Metadata = {
  title: "Admin · Visão Geral — pagwave",
};

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · Visão Geral"
        description="Liquidez consolidada da conta mestre XPag, métricas globais de usuários, chaves e disputas MED."
      />
      <AdminOverviewView />
    </div>
  );
}

