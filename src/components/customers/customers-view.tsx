"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { Customer } from "@/lib/schemas";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p> : null}
    </Card>
  );
}

export function CustomersView({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.email} ${customer.plan}`.toLowerCase().includes(needle),
    );
  }, [customers, query]);

  const { active, avgLtv } = useMemo(
    () => ({
      active: customers.filter((customer) => customer.status === "Active").length,
      avgLtv: customers.reduce((sum, customer) => sum + customer.ltv, 0) / (customers.length || 1),
    }),
    [customers],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Customers" value={String(customers.length)} hint="Across all segments" />
        <Stat label="Active" value={String(active)} hint={`${customers.length - active} need attention`} />
        <Stat
          label="Average LTV"
          value={formatCurrency({ amount: Math.round(avgLtv), currency: "USD", fractionDigits: 0 })}
          hint="Lifetime value"
        />
      </div>

      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <Search className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email or plan"
              className="pl-10"
            />
          </label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {filtered.length} of {customers.length}
          </span>
        </div>

        <div className="text-muted-foreground hidden grid-cols-[minmax(0,1fr)_120px_120px_120px_110px] gap-4 border-b pb-3 text-[11px] font-medium lg:grid">
          <span>Customer</span>
          <span>Plan</span>
          <span>Status</span>
          <span>LTV</span>
          <span>Joined</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-sm">
            <Users className="size-6" />
            No customers match your search.
          </div>
        ) : (
          <ul className="divide-line divide-y">
            {filtered.map((customer) => (
              <li
                key={customer.id}
                className="hover:bg-surface-subtle/60 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-xl px-2 py-3 transition-colors lg:grid-cols-[minmax(0,1fr)_120px_120px_120px_110px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar data={customer.avatar} name={customer.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-[13px] font-medium">{customer.name}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{customer.email}</p>
                  </div>
                </div>

                <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:contents">
                  <span className="lg:col-start-2 lg:row-start-1 lg:justify-self-start">
                    <Badge tone={statusTone(customer.plan)}>{customer.plan}</Badge>
                  </span>

                  <span className="lg:col-start-3 lg:row-start-1 lg:justify-self-start">
                    <Badge tone={statusTone(customer.status)}>{customer.status}</Badge>
                  </span>

                  <span className="text-foreground col-start-2 row-start-2 justify-self-end text-[13px] font-semibold tabular-nums lg:col-start-4 lg:row-start-1 lg:justify-self-start">
                    {formatCurrency({ amount: customer.ltv, currency: "USD", fractionDigits: 0 })}
                  </span>

                  <span className="text-muted-foreground col-start-2 row-start-2 justify-self-end text-[11px] lg:col-start-5 lg:row-start-1 lg:justify-self-start">
                    {formatDate(customer.joinedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}