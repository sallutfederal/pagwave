import type { FlagCode } from "@/components/landing/country-flag";

export const XPAG_CURRENCIES = [
  "BRL",
  "MXN",
  "COP",
  "ARS",
  "BOB",
  "CLP",
  "USD",
  "VES",
  "USDT",
  "USDC",
] as const;

export type XPagCurrency = (typeof XPAG_CURRENCIES)[number];

export type FieldOption = {
  value: string;
  label: string;
};

export type DynamicFieldSpec = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "select";
  required?: boolean;
  /** Only render/require when method equals one of these values. */
  whenMethod?: string[];
  options?: FieldOption[];
  hint?: string;
};

export type CashoutRailMeta = {
  id: string;
  label: string;
  /** Exact `method` value sent to XPag when required. */
  apiMethod?: string;
  description: string;
};

export type CashinMethodMeta = {
  id: string;
  label: string;
  description: string;
  supportsOpenValue?: boolean;
  minAmount?: number;
  maxAmount?: number;
};

export type CurrencySpec = {
  code: XPagCurrency;
  symbol: string;
  name: string;
  countryName: string;
  flag: FlagCode | null;
  kind: "fiat" | "crypto";
  railSummary: string;
  cryptoNetwork?: "TRON" | "SOLANA";
  cryptoBadge?: string;
  integerOnly?: boolean;
  convertible: boolean;
  minConvertFrom?: number;
  cashoutRails: CashoutRailMeta[];
  cashoutFields: DynamicFieldSpec[];
  cashinMethods: CashinMethodMeta[];
  cashinPayerFields: DynamicFieldSpec[];
  supportsOpenValueCashin: boolean;
};

const DOC_TYPES_AR: FieldOption[] = [{ value: "CUIT", label: "CUIT" }];
const DOC_TYPES_COP: FieldOption[] = [
  { value: "CC", label: "Cédula (CC)" },
  { value: "CE", label: "Cédula Extranjería (CE)" },
  { value: "NIT", label: "NIT" },
  { value: "PAS", label: "Passaporte" },
];
const DOC_TYPES_BOB: FieldOption[] = [
  { value: "CI", label: "CI" },
  { value: "NIT", label: "NIT" },
  { value: "PAS", label: "Passaporte" },
];
const DOC_TYPES_CLP: FieldOption[] = [
  { value: "RUT", label: "RUT" },
  { value: "CE", label: "CE" },
  { value: "PASSPORT", label: "Passaporte" },
];
const DOC_TYPES_EC: FieldOption[] = [
  { value: "CI", label: "CI" },
  { value: "RUC", label: "RUC" },
  { value: "PAS", label: "Passaporte" },
];
const DOC_TYPES_VE: FieldOption[] = [
  { value: "CI", label: "CI (V-/E-)" },
  { value: "RIF", label: "RIF (J-)" },
];

export const CURRENCY_SPECS: Record<XPagCurrency, CurrencySpec> = {
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Real Brasileiro",
    countryName: "Brasil",
    flag: "BR",
    kind: "fiat",
    railSummary: "Pix · BR Code",
    convertible: true,
    cashoutRails: [
      {
        id: "PIX",
        label: "Chave Pix",
        description: "Envie via CPF, CNPJ, e-mail, telefone ou chave aleatória (EVP).",
      },
      {
        id: "BRCODE",
        label: "Pix Copia e Cola",
        description: "Pague um QR Code estático ou dinâmico colando a string EMV.",
      },
    ],
    cashoutFields: [
      {
        key: "pix_type",
        label: "Tipo de chave",
        placeholder: "Selecione",
        type: "select",
        required: true,
        whenMethod: ["PIX"],
        options: [
          { value: "CPF", label: "CPF" },
          { value: "CNPJ", label: "CNPJ" },
          { value: "EMAIL", label: "E-mail" },
          { value: "PHONE", label: "Telefone (+55)" },
          { value: "EVP", label: "Chave aleatória (EVP)" },
        ],
      },
      {
        key: "pix_key",
        label: "Chave Pix",
        placeholder: "Ex.: 52998224725 ou email@empresa.com",
        required: true,
        whenMethod: ["PIX"],
        hint: "CPF/CNPJ apenas dígitos; telefone com DDI+DDD (ex.: +5511999998888).",
      },
      {
        key: "pix_copia_cola",
        label: "Código Pix Copia e Cola",
        placeholder: "00020126580014br.gov.bcb.pix...",
        required: true,
        whenMethod: ["BRCODE"],
      },
      {
        key: "name",
        label: "Nome do favorecido",
        placeholder: "Nome completo ou razão social",
        required: true,
        whenMethod: ["PIX"],
      },
      {
        key: "document",
        label: "CPF / CNPJ do favorecido",
        placeholder: "Somente números",
        required: true,
        whenMethod: ["PIX"],
      },
    ],
    cashinMethods: [
      {
        id: "PIX",
        label: "Pix QR / Copia e Cola",
        description: "Liquidação instantânea 24/7; aceita valor fixo ou valor aberto.",
        supportsOpenValue: true,
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Opcional em BRL" },
      { key: "document", label: "CPF/CNPJ do pagador", placeholder: "Opcional (11 ou 14 dígitos)" },
    ],
    supportsOpenValueCashin: true,
  },

  MXN: {
    code: "MXN",
    symbol: "$",
    name: "Peso Mexicano",
    countryName: "México",
    flag: "MX",
    kind: "fiat",
    railSummary: "SPEI · OXXO",
    convertible: true,
    cashoutRails: [
      {
        id: "SPEI",
        apiMethod: "SPEI",
        label: "SPEI (CLABE 18 dígitos)",
        description: "Transferência interbancária mexicana para qualquer conta CLABE.",
      },
    ],
    cashoutFields: [
      {
        key: "clabe",
        label: "CLABE",
        placeholder: "18 dígitos numéricos",
        required: true,
        hint: "Exatamente 18 dígitos numéricos.",
      },
      {
        key: "name",
        label: "Nome do titular",
        placeholder: "Nome completo",
        required: true,
      },
      {
        key: "document",
        label: "CURP ou RFC",
        placeholder: "Identificação fiscal do titular",
        required: true,
      },
    ],
    cashinMethods: [
      {
        id: "SPEI",
        label: "SPEI (CLABE)",
        description: "Receba via transferência SPEI; suporta valor fixo (24h) ou aberto.",
        supportsOpenValue: true,
      },
      {
        id: "OXXO",
        label: "OXXO Pay (Voucher)",
        description: "Pagamento em dinheiro nas lojas OXXO (10 a 10.000 MXN; até 12 dias).",
        supportsOpenValue: false,
        minAmount: 10,
        maxAmount: 10000,
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Nome completo" },
      { key: "email", label: "E-mail (recomendado OXXO)", placeholder: "pagador@empresa.com", type: "email" },
      { key: "document", label: "CURP / RFC", placeholder: "Opcional" },
    ],
    supportsOpenValueCashin: true,
  },

  COP: {
    code: "COP",
    symbol: "COP$",
    name: "Peso Colombiano",
    countryName: "Colômbia",
    flag: "CO",
    kind: "fiat",
    railSummary: "Bre-B · Nequi",
    convertible: true,
    minConvertFrom: 50000,
    cashoutRails: [
      {
        id: "BREB",
        apiMethod: "BREB",
        label: "Bre-B (Chave instantânea)",
        description: "Único trilho ativo de saque em COP; transferência bancária está desativada.",
      },
    ],
    cashoutFields: [
      {
        key: "key_type",
        label: "Tipo de chave Bre-B",
        placeholder: "Selecione",
        type: "select",
        required: true,
        options: [
          { value: "PHONE", label: "Celular (3XXXXXXXXX)" },
          { value: "EMAIL", label: "E-mail" },
          { value: "CC", label: "Cédula (CC)" },
        ],
      },
      {
        key: "key",
        label: "Chave Bre-B",
        placeholder: "Ex.: 3001234567 ou usuario@dominio.co",
        required: true,
      },
      {
        key: "name",
        label: "Nome do beneficiário",
        placeholder: "Nome completo",
        required: true,
      },
      {
        key: "document_type",
        label: "Tipo de documento",
        placeholder: "Selecione",
        type: "select",
        required: true,
        options: DOC_TYPES_COP,
      },
      {
        key: "document",
        label: "Documento",
        placeholder: "Número do documento",
        required: true,
      },
    ],
    cashinMethods: [
      {
        id: "NEQUI_QR",
        label: "Nequi QR / Link",
        description: "Expira em 45 minutos; informe celular (10 dígitos com inicial 3) se desejar push.",
      },
      {
        id: "BREB",
        label: "Bre-B QR",
        description: "Chave instantânea colombiana (expira em 15 minutos).",
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Opcional" },
      { key: "phone", label: "Celular Nequi (opcional)", placeholder: "3XXXXXXXXX (10 dígitos)" },
    ],
    supportsOpenValueCashin: false,
  },

  ARS: {
    code: "ARS",
    symbol: "ARS$",
    name: "Peso Argentino",
    countryName: "Argentina",
    flag: "AR",
    kind: "fiat",
    railSummary: "CVU · CBU",
    convertible: true,
    cashoutRails: [
      {
        id: "BANK_TRANSFER",
        apiMethod: "BANK_TRANSFER",
        label: "Transferência CVU / CBU",
        description: "Envio imediato para CVU/CBU de 22 dígitos.",
      },
    ],
    cashoutFields: [
      {
        key: "account_number",
        label: "CVU / CBU",
        placeholder: "22 dígitos numéricos",
        required: true,
      },
      {
        key: "name",
        label: "Nome do titular",
        placeholder: "Obrigatório para ARS",
        required: true,
      },
      {
        key: "document_type",
        label: "Tipo de documento",
        placeholder: "CUIT",
        type: "select",
        options: DOC_TYPES_AR,
      },
      {
        key: "document",
        label: "CUIT (opcional)",
        placeholder: "11 dígitos",
      },
      {
        key: "bank_code",
        label: "Código do banco (opcional)",
        placeholder: "Ex.: 007",
      },
    ],
    cashinMethods: [
      {
        id: "BANK_TRANSFER",
        label: "Transferência CVU",
        description: "Gera CVU temporário (~2s para emissão). Nome do pagador obrigatório.",
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Obrigatório em ARS", required: true },
      { key: "document", label: "CUIT (opcional)", placeholder: "11 dígitos" },
    ],
    supportsOpenValueCashin: false,
  },

  BOB: {
    code: "BOB",
    symbol: "Bs",
    name: "Boliviano",
    countryName: "Bolívia",
    flag: "BO",
    kind: "fiat",
    railSummary: "QR Simple · Banco",
    convertible: true,
    cashoutRails: [
      {
        id: "BANK_TRANSFER",
        apiMethod: "BANK_TRANSFER",
        label: "Transferência Bancária (BO)",
        description: "Exige código de banco (ex.: BO.BNB), tipo de conta e contatos completos.",
      },
    ],
    cashoutFields: [
      {
        key: "bank_code",
        label: "Código do banco",
        placeholder: "Ex.: BO.BNB",
        required: true,
      },
      {
        key: "account_type",
        label: "Tipo de conta",
        placeholder: "Selecione",
        type: "select",
        required: true,
        options: [
          { value: "CACC", label: "Conta Corrente (CACC)" },
          { value: "SVGS", label: "Poupança (SVGS)" },
        ],
      },
      {
        key: "account_number",
        label: "Número da conta",
        placeholder: "Conta bancária",
        required: true,
      },
      {
        key: "name",
        label: "Nome do titular",
        placeholder: "Nome completo",
        required: true,
      },
      {
        key: "document_type",
        label: "Tipo de documento",
        placeholder: "Selecione",
        type: "select",
        required: true,
        options: DOC_TYPES_BOB,
      },
      {
        key: "document",
        label: "Documento",
        placeholder: "Número do documento",
        required: true,
      },
      {
        key: "phone",
        label: "Telefone",
        placeholder: "+59170000000",
        required: true,
      },
      {
        key: "email",
        label: "E-mail",
        placeholder: "titular@empresa.bo",
        type: "email",
        required: true,
      },
    ],
    cashinMethods: [
      {
        id: "QR",
        label: "QR Simple Bolívia",
        description: "QR bancário boliviano. Exige nome, telefone, e-mail e documento.",
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Obrigatório", required: true },
      { key: "phone", label: "Telefone", placeholder: "+59170000000", required: true },
      { key: "email", label: "E-mail", placeholder: "pagador@empresa.bo", type: "email", required: true },
      { key: "document_type", label: "Tipo doc", placeholder: "CI", type: "select", required: true, options: DOC_TYPES_BOB },
      { key: "document", label: "Documento", placeholder: "CI / NIT", required: true },
    ],
    supportsOpenValueCashin: false,
  },

  CLP: {
    code: "CLP",
    symbol: "CLP$",
    name: "Peso Chileno",
    countryName: "Chile",
    flag: "CL",
    kind: "fiat",
    railSummary: "Banco · RUT",
    integerOnly: true,
    convertible: true,
    cashoutRails: [
      {
        id: "BANK_TRANSFER",
        apiMethod: "BANK_TRANSFER",
        label: "Transferência Bancária (CL)",
        description: "Valor obrigatoriamente inteiro; RUT validado por dígito verificador.",
      },
    ],
    cashoutFields: [
      {
        key: "bank_code",
        label: "Código do banco (3 dígitos)",
        placeholder: "Ex.: 001 (Banco de Chile)",
        required: true,
      },
      {
        key: "account_type",
        label: "Tipo de conta",
        placeholder: "Selecione",
        type: "select",
        required: true,
        options: [
          { value: "CACC", label: "Cuenta Corriente (CACC)" },
          { value: "VISTA", label: "Cuenta Vista / RUT (VISTA)" },
          { value: "SVGS", label: "Ahorro (SVGS)" },
          { value: "RUT", label: "CuentaRUT (RUT)" },
          { value: "SALARY", label: "Salário (SALARY)" },
        ],
      },
      {
        key: "account_number",
        label: "Número da conta",
        placeholder: "Número da conta",
        required: true,
      },
      {
        key: "name",
        label: "Nome do titular",
        placeholder: "Nome completo",
        required: true,
      },
      {
        key: "document_type",
        label: "Tipo de documento",
        placeholder: "RUT",
        type: "select",
        required: true,
        options: DOC_TYPES_CLP,
      },
      {
        key: "document",
        label: "RUT / Documento",
        placeholder: "Ex.: 12345678-5",
        required: true,
      },
      {
        key: "email",
        label: "E-mail",
        placeholder: "titular@empresa.cl",
        type: "email",
        required: true,
      },
    ],
    cashinMethods: [
      {
        id: "BANK_TRANSFER",
        label: "Transferência / Khipu",
        description: "Retorna checkout_url. Valor inteiro em pesos.",
      },
      {
        id: "CARD",
        label: "Cartão (Webpay)",
        description: "Pagamento via cartão local em pesos inteiros.",
      },
      {
        id: "WALLET",
        label: "Carteira digital",
        description: "Checkout local em pesos chilenos.",
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Obrigatório", required: true },
      { key: "email", label: "E-mail", placeholder: "pagador@empresa.cl", type: "email", required: true },
      { key: "document_type", label: "Tipo doc", placeholder: "RUT", type: "select", required: true, options: DOC_TYPES_CLP },
      { key: "document", label: "RUT", placeholder: "12345678-5", required: true },
    ],
    supportsOpenValueCashin: false,
  },

  USD: {
    code: "USD",
    symbol: "US$",
    name: "Dólar Americano (Equador)",
    countryName: "Equador",
    flag: "EC",
    kind: "fiat",
    railSummary: "Banco · Cash (EC)",
    convertible: true,
    cashoutRails: [
      {
        id: "BANK_TRANSFER",
        apiMethod: "BANK_TRANSFER",
        label: "Transferência Bancária (EC)",
        description: "Conta local no Equador (código ex.: EC.PICH).",
      },
    ],
    cashoutFields: [
      {
        key: "bank_code",
        label: "Código do banco",
        placeholder: "Ex.: EC.PICH",
        required: true,
      },
      {
        key: "account_type",
        label: "Tipo de conta",
        placeholder: "Selecione",
        type: "select",
        required: true,
        options: [
          { value: "SVGS", label: "Poupança (SVGS)" },
          { value: "CACC", label: "Conta Corrente (CACC)" },
        ],
      },
      {
        key: "account_number",
        label: "Número da conta",
        placeholder: "Número da conta",
        required: true,
      },
      {
        key: "name",
        label: "Nome do titular",
        placeholder: "Nome completo",
        required: true,
      },
      {
        key: "document_type",
        label: "Tipo de documento",
        placeholder: "CI",
        type: "select",
        required: true,
        options: DOC_TYPES_EC,
      },
      {
        key: "document",
        label: "CI / RUC",
        placeholder: "10 ou 13 dígitos",
        required: true,
      },
      {
        key: "phone",
        label: "Telefone",
        placeholder: "+593990000000",
        required: true,
      },
      {
        key: "email",
        label: "E-mail",
        placeholder: "titular@empresa.ec",
        type: "email",
        required: true,
      },
    ],
    cashinMethods: [
      {
        id: "BANK_TRANSFER",
        label: "Transferência (Equador)",
        description: "Pagamento bancário via checkout_url em USD.",
      },
      {
        id: "CASH",
        label: "Rede física (Cash)",
        description: "Pagamento presencial via código de referência.",
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Obrigatório", required: true },
      { key: "phone", label: "Telefone", placeholder: "+593990000000", required: true },
      { key: "email", label: "E-mail", placeholder: "pagador@empresa.ec", type: "email", required: true },
      { key: "document_type", label: "Tipo doc", placeholder: "CI", type: "select", required: true, options: DOC_TYPES_EC },
      { key: "document", label: "CI / RUC", placeholder: "10 ou 13 dígitos", required: true },
    ],
    supportsOpenValueCashin: false,
  },

  VES: {
    code: "VES",
    symbol: "Bs.D",
    name: "Bolívar Venezuelano",
    countryName: "Venezuela",
    flag: "VE",
    kind: "fiat",
    railSummary: "Pago Móvil · Banco",
    convertible: true,
    cashoutRails: [
      {
        id: "PAGOMOVIL",
        apiMethod: "PAGOMOVIL",
        label: "Pago Móvil",
        description: "Celular de 11 dígitos (04XX...) + código do banco de 4 dígitos.",
      },
      {
        id: "BANK_TRANSFER",
        apiMethod: "BANK_TRANSFER",
        label: "Transferência Bancária (VE)",
        description: "Conta bancária de 20 dígitos + banco de 4 dígitos.",
      },
    ],
    cashoutFields: [
      {
        key: "bank_code",
        label: "Código do banco (4 dígitos)",
        placeholder: "Ex.: 0102 ou 0134",
        required: true,
      },
      {
        key: "phone",
        label: "Celular Pago Móvil",
        placeholder: "11 dígitos (ex.: 04141234567)",
        required: true,
      },
      {
        key: "account_number",
        label: "Conta bancária (20 dígitos)",
        placeholder: "Ex.: 01020123456789012345",
        required: true,
        whenMethod: ["BANK_TRANSFER"],
      },
      {
        key: "name",
        label: "Nome do titular",
        placeholder: "Nome completo",
        required: true,
      },
      {
        key: "document_type",
        label: "Tipo de documento",
        placeholder: "CI",
        type: "select",
        required: true,
        options: DOC_TYPES_VE,
      },
      {
        key: "document",
        label: "CI / RIF",
        placeholder: "Ex.: V-12345678 ou J-123456789",
        required: true,
      },
    ],
    cashinMethods: [
      {
        id: "PAGOMOVIL",
        label: "Pago Móvil",
        description: "Não exige e-mail; exige nome, celular (11 dígitos) e CI/RIF.",
      },
      {
        id: "BANK_TRANSFER",
        label: "Transferência Bancária (VE)",
        description: "Transferência local em Bolívares.",
      },
    ],
    cashinPayerFields: [
      { key: "name", label: "Nome do pagador", placeholder: "Obrigatório", required: true },
      { key: "phone", label: "Celular", placeholder: "04141234567", required: true },
      { key: "document_type", label: "Tipo doc", placeholder: "CI", type: "select", required: true, options: DOC_TYPES_VE },
      { key: "document", label: "CI / RIF", placeholder: "V-12345678", required: true },
    ],
    supportsOpenValueCashin: false,
  },

  USDT: {
    code: "USDT",
    symbol: "USDT",
    name: "Tether USD",
    countryName: "Cripto · TRON",
    flag: null,
    kind: "crypto",
    railSummary: "TRON (TRC20)",
    cryptoNetwork: "TRON",
    cryptoBadge: "TRC20",
    convertible: true,
    cashoutRails: [
      {
        id: "TRON",
        label: "Rede TRON (TRC20)",
        description: "Endereço público TRON iniciado com 'T' (34 caracteres Base58).",
      },
    ],
    cashoutFields: [
      {
        key: "address",
        label: "Endereço TRON (TRC20)",
        placeholder: "T... (34 caracteres Base58)",
        required: true,
        hint: "A rede é fixada em TRON. Endereços Ethereum/BSC (0x...) não são aceitos.",
      },
    ],
    cashinMethods: [
      {
        id: "TRON",
        label: "Depósito On-chain TRON (TRC20)",
        description: "Gera deposit_address + valor exato micro-ajustado para reconciliação.",
      },
    ],
    cashinPayerFields: [],
    supportsOpenValueCashin: false,
  },

  USDC: {
    code: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    countryName: "Cripto · Solana",
    flag: null,
    kind: "crypto",
    railSummary: "Solana (SPL)",
    cryptoNetwork: "SOLANA",
    cryptoBadge: "SPL",
    convertible: false,
    cashoutRails: [
      {
        id: "SOLANA",
        label: "Rede Solana (SPL)",
        description: "Endereço público Solana Base58 válido (32 bytes decodificados).",
      },
    ],
    cashoutFields: [
      {
        key: "address",
        label: "Endereço Solana (SPL)",
        placeholder: "Chave pública Solana Base58 (32–44 chars)",
        required: true,
        hint: "A rede é fixada em SOLANA. Atenção: USDC não participa de conversões internas.",
      },
    ],
    cashinMethods: [
      {
        id: "SOLANA",
        label: "Depósito On-chain Solana (SPL)",
        description: "Gera deposit_address + valor exato micro-ajustado; splits aplicados na entrada.",
      },
    ],
    cashinPayerFields: [],
    supportsOpenValueCashin: false,
  },
};

export const XPAG_ERROR_MESSAGES: Record<string, string> = {
  insufficient_balance: "Saldo disponível insuficiente para cobrir valor e taxa.",
  currency_not_convertible: "A moeda selecionada (como USDC) não suporta conversão interna.",
  amount_below_minimum: "O valor informado está abaixo do mínimo permitido para esta operação.",
  amount_too_small: "O valor líquido após taxas é pequeno demais para concluir a operação.",
  cop_bank_transfer_unsupported: "Em COP, saques funcionam exclusivamente via Bre-B.",
  invalid_pix_key: "Chave Pix inválida ou incompatível com o tipo selecionado.",
  invalid_brcode: "Código Pix Copia e Cola (BR Code) inválido.",
  invalid_clabe: "CLABE inválida: informe exatamente 18 dígitos numéricos.",
  invalid_address: "Endereço cripto inválido para a rede exigida.",
  invalid_network: "Rede blockchain incompatível: USDT usa TRON e USDC usa SOLANA.",
  invalid_document: "Documento do beneficiário/pagador inválido.",
  invalid_rut: "RUT chileno inválido (falha no dígito verificador).",
  invalid_bank_code: "Código bancário ausente ou inválido para o país.",
  invalid_account: "Número de conta inválido para o país selecionado.",
  payer_required: "Este país/trilho exige os dados obrigatórios do pagador.",
  awaiting_instruction: "A instrução bancária ainda está sendo emitida (~2s). Consulte novamente.",
  duplicate_external_id: "Já existe uma operação registrada com este external_id.",
  provider_unavailable: "Provedor temporariamente indisponível. Tente novamente em instantes.",
  rate_limited: "Limite de requisições excedido. Aguarde alguns segundos antes de reenviar.",
  blocked_currency: "Esta moeda está temporariamente bloqueada para operações na conta.",
};

export function translateXPagError(code?: string, fallback?: string): string {
  if (code && XPAG_ERROR_MESSAGES[code]) {
    return XPAG_ERROR_MESSAGES[code];
  }
  return fallback || "Não foi possível processar a requisição junto à XPag.";
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_MAP = new Map<string, number>(
  Array.from(BASE58_ALPHABET).map((ch, idx) => [ch, idx]),
);

function decodeBase58(input: string): Uint8Array | null {
  if (!input) return null;
  const bytes = [0];
  for (const ch of input) {
    const val = BASE58_MAP.get(ch);
    if (val === undefined) return null;
    let carry = val;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of input) {
    if (ch !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

export function isValidSolanaAddress(address: string): boolean {
  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  const decoded = decodeBase58(trimmed);
  return decoded !== null && decoded.length === 32;
}

export function isValidTronAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed.startsWith("T") || trimmed.length !== 34) return false;
  return decodeBase58(trimmed) !== null;
}

export function isValidChileanRut(raw: string): boolean {
  const cleaned = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (cleaned.length < 8) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rem = 11 - (sum % 11);
  const expected = rem === 11 ? "0" : rem === 10 ? "K" : String(rem);
  return dv === expected;
}

export function validateDestinationInput(
  currency: XPagCurrency,
  rail: string,
  details: Record<string, string>,
): string | null {
  const spec = CURRENCY_SPECS[currency];
  if (!spec) return "Moeda não suportada.";

  for (const field of spec.cashoutFields) {
    if (field.whenMethod && !field.whenMethod.includes(rail)) continue;
    const value = (details[field.key] ?? "").trim();
    if (field.required && !value) {
      return `Preencha o campo obrigatório: ${field.label}.`;
    }
  }

  switch (currency) {
    case "BRL": {
      if (rail === "BRCODE") {
        const raw = (details.pix_copia_cola ?? "").trim();
        if (!raw.startsWith("000201")) {
          return "Código Pix Copia e Cola inválido (deve iniciar com 000201).";
        }
        return null;
      }
      const pixType = details.pix_type;
      const key = (details.pix_key ?? "").trim();
      const docDigits = (details.document ?? "").replace(/\D/g, "");
      if (docDigits.length !== 11 && docDigits.length !== 14) {
        return "CPF/CNPJ do favorecido deve ter 11 ou 14 dígitos.";
      }
      if (pixType === "CPF" && key.replace(/\D/g, "").length !== 11) {
        return "Chave CPF deve conter 11 dígitos.";
      }
      if (pixType === "CNPJ" && key.replace(/\D/g, "").length !== 14) {
        return "Chave CNPJ deve conter 14 dígitos.";
      }
      if (pixType === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
        return "Chave Pix de e-mail inválida.";
      }
      if (pixType === "PHONE" && key.replace(/\D/g, "").length < 12) {
        return "Telefone Pix deve incluir DDI + DDD + número (ex.: +5511999998888).";
      }
      if (
        pixType === "EVP" &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)
      ) {
        return "Chave EVP deve ser um UUID válido.";
      }
      return null;
    }
    case "MXN":
      return /^\d{18}$/.test((details.clabe ?? "").trim())
        ? null
        : "CLABE deve possuir exatamente 18 dígitos numéricos.";
    case "ARS":
      return /^\d{22}$/.test((details.account_number ?? "").trim())
        ? null
        : "CVU/CBU argentino deve possuir exatamente 22 dígitos.";
    case "COP":
      if (rail !== "BREB") return "Saque em COP aceita exclusivamente o trilho BREB.";
      return null;
    case "CLP":
      if (!/^\d{3}$/.test((details.bank_code ?? "").trim())) {
        return "Código bancário do Chile deve ter 3 dígitos (ex.: 001).";
      }
      if (details.document_type === "RUT" && !isValidChileanRut(details.document ?? "")) {
        return "RUT chileno inválido (verifique o dígito verificador).";
      }
      return null;
    case "VES": {
      if (!/^\d{4}$/.test((details.bank_code ?? "").trim())) {
        return "Código bancário venezuelano deve ter 4 dígitos (ex.: 0102).";
      }
      if (!/^\d{11}$/.test((details.phone ?? "").replace(/\D/g, ""))) {
        return "Celular Pago Móvil deve conter 11 dígitos (ex.: 04141234567).";
      }
      if (
        rail === "BANK_TRANSFER" &&
        !/^\d{20}$/.test((details.account_number ?? "").replace(/\D/g, ""))
      ) {
        return "Conta bancária venezuelana deve conter 20 dígitos.";
      }
      return null;
    }
    case "USDT":
      return isValidTronAddress(details.address ?? "")
        ? null
        : "Endereço USDT inválido: informe um endereço TRON iniciado com 'T' e 34 caracteres Base58.";
    case "USDC":
      return isValidSolanaAddress(details.address ?? "")
        ? null
        : "Endereço USDC inválido: informe um endereço Solana Base58 válido (32 bytes).";
    default:
      return null;
  }
}

export function summarizeDestination(
  currency: XPagCurrency,
  rail: string,
  details: Record<string, string>,
): string {
  switch (currency) {
    case "BRL":
      return rail === "BRCODE"
        ? `BR Code (${(details.pix_copia_cola ?? "").slice(0, 18)}...)`
        : `${details.pix_type || "PIX"} · ${details.pix_key || ""}`;
    case "MXN":
      return `CLABE ${details.clabe || ""}`;
    case "COP":
      return `Bre-B ${details.key_type || ""} · ${details.key || ""}`;
    case "ARS":
      return `CVU/CBU ${details.account_number || ""}`;
    case "BOB":
    case "CLP":
    case "USD":
      return `${details.bank_code || rail} · ${details.account_number || ""}`;
    case "VES":
      return rail === "PAGOMOVIL"
        ? `Pago Móvil · ${details.bank_code || ""} · ${details.phone || ""}`
        : `Conta VE · ${details.bank_code || ""} · ${(details.account_number || "").slice(-6)}`;
    case "USDT":
    case "USDC": {
      const addr = (details.address ?? "").trim();
      return addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
    }
  }
}

export function formatCurrencyAmount(value: number, currency: XPagCurrency): string {
  const spec = CURRENCY_SPECS[currency];
  if (spec.kind === "crypto") {
    const abs = Math.abs(value);
    const maxDecimals = abs > 0 && abs < 1 ? 6 : 4;
    return `${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    })} ${currency}`;
  }
  const decimals = spec.integerOnly ? 0 : 2;
  return `${spec.symbol} ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function buildCashoutPayload(params: {
  currency: XPagCurrency;
  rail: string;
  amount: number;
  externalId: string;
  webhookUrl?: string;
  description?: string;
  details: Record<string, string>;
}): Record<string, unknown> {
  const { currency, rail, amount, externalId, webhookUrl, description, details } = params;
  const cleanAmount = currency === "CLP" ? Math.round(amount) : Number(amount);

  const base: Record<string, unknown> = {
    currency,
    amount: cleanAmount,
    external_id: externalId,
    ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
    ...(description ? { description } : {}),
  };

  const d = Object.fromEntries(
    Object.entries(details).map(([k, v]) => [k, v.trim()]),
  );

  switch (currency) {
    case "BRL": {
      if (rail === "BRCODE") {
        return { ...base, pix_copia_cola: d.pix_copia_cola };
      }
      const docDigits = (d.document ?? "").replace(/\D/g, "");
      const pixKey =
        d.pix_type === "CPF" || d.pix_type === "CNPJ"
          ? d.pix_key.replace(/\D/g, "")
          : d.pix_key;
      return {
        ...base,
        pix_key: pixKey,
        pix_type: d.pix_type,
        name: d.name,
        document: docDigits,
      };
    }
    case "MXN":
      return { ...base, clabe: d.clabe, name: d.name, document: d.document };
    case "COP":
      return {
        ...base,
        method: "BREB",
        key: d.key,
        key_type: d.key_type,
        name: d.name,
        document: d.document,
        document_type: d.document_type,
      };
    case "ARS":
      return {
        ...base,
        method: "BANK_TRANSFER",
        account_number: d.account_number,
        name: d.name,
        ...(d.document ? { document: d.document, document_type: d.document_type || "CUIT" } : {}),
        ...(d.bank_code ? { bank_code: d.bank_code } : {}),
      };
    case "BOB":
    case "CLP":
    case "USD":
      return {
        ...base,
        ...(currency === "USD" ? { method: "BANK_TRANSFER" } : {}),
        bank_code: d.bank_code,
        account_type: d.account_type,
        account_number: d.account_number,
        name: d.name,
        document: d.document,
        document_type: d.document_type,
        ...(d.phone ? { phone: d.phone } : {}),
        email: d.email,
      };
    case "VES":
      return {
        ...base,
        method: rail === "BANK_TRANSFER" ? "BANK_TRANSFER" : "PAGOMOVIL",
        bank_code: d.bank_code,
        phone: d.phone.replace(/\D/g, ""),
        ...(rail === "BANK_TRANSFER" ? { account_number: d.account_number.replace(/\D/g, "") } : {}),
        name: d.name,
        document: d.document,
        document_type: d.document_type,
      };
    case "USDT":
      return { ...base, address: d.address, network: "TRON" };
    case "USDC":
      return { ...base, address: d.address, network: "SOLANA" };
  }
}

