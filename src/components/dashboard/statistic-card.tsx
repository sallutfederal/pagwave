"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { useState } from "react";

import { ChartLegend, DonutChart } from "@/components/dashboard/donut-chart";
import { useI18n } from "@/components/locale-provider";
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

type StatisticCardProps = {
  initial: Statistic;
};

export function StatisticCard({ initial }: StatisticCardProps) {
  const [period, setPeriod] = useState<Period>("this-month");
  const { messages } = useI18n();

  const periods: { value: Period; label: string }[] = [
    { value: "this-month", label: messages.dashboard.thisMonth },
    { value: "last-month", label: messages.dashboard.lastMonth },
    { value: "last-year", label: messages.dashboard.lastYear },
  ];

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard", "statistic", period],
    queryFn: ({ signal }) => api.statistic(period, signal),
    initialData: period === initial.period ? initial : undefined,
    placeholderData: keepPreviousData,
  });

  const statistic = data ?? initial;
  const localizedSegments = statistic.segments.map((segment) => ({
    ...segment,
    label:
      segment.id === "bills"
        ? messages.dashboard.segmentBills
        : segment.id === "money"
          ? messages.dashboard.segmentTransfers
          : segment.label,
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-foreground text-[15px] font-semibold">
            {messages.dashboard.statistics}
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={messages.dashboard.statisticsTooltip}
                className="text-subtle-foreground hover:text-muted-foreground transition-colors"
              >
                <HelpCircle className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{messages.dashboard.statisticsTooltip}</TooltipContent>
          </Tooltip>
        </div>

        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger aria-label={messages.dashboard.statistics}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((option) => (
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
            segments={localizedSegments}
            total={statistic.total}
            label={messages.dashboard.spendingBadge}
            currency={statistic.currency}
          />
        </div>
      </div>

      <ChartLegend segments={localizedSegments} />
    </Card>
  );
}
