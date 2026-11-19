import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cartões — pagwave",
};

export default function CardsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Cartões"
        description="Módulo temporariamente desativado enquanto finalizamos a integração com o emissor oficial."
      />

      <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="bg-accent-soft text-accent grid size-12 place-items-center rounded-2xl">
          <CreditCard className="size-6" />
        </span>
        <div className="max-w-md space-y-1.5">
          <h2 className="text-foreground text-base font-semibold">Cartões em breve</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Para evitar confusão com cartões simulados, este módulo foi ocultado temporariamente até a integração real com a emissora parceira. Use sua carteira para depósitos, saques, transferências P2P e conversões.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Link href="/wallet" className={buttonVariants({ size: "sm" })}>
            Ir para Carteira
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "sm", variant: "outline" })}>
            Voltar ao Painel
          </Link>
        </div>
      </Card>
    </div>
  );
}
