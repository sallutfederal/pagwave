import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { AdminOverviewView } from "@/components/admin/admin-overview-view";

export const metadata: Metadata = {
  title: "Admin · Visão Geral — pagwave",
};

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="adminOverview" />
      <AdminOverviewView />
    </div>
  );
}
