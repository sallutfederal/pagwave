"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  KeyRound,
  Lock,
  Plug,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyBadge } from "@/components/wallet/currency-badge";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  XPAG_ERROR_MESSAGES,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type CodeLang = "curl" | "node" | "python" | "php";

function CopyCodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-line overflow-hidden rounded-2xl border bg-black/50">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-muted-foreground font-mono text-[11px]">{title || "Exemplo"}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2.5 text-[11px]"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="text-foreground overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

const CASHIN_REQUEST_EXAMPLES: Record<XPagCurrency, Record<string, unknown>> = {
  BRL: {
    currency: "BRL",
    amount: 149.9,
    external_id: "pedido_1042",
    webhook_url: "https://api.seusistema.com/webhooks/pagwave",
    description: "Assinatura Pagwave Pro",
  },
  MXN: {
    currency: "MXN",
    method: "SPEI",
    amount: 1200,
    external_id: "mx_1042",
    webhook_url: "https://api.seusistema.com/webhooks/pagwave",
    name: "Carlos Mendoza",
  },
  COP: {
    currency: "COP",
    method: "NEQUI_QR",
    amount: 95000,
    external_id: "co_1042",
    phone: "3001234567",
  },
  ARS: {
    currency: "ARS",
    method: "BANK_TRANSFER",
    amount: 25000,
    external_id: "ar_1042",
    name: "Mateo Fernández",
    document: "20345678901",
    document_type: "CUIT",
  },
  BOB: {
    currency: "BOB",
    method: "QR",
    amount: 350,
    external_id: "bo_1042",
    name: "Ana Rojas",
    phone: "+59170000000",
    email: "ana@empresa.bo",
    document: "1234567",
    document_type: "CI",
  },
  CLP: {
    currency: "CLP",
    method: "BANK_TRANSFER",
    amount: 45000,
    external_id: "cl_1042",
    name: "Diego Soto",
    email: "diego@empresa.cl",
    document: "12345678-5",
    document_type: "RUT",
  },
  USD: {
    currency: "USD",
    method: "BANK_TRANSFER",
    amount: 220,
    external_id: "ec_1042",
    name: "Lucia Vera",
    phone: "+593990000000",
    email: "lucia@empresa.ec",
    document: "0912345678",
    document_type: "CI",
  },
  VES: {
    currency: "VES",
    method: "PAGOMOVIL",
    amount: 1800,
    external_id: "ve_1042",
    name: "Gabriel Perez",
    phone: "04141234567",
    document: "V-12345678",
    document_type: "CI",
  },
  USDT: {
    currency: "USDT",
    amount: 100,
    external_id: "usdt_1042",
    webhook_url: "https://api.seusistema.com/webhooks/pagwave",
  },
  USDC: {
    currency: "USDC",
    amount: 250,
    external_id: "usdc_1042",
    webhook_url: "https://api.seusistema.com/webhooks/pagwave",
  },
};

const CASHIN_RESPONSE_EXAMPLES: Record<XPagCurrency, Record<string, unknown>> = {
  BRL: {
    ok: true,
    currency: "BRL",
    status: "pending",
    request_number: "req_brl_889210",
    transaction_id: "tx_brl_019283",
    external_id: "pedido_1042",
    copyPaste: "00020126580014br.gov.bcb.pix0136...",
    qr_img: "data:image/png;base64,...",
  },
  MXN: {
    ok: true,
    currency: "MXN",
    method: "SPEI",
    status: "pending",
    request_number: "req_mxn_71204",
    clabe: "646180157000001234",
    bank_name: "STP",
    beneficiary: "Pagwave Latam",
  },
  COP: {
    ok: true,
    currency: "COP",
    method: "NEQUI_QR",
    status: "pending",
    request_number: "req_cop_39201",
    code: "000201...",
    qr_url: "https://...",
    checkout_url: "https://...",
    expire_minutes: 45,
  },
  ARS: {
    ok: true,
    currency: "ARS",
    method: "BANK_TRANSFER",
    status: "pending",
    request_number: "req_ars_51209",
    payee_data: {
      accountNumber: "0000003100012345678901",
      name: "Pagwave AR",
      bankName: "MercadoPago / CVU",
    },
  },
  BOB: {
    ok: true,
    currency: "BOB",
    method: "QR",
    status: "pending",
    request_number: "req_bob_11024",
    qr_img: "data:image/png;base64,...",
  },
  CLP: {
    ok: true,
    currency: "CLP",
    method: "BANK_TRANSFER",
    status: "pending",
    request_number: "req_clp_78112",
    checkout_url: "https://checkout.../clp/78112",
  },
  USD: {
    ok: true,
    currency: "USD",
    method: "BANK_TRANSFER",
    status: "pending",
    request_number: "req_usd_66201",
    checkout_url: "https://checkout.../ec/66201",
  },
  VES: {
    ok: true,
    currency: "VES",
    method: "PAGOMOVIL",
    status: "pending",
    request_number: "req_ves_99123",
    checkout_url: "https://checkout.../ve/99123",
  },
  USDT: {
    ok: true,
    currency: "USDT",
    network: "TRON",
    status: "pending",
    request_number: "req_usdt_44019",
    deposit_address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    amount: 100.0142,
  },
  USDC: {
    ok: true,
    currency: "USDC",
    network: "SOLANA",
    status: "pending",
    request_number: "req_usdc_55019",
    deposit_address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    amount: 250.0087,
  },
};

const NAV_SECTIONS = [
  { id: "overview", label: "Visão Geral & Fluxo" },
  { id: "auth", label: "Autenticação" },
  { id: "modes", label: "Dinâmica vs. Estática" },
  { id: "currencies", label: "Moedas & Cobranças" },
  { id: "endpoints", label: "Saldo, Saque & Consulta" },
  { id: "webhooks", label: "Webhooks & HMAC" },
  { id: "sandbox", label: "Sandbox & Erros" },
] as const;

const subscribeNoop = () => () => {};

export function DocsView() {
  const [selectedCurrency, setSelectedCurrency] = useState<XPagCurrency>("BRL");
  const [codeLang, setCodeLang] = useState<CodeLang>("curl");
  const baseOrigin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => "https://api.pagwave.local",
  );
  const [clientId, setClientId] = useState("pw_live_SEU_CLIENT_ID");

  useEffect(() => {
    let cancelled = false;
    async function loadClientId() {
      const res = await fetch("/api/integrations/keys", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        credential?: { clientId?: string };
      } | null;
      if (!cancelled && res.ok && json?.ok && json.credential?.clientId) {
        setClientId(json.credential.clientId);
      }
    }
    void loadClientId();
    return () => {
      cancelled = true;
    };
  }, []);

  const spec = CURRENCY_SPECS[selectedCurrency];
  const reqBody = JSON.stringify(CASHIN_REQUEST_EXAMPLES[selectedCurrency], null, 2);
  const resBody = JSON.stringify(CASHIN_RESPONSE_EXAMPLES[selectedCurrency], null, 2);
  const baseApiUrl = `${baseOrigin}/api/v1`;

  const codeSnippets: Record<CodeLang, string> = {
    curl: `curl -X POST "${baseApiUrl}/cashin" \\
  -H "Content-Type: application/json" \\
  -H "X-Client-Id: ${clientId}" \\
  -H "X-Client-Secret: SEU_CLIENT_SECRET" \\
  -d '${JSON.stringify(CASHIN_REQUEST_EXAMPLES[selectedCurrency])}'`,

    node: `const res = await fetch("${baseApiUrl}/cashin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Client-Id": "${clientId}",
    "X-Client-Secret": process.env.PAGWAVE_CLIENT_SECRET!,
  },
  body: JSON.stringify(${reqBody}),
});

const charge = await res.json();
console.log(charge);`,

    python: `import os
import requests

resp = requests.post(
    "${baseApiUrl}/cashin",
    headers={
        "X-Client-Id": "${clientId}",
        "X-Client-Secret": os.environ["PAGWAVE_CLIENT_SECRET"],
    },
    json=${reqBody.replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False")},
    timeout=20,
)
print(resp.json())`,

    php: `<?php
$ch = curl_init("${baseApiUrl}/cashin");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "X-Client-Id: ${clientId}",
    "X-Client-Secret: " . getenv("PAGWAVE_CLIENT_SECRET"),
  ],
  CURLOPT_POSTFIELDS => json_encode(${reqBody}),
]);
$response = curl_exec($ch);
echo $response;`,
  };

  const webhookVerifySnippet = `import crypto from "node:crypto";

export async function POST(request: Request) {
  const rawBody = await request.text(); // Leia o corpo bruto ANTES do JSON.parse
  const signature = request.headers.get("x-webhook-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", process.env.PAGWAVE_CLIENT_SECRET!)
    .update(rawBody, "utf8")
    .digest("hex");

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(rawBody);
  // Deduplique por event.e2e (principalmente em origin === "static")
  return Response.json({ ok: true });
}`;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* Sticky Side Navigation */}
      <aside className="lg:sticky lg:top-24 lg:col-span-3">
        <Card className="space-y-3 p-4">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Guia da API Pagwave
          </p>
          <nav className="flex flex-wrap gap-1.5 lg:flex-col">
            {NAV_SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="text-muted-foreground hover:bg-surface-hover hover:text-foreground rounded-xl px-3 py-2 text-xs font-medium transition-colors"
              >
                {sec.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-white/10 pt-3">
            <Link
              href="/integrations"
              className="bg-accent text-accent-fg hover:bg-accent/90 flex h-9 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold transition-colors"
            >
              <Plug className="size-3.5" />
              Minhas Credenciais
            </Link>
          </div>
        </Card>
      </aside>

      {/* Main Documentation Content */}
      <div className="space-y-6 lg:col-span-9">
        {/* 1. Overview & Architecture Flow */}
        <section id="overview" className="scroll-mt-24">
          <Card className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="bg-accent-soft text-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold">
                  <Code2 className="size-3.5" />
                  REST · JSON · 10 Moedas & Redes
                </span>
                <h2 className="text-foreground mt-2 text-lg font-semibold">
                  Uma única API para gerar cobranças e saques em toda a América Latina e Cripto
                </h2>
              </div>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
              Receba via <strong>Pix (BRL)</strong>, <strong>SPEI / OXXO (MXN)</strong>,{" "}
              <strong>Nequi / Bre-B (COP)</strong>, <strong>CVU (ARS)</strong>,{" "}
              <strong>QR Simple (BOB)</strong>, <strong>Khipu / Webpay (CLP)</strong>,{" "}
              <strong>USD Equador</strong>, <strong>Pago Móvil (VES)</strong>,{" "}
              <strong>USDT (TRON)</strong> e <strong>USDC (Solana)</strong> através de uma única integração.
            </p>

            {/* Visual Flow Diagram */}
            <div className="grid gap-3 md:grid-cols-4">
              {[
                {
                  step: "1. Sua Aplicação",
                  title: "Envia a Key única",
                  desc: "Headers X-Client-Id e X-Client-Secret gerados em /integrations.",
                  icon: KeyRound,
                },
                {
                  step: "2. Gateway Pagwave",
                  title: "Autentica & Valida",
                  desc: "Valida assinatura da conta em tempo constante e regras da moeda.",
                  icon: Lock,
                },
                {
                  step: "3. Liquidação",
                  title: "Roteamento Multi-moeda",
                  desc: "Emite instrução local instantânea ou endereço on-chain micro-ajustado.",
                  icon: ShieldCheck,
                },
                {
                  step: "4. Retorno + Webhook",
                  title: "QR / Checkout / e2e",
                  desc: "Retorna dados de pagamento na hora e confirma via POST HMAC-SHA256.",
                  icon: Webhook,
                },
              ].map((node, idx) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.step}
                    className="border-line bg-surface-subtle relative flex flex-col justify-between gap-2 rounded-2xl border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-accent text-[11px] font-semibold">{node.step}</span>
                      <Icon className="text-muted-foreground size-4" />
                    </div>
                    <div>
                      <p className="text-foreground text-xs font-semibold">{node.title}</p>
                      <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                        {node.desc}
                      </p>
                    </div>
                    {idx < 3 ? (
                      <ArrowRight className="text-muted-foreground/50 absolute top-1/2 -right-2.5 hidden size-4 -translate-y-1/2 md:block" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* 2. Authentication */}
        <section id="auth" className="scroll-mt-24">
          <Card className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-foreground text-base font-semibold">
                Autenticação por Conta (`X-Client-Id` & `X-Client-Secret`)
              </h2>
              <Link href="/integrations" className="text-accent text-xs font-medium hover:underline">
                Gerenciar minhas chaves →
              </Link>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Todas as chamadas para <code className="text-foreground">{baseApiUrl}</code> devem incluir o par exclusivo de credenciais da sua conta nos cabeçalhos HTTP. Nunca exponha seu <code className="text-foreground">X-Client-Secret</code> em código front-end ou aplicativos mobile.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-line bg-surface-subtle rounded-xl border p-3.5">
                <p className="text-muted-foreground text-[11px]">Base URL</p>
                <p className="text-foreground mt-1 font-mono text-xs">{baseApiUrl}</p>
              </div>
              <div className="border-line bg-surface-subtle rounded-xl border p-3.5">
                <p className="text-muted-foreground text-[11px]">Seu X-Client-Id atual</p>
                <p className="text-foreground mt-1 font-mono text-xs">{clientId}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Dynamic vs Open Value */}
        <section id="modes" className="scroll-mt-24">
          <Card className="space-y-4 p-6">
            <h2 className="text-foreground text-base font-semibold">
              Cobrança Dinâmica vs. Valor Aberto (Estática)
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              A rota é sempre <code className="text-foreground">POST /api/v1/cashin</code> — o que muda o comportamento é apenas a presença ou ausência do campo <code className="text-foreground">amount</code>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-white/10">
                    <th className="py-2 pr-4 font-medium">Característica</th>
                    <th className="py-2 pr-4 font-medium">Dinâmica (com `amount`)</th>
                    <th className="py-2 font-medium">Valor aberto / estática (sem `amount`)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-muted-foreground">
                  <tr>
                    <td className="text-foreground py-2.5 pr-4 font-medium">Quem define o valor</td>
                    <td className="py-2.5 pr-4">Sua aplicação na criação</td>
                    <td className="py-2.5">O pagador na hora do pagamento (BRL / MXN SPEI)</td>
                  </tr>
                  <tr>
                    <td className="text-foreground py-2.5 pr-4 font-medium">Quantidade de pagamentos</td>
                    <td className="py-2.5 pr-4">Apenas 1 pagamento</td>
                    <td className="py-2.5">Múltiplos pagamentos na mesma instrução</td>
                  </tr>
                  <tr>
                    <td className="text-foreground py-2.5 pr-4 font-medium">Campo `origin` no webhook</td>
                    <td className="py-2.5 pr-4">Ausente / <code className="text-foreground">api_v1</code></td>
                    <td className="py-2.5"><code className="text-foreground">&quot;origin&quot;: &quot;static&quot;</code></td>
                  </tr>
                  <tr>
                    <td className="text-foreground py-2.5 pr-4 font-medium">Chave de reconciliação</td>
                    <td className="py-2.5 pr-4"><code className="text-foreground">request_number</code> / <code className="text-foreground">external_id</code></td>
                    <td className="py-2.5">Obrigatoriamente pelo <code className="text-foreground">e2e</code> único por pagamento</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              <strong>Atenção OXXO (MXN):</strong> com <code className="font-mono">&quot;method&quot;: &quot;OXXO&quot;</code>, o voucher é dinâmico entre 10 e 10.000 MXN, possui validade de 12 dias e confirmação assíncrona — trate <code className="font-mono">pending</code> como estado normal.
            </p>
          </Card>
        </section>

        {/* 4. Interactive Currency & Cash-in Reference */}
        <section id="currencies" className="scroll-mt-24">
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-foreground text-base font-semibold">
                Criar Cobrança por Moeda (`POST /api/v1/cashin`)
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Selecione uma moeda abaixo para ver os trilhos aceitos, payload exato e resposta esperada.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {XPAG_CURRENCIES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedCurrency(code)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedCurrency === code
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface-subtle text-muted-foreground hover:text-foreground",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
              <CurrencyBadge currency={selectedCurrency} />
              <div className="text-right text-xs">
                <p className="text-foreground font-medium">
                  Métodos: {spec.cashinMethods.map((m) => m.id).join(" · ")}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Valor aberto estático: {spec.supportsOpenValueCashin ? "Sim" : "Não (amount obrigatório)"}
                </p>
              </div>
            </div>

            {/* Code Language Switcher */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "curl", label: "cURL" },
                    { id: "node", label: "Node.js / TS" },
                    { id: "python", label: "Python" },
                    { id: "php", label: "PHP" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCodeLang(tab.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      codeLang === tab.id
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-line bg-surface-subtle text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <CopyCodeBlock
                title={`Requisição POST /api/v1/cashin (${selectedCurrency})`}
                code={codeSnippets[codeLang]}
              />

              <CopyCodeBlock
                title={`Resposta JSON esperada (${selectedCurrency})`}
                code={resBody}
              />
            </div>
          </Card>
        </section>

        {/* 5. Balance, Cashout, Transactions */}
        <section id="endpoints" className="scroll-mt-24">
          <Card className="space-y-4 p-6">
            <h2 className="text-foreground text-base font-semibold">
              Demais Endpoints Disponíveis na API Pagwave
            </h2>
            <div className="space-y-3">
              {[
                {
                  method: "GET",
                  path: "/api/v1/balance",
                  desc: "Retorna available e blocked (MED) para todas as 10 moedas além de blocked_currencies.",
                },
                {
                  method: "POST",
                  path: "/api/v1/cashout",
                  desc: "Solicita saque em qualquer moeda/país ou cripto (USDT TRON / USDC Solana), aceitando beneficiary_id salvo ou destino avulso com external_id idempotente.",
                },
                {
                  method: "GET",
                  path: "/api/v1/transactions?kind=cashin|cashout&transaction_id=...",
                  desc: "Consulta status em tempo real por transaction_id, request_number, e2e, external_id ou clabe.",
                },
                {
                  method: "POST",
                  path: "/api/v1/sandbox/simulate",
                  desc: "Em Sandbox, simula desfecho paid, failed ou expired informando { request_number, status }.",
                },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="border-line bg-surface-subtle rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-accent-soft text-accent rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold">
                      {ep.method}
                    </span>
                    <code className="text-foreground font-mono text-xs">{ep.path}</code>
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">{ep.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* 6. Webhooks */}
        <section id="webhooks" className="scroll-mt-24">
          <Card className="space-y-4 p-6">
            <h2 className="text-foreground text-base font-semibold">
              Webhooks & Assinatura HMAC-SHA256
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Envie <code className="text-foreground">webhook_url</code> no corpo do <code className="text-foreground">POST /api/v1/cashin</code> ou configure sua URL padrão em{" "}
              <Link href="/integrations" className="text-accent underline">
                Integrações
              </Link>
              . Sempre validamos e encaminhamos o evento assinado com HMAC-SHA256 do seu{" "}
              <code className="text-foreground">X-Client-Secret</code> no header{" "}
              <code className="text-foreground">X-Webhook-Signature</code>. Eventos suportados:{" "}
              <code className="text-foreground">paid</code>,{" "}
              <code className="text-foreground">failed</code>,{" "}
              <code className="text-foreground">expired</code>,{" "}
              <code className="text-foreground">med</code> e{" "}
              <code className="text-foreground">med_closed</code>.
            </p>
            <CopyCodeBlock
              title="Validação segura em Node.js / Next.js"
              code={webhookVerifySnippet}
            />
          </Card>
        </section>

        {/* 7. Sandbox & Error codes */}
        <section id="sandbox" className="scroll-mt-24">
          <Card className="space-y-4 p-6">
            <h2 className="text-foreground text-base font-semibold">
              Códigos de Erro (`error_code`) & Retentativas
            </h2>
            <p className="text-muted-foreground text-xs">
              Trate integrações pelo campo estável <code className="text-foreground">error_code</code>. Códigos elegíveis para retry automático com backoff: <code className="text-foreground">provider_unavailable</code> e <code className="text-foreground">rate_limited</code>.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(XPAG_ERROR_MESSAGES).map(([code, msg]) => (
                <div
                  key={code}
                  className="border-line bg-surface-subtle rounded-xl border px-3.5 py-2.5"
                >
                  <code className="text-accent font-mono text-[11px] font-semibold">{code}</code>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">{msg}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
