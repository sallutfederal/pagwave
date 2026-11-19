import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatisticCard } from "@/components/dashboard/statistic-card";
import { TransactionsList } from "@/components/dashboard/transactions-list";
import { WalletsStrip } from "@/components/dashboard/wallets-strip";
import { getMessages } from "@/lib/i18n";
import { getCurrentUser } from "@/server/auth";
import {
  getDashboardSummary,
  getRecentSales,
  getStatistic,
  getTransactions,
  getWallets,
} from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Painel — pagwave",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const [user, summary, { sales }, { transactions }, statistic, { wallets }] =
    await Promise.all([
      getCurrentUser(),
      getDashboardSummary(),
      getRecentSales(),
      getTransactions(5),
      getStatistic("this-month"),
      getWallets(),
    ]);
  const msg = getMessages(user.locale);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      <div className="space-y-7 xl:col-span-8">
        <section className="space-y-5">
          <SectionHeader
            title={msg.dashboard.walletsTitle}
            actionLabel={msg.dashboard.manage}
            actionHref="/wallet"
          />
          <WalletsStrip wallets={wallets} />
        </section>

        <QuickActions actions={summary.quickActions} />

        <section className="space-y-2">
          <SectionHeader
            title={msg.dashboard.recentEntries}
            actionLabel={msg.dashboard.seeAll}
            actionHref="/transactions"
          />
          <RecentSales sales={sales} />
        </section>
      </div>

      <div className="space-y-6 xl:col-span-4">
        <StatisticCard initial={statistic} />
        <section className="space-y-3">
          <SectionHeader
            title={msg.dashboard.recentTransactions}
            actionLabel={msg.dashboard.seeAll}
            actionHref="/transactions"
          />
          <TransactionsList transactions={transactions} />
        </section>
      </div>
    </div>
  );
}
