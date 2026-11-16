"use client";

import { ArrowRight, BookOpenCheck, Check, CreditCard, Landmark, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

const CURRENCY_ACCOUNTS: Record<
  "USD" | "EUR" | "MXN",
  {
    flag: FlagCode;
    balance: string;
    holder: string;
    badge: string;
    detail1Label: string;
    detail1Value: string;
    detail2Label: string;
    detail2Value: string;
    rails: string;
  }
> = {
  USD: {
    flag: "US",
    balance: "USD 1.284.560,00",
    holder: "Solano Mexico S.A. de C.V.",
    badge: "Sem entidade nos EUA",
    detail1Label: "Número da conta",
    detail1Value: "•••• •••• 4521",
    detail2Label: "Routing number",
    detail2Value: "•••• 0021",
    rails: "ACH, Wire, SWIFT",
  },
  EUR: {
    flag: "EU",
    balance: "EUR 412.800,00",
    holder: "Solano Mexico S.A. de C.V.",
    badge: "IBAN dedicado",
    detail1Label: "IBAN",
    detail1Value: "DE89 •••• •••• 3104",
    detail2Label: "BIC / SWIFT",
    detail2Value: "PGWVDEFF",
    rails: "SEPA, SEPA Instant",
  },
  MXN: {
    flag: "MX",
    balance: "MXN 18.400.000,00",
    holder: "Solano Mexico S.A. de C.V.",
    badge: "CLABE local",
    detail1Label: "CLABE",
    detail1Value: "6461 •••• •••• 9910",
    detail2Label: "Banco liquidante",
    detail2Value: "STP México",
    rails: "SPEI 24/7",
  },
};

export function PlatformBento() {
  const [currency, setCurrency] = useState<keyof typeof CURRENCY_ACCOUNTS>("USD");
  const activeAccount = CURRENCY_ACCOUNTS[currency];

  return (
    <section id="plataforma" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.bento.eyebrow}</p>
          <h2 className="lh-h2 mt-3 max-w-2xl text-lh-fg">{landingCopy.bento.title}</h2>
          <p className="lh-lead mt-4 max-w-2xl text-lh-muted">{landingCopy.bento.lead}</p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Local accounts in entity name */}
          <RevealItem>
            <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-lh-bg text-lh-fg">
                    <Landmark className="size-4" />
                  </span>
                  <div className="inline-flex rounded-full border border-lh-line bg-[#f7f6f1] p-0.5">
                    {(["USD", "EUR", "MXN"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCurrency(code)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                          currency === code
                            ? "bg-[#1e1f1d] text-white"
                            : "text-lh-muted hover:text-lh-fg",
                        )}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 className="lh-h3 mt-5 text-lh-fg">
                  Abra contas locais em nome de cada empresa.
                </h3>
                <p className="mt-1.5 text-xs text-lh-muted">
                  Solano Mexico S.A. de C.V. · 4 empresas
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-lh-line bg-[#f7f6f1] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-lh-muted">
                    <CountryFlag code={activeAccount.flag} className="h-[13px] w-[18px] rounded-[2px]" />
                    Saldo disponível
                  </span>
                  <span className="rounded-full bg-[#efe6d0] px-2.5 py-0.5 text-[10px] font-medium text-[#a57a2e]">
                    {activeAccount.badge}
                  </span>
                </div>
                <p className="lh-mono mt-1 text-lg font-bold text-lh-fg">{activeAccount.balance}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-lh-line/80 pt-3 text-[11px]">
                  <div>
                    <p className="text-lh-muted">{activeAccount.detail1Label}</p>
                    <p className="lh-mono font-semibold text-lh-fg">{activeAccount.detail1Value}</p>
                  </div>
                  <div>
                    <p className="text-lh-muted">{activeAccount.detail2Label}</p>
                    <p className="lh-mono font-semibold text-lh-fg">{activeAccount.detail2Value}</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-lh-muted">Redes: {activeAccount.rails}</p>
              </div>
            </article>
          </RevealItem>

          {/* Card 2: Move money between entities on a Sunday */}
          <RevealItem>
            <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
              <div>
                <span className="grid size-9 place-items-center rounded-xl bg-[#2a7048]/10 text-[#2a7048]">
                  <ArrowRight className="size-4" />
                </span>
                <h3 className="lh-h3 mt-5 text-lh-fg">
                  Movimente dinheiro entre suas empresas num domingo, se precisar.
                </h3>
              </div>

              <div className="mt-5 rounded-2xl border border-lh-line bg-[#f7f6f1] p-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-lh-fg">Transferência entre empresas</span>
                  <span className="rounded-full bg-[#2a7048]/10 px-2 py-0.5 font-semibold text-[#2a7048]">
                    Liquidada
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-lh-muted">De</span>
                    <span className="font-medium text-lh-fg">Solano Group Inc. (Delaware)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lh-muted">Para</span>
                    <span className="font-medium text-lh-fg">Solano Mexico S.A. de C.V.</span>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-lh-line/80 pt-3">
                  <p className="lh-mono text-base font-semibold text-lh-fg">USD 240.000,00</p>
                  <div className="lh-mono text-right text-[10px] text-lh-muted">
                    <p>Enviada dom. 02:14</p>
                    <p className="font-semibold text-[#2a7048]">Liquidada dom. 02:14</p>
                  </div>
                </div>
              </div>
            </article>
          </RevealItem>

          {/* Card 3: Pay suppliers on local rails */}
          <RevealItem>
            <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#efe6d0] text-[#a57a2e]">
                    <Send className="size-4" />
                  </span>
                  <span className="lh-mono rounded-full border border-lh-line px-2.5 py-0.5 text-[10px] font-medium text-lh-muted">
                    Pagamento em lote · 3 envios
                  </span>
                </div>
                <h3 className="lh-h3 mt-5 text-lh-fg">
                  Pague fornecedores pelas redes deles.
                </h3>
              </div>

              <div className="mt-5 divide-y divide-lh-line/80 rounded-2xl border border-lh-line bg-[#f7f6f1]">
                {[
                  { name: "Fabricante, Monterrey", rail: "SPEI", val: "MXN 1.840.000,00" },
                  { name: "Folha, São Paulo", rail: "Pix", val: "BRL 318.000,00" },
                  { name: "Logística, Roterdã", rail: "SEPA", val: "EUR 62.400,00" },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <div>
                      <p className="font-semibold text-lh-fg">{row.name}</p>
                      <p className="lh-mono text-[10px] text-lh-muted">{row.rail}</p>
                    </div>
                    <div className="text-right">
                      <p className="lh-mono font-semibold text-lh-fg">{row.val}</p>
                      <p className="text-[10px] font-medium text-[#2a7048]">Enviada</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </RevealItem>

          {/* Card 4: Give every team member a card and limit */}
          <RevealItem>
            <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
              <div>
                <span className="grid size-9 place-items-center rounded-xl bg-lh-bg text-lh-fg">
                  <CreditCard className="size-4" />
                </span>
                <h3 className="lh-h3 mt-5 text-lh-fg">
                  Dê um cartão a cada pessoa e um limite.
                </h3>
              </div>

              <div className="mt-5 rounded-2xl bg-[#2a2b28] p-4 text-white">
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span>Ana Ruiz · Marketing</span>
                  <span className="lh-mono">Visa virtual •••• 8842</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/70">Limite mensal</span>
                  <span className="lh-mono font-semibold">USD 15.500 de 25.000</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-[62%] rounded-full bg-[#cfa84a]" />
                </div>
              </div>
            </article>
          </RevealItem>

          {/* Card 5: See all entities in one login */}
          <RevealItem>
            <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-lh-bg text-lh-fg">
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="lh-mono text-[11px] text-lh-muted">Solano Group · 4 empresas</span>
                </div>
                <h3 className="lh-h3 mt-5 text-lh-fg">Veja todas as empresas em um só login.</h3>
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-lh-line bg-[#f7f6f1] p-3.5">
                {[
                  { name: "Group Inc.", place: "EUA", bal: "USD 2.140.000,00" },
                  { name: "Mexico S.A. de C.V.", place: "México", bal: "MXN 18.400.000,00" },
                  { name: "Brasil Ltda.", place: "Brasil", bal: "BRL 1.920.000,00" },
                  { name: "UK Ltd.", place: "Reino Unido", bal: "GBP 310.500,00" },
                ].map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-lh-fg">
                      {e.name} <span className="text-[11px] text-lh-muted">· {e.place}</span>
                    </span>
                    <span className="lh-mono font-semibold text-lh-fg">{e.bal}</span>
                  </div>
                ))}
              </div>
            </article>
          </RevealItem>

          {/* Card 6: Accounting close */}
          <RevealItem>
            <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#2a7048]/10 text-[#2a7048]">
                    <BookOpenCheck className="size-4" />
                  </span>
                  <span className="rounded-full border border-lh-line bg-[#f7f6f1] px-2.5 py-0.5 text-[10px] font-medium text-lh-muted">
                    QuickBooks · Xero · NetSuite
                  </span>
                </div>
                <h3 className="lh-h3 mt-5 text-lh-fg">
                  Feche a contabilidade de cada empresa no próprio livro razão.
                </h3>
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-lh-line bg-[#f7f6f1] p-3.5">
                {[
                  { entity: "Solano Group Inc.", count: "118 transações classificadas" },
                  { entity: "Solano Mexico S.A. de C.V.", count: "42 transações classificadas" },
                  { entity: "Solano Brasil Ltda.", count: "27 transações classificadas" },
                  { entity: "Solano UK Ltd.", count: "16 transações classificadas" },
                ].map((item) => (
                  <div key={item.entity} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-lh-fg">{item.entity}</p>
                      <p className="text-[10px] text-lh-muted">{item.count}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2a7048]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2a7048]">
                      <Check className="size-2.5" /> Sincronizado
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

