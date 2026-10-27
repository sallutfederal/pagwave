import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="lh-eyebrow text-lh-accent">{landingCopy.features.eyebrow}</p>
        <h2 className="lh-h2 text-lh-fg mt-4 max-w-2xl">{landingCopy.features.title}</h2>
        <p className="lh-lead text-lh-muted mt-4 max-w-xl">{landingCopy.features.lead}</p>
      </Reveal>

      <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {landingCopy.features.items.map((feature) => {
          const Icon = feature.icon;

          return (
            <RevealItem key={feature.title}>
              <Link
                href={feature.href}
                className="lh-ring group relative flex h-full flex-col overflow-hidden rounded-card bg-lh-surface p-6 transition-colors duration-300 hover:bg-lh-surface-strong"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-lh-accent/25 to-lh-accent-2/25 text-lh-accent">
                    <Icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 -translate-x-1 text-lh-muted opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>

                <h3 className="lh-h3 text-lh-fg">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-lh-muted">
                  {feature.description}
                </p>

                <span className="lh-mono mt-5 text-[11px] text-lh-accent">{feature.meta}</span>
              </Link>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}