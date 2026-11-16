import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export const metadata: Metadata = {
  title: "Admin · Usuários & KYC — pagwave",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · Usuários & KYC"
        description="Gerencie aprovações de KYC, níveis de conta, uso de chaves API e suspensão operacional de usuários."
      />
      <AdminUsersView />
    </div>
  );
}

