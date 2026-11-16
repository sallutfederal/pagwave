"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CountryFlag } from "@/components/landing/country-flag";
import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function MarketsSection() {
  const [query, setQuery] = useState("");

  const filteredPayouts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return landingCopy.markets.payouts;
    return landingCopy.markets.payouts.filter(
      (item) =>
        item.country.toLowerCase().includes(q) ||
        item.currency.toLowerCase().includes(q) ||
        item.rails.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section id="mercados" className="scroll-mt-24 border-y border-lh-line bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.markets.eyebrow}</p>
          <h2 className="lh-h2 mt-3 max-w-2xl text-lh-fg">{landingCopy.markets.title}</h2>
          <p className="lh-lead mt-4 max-w-2xl text-lh-muted">{landingCopy.markets.lead}</p>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Receiving accounts (6 core markets) */}
          <Reveal>
            <div className="lh-ring h-full rounded-card bg-[#f7f6f1] p-6 sm:p-7">
              <h3 className="lh-h3 text-lh-fg">{landingCopy.markets.receivingTitle}</h3>
              <p className="mt-1 text-xs text-lh-muted">{landingCopy.markets.receivingSubtitle}</p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {landingCopy.markets.receiving.map((item) => (
                  <div
                    key={item.country}
                    className="flex items-center justify-between rounded-2xl border border-lh-line bg-white px-4 py-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <CountryFlag code={item.code} />
                      <div>
                        <p className="text-xs font-semibold text-lh-fg">{item.country}</p>
                        <p className="lh-mono text-[10px] text-lh-muted">{item.rails}</p>
                      </div>
                    </div>
                    <span className="lh-mono rounded-lg bg-lh-bg px-2 py-1 text-[11px] font-bold text-lh-fg">
                      {item.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Local rail payouts (140+ countries) */}
          <Reveal delay={0.08}>
            <div className="lh-ring flex h-full flex-col justify-between rounded-card bg-[#f7f6f1] p-6 sm:p-7">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="lh-h3 text-lh-fg">{landingCopy.markets.payoutTitle}</h3>
                    <p className="mt-1 text-xs text-lh-muted">
                      {landingCopy.markets.payoutSubtitle}
                    </p>
                  </div>
                </div>

                {/* Quick search input */}
                <label className="relative mt-5 block">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-lh-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar país, moeda ou rede (ex: Pix, UPI, SGD)..."
                    className="w-full rounded-full border border-lh-line bg-white py-2.5 pr-4 pl-10 text-xs text-lh-fg placeholder:text-lh-muted focus:border-[#1e1f1d] focus:outline-none"
                  />
                </label>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {filteredPayouts.length > 0 ? (
                    filteredPayouts.map((item) => (
                      <div
                        key={item.country}
                        className="flex items-center justify-between rounded-xl border border-lh-line bg-white px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <CountryFlag code={item.code} />
                          <div>
                            <p className="text-xs font-semibold text-lh-fg">{item.country}</p>
                            <p className="lh-mono text-[10px] text-lh-muted">{item.rails}</p>
                          </div>
                        </div>
                        <span className="lh-mono text-[11px] font-bold text-lh-muted">
                          {item.currency}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 rounded-xl border border-dashed border-lh-line bg-white p-4 text-center text-xs text-lh-muted">
                      Nenhum mercado encontrado para &ldquo;{query}&rdquo; nesta amostra — suportamos mais de 140 países no painel.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-lh-line pt-4 text-xs">
                <span className="font-medium text-lh-muted">+140 países e +300 redes locais</span>
                <span className="lh-mono font-semibold text-[#2a7048]">Liquidação local</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

