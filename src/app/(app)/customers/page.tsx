import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { CustomersView } from "@/components/customers/customers-view";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Customers — pagwave",
};

export default async function CustomersPage() {
  const { customers } = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Who uses pagwave, on which plan and how much they generated."
        actions={
          <Button>
            <UserPlus /> Invite customer
          </Button>
        }
      />

      <CustomersView customers={customers} />
    </div>
  );
}