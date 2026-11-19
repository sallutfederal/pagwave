import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";

import { LocalizedPageHeader } from "@/components/layout/localized-page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMessages } from "@/lib/i18n";
import { getCurrentUser } from "@/server/auth";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Cartões — pagwave",
};

export default function CardsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-white/[0.03]" />}>
      <CardsContent />
    </Suspense>
  );
}

async function CardsContent() {
  const user = await getCurrentUser();
  const mp = getMessages(user.locale).pages;

  return (
    <div className="space-y-7">
      <LocalizedPageHeader section="cards" />

      <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="bg-accent-soft text-accent grid size-12 place-items-center rounded-2xl">
          <CreditCard className="size-6" />
        </span>
        <div className="max-w-md space-y-1.5">
          <h2 className="text-foreground text-base font-semibold">{mp.cardsSoonTitle}</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">{mp.cardsSoonDesc}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Link href="/wallet" className={buttonVariants({ size: "sm" })}>
            {mp.goToWallet}
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "sm", variant: "outline" })}>
            {mp.backToDashboard}
          </Link>
        </div>
      </Card>
    </div>
  );
}
