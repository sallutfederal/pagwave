import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { AdminTransactionsView } from "@/components/admin/admin-transactions-view";

export const metadata: Metadata = {
  title: "Admin · Transações & MED — pagwave",
};

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="adminTransactions" />
      <AdminTransactionsView />
    </div>
  );
}
