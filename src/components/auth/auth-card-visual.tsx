"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowUpRight, CheckCircle2, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useState, type MouseEvent } from "react";

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface AuthCardVisualProps {
  mode: "login" | "create";
}

export function AuthCardVisual({ mode }: AuthCardVisualProps) {
  const [activeCurrency, setActiveCurrency] = useState<"USD" | "EUR" | "BRL">("USD");

  // Mouse tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    damping: 25,
    stiffness: 250,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    damping: 25,
    stiffness: 250,
  });

  const sheenX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const sheenY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const balanceMap = {
    USD: "$ 148,920.40",
    EUR: "€ 136,450.80",
    BRL: "R$ 782,190.00",
  };

  return (
    <div className="relative flex flex-col justify-between h-full p-8 lg:p-12 text-lh-fg overflow-hidden select-none">
      {/* Background Ambient Glow inside showcase */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-lh-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-lh-accent-2/20 blur-3xl" />

      {/* Header Info */}
      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-lh-line bg-white/[0.04] px-3 py-1 text-xs font-medium text-lh-muted backdrop-blur-md">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Pagwave Cloud Core v2.4</span>
          <span className="text-white/20">|</span>
          <span className="text-lh-accent flex items-center gap-1">
            <Zap className="size-3" /> 0.02s Latency
          </span>
        </div>

        <h2 className="lh-display text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
          {mode === "login" ? (
            <>
              Instant liquidity. <br />
              <span className="bg-linear-to-r from-lh-accent via-lh-accent-2 to-lh-accent-3 bg-clip-text text-transparent">
                Institutional control.
              </span>
            </>
          ) : (
            <>
              The modern standard for <br />
              <span className="bg-linear-to-r from-lh-accent via-lh-accent-2 to-lh-accent-3 bg-clip-text text-transparent">
                global capital movement.
              </span>
            </>
          )}
        </h2>

        <p className="text-sm xl:text-base text-lh-muted max-w-md leading-relaxed">
          {mode === "login"
            ? "Sign in to monitor multi-currency reserves, deploy smart corporate cards, and execute sub-second settlements."
            : "Create your corporate or creator account today. Issue physical and virtual black cards with zero maintenance fees."}
        </p>
      </div>

      {/* Center 3D Interactive Card Showcase */}
      <div
        className="relative my-8 xl:my-10 perspective-[1000px] flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative w-full max-w-[430px] aspect-[1.58/1] rounded-[24px] p-6 sm:p-7 transition-all duration-200 cursor-grab active:cursor-grabbing border border-white/15 shadow-2xl shadow-black/80 bank-card-dark overflow-hidden group"
        >
          {/* Holographic foil sheen */}
          <motion.div
            style={{
              background: `radial-gradient(circle at ${sheenX} ${sheenY}, rgba(255,255,255,0.22) 0%, rgba(76,141,255,0.18) 35%, transparent 70%)`,
            }}
            className="pointer-events-none absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity"
          />

          {/* Micro dot grid */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Card Top Row: Logo & Currency Toggle */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="text-sm font-semibold tracking-wider text-white/90 uppercase font-mono">
                PAGWAVE OBSIDIAN
              </span>
            </div>

            {/* Currency selector chips */}
            <div className="flex items-center gap-1 rounded-full bg-black/40 border border-white/10 p-0.5 backdrop-blur-md">
              {(["USD", "EUR", "BRL"] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setActiveCurrency(curr)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-all",
                    activeCurrency === curr
                      ? "bg-lh-accent text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Chip & Contactless */}
          <div className="relative z-10 my-4 flex items-center gap-3">
            {/* Golden Metallic Chip */}
            <div className="relative w-12 h-9 rounded-md bg-linear-to-br from-[#e0c068] via-[#ffd700] to-[#b38600] p-0.5 shadow-md border border-[#fff2a8]/60 overflow-hidden">
              <div className="w-full h-full rounded-[4px] border border-black/30 flex items-center justify-between px-1">
                <div className="w-2.5 h-full border-r border-black/30" />
                <div className="w-2 h-2 rounded-full border border-black/30" />
                <div className="w-2.5 h-full border-l border-black/30" />
              </div>
            </div>

            {/* Contactless waves SVG */}
            <svg
              className="size-5 text-white/60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M8.5 16.5a5 5 0 0 1 0-7" />
              <path d="M12 19a8.5 8.5 0 0 1 0-12" />
              <path d="M15.5 21.5a12 12 0 0 1 0-17" />
            </svg>
          </div>

          {/* Balance display */}
          <div className="relative z-10 my-auto">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block font-mono">
              Available Treasury
            </span>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums drop-shadow-sm font-sans">
              {balanceMap[activeCurrency]}
            </p>
          </div>

          {/* Card Bottom Row: Number, Holder, Mastercard/Visa */}
          <div className="relative z-10 mt-auto flex items-end justify-between pt-2">
            <div>
              <p className="text-xs sm:text-sm font-mono tracking-widest text-white/80 font-medium">
                •••• •••• •••• 8842
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider font-mono mt-0.5">
                ALEXANDER VANCE · 09/31
              </p>
            </div>

            {/* Holographic interlocking circles */}
            <div className="flex items-center -space-x-2.5 opacity-90">
              <div className="size-6 sm:size-7 rounded-full bg-rose-500/90 shadow-lg backdrop-blur-xs" />
              <div className="size-6 sm:size-7 rounded-full bg-amber-400/90 shadow-lg backdrop-blur-xs mix-blend-screen" />
            </div>
          </div>
        </motion.div>

        {/* Floating Telemetry Pill 1 (Top Right) */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-2 sm:-right-4 hidden sm:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-lh-bg-soft/90 px-3.5 py-2 shadow-xl backdrop-blur-xl"
        >
          <div className="grid size-7 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <ArrowUpRight className="size-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-white">+$24,500.00 USD</p>
            <p className="text-[10px] text-lh-muted">Instant Stripe Wire</p>
          </div>
        </motion.div>

        {/* Floating Telemetry Pill 2 (Bottom Left) */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -bottom-4 -left-2 sm:-left-4 hidden sm:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-lh-bg-soft/90 px-3.5 py-2 shadow-xl backdrop-blur-xl"
        >
          <div className="grid size-7 place-items-center rounded-xl bg-lh-accent/15 text-lh-accent">
            <ShieldCheck className="size-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-white">SOC 2 Type II</p>
            <p className="text-[10px] text-lh-muted">Quantum Vault Active</p>
          </div>
        </motion.div>
      </div>

      {/* Footer Metrics / Testimonial */}
      <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
        <div>
          <p className="lh-numeric text-lg xl:text-xl font-bold text-white tracking-tight">$14.8M+</p>
          <p className="text-[11px] text-lh-muted">Settled Today</p>
        </div>
        <div>
          <p className="lh-numeric text-lg xl:text-xl font-bold text-white tracking-tight">99.999%</p>
          <p className="text-[11px] text-lh-muted">Core Uptime</p>
        </div>
        <div>
          <p className="lh-numeric text-lg xl:text-xl font-bold text-white tracking-tight">180+ Countries</p>
          <p className="text-[11px] text-lh-muted">Global Reach</p>
        </div>
      </div>
    </div>
  );
}
