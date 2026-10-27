import type { Metadata } from "next";
import { Suspense } from "react";

import { BankCardTile } from "@/components/dashboard/bank-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatisticCard } from "@/components/dashboard/statistic-card";
import { TransactionsList } from "@/components/dashboard/transactions-list";
import {
  getDashboardSummary,
  getRecentSales,
  getStatistic,
  getTransactions,
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
  const [{ sales }, { transactions }, statistic] = await Promise.all([
    getRecentSales(),
    getTransactions(5),
    getStatistic("this-month"),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      <div className="space-y-7 xl:col-span-8">
        <section className="space-y-5">
          <SectionHeader title="Cards" actionHref="/cards" />
          <div className="grid gap-5 sm:grid-cols-2">
            {summary.cards.map((card) => (
              <BankCardTile key={card.id} card={card} />
            ))}
          </div>
        </section>

        <QuickActions actions={summary.quickActions} />

        <section className="space-y-2">
          <SectionHeader title="Recent Sales" actionHref="/transactions" />
          <RecentSales sales={sales} />
        </section>
      </div>

      <div className="space-y-6 xl:col-span-4">
        <StatisticCard initial={statistic} />
        <TransactionsList transactions={transactions} />
      </div>
    </div>
  );
}