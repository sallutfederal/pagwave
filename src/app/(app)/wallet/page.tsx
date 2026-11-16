import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Wallet — pagwave",
};

export default function WalletPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Wallet"
        description="Carteira multi-moeda e cripto integrada à XPag: gerencie chaves de saque em 8 países, endereços USDT/USDC, cobranças e conversões."
      />
      <WalletView />
    </div>
  );
}

