"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { useState } from "react";

import { ChartLegend, DonutChart } from "@/components/dashboard/donut-chart";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import type { Period, Statistic } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const PERIODS: { value: Period; label: string }[] = [
  { value: "this-month", label: "Este mês" },
  { value: "last-month", label: "Mês passado" },
  { value: "last-year", label: "Último ano" },
];

type StatisticCardProps = {
  initial: Statistic;
};

export function StatisticCard({ initial }: StatisticCardProps) {
  const [period, setPeriod] = useState<Period>("this-month");

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard", "statistic", period],
    queryFn: ({ signal }) => api.statistic(period, signal),
    initialData: period === initial.period ? initial : undefined,
    placeholderData: keepPreviousData,
  });

  const statistic = data ?? initial;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-foreground text-[15px] font-semibold">Estatísticas</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Como este gráfico é calculado"
                className="text-subtle-foreground hover:text-muted-foreground transition-colors"
              >
                <HelpCircle className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Proporção entre tarifas e transferências no período</TooltipContent>
          </Tooltip>
        </div>

        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger aria-label="Período das estatísticas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="my-6 flex justify-center">
        <div className={cn("transition-opacity", isFetching && "opacity-50")}>
          <DonutChart
            segments={statistic.segments}
            total={statistic.total}
            label={statistic.label}
            currency={statistic.currency}
          />
        </div>
      </div>

      <ChartLegend segments={statistic.segments} />
    </Card>
  );
}