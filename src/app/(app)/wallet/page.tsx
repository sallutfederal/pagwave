import type { Metadata } from "next";
import { Suspense } from "react";

import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Carteira — pagwave",
};

export default function WalletPage() {
  return (
    <div className="space-y-7">
      <LocalizedPageHeader section="wallet" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-white/[0.03]" />}>
        <WalletView />
      </Suspense>
    </div>
  );
}
