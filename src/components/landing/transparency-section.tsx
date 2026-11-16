import { KeyRound, Landmark, ShieldCheck, Wallet } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

const ICONS = [Landmark, KeyRound, Wallet, ShieldCheck];

export function TransparencySection() {
  return (
    <section id="seguranca" className="scroll-mt-24 border-t border-lh-line bg-lh-bg-soft/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="lh-eyebrow text-[#a57a2e]">{landingCopy.transparency.eyebrow}</p>
          <h2 className="lh-h2 mt-3 max-w-2xl text-lh-fg">{landingCopy.transparency.title}</h2>
          <p className="lh-lead mt-4 max-w-xl text-lh-muted">{landingCopy.transparency.lead}</p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingCopy.transparency.items.map((item, idx) => {
            const Icon = ICONS[idx] ?? ShieldCheck;
            return (
              <RevealItem key={item.title}>
                <article className="lh-ring flex h-full flex-col rounded-card bg-white p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-[#f7f6f1] text-lh-fg">
                      <Icon className="size-4" />
                    </span>
                    <span className="rounded-full border border-lh-line bg-[#f7f6f1] px-2.5 py-0.5 text-[10px] font-medium text-lh-muted">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="lh-h3 mt-5 text-lh-fg">{item.title}</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-lh-muted sm:text-sm">
                    {item.description}
                  </p>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal delay={0.1}>
          <p className="mt-6 text-xs font-medium text-lh-muted">
            {landingCopy.transparency.disclaimer}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

