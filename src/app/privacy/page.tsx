import type { Metadata } from "next";

import { LegalPageShell, type LegalSection } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Política de Privacidade — pagwave",
  description: "Como a pagwave coleta, protege e trata dados pessoais e documentos de KYC.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "data-collected",
    title: "1. Dados Coletados",
    paragraphs: [
      "Coletamos informações cadastrais e empresariais (nome, e-mail, telefone, país, razão social e identificação fiscal), dados de transações e logs de segurança (IP, agente de usuário e histórico de sessões).",
      "Para cumprimento regulatório de KYC/AML, também coletamos documentos de identificação e comprovantes enviados pelo titular na área de Configurações.",
    ],
  },
  {
    id: "purpose",
    title: "2. Finalidade do Tratamento",
    paragraphs: [
      "Os dados são tratados para execução dos serviços contratados, autenticação segura (JWT e 2FA), prevenção a fraudes, auditoria financeira e cumprimento de obrigações legais e regulatórias (LGPD — Lei nº 13.709/2018).",
    ],
  },
  {
    id: "protection",
    title: "3. Armazenamento e Proteção",
    paragraphs: [
      "Credenciais sensíveis e segredos de integração são protegidos por hashing ou criptografia autenticada, e os arquivos de KYC são armazenados em acesso restrito visível apenas ao próprio titular e à equipe de compliance autorizada.",
      "Adotamos cookies HttpOnly para sessões web, controle de taxa de requisições e registros de auditoria para operações administrativas e financeiras.",
    ],
  },
  {
    id: "sharing",
    title: "4. Compartilhamento com Parceiros",
    paragraphs: [
      "Dados estritamente necessários podem ser transmitidos a provedores de liquidação bancária, infraestrutura de nuvem e verificação de identidade exclusivamente para viabilizar transações e cumprir exigências legais.",
    ],
  },
  {
    id: "rights",
    title: "5. Direitos do Titular e Retenção",
    paragraphs: [
      "Você pode consultar, atualizar ou solicitar esclarecimentos sobre seus dados pessoais através da área de Configurações e do canal de Suporte dentro do painel. Registros financeiros e de compliance permanecem retidos pelo prazo legal exigido pela legislação aplicável.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      badge="Privacidade & LGPD · pagwave"
      title="Política de Privacidade"
      updatedAt="Novembro de 2026"
      summary="Esta Política descreve como a pagwave coleta, armazena, protege e utiliza informações pessoais e operacionais na plataforma."
      sections={SECTIONS}
      otherHref="/terms"
      otherLabel="Termos de Serviço"
    />
  );
}

