import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/server/dashboard-data";

export const metadata: Metadata = {
  title: "Products — pagwave",
};

export default async function ProductsPage() {
  const { products } = await getProducts();

  return (
    <div>
      <PageHeader
        title="Products"
        description="Subscriptions, cards and passes linked to this account."
        actions={
          <Button>
            <Plus /> Add product
          </Button>
        }
      />

      <ProductGrid products={products} />
    </div>
  );
}