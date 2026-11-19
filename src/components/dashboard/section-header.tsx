"use client";

import Link from "next/link";

import { useI18n } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  className,
}: SectionHeaderProps) {
  const { messages } = useI18n();

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="text-foreground text-[15px] font-semibold">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="text-muted-foreground hover:text-foreground text-xs font-medium">
          {actionLabel ?? messages.dashboard.seeAll}
        </Link>
      ) : null}
    </div>
  );
}
