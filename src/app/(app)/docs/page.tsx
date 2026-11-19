import type { Metadata } from "next";
import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { DocsView } from "@/components/docs/docs-view";

export const metadata: Metadata = {
  title: "Docs — pagwave",
};

export default function DocsPage() {
  return (
    <div className="space-y-7">
      <LocalizedPageHeader section="docs" />
      <DocsView />
    </div>
  );
}
