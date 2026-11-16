import { ArrowRight, CheckCircle2, CreditCard, Fingerprint, Globe, Layers } from "lucide-react";
import Link from "next/link";

import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

const ENTITY_FLAGS: Record<string, FlagCode> = {
  "Inc.": "US",
  "S.A. de C.V.": "MX",
  "Ltda.": "BR",
  "Ltd.": "GB",
  "B.V.": "EU",
  "Pvt. Ltd.": "IN",
  "FZ-LLC": "AE",
};

export function CardsAndScale() {
  return (
    <>
      {/* Cards spotlight */}
      <section id="cartoes" className="scroll-mt-24 border-y border-lh-line bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Reveal>
            <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.cardsSection.eyebrow}</p>
            <h2 className="lh-h2 mt-3 text-lh-fg">{landingCopy.cardsSection.title}</h2>
            <p className="lh-lead mt-4 text-lh-muted">{landingCopy.cardsSection.lead}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={landingCopy.cardsSection.cta.href}
                className="inline-flex items-center gap-2 rounded-full bg-[#cfa84a] px-6 py-3 text-sm font-medium text-[#1e1f1d] shadow-xs transition-colors hover:bg-[#d7b55f]"
              >
                <CreditCard className="size-4" />
                {landingCopy.cardsSection.cta.label}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Virtual card & monthly limit */}
              <div className="lh-ring rounded-card bg-[#f7f6f1] p-5">
                <div className="bank-card-dark relative overflow-hidden rounded-2xl p-4 text-white">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 36%, rgba(255,255,255,0.28) 50%, transparent 64%)",
                    }}
                  />
                  <div className="relative flex items-center justify-between text-[10px] text-white/70">
                    <span>Virtual · Visa</span>
                    <span className="font-display text-xs font-bold text-white">VISA</span>
                  </div>
                  <p className="relative mt-6 text-sm font-medium">Ana Ruiz</p>
                  <p className="relative text-[11px] text-white/65">Marketing · Solano Mexico</p>
                  <p className="lh-mono relative mt-2 text-xs text-white/80">•••• 8842</p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-lh-muted">Limite mensal</span>
                    <span className="lh-mono font-semibold text-lh-fg">USD 15.500 / 25.000</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-lh-bg-soft">
                    <div className="h-full w-[62%] rounded-full bg-[#cfa84a]" />
                  </div>
                </div>
              </div>

              {/* Browser extension & passkey approval */}
              <div className="lh-ring flex flex-col justify-between rounded-card bg-[#f7f6f1] p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efe6d0] px-2.5 py-1 text-[11px] font-medium text-[#a57a2e]">
                      <Globe className="size-3" /> Extensão do navegador
                    </span>
                    <span className="lh-mono text-[10px] text-lh-muted">Auto-fill</span>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-lh-line bg-white p-3.5 text-xs">
                    <p className="font-semibold text-lh-fg">Dados do cartão preenchidos no checkout</p>
                    <div className="flex items-center justify-between rounded-lg bg-[#f7f6f1] px-2.5 py-2">
                      <span className="lh-mono text-[11px] text-lh-muted">4532 •••• •••• 8842</span>
                      <span className="lh-mono text-[11px] text-lh-muted">09/29</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#2a7048]/25 bg-[#2a7048]/[0.06] px-3.5 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2a7048] text-white">
                    <Fingerprint className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#18442b]">
                      Confirmado com sua chave de acesso
                    </p>
                    <p className="text-[11px] text-[#2a7048]">Aprovação biométrica instantânea</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Scale stages */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.scale.eyebrow}</p>
            <h2 className="lh-h2 mt-3 max-w-2xl text-lh-fg">{landingCopy.scale.title}</h2>
            <p className="mt-2 font-display text-lg font-medium text-lh-muted sm:text-xl">
              {landingCopy.scale.subtitle}
            </p>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3">
            {landingCopy.scale.stages.map((stage) => (
              <RevealItem key={stage.tier}>
                <article className="lh-ring flex h-full flex-col justify-between rounded-card bg-white p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="lh-h3 text-lh-fg">{stage.tier}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f6f1] px-2.5 py-1 text-[11px] font-medium text-lh-fg">
                        <Layers className="size-3 text-[#a57a2e]" />
                        Um só login
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 rounded-2xl bg-[#2a2b28] p-3">
                      {stage.entities.map((entity, idx) => (
                        <span
                          key={`${stage.tier}-${entity}-${idx}`}
                          className="lh-mono inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#1e1f1d] shadow-xs"
                        >
                          <CountryFlag
                            code={ENTITY_FLAGS[entity] ?? "US"}
                            className="h-[11px] w-[15px] rounded-[2px]"
                          />
                          {entity}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-lh-muted">{stage.description}</p>
                  </div>

                  <p className="mt-6 inline-flex items-center gap-1.5 border-t border-lh-line pt-4 text-xs font-medium text-[#2a7048]">
                    <CheckCircle2 className="size-3.5" />
                    {stage.cta}
                  </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}

