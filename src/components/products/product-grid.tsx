import { CalendarDays, MoreVertical } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { Product } from "@/lib/schemas";

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar data={product.avatar} name={product.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">{product.name}</p>
          <p className="text-muted-foreground truncate text-[11px]">
            {product.category} · {product.plan}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label={`${product.name} options`}>
          <MoreVertical />
        </Button>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <p className="text-foreground text-[22px] leading-none font-semibold tabular-nums">
          {product.price === 0
            ? "Free"
            : formatCurrency({
                amount: product.price,
                currency: product.currency,
                fractionDigits: 2,
              })}
          {product.price > 0 ? (
            <span className="text-muted-foreground ml-1 text-xs font-normal">
              /{product.interval === 1 ? "month" : "one-off"}
            </span>
          ) : null}
        </p>
        <Badge tone={statusTone(product.status)}>{product.status}</Badge>
      </div>

      <div className="border-line mt-5 flex items-center justify-between border-t pt-4">
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <CalendarDays className="size-3.5" />
          Renews {formatDate(product.renewsAt)}
        </span>
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </div>
    </Card>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}