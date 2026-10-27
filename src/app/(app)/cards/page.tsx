import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';

import { CardLimits } from '@/components/cards/card-limits';
import { CardRequestDialog } from '@/components/cards/card-request-dialog';
import { UserCards } from '@/components/cards/user-cards';
import { BankCardTile } from '@/components/dashboard/bank-card';
import { PageHeader } from '@/components/layout/page-header';
import { SectionHeader } from '@/components/dashboard/section-header';
import { TransactionListItem } from '@/components/shared/transaction-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCardSettings, getDashboardSummary, getTransactions } from '@/server/dashboard-data';

export const metadata: Metadata = {
  title: 'Cards — pagwave',
};

export default async function CardsPage() {
  const [summary, { settings }, { transactions }] = await Promise.all([
    getDashboardSummary(),
    getCardSettings(),
    getTransactions(5),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Cards"
        description="Balances, limits and activity of the cards linked to this account."
        actions={
          <Button variant="outline">
            <CreditCard /> Freeze all
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summary.cards.map(card => (
          <BankCardTile key={card.id} card={card} />
        ))}

        <UserCards />

        <CardRequestDialog />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <CardLimits cards={summary.cards} settings={settings} />
        </div>

        <div className="space-y-4 xl:col-span-5">
          <SectionHeader
            title="Card activity"
            actionLabel="All transactions"
            actionHref="/transactions"
          />
          <div className="space-y-3">
            {transactions.map(transaction => (
              <TransactionListItem key={transaction.id} transaction={transaction} showDate />
            ))}
          </div>

          <Card className="flex items-center gap-4 p-5">
            <span className="bg-accent-soft text-accent grid size-11 shrink-0 place-items-center rounded-2xl">
              <CreditCard className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium">Instant freeze</p>
              <p className="text-muted-foreground text-xs">
                Block a card in one tap — payments stop immediately.
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto shrink-0">
              Learn more
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
