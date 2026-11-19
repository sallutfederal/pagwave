import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Carteira — pagwave",
};

export default function WalletPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Carteira"
        description="Carteira multi-moeda e cripto integrada à XPag: gerencie depósitos, saques em 8 países, transferências P2P, endereços USDT/USDC e conversões."
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-white/[0.03]" />}>
        <WalletView />
      </Suspense>
    </div>
  );
}
