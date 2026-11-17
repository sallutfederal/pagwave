import type { Metadata } from "next";

import { LegalPageShell, type LegalSection } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Termos de Serviço — pagwave",
  description: "Condições gerais de uso da infraestrutura financeira e gateway pagwave.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "eligibility",
    title: "1. Elegibilidade e Cadastro",
    paragraphs: [
      "Ao criar uma conta na pagwave, você declara possuir capacidade civil plena ou representar legitimamente pessoa jurídica regularmente constituída, comprometendo-se a fornecer dados cadastrais verdadeiros e atualizados.",
      "A liberação de limites operacionais, saques e liquidações internacionais está condicionada à conclusão satisfatória das etapas de verificação de identidade (KYC) e prevenção à lavagem de dinheiro (AML/PLD).",
    ],
  },
  {
    id: "services",
    title: "2. Serviços, Carteiras e Gateway de Pagamentos",
    paragraphs: [
      "A pagwave disponibiliza infraestrutura para recebimentos locais (como Pix, SPEI e PSE), conversão entre moedas fiduciárias e ativos digitais suportados, além de chaves de API e webhooks para integração com sistemas do cliente.",
      "Depósitos, liquidações e repasses somente são creditados em saldo disponível após confirmação definitiva pelos trilhos bancários ou parceiros liquidantes aplicáveis.",
    ],
  },
  {
    id: "limits",
    title: "3. Tarifas, Limites e Conformidade",
    paragraphs: [
      "As tarifas por transação, spread cambial e limites por operação, diários e mensais aplicáveis à sua conta são apresentados no painel administrativo e variam conforme o nível de verificação KYC e moeda movimentada.",
      "Transações atípicas, contestações (MED/chargebacks) ou inconsistências documentais podem resultar em retenção cautelar temporária de valores até a conclusão da análise de risco e compliance.",
    ],
  },
  {
    id: "security",
    title: "4. Segurança da Conta e Chaves de API",
    paragraphs: [
      "O usuário é responsável pela guarda de suas credenciais de acesso, tokens de autenticação em dois fatores (2FA) e segredos de API (X-Client-Secret e segredos de webhook).",
      "Em caso de suspeita de comprometimento, o titular deve revogar imediatamente as chaves no painel de Integrações e encerrar as sessões ativas em Configurações.",
    ],
  },
  {
    id: "termination",
    title: "5. Suspensão, Encerramento e Contato",
    paragraphs: [
      "A pagwave pode suspender preventivamente contas que violem estes Termos, políticas de uso aceitável ou obrigações regulatórias aplicáveis.",
      "Dúvidas operacionais ou solicitações relacionadas a estes Termos podem ser registradas diretamente pelo canal de Suporte dentro da plataforma autenticada.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      badge="Documento Legal · pagwave"
      title="Termos de Serviço"
      updatedAt="Novembro de 2026"
      summary="Estes Termos regulam o acesso e a utilização da plataforma web, carteiras multi-moeda e APIs da pagwave Tecnologia Financeira."
      sections={SECTIONS}
      otherHref="/privacy"
      otherLabel="Política de Privacidade"
    />
  );
}

