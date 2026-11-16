"use client";

import { AlertTriangle, ArrowLeftRight, ArrowRight, CheckCircle2, FileSpreadsheet, KeyRound, Layers, Lock } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

const LEGACY_BANKS: readonly {
  flag: FlagCode;
  company: string;
  bank: string;
  balance: string;
  note: string;
}[] = [
  { flag: "US", company: "Solano Group Inc.", bank: "Banco 1 · EUA", balance: "USD 2.140.000", note: "Login e corte próprios" },
  { flag: "GB", company: "Solano UK Ltd.", bank: "Banco 2 · Reino Unido", balance: "GBP 310.500", note: "Login e corte próprios" },
  { flag: "MX", company: "Solano Mexico S.A. de C.V.", bank: "Banco 3 · México", balance: "MXN 18.400.000", note: "Login e corte próprios" },
  { flag: "BR", company: "Solano Brasil Ltda.", bank: "Banco 4 · Brasil", balance: "BRL 1.920.000", note: "Login e corte próprios" },
];

const PAGWAVE_ENTITIES: readonly {
  flag: FlagCode;
  company: string;
  place: string;
  rail: string;
  balance: string;
}[] = [
  { flag: "US", company: "Solano Group Inc.", place: "Delaware", rail: "ACH · Wire", balance: "USD 2.140.000" },
  { flag: "GB", company: "Solano UK Ltd.", place: "Londres", rail: "Faster Payments", balance: "GBP 310.500" },
  { flag: "MX", company: "Solano Mexico S.A. de C.V.", place: "Monterrey", rail: "SPEI", balance: "MXN 18.400.000" },
  { flag: "BR", company: "Solano Brasil Ltda.", place: "São Paulo", rail: "Pix", balance: "BRL 1.920.000" },
];

export function ProblemSection() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<"legacy" | "pagwave">("pagwave");

  return (
    <section id="comparativo" className="scroll-mt-24 border-y border-lh-line bg-lh-bg-soft/70 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Reveal>
            <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.problem.eyebrow}</p>
            <h2 className="lh-h2 mt-3 text-lh-fg">{landingCopy.problem.title}</h2>
            <p className="mt-2 font-display text-lg font-medium text-lh-fg/80 sm:text-xl">
              {landingCopy.problem.subtitle}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="lh-lead text-lh-muted">{landingCopy.problem.lead}</p>
          </Reveal>
        </div>

        {/* Toggle Switch */}
        <Reveal delay={0.12}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="Comparar estrutura"
              className="inline-flex rounded-full border border-lh-line bg-white p-1 shadow-xs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "legacy"}
                onClick={() => setMode("legacy")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-medium transition-all sm:text-sm",
                  mode === "legacy"
                    ? "bg-[#1e1f1d] text-white shadow-xs"
                    : "text-lh-muted hover:text-lh-fg",
                )}
              >
                Sua estrutura atual
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "pagwave"}
                onClick={() => setMode("pagwave")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all sm:text-sm",
                  mode === "pagwave"
                    ? "bg-[#1e1f1d] text-white shadow-xs"
                    : "text-lh-muted hover:text-lh-fg",
                )}
              >
                <Layers className="size-3.5 text-[#cfa84a]" />
                Com a pagwave
              </button>
            </div>

            <p className="text-xs font-medium text-lh-muted">
              {mode === "legacy"
                ? "4 bancos · 4 tokens · 1 planilha · dias de espera"
                : "1 login · 4 entidades · redes locais · liquidação em segundos"}
            </p>
          </div>
        </Reveal>

        {/* Interactive Comparison Canvas */}
        <div className="lh-ring mt-6 overflow-hidden rounded-[28px] bg-white p-5 sm:p-8">
          <AnimatePresence mode="wait">
            {mode === "legacy" ? (
              <motion.div
                key="legacy"
                initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -8 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
                className="space-y-6"
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {LEGACY_BANKS.map((bank) => (
                    <div
                      key={bank.company}
                      className="rounded-2xl border border-dashed border-lh-line bg-[#fafaf7] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <CountryFlag code={bank.flag} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#efe6d0] px-2 py-0.5 text-[10px] font-medium text-[#75551c]">
                          <Lock className="size-2.5" /> Isolado
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-lh-fg">{bank.company}</p>
                      <p className="text-[11px] text-lh-muted">{bank.bank}</p>
                      <p className="lh-mono mt-3 text-sm font-semibold text-lh-fg">{bank.balance}</p>
                      <p className="mt-1 text-[11px] text-[#75551c]">{bank.note}</p>
                    </div>
                  ))}
                </div>

                {/* Legacy friction artifacts */}
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-lh-line bg-[#fcfcf9] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-lh-fg">
                      <FileSpreadsheet className="size-4 text-lh-muted" />
                      Posição de caixa do grupo.xlsx
                    </div>
                    <p className="mt-1.5 text-xs text-lh-muted">
                      Atualizado sexta-feira manualmente. Saldos desatualizados no fim de semana.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
                      <span className="inline-flex items-center gap-1.5">
                        <KeyRound className="size-4" />
                        Token 3 de 4
                      </span>
                      <span className="lh-mono rounded bg-white px-2 py-0.5 text-xs font-bold">
                        482 193
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-amber-900">
                      Mesa de tesouraria (08:52): cotação USD/MXN válida por 15 min antes do corte das 15:00.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-red-950">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="size-4" />
                        Transferência internacional
                      </span>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                        Pendente
                      </span>
                    </div>
                    <p className="lh-mono mt-1.5 text-sm font-bold text-red-950">USD 240.000,00</p>
                    <p className="mt-0.5 text-xs text-red-900">
                      Data-valor: quarta-feira · Tarifas compartilhadas
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-lh-muted">
                  {landingCopy.problem.legacyCaption}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="pagwave"
                initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -8 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-lh-line bg-[#2a2b28] p-4 text-white sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-[#cfa84a]">
                        <Layers className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">Uma camada para todas as suas empresas</p>
                        <p className="text-xs text-white/65">
                          Um só login · Permissões por entidade · Conciliação contábil automática
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#cfa84a]/20 px-3 py-1 text-xs font-medium text-[#e3d5b8]">
                      <CheckCircle2 className="size-3.5" />
                      Caixa consolidado em tempo real
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {PAGWAVE_ENTITIES.map((entity) => (
                      <div
                        key={entity.company}
                        className="rounded-xl border border-white/12 bg-white/6 p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <CountryFlag code={entity.flag} />
                          <span className="lh-mono rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/85">
                            {entity.rail}
                          </span>
                        </div>
                        <p className="mt-2.5 text-xs font-semibold text-white">{entity.company}</p>
                        <p className="text-[11px] text-white/60">{entity.place}</p>
                        <p className="lh-mono mt-3 text-sm font-semibold text-white">{entity.balance}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant Intercompany Settlement Highlight */}
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-lh-line bg-[#f7f6f1] p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1e1f1d] text-[#cfa84a]">
                      <ArrowLeftRight className="size-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-lh-fg">
                        <span>Entre suas empresas</span>
                        <ArrowRight className="size-3.5 text-lh-muted" />
                        <span>De Delaware para Monterrey</span>
                      </div>
                      <p className="mt-0.5 text-xs text-lh-muted">
                        Liquidada em segundos, domingo às 02:14 — sem corte bancário nem mesa de câmbio.
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="lh-mono text-base font-semibold text-lh-fg">USD 240.000,00</p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#2a7048]">
                      <span className="size-1.5 rounded-full bg-[#2a7048]" />
                      Liquidada · 0 tarifas ocultas
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-lh-muted">
                  {landingCopy.problem.pagwaveCaption}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

