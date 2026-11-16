import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function Cta() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-[#1e1f1d] px-7 py-14 text-white shadow-xl sm:px-14 sm:py-16 lg:pr-[340px]">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 right-10 size-80 rounded-full bg-[#cfa84a]/16 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 left-0 size-80 rounded-full bg-[#2a7048]/18 blur-3xl"
            />

            <div className="relative max-w-xl">
              <p className="lh-eyebrow text-[#cfa84a]">{landingCopy.cta.eyebrow}</p>
              <h2 className="lh-h2 mt-3 text-[#f2f1ea]">{landingCopy.cta.title}</h2>
              <p className="lh-lead mt-4 text-white/75">{landingCopy.cta.lead}</p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={landingCopy.cta.primary.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[#cfa84a] px-6 py-3 text-sm font-medium text-[#1e1f1d] transition-colors hover:bg-[#d7b55f]"
                >
                  {landingCopy.cta.primary.label}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={landingCopy.cta.secondary.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  {landingCopy.cta.secondary.label}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/65">
                {landingCopy.cta.badges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-[#cfa84a]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Angled 3D metal corporate card */}
            <div
              aria-hidden="true"
              className="pointer-events-none mt-10 hidden w-[320px] select-none lg:block lg:absolute lg:-right-8 lg:-bottom-10 lg:mt-0 lg:-rotate-12"
            >
              <div className="relative overflow-hidden rounded-[20px] border border-white/15 bg-gradient-to-br from-[#2d2e2a] via-[#1c1d1b] to-[#111210] p-6 text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.65)]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-45"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 36%, rgba(255,255,255,0.28) 50%, transparent 64%)",
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="font-display text-sm font-medium tracking-tight text-white/95">
                    pagwave
                  </span>
                  <span className="rounded-full border border-[#cfa84a]/40 bg-[#cfa84a]/15 px-2 py-0.5 text-[10px] font-medium text-[#e3d5b8]">
                    Metal
                  </span>
                </div>
                <div className="relative mt-7 flex items-center justify-between">
                  <span className="h-6 w-8 rounded-[5px] border border-[#e3d5b8]/45 bg-gradient-to-br from-[#e3d5b8] to-[#a57a2e]" />
                  <span className="lh-mono text-xs text-white/60">•••• 8842</span>
                </div>
                <div className="relative mt-8 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-white/50">Corporate Global</p>
                    <p className="text-xs font-medium tracking-wide text-white/90">
                      SOLANO GROUP INC.
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold tracking-wider text-white/90">
                    VISA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
