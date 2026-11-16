"use client";

import {
  ArrowRight,
  Clock,
  CreditCard,
  Globe2,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy, type TourTabId } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

const TOUR_ORDER: TourTabId[] = [
  "recebimentos",
  "entre-empresas",
  "pagamentos",
  "cartoes",
  "credito",
];

function SceneRecebimentos({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative mx-auto w-full max-w-[440px] pt-1 pb-2 sm:pb-10">
      {/* Stacked back cards: MXN -> EUR */}
      <div
        aria-hidden="true"
        className="mx-7 flex items-center justify-between gap-2 rounded-t-[16px] bg-[#2a2b28] px-4 pt-3 pb-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:mx-8"
      >
        <span className="inline-flex items-center gap-2">
          <CountryFlag code="MX" />
          <span className="text-[12px] font-medium tracking-tight">Conta em MXN</span>
        </span>
        <span className="text-[10.5px] font-medium text-white/55">CLABE · SPEI</span>
      </div>

      <div
        aria-hidden="true"
        className="-mt-3 mx-3.5 flex items-center justify-between gap-2 rounded-t-[16px] bg-[#e3d5b8] px-4 pt-3 pb-5 text-[#1e1f1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:mx-4"
      >
        <span className="inline-flex items-center gap-2">
          <CountryFlag code="EU" />
          <span className="text-[12px] font-medium tracking-tight">Conta em EUR</span>
        </span>
        <span className="text-[10.5px] font-medium text-[#5c5646]">IBAN · SEPA</span>
      </div>

      {/* Main foreground USD account card */}
      <div className="relative z-10 -mt-3 rounded-[20px] border border-black/[0.05] bg-white p-5 text-[#1e1f1d] shadow-[0_24px_48px_-14px_rgba(20,20,18,0.14),0_4px_12px_-2px_rgba(20,20,18,0.05)] sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2.5">
            <CountryFlag code="US" />
            <span className="text-[15px] font-medium tracking-tight text-[#1e1f1d]">
              Conta em USD
            </span>
          </span>
          <span className="text-[11px] font-medium text-[#64655f]">ACH · Wire · SWIFT</span>
        </div>

        <div className="mt-4">
          <p className="text-[11px] text-[#78766f]">Número da conta</p>
          <p className="mt-0.5 text-[21px] font-medium tracking-tight text-[#1e1f1d] tabular-nums sm:text-[23px]">
            •••• •••• 4521
          </p>
        </div>

        <div className="mt-4 grid grid-cols-[0.85fr_1.15fr] gap-4">
          <div>
            <p className="text-[11px] text-[#78766f]">Routing number</p>
            <p className="mt-0.5 text-[12.5px] font-medium text-[#1e1f1d] tabular-nums">
              •••• 0021
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#78766f]">Titular da conta</p>
            <p className="mt-0.5 truncate text-[12.5px] font-medium text-[#1e1f1d]">
              Solano Mexico S.A. de C.V.
            </p>
          </div>
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#1e1f1d] px-3 py-1.5 text-[11px] font-medium text-white">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5 shrink-0">
            <path
              d="M3 8.5l3 3 7-7"
              stroke="#e09f2d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sem entidade nos EUA
        </span>
      </div>

      {/* Floating incoming ACH chip */}
      <motion.div
        aria-hidden="true"
        animate={reduced ? undefined : { y: [0, -4, 0] }}
        transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 mt-3 ml-auto w-fit min-w-[235px] rounded-[16px] border border-black/[0.06] bg-white px-4 py-3.5 shadow-[0_22px_48px_-10px_rgba(20,20,18,0.18),0_2px_8px_rgba(20,20,18,0.06)] sm:absolute sm:right-0 sm:bottom-0 sm:mt-0"
      >
        <div className="flex items-center justify-between gap-5 text-[11px]">
          <span className="text-[#78766f]">Recebido via ACH</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#217a4b]">
            <span className="size-1.5 rounded-full bg-[#217a4b]" />
            Recebido
          </span>
        </div>
        <p className="mt-1 text-[20px] font-medium tracking-tight text-[#1e1f1d] tabular-nums">
          USD&nbsp;86.400,00
        </p>
        <p className="mt-0.5 text-[11px] text-[#78766f]">De um cliente em Austin, Texas</p>
      </motion.div>
    </div>
  );
}

function SceneEntreEmpresas() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-lh-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#efe6d0] px-2.5 py-0.5 text-[11px] font-medium text-[#a57a2e]">
            Aporte em subsidiária · Entre empresas
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2a7048]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2a7048]">
            <Zap className="size-3" /> Liquidada
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl border border-lh-line/80 bg-[#f7f6f1] p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-lh-muted">De</p>
            <p className="mt-0.5 text-xs font-semibold text-lh-fg">Solano Group Inc.</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-lh-muted">
              <CountryFlag code="US" className="h-[12px] w-4 rounded-[2px]" />
              Delaware
            </p>
          </div>
          <div className="grid size-7 place-items-center rounded-full bg-[#1e1f1d] text-white">
            <ArrowRight className="size-3.5" />
          </div>
          <div className="rounded-xl border border-lh-line/80 bg-[#f7f6f1] p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-lh-muted">Para</p>
            <p className="mt-0.5 text-xs font-semibold text-lh-fg">Solano Brasil Ltda.</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-lh-muted">
              <CountryFlag code="BR" className="h-[12px] w-4 rounded-[2px]" />
              São Paulo
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-lh-line/80 pt-3">
          <div>
            <p className="text-[11px] text-lh-muted">Valor movimentado</p>
            <p className="lh-mono text-lg font-semibold tracking-tight text-lh-fg">USD 240.000,00</p>
          </div>
          <div className="text-right text-[11px]">
            <p className="text-lh-muted">
              Enviada <span className="lh-mono font-medium text-lh-fg">dom. 02:14</span>
            </p>
            <p className="text-[#2a7048]">
              Liquidada <span className="lh-mono font-semibold">dom. 02:14</span>
            </p>
          </div>
        </div>
      </div>

      {/* Weekend settlement comparison bar */}
      <div className="rounded-2xl border border-lh-line bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="font-medium text-lh-fg">Mesma transferência, domingo às 02:14</span>
          <div className="lh-mono flex gap-2.5 text-[10px] text-lh-muted">
            <span>sáb.</span>
            <span className="font-bold text-lh-fg">dom.</span>
            <span>seg.</span>
            <span>ter.</span>
            <span>qua.</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-16 text-[11px] font-semibold text-lh-fg">pagwave</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-lh-bg-soft">
              <div className="flex h-full w-1/5 items-center justify-center rounded-full bg-[#2a7048] px-2 text-[10px] font-semibold text-white">
                Segundos
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-16 text-[11px] text-lh-muted">Banco</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-lh-bg-soft">
              <div className="flex h-full w-[88%] items-center justify-between rounded-full bg-[#efe6d0] px-2.5 text-[10px] font-medium text-[#75551c]">
                <span>Bancos fechados</span>
                <span>Dias úteis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenePagamentos() {
  const payouts: readonly { label: string; rail: string; amount: string; flag: FlagCode }[] = [
    { label: "Fornecedor, Monterrey", rail: "SPEI", amount: "MXN 1.840.000,00", flag: "MX" },
    { label: "Folha, São Paulo", rail: "Pix", amount: "BRL 318.000,00", flag: "BR" },
    { label: "Prestador, Londres", rail: "Faster Payments", amount: "GBP 24.000,00", flag: "GB" },
    { label: "Aluguel, Berlim", rail: "SEPA", amount: "EUR 12.400,00", flag: "DE" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-[#2a2b28] px-4 py-3.5 text-white">
        <div>
          <p className="text-[11px] text-white/65">Saldo unificado · Solano Group</p>
          <p className="lh-mono mt-0.5 text-xl font-medium tracking-tight">USD 1.684.250,00</p>
        </div>
        <span className="rounded-full bg-[#cfa84a]/20 px-2.5 py-1 text-[11px] font-medium text-[#e3d5b8]">
          +140 países · +300 redes
        </span>
      </div>

      <div className="divide-y divide-lh-line/80 overflow-hidden rounded-2xl border border-lh-line bg-white">
        {payouts.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <CountryFlag code={item.flag} />
              <div>
                <p className="text-xs font-semibold text-lh-fg">{item.label}</p>
                <p className="lh-mono text-[10px] text-lh-muted">Rede local · {item.rail}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="lh-mono text-xs font-semibold text-lh-fg">{item.amount}</p>
              <p className="text-[10px] font-medium text-[#2a7048]">Enviada</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneCartoes() {
  return (
    <div className="space-y-3">
      {/* Dark corporate Visa card */}
      <div className="bank-card-dark relative overflow-hidden rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/90">
            Visa Corporativo · Virtual
          </span>
          <span className="font-display text-sm font-bold tracking-wider text-white/90">VISA</span>
        </div>

        <div className="mt-7 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-white/65">Portadora</p>
            <p className="text-sm font-semibold">Ana Ruiz · Marketing</p>
            <p className="lh-mono mt-1 text-xs text-white/75">•••• •••• •••• 8842</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60">Validade</p>
            <p className="lh-mono text-xs font-medium">09/29</p>
          </div>
        </div>
      </div>

      {/* Live spending rule & limit */}
      <div className="rounded-2xl border border-lh-line bg-white p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-lh-fg">Limite mensal ativo</span>
          <span className="lh-mono font-semibold text-lh-fg">USD 15.500 de 25.000</span>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-lh-bg-soft">
          <div className="h-full w-[62%] rounded-full bg-[#cfa84a]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-lh-line bg-[#f7f6f1] px-2.5 py-1 text-[10px] font-medium text-lh-muted">
            Bloqueio por categoria
          </span>
          <span className="rounded-full border border-lh-line bg-[#f7f6f1] px-2.5 py-1 text-[10px] font-medium text-lh-muted">
            Chave de acesso (Passkey)
          </span>
          <span className="rounded-full border border-[#2a7048]/25 bg-[#2a7048]/10 px-2.5 py-1 text-[10px] font-medium text-[#2a7048]">
            Regras em tempo real
          </span>
        </div>
      </div>
    </div>
  );
}

function SceneCredito() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-lh-line bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="rounded-full bg-[#efe6d0] px-2.5 py-0.5 text-[11px] font-medium text-[#a57a2e]">
              Pedido de estoque
            </span>
            <p className="mt-2 text-sm font-semibold text-lh-fg">Fornecedor em Monterrey</p>
            <p className="text-xs text-lh-muted">3.200 unidades · Coleção de primavera</p>
          </div>
          <div className="text-right">
            <p className="lh-mono text-base font-semibold text-lh-fg">USD 186.000,00</p>
            <p className="text-[11px] font-medium text-[#a57a2e]">Sacado da linha</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-lh-line bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-lh-fg">Linha de crédito rotativa</p>
          <p className="lh-mono text-xs font-semibold text-[#2a7048]">USD 412.500 de 750.000</p>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-lh-bg-soft">
          <div className="h-full w-[45%] rounded-full bg-[#1e1f1d]" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-lh-line/80 pt-3 text-xs">
          <span className="text-lh-muted">Próximo pagamento · Vence em 15 de nov.</span>
          <span className="lh-mono font-semibold text-lh-fg">USD 46.500,00</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TourTabId>("recebimentos");
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const idx = TOUR_ORDER.indexOf(prev);
        return TOUR_ORDER[(idx + 1) % TOUR_ORDER.length];
      });
    }, 5200);
    return () => clearInterval(timer);
  }, [playing, reduced]);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="lh-aurora" aria-hidden>
        <span className="lh-aurora-a" />
        <span className="lh-aurora-b" />
        <span className="lh-aurora-c" />
      </div>
      <div className="lh-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* Left editorial copy */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-lh-line bg-lh-surface px-3.5 py-1 text-[11px] font-medium tracking-wide text-lh-fg shadow-xs">
                <Globe2 className="size-3.5 text-[#a57a2e]" />
                {landingCopy.hero.eyebrow}
              </span>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="lh-display mt-5 text-lh-fg">{landingCopy.hero.title}</h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="lh-lead mt-5 max-w-xl text-lh-muted">{landingCopy.hero.lead}</p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={landingCopy.hero.primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[#cfa84a] px-6 py-3 text-sm font-medium text-[#1e1f1d] shadow-xs transition-all hover:bg-[#d7b55f]"
                >
                  {landingCopy.hero.primaryCta.label}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={landingCopy.hero.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#1e1f1d] bg-transparent px-6 py-3 text-sm font-medium text-[#1e1f1d] transition-colors hover:bg-black/5"
                >
                  {landingCopy.hero.secondaryCta.label}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-lh-line pt-5">
                {landingCopy.hero.trust.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-lh-muted"
                  >
                    <ShieldCheck className="size-3.5 text-[#2a7048]" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right interactive 5-tab product tour */}
          <Reveal delay={0.08}>
            <div className="lh-ring rounded-[26px] bg-[#f7f6f1] p-4 sm:p-5">
              {/* Tabs + Play/Pause */}
              <div className="flex items-center gap-2">
                <div
                  role="tablist"
                  aria-label="Recursos da pagwave"
                  className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto rounded-full border border-lh-line bg-white/85 p-1"
                >
                  {landingCopy.hero.tourTabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setPlaying(false);
                        }}
                        className={cn(
                          "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                          active
                            ? "bg-[#1e1f1d] text-white shadow-xs"
                            : "text-lh-muted hover:text-lh-fg",
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? "Pausar tour" : "Reproduzir tour"}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-lh-line bg-white text-lh-fg transition-colors hover:bg-lh-surface-strong"
                >
                  {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
              </div>

              {/* Dynamic Scene Box */}
              <div className="mt-4 min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduced ? 0 : -6 }}
                    transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {activeTab === "recebimentos" && <SceneRecebimentos reduced={reduced} />}
                    {activeTab === "entre-empresas" && <SceneEntreEmpresas />}
                    {activeTab === "pagamentos" && <ScenePagamentos />}
                    {activeTab === "cartoes" && <SceneCartoes />}
                    {activeTab === "credito" && <SceneCredito />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Scene Caption */}
              <p className="mt-4 border-t border-lh-line pt-3.5 text-xs leading-relaxed text-lh-muted">
                {landingCopy.hero.tourCaptions[activeTab]}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Backing & institutional standards strip */}
        <Reveal delay={0.18}>
          <div className="mt-16 grid grid-cols-2 gap-3 rounded-2xl border border-lh-line bg-lh-surface p-4 sm:grid-cols-4 sm:p-5">
            {landingCopy.backing.items.map((item, idx) => {
              const Icon = [ShieldCheck, CreditCard, Globe2, Clock][idx] ?? Sparkles;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-lh-bg text-lh-fg">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-lh-fg">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-lh-muted">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
