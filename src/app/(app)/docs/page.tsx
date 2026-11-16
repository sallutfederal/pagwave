import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DocsView } from "@/components/docs/docs-view";

export const metadata: Metadata = {
  title: "Docs — pagwave",
};

export default function DocsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Documentação da API"
        description="Guia completo para autenticar suas credenciais, gerar cobranças em 10 moedas/redes, realizar saques e validar webhooks."
      />
      <DocsView />
    </div>
  );
}

