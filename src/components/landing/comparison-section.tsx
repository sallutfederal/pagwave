import { Check, Minus } from "lucide-react";

import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function ComparisonSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.comparison.eyebrow}</p>
          <h2 className="lh-h2 mt-3 max-w-2xl text-lh-fg">{landingCopy.comparison.title}</h2>
          <p className="lh-lead mt-4 max-w-xl text-lh-muted">{landingCopy.comparison.lead}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="lh-ring mt-10 overflow-hidden rounded-card bg-white">
            {/* Header row */}
            <div className="hidden grid-cols-[0.9fr_1.15fr_1.15fr] border-b border-lh-line bg-[#f7f6f1] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-lh-muted md:grid">
              <span>Dimensão</span>
              <span>Sua estrutura atual</span>
              <span className="text-lh-fg">Com a pagwave</span>
            </div>

            <div className="divide-y divide-lh-line">
              {landingCopy.comparison.rows.map((row) => (
                <div
                  key={row.topic}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[0.9fr_1.15fr_1.15fr] md:items-center"
                >
                  <div className="font-display text-sm font-medium text-lh-fg">{row.topic}</div>

                  <div className="flex items-start gap-2.5 text-xs leading-relaxed text-lh-muted sm:text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lh-bg text-lh-muted">
                      <Minus className="size-3" />
                    </span>
                    <div>
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-lh-muted md:hidden">
                        Sua estrutura atual
                      </span>
                      {row.legacy}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#2a7048]/[0.06] p-3 text-xs font-medium leading-relaxed text-lh-fg sm:text-sm md:bg-transparent md:p-0">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#2a7048] text-white">
                      <Check className="size-3" />
                    </span>
                    <div>
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#2a7048] md:hidden">
                        Com a pagwave
                      </span>
                      {row.pagwave}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs text-lh-muted">{landingCopy.comparison.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}

