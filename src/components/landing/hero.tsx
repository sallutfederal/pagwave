"use client";

import { ArrowUpRight, Github, Play } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { Reveal, Spotlight } from "@/components/landing/motion-primitives";
import { buttonVariants } from "@/components/ui/button";
import { landingCopy } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

/**
 * A hand-built mini version of the dashboard used as the hero visual: zero
 * images, all CSS, so the LCP is text instead of a screenshot.
 */
function MiniDashboard() {
  return (
    <div className="lh-ring overflow-hidden rounded-card bg-lh-bg-soft shadow-2xl shadow-black/60">
      <div className="flex items-center gap-2 border-b border-lh-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="lh-mono ml-3 text-[10px] text-lh-muted">localhost:3000/dashboard</span>
      </div>

      <div className="grid grid-cols-[52px_minmax(0,1fr)]">
        <div className="space-y-2.5 border-r border-lh-line bg-black/30 p-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "size-6 rounded-md",
                index === 0 ? "bg-lh-accent/80" : "bg-white/8",
              )}
            />
          ))}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-full bg-linear-to-br from-lh-accent-2 to-lh-accent-3" />
            <div className="space-y-1">
              <span className="block h-2 w-24 rounded-full bg-white/25" />
              <span className="block h-1.5 w-32 rounded-full bg-white/10" />
            </div>
            <span className="ml-auto h-6 w-28 rounded-full bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="lh-ring bank-card-dark relative aspect-[1.68/1] overflow-hidden rounded-inner p-3">
              <span className="block h-1.5 w-12 rounded-full bg-white/25" />
              <span className="absolute bottom-3 left-3 block text-base font-semibold tracking-tight text-white">
                $ 15,780.0
              </span>
            </div>
            <div className="lh-ring relative aspect-[1.68/1] overflow-hidden rounded-inner bg-white p-3">
              <span className="block h-1.5 w-12 rounded-full bg-slate-300" />
              <span className="absolute bottom-3 left-3 block text-base font-semibold tracking-tight text-slate-900">
                ₺123,424.0
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
            <div className="space-y-2 rounded-inner border border-lh-line p-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="size-5 rounded-full bg-white/12" />
                  <span className="h-1.5 flex-1 rounded-full bg-white/12" />
                  <span
                    className={cn(
                      "h-4 w-12 rounded-full",
                      index === 0 ? "bg-success/25" : index === 1 ? "bg-warning/25" : "bg-danger/25",
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="relative grid place-items-center rounded-inner border border-lh-line p-3">
              <svg viewBox="0 0 100 100" className="size-20 -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#7fb2ff" strokeWidth="13" strokeLinecap="round" strokeDasharray="150 90" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2b3a4a" strokeWidth="13" strokeLinecap="round" strokeDasharray="90 150" strokeDashoffset="-160" />
              </svg>
              <span className="lh-numeric absolute text-[9px] font-semibold text-white">$14,810</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const previewY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const previewScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      <div className="lh-aurora" aria-hidden>
        <span className="lh-aurora-a" />
        <span className="lh-aurora-b" />
        <span className="lh-aurora-c" />
      </div>
      <div className="lh-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <motion.div className="lh-parallax" style={{ y: copyY, opacity: copyOpacity }}>
          <Reveal>
            <p className="lh-eyebrow text-lh-accent">{landingCopy.hero.eyebrow}</p>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="lh-display text-lh-fg mt-5">{landingCopy.hero.title}</h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="lh-lead text-lh-muted mt-6 max-w-xl">{landingCopy.hero.lead}</p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={landingCopy.hero.primaryCta.href} className={buttonVariants({ size: "default" })}>
                <Play />
                {landingCopy.hero.primaryCta.label}
              </Link>
              <a
                href={landingCopy.hero.secondaryCta.href}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline", size: "default", className: "border-lh-line bg-lh-surface text-lh-fg hover:bg-lh-surface-strong" })}
              >
                <Github />
                {landingCopy.hero.secondaryCta.label}
                <ArrowUpRight />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="lh-mono text-lh-muted mt-5 text-xs">{landingCopy.hero.note}</p>
          </Reveal>
        </motion.div>

        <motion.div
          className="lh-parallax"
          style={{ y: previewY, scale: previewScale }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Spotlight className="lh-ring relative rounded-card">
            <MiniDashboard />
          </Spotlight>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {landingCopy.hero.preview.badges.map((badge) => (
              <span
                key={badge}
                className="lh-mono rounded-full border border-lh-line bg-lh-surface px-2.5 py-1 text-[10px] text-lh-muted"
              >
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}