import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AdminTransactionsView } from "@/components/admin/admin-transactions-view";

export const metadata: Metadata = {
  title: "Admin · Transações & MED — pagwave",
};

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · Transações & MED"
        description="Auditoria global de recebimentos, saques, conversões e disputas MED de todas as contas."
      />
      <AdminTransactionsView />
    </div>
  );
}

