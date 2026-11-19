"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav } from "@/components/layout/nav-items";
import { useI18n } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function AdminSubnav() {
  const pathname = usePathname();
  const { modules } = useI18n();

  const labelFor = (href: string, fallback: string) => {
    switch (href) {
      case "/admin":
        return modules.admin.overviewNav;
      case "/admin/users":
        return modules.admin.usersNav;
      case "/admin/transactions":
        return modules.admin.txNav;
      case "/admin/integrations":
        return modules.admin.integrationsNav;
      case "/admin/settings":
        return modules.admin.settingsNav;
      default:
        return fallback.replace(/^Admin ·\s*/, "");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
      {adminNav.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                : "border-line bg-surface text-muted-foreground hover:border-foreground/25 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {labelFor(item.href, item.label)}
          </Link>
        );
      })}
    </div>
  );
}
