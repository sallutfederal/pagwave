import type { Metadata } from "next";

import { TransactionsView } from "@/components/transactions/transactions-view";
import { getTransactions } from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Transações — pagwave",
};

export default async function TransactionsPage() {
  const { transactions } = await getTransactions();

  return <TransactionsView initialTransactions={transactions} />;
}
