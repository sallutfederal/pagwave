import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { AdminFeesView } from "@/components/admin/admin-fees-view";
import { requireAdminUser } from "@/server/admin-auth";

export const metadata: Metadata = {
  title: "Admin · Taxas & Saques — pagwave",
};

export default async function AdminFeesPage() {
  await requireAdminUser();
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="adminFees" />
      <AdminFeesView />
    </div>
  );
}
