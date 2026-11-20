import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { FeesView } from "@/components/fees/fees-view";

export const metadata: Metadata = {
  title: "Taxas & Tarifas — pagwave",
};

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <LocalizedPageHeader section="fees" />
      <FeesView />
    </div>
  );
}
