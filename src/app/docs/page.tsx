import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { LogoLockup } from "@/components/brand/logo";
import { DocsView } from "@/components/docs/docs-view";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Documentação API v1 — pagwave",
  description:
    "Referência técnica oficial da API pagwave v1: autenticação por chave, cobranças multi-moeda, saques, saldo e webhooks HMAC.",
};

export default function DocsPage() {
  return (
    <div className="bg-background app-atmosphere min-h-dvh">
      <header className="bg-background/80 border-line sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85">
              <LogoLockup size={28} />
            </Link>
            <span className="bg-accent-soft text-accent hidden items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-flex">
              <BookOpen className="size-3.5" />
              API v1 Docs
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/integrations"
              className="border-line bg-surface text-foreground hover:border-foreground/25 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="font-display text-foreground text-3xl font-semibold tracking-tight">
            Documentação API
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Referência completa para integrar cobranças multi-moeda, transferências, saques, saldo e
            webhooks HMAC com a pagwave.
          </p>
        </header>

        <DocsView />
      </main>
    </div>
  );
}
