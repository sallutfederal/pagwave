import type { Metadata } from "next";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { Button } from "@/components/ui/button";
import { getTransactions } from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Transactions — pagwave",
};

export default async function TransactionsPage() {
  const { transactions } = await getTransactions();

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every movement on your cards and accounts, newest first."
        actions={
          <Button variant="outline">
            <Download /> Export CSV
          </Button>
        }
      />

      <TransactionsView transactions={transactions} />
    </div>
  );
}