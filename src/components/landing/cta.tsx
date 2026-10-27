import { ArrowUpRight, Play } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/landing/motion-primitives";
import { buttonVariants } from "@/components/ui/button";
import { landingCopy } from "@/lib/landing-copy";

export function Cta() {
  return (
    <section className="relative px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="lh-ring relative overflow-hidden rounded-card bg-lh-surface px-6 py-16 text-center sm:px-16 sm:py-20">
            <div className="lh-aurora" aria-hidden>
              <span className="lh-aurora-a -top-32 right-0" />
              <span className="lh-aurora-b -top-24 -left-24" />
            </div>

            <div className="relative">
              <h2 className="lh-h2 text-lh-fg">{landingCopy.cta.title}</h2>
              <p className="lh-lead text-lh-muted mx-auto mt-4 max-w-xl">{landingCopy.cta.lead}</p>

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href={landingCopy.cta.primary.href} className={buttonVariants({ size: "default" })}>
                  <Play />
                  {landingCopy.cta.primary.label}
                </Link>
                <a
                  href={landingCopy.cta.secondary.href}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "default",
                    className: "border-lh-line bg-lh-surface-strong text-lh-fg hover:bg-white/10",
                  })}
                >
                  {landingCopy.cta.secondary.label}
                  <ArrowUpRight />
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}