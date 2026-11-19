/**
 * Conteúdo centralizado da landing page pagwave (PT-BR), inspirado na
 * arquitetura editorial de fintechs globais multi-entidade.
 */

import type { FlagCode } from "@/components/landing/country-flag";

export type TourTabId =
  | "recebimentos"
  | "entre-empresas"
  | "pagamentos"
  | "cartoes"
  | "credito";

export interface LandingMarketItem {
  code: FlagCode;
  flag: string;
  country: string;
  currency: string;
  rails: string;
}

export const landingCopy = {
  meta: {
    title: "pagwave — A conta empresarial global para empresas multinacionais",
    description:
      "Contas locais em nome de cada empresa em 6 mercados, liquidação instantânea entre subsidiárias, pagamentos em +140 países e cartões corporativos globais.",
  },

  nav: {
    links: [
      { href: "#plataforma", label: "Plataforma" },
      { href: "#comparativo", label: "Infraestrutura" },
      { href: "#mercados", label: "Mercados" },
      { href: "#cartoes", label: "Cartões" },
      { href: "#seguranca", label: "Segurança" },
    ],
    signIn: { href: "/login", label: "Entrar" },
    cta: { href: "/create", label: "Abrir uma conta" },
    menu: { open: "Abrir menu", close: "Fechar menu" },
  },

  hero: {
    eyebrow: "Infraestrutura financeira global · Contas, Câmbio & Cartões",
    title: "Chega de abrir conta bancária em cada país.",
    lead:
      "Cada empresa que você administra tem contas locais no próprio nome, e o dinheiro circula entre elas em segundos — com liquidação 24/7, redes locais e autocustódia.",
    primaryCta: { href: "/create", label: "Abrir uma conta" },
    secondaryCta: { href: "/dashboard", label: "Explorar o painel" },
    trust: [
      "Conta pronta em 10 minutos",
      "Auditoria SOC 2 Type II",
      "Conformidade PCI DSS",
    ],
    tourTabs: [
      { id: "recebimentos", label: "Recebimentos" },
      { id: "entre-empresas", label: "Entre empresas" },
      { id: "pagamentos", label: "Pagamentos" },
      { id: "cartoes", label: "Cartões" },
      { id: "credito", label: "Linha de crédito" },
    ] as const satisfies readonly { id: TourTabId; label: string }[],
    tourCaptions: {
      recebimentos:
        "A Solano Mexico S.A. de C.V. possui contas em USD, EUR e MXN no próprio nome e acabou de receber USD 86.400,00 via ACH de um cliente em Austin, Texas — sem entidade nos EUA.",
      "entre-empresas":
        "A Solano Group Inc., em Delaware, envia USD 240.000,00 para a Solano Brasil Ltda., em São Paulo, domingo às 02:14 — liquidação instantânea em segundos.",
      pagamentos:
        "A partir de um único saldo de USD 1.684.250,00, você paga fornecedores no México via SPEI, folha em São Paulo via Pix, prestadores em Londres via Faster Payments e aluguel em Berlim via SEPA.",
      cartoes:
        "Ana Ruiz, da equipe de marketing, já utilizou USD 15.500 de um limite mensal de USD 25.000 em um cartão Visa corporativo virtual com regras instantâneas.",
      credito:
        "Saque USD 186.000,00 da sua linha de crédito rotativa para financiar pedidos de estoque com fornecedores globais, mantendo USD 412.500 de 750.000 disponíveis.",
    } satisfies Record<TourTabId, string>,
  },

  backing: {
    label: "Padrão institucional global",
    items: [
      { title: "Auditoria SOC 2 Type II", detail: "Controles contínuos de segurança" },
      { title: "Conformidade PCI DSS", detail: "Proteção de dados de cartão" },
      { title: "+140 países conectados", detail: "Mais de 300 redes locais" },
      { title: "Liquidação 24/7", detail: "Zero janela de corte bancário" },
    ],
  },

  problem: {
    eyebrow: "O problema do sistema bancário local",
    title: "Quatro empresas, quatro bancos, quatro logins.",
    subtitle: "Cada movimentação entre elas vira uma transferência internacional.",
    lead:
      "Os bancos são locais por natureza, então grupos globais acabam com uma conta por país, tokens físicos diferentes, horários de corte e dias de espera para mover o próprio caixa.",
    legacyCaption:
      "Na estrutura tradicional, movimentar capital entre suas empresas nos EUA, Reino Unido, México e Brasil exige câmbio na mesa de tesouraria, tokens separados e data-valor para quarta-feira.",
    pagwaveCaption:
      "Com a pagwave, as mesmas quatro empresas compartilham uma única camada financeira, recebem por redes locais (ACH, Faster Payments, SPEI, Pix) e movem USD entre si domingo às 02:14 em segundos.",
  },

  bento: {
    eyebrow: "Uma plataforma unificada",
    title: "Gerencie todas as suas empresas a partir de uma única conta.",
    lead:
      "Contas locais em nome próprio, transferências entre subsidiárias, pagamentos em lote, cartões corporativos e conciliação contábil com as mesmas permissões.",
  },

  markets: {
    eyebrow: "Cobertura global e redes locais",
    title: "Receba e pague como uma empresa local.",
    lead:
      "Contas em nome da sua empresa em 6 mercados estratégicos e pagamentos locais em mais de 140 países pelas mesmas redes usadas no país de destino.",
    receivingTitle: "Contas em nome da sua empresa",
    receivingSubtitle: "Receba como uma empresa local, pelas redes locais.",
    receiving: [
      { code: "US", flag: "🇺🇸", country: "Estados Unidos", currency: "USD", rails: "ACH, Wire, SWIFT" },
      { code: "EU", flag: "🇪🇺", country: "União Europeia", currency: "EUR", rails: "SEPA, SEPA Instant" },
      { code: "GB", flag: "🇬🇧", country: "Reino Unido", currency: "GBP", rails: "Faster Payments, CHAPS" },
      { code: "MX", flag: "🇲🇽", country: "México", currency: "MXN", rails: "SPEI (CLABE)" },
      { code: "BR", flag: "🇧🇷", country: "Brasil", currency: "BRL", rails: "Pix, TED" },
      { code: "NG", flag: "🇳🇬", country: "Nigéria", currency: "NGN", rails: "NIP · Redes locais" },
    ] satisfies LandingMarketItem[],
    payoutTitle: "Pague fornecedores, funcionários e parceiros na moeda deles.",
    payoutSubtitle: "Pagamentos em mais de 140 países por mais de 300 redes locais.",
    payouts: [
      { code: "IN", flag: "🇮🇳", country: "Índia", currency: "INR", rails: "UPI, IMPS" },
      { code: "CN", flag: "🇨🇳", country: "China", currency: "CNY", rails: "Alipay, WeChat Pay" },
      { code: "AE", flag: "🇦🇪", country: "Emirados Árabes Unidos", currency: "AED", rails: "UAEFTS" },
      { code: "HK", flag: "🇭🇰", country: "Hong Kong", currency: "HKD", rails: "FPS" },
      { code: "SG", flag: "🇸🇬", country: "Singapura", currency: "SGD", rails: "PayNow, FAST" },
      { code: "AU", flag: "🇦🇺", country: "Austrália", currency: "AUD", rails: "NPP, PayID" },
      { code: "JP", flag: "🇯🇵", country: "Japão", currency: "JPY", rails: "Zengin" },
      { code: "CO", flag: "🇨🇴", country: "Colômbia", currency: "COP", rails: "PSE, Transfiya" },
      { code: "CL", flag: "🇨🇱", country: "Chile", currency: "CLP", rails: "TEF" },
      { code: "AR", flag: "🇦🇷", country: "Argentina", currency: "ARS", rails: "Transferencias 3.0" },
      { code: "CA", flag: "🇨🇦", country: "Canadá", currency: "CAD", rails: "Interac e-Transfer, EFT" },
      { code: "CH", flag: "🇨🇭", country: "Suíça", currency: "CHF", rails: "SIC" },
    ] satisfies LandingMarketItem[],
  },

  comparison: {
    eyebrow: "Comparativo operacional",
    title: "Compare sua estrutura atual com a pagwave.",
    lead: "As mesmas empresas, os mesmos países, sem peças soltas nem atrito cambial.",
    rows: [
      {
        topic: "Contas locais",
        legacy: "Uma conta em um banco local por país, aberta uma de cada vez com burocracia presencial.",
        pagwave:
          "Contas no nome de cada empresa nos EUA, UE, Reino Unido, México, Brasil e Nigéria em minutos.",
      },
      {
        topic: "Logins e acessos",
        legacy: "Um login, um token de hardware e um fluxo de aprovação diferente para cada banco.",
        pagwave: "Um só login centralizado, com permissões granulares e contabilidade separada por entidade.",
      },
      {
        topic: "Dinheiro entre empresas",
        legacy: "Transferência internacional com spread cambial, mesa de câmbio e apenas em dias úteis.",
        pagwave: "Liquidado em segundos em USD ou stablecoins, qualquer dia e a qualquer hora (24/7).",
      },
      {
        topic: "Pagamentos globais",
        legacy: "SWIFT caro, tarifas surpresa de bancos intermediários e destinatário esperando dias.",
        pagwave: "Pagamentos locais em mais de 140 países por mais de 300 redes de liquidação imediata.",
      },
      {
        topic: "Stablecoins e caixa",
        legacy: "Indisponível nos bancos tradicionais ou desconectado da tesouraria fiduciária.",
        pagwave: "Saldos em USDC e EURC em autocustódia lado a lado com suas contas em moeda fiduciária.",
      },
    ],
    footnote:
      '"Sua estrutura atual" descreve uma operação típica com múltiplos bancos locais, não um provedor específico.',
  },

  cardsSection: {
    eyebrow: "Cartões corporativos globais",
    title: "Dê um cartão para cada pessoa da sua equipe.",
    lead:
      "Cartões Visa físicos de metal e virtuais instantâneos com limites por pessoa, moeda ou categoria — e aprovação biométrica direta no checkout.",
    cta: { href: "/create", label: "Abrir conta corporativa" },
  },

  scale: {
    eyebrow: "Escale sem multiplicar bancos",
    title: "Comece com dois países.",
    subtitle: "Adicione empresas e mercados sem adicionar bancos.",
    stages: [
      {
        tier: "Startups",
        entities: ["Inc.", "S.A. de C.V."],
        description: "Uma holding nos EUA e o primeiro time operacional ou comercial na América Latina.",
        cta: "Ideal para empresas em expansão inicial",
      },
      {
        tier: "Empresas médias",
        entities: ["Inc.", "S.A. de C.V.", "Ltda.", "Ltd."],
        description: "Múltiplas subsidiárias faturando em moedas locais com uma única equipe financeira.",
        cta: "Tesouraria multi-entidade unificada",
      },
      {
        tier: "Grandes empresas",
        entities: ["Inc.", "Ltd.", "B.V.", "S.A. de C.V.", "Ltda.", "Pvt. Ltd.", "FZ-LLC"],
        description: "Um grupo operando em vários continentes com alçadas, auditoria e livros separados.",
        cta: "Governança global e ERPs integrados",
      },
    ],
  },

  transparency: {
    eyebrow: "Custódia & Conformidade",
    title: "Saiba onde seu dinheiro está.",
    lead: "Em linguagem direta e transparente, antes de movimentar qualquer valor.",
    items: [
      {
        title: "Dólares americanos (USD)",
        badge: "FDIC Pass-Through",
        description:
          "Mantidos em bancos parceiros regulados nos EUA com elegibilidade de seguro FDIC pass-through contra falência da instituição custodiante.",
      },
      {
        title: "Stablecoins (USDC / EURC)",
        badge: "Autocustódia",
        description:
          "Mantidas em carteiras de autocustódia criptográfica sob controle exclusivo da sua empresa, com liquidação instantânea 24/7.",
      },
      {
        title: "Moedas locais",
        badge: "Redes reguladas",
        description:
          "Mantidas em instituições de pagamento e bancos parceiros licenciados nos respectivos mercados locais para liquidação por Pix, SPEI, SEPA e Faster Payments.",
      },
      {
        title: "Segurança corporativa",
        badge: "SOC 2 Type II · PCI DSS",
        description:
          "Infraestrutura auditada de ponta a ponta com autenticação por passkey, segregação por entidade e trilhas imutáveis de auditoria.",
      },
    ],
    disclaimer: "A pagwave é uma plataforma de tecnologia financeira global, não um banco tradicional.",
  },

  cta: {
    eyebrow: "Pronto para operar sem fronteiras",
    title: "Chega de abrir conta bancária em cada país.",
    lead:
      "Abra sua conta empresarial global em 10 minutos ou explore o painel financeiro completo agora mesmo.",
    primary: { href: "/create", label: "Abrir uma conta" },
    secondary: { href: "/dashboard", label: "Acessar painel" },
    badges: ["Auditoria SOC 2 Type II", "Conformidade PCI DSS", "Sem taxas de abertura"],
  },

  footer: {
    tagline:
      "A conta empresarial global para grupos multinacionais. Contas locais, liquidação instantânea, pagamentos em +140 países e cartões corporativos.",
    columns: [
      {
        title: "Produtos",
        links: [
          { href: "/dashboard", label: "Conta Empresarial" },
          { href: "/wallet", label: "Carteira Multi-moeda" },
          { href: "/transactions", label: "Pagamentos Globais" },
          { href: "/docs", label: "API & Webhooks" },
        ],
      },
      {
        title: "Plataforma",
        links: [
          { href: "#plataforma", label: "Multi-entidades" },
          { href: "#comparativo", label: "Comparativo" },
          { href: "#mercados", label: "Mercados e Redes" },
          { href: "#seguranca", label: "Autocustódia & Segurança" },
        ],
      },
      {
        title: "Acesso",
        links: [
          { href: "/create", label: "Abrir uma conta" },
          { href: "/login", label: "Entrar no painel" },
          { href: "/docs", label: "Documentação API" },
          { href: "/settings", label: "Configurações" },
        ],
      },
    ],
    legal:
      "© 2026 pagwave Tecnologia Financeira. Todos os direitos reservados. Auditoria SOC 2 Type II e conformidade PCI DSS.",
  },
} as const;
