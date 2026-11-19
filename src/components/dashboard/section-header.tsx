import Link from "next/link";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function SectionHeader({
  title,
  actionLabel = "Ver tudo",
  actionHref,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="text-foreground text-[15px] font-semibold">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="text-muted-foreground hover:text-foreground text-xs font-medium">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
