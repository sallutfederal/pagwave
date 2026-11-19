import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";

export const metadata: Metadata = {
  title: "Admin · Configurações & Moedas — pagwave",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="adminSettings" />
      <AdminSettingsView />
    </div>
  );
}
