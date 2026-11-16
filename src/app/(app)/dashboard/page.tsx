import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BankCardTile } from "@/components/dashboard/bank-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatisticCard } from "@/components/dashboard/statistic-card";
import { TransactionsList } from "@/components/dashboard/transactions-list";
import { WalletsStrip } from "@/components/dashboard/wallets-strip";
import {
  getDashboardSummary,
  getRecentSales,
  getStatistic,
  getTransactions,
  getWallets,
} from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard — pagwave",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const summary = await getDashboardSummary();
  const [{ sales }, { transactions }, statistic, { wallets }] = await Promise.all([
    getRecentSales(),
    getTransactions(5),
    getStatistic("this-month"),
    getWallets(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      <div className="space-y-7 xl:col-span-8">
        <section className="space-y-5">
          <SectionHeader title="Wallets" />
          <WalletsStrip wallets={wallets} />
        </section>

        <section className="space-y-5">
          <SectionHeader title="Cards" actionHref="/cards" />
          {summary.cards.length === 0 ? (
            <Link
              href="/cards"
              className="border-line bg-surface/60 text-muted-foreground hover:border-accent/40 hover:text-foreground flex items-center gap-4 rounded-card border border-dashed p-5 transition-colors"
            >
              <span className="bg-accent-soft text-accent grid size-11 shrink-0 place-items-center rounded-2xl">
                <CreditCard className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">No cards issued yet</p>
                <p className="text-xs">Issue your first virtual card linked to your USD, EUR or BRL wallet.</p>
              </div>
            </Link>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {summary.cards.slice(0, 2).map((card) => (
                <BankCardTile key={card.id} card={card} />
              ))}
            </div>
          )}
        </section>

        <QuickActions actions={summary.quickActions} />

        <section className="space-y-2">
          <SectionHeader title="Recent Sales" actionHref="/transactions" />
          <RecentSales sales={sales} />
        </section>
      </div>

      <div className="space-y-6 xl:col-span-4">
        <StatisticCard initial={statistic} />
        <section className="space-y-3">
          <SectionHeader title="Recent transactions" actionHref="/transactions" />
          <TransactionsList transactions={transactions} />
        </section>
      </div>
    </div>
  );
}