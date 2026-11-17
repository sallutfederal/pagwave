import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";

import { LogoLockup } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: {
    template: "%s — pagwave",
    default: "Authentication — pagwave",
  },
  description: "Secure authentication portal for Pagwave Financial Infrastructure.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lh-bg lh-grain min-h-dvh flex flex-col justify-between text-lh-fg selection:bg-lh-accent selection:text-white relative overflow-x-hidden">
      {/* Dynamic Cyber Grid Background */}
      <div className="lh-grid pointer-events-none fixed inset-0 z-0 opacity-60" />

      {/* Aurora Ambient Glow Blobs */}
      <div className="lh-aurora pointer-events-none fixed inset-0 z-0">
        <span className="lh-aurora-a" />
        <span className="lh-aurora-b" />
        <span className="lh-aurora-c" />
      </div>

      {/* Auth Navbar */}
      <header className="relative z-20 border-b border-white/[0.06] bg-lh-bg/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-85"
            aria-label="Pagwave Home"
          >
            <LogoLockup size={32} wordmarkClassName="text-white text-base font-semibold" />
          </Link>

          <div className="flex items-center gap-4">
            {/* Live Security Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-lh-muted backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck className="size-3.5 text-lh-accent" />
              <span>256-Bit Encrypted Vault</span>
            </div>

            {/* Back to website button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-lh-muted hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        {children}
      </main>

      {/* Auth Footer */}
      <footer className="relative z-20 border-t border-white/[0.06] bg-lh-bg/50 backdrop-blur-xl py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-8 text-xs text-lh-muted">
          <p>© 2026 pagwave Financial Technologies. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-white/50">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Systems Operational
            </span>
            <span className="text-white/20">·</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/terms#security" className="hover:text-white transition-colors">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
