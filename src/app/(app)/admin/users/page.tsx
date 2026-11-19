import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export const metadata: Metadata = {
  title: "Admin · Usuários & KYC — pagwave",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="adminUsers" />
      <AdminUsersView />
    </div>
  );
}
