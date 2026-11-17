import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { LogoLockup } from "@/components/brand/logo";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export function LegalPageShell({
  badge,
  title,
  updatedAt,
  summary,
  sections,
  otherHref,
  otherLabel,
}: {
  badge: string;
  title: string;
  updatedAt: string;
  summary: string;
  sections: LegalSection[];
  otherHref: string;
  otherLabel: string;
}) {
  return (
    <div className="lh-bg lh-grain min-h-dvh text-lh-fg selection:bg-lh-accent selection:text-white relative overflow-x-hidden">
      <div className="lh-grid pointer-events-none fixed inset-0 z-0 opacity-50" />
      <div className="lh-aurora pointer-events-none fixed inset-0 z-0">
        <span className="lh-aurora-a" />
        <span className="lh-aurora-b" />
      </div>

      <header className="relative z-20 border-b border-white/[0.06] bg-lh-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85">
            <LogoLockup size={30} wordmarkClassName="text-white text-base font-semibold" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={otherHref}
              className="text-xs text-white/70 transition-colors hover:text-white"
            >
              {otherLabel}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-lh-muted transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              <span>Início</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/75">
            <ShieldCheck className="size-3.5 text-[#e7d599]" />
            <span>{badge}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-xs text-white/50">Última atualização: {updatedAt}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/75">{summary}</p>

          <div className="my-8 h-px bg-white/10" />

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-2.5">
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                {section.paragraphs.map((text, index) => (
                  <p key={index} className="text-sm leading-relaxed text-white/70">
                    {text}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

