"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoMark } from "@/components/brand/logo";
import { logoutItem, mainNav, secondaryNav, type NavItem } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavButton({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "group text-rail-muted hover:bg-rail-soft hover:text-rail-fg relative flex size-11 items-center justify-center rounded-xl transition-colors",
        active && "bg-rail-soft text-rail-fg",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
      <span className="sr-only">{item.label}</span>
      {active ? (
        <span className="bg-accent absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full" />
      ) : null}
    </Link>
  );
}

function SidebarLogo({ className }: { className?: string }) {
  return <LogoMark size={40} className={className} />;
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <>
      {mainNav.map((item) => (
        <NavButton key={item.href} item={item} pathname={pathname} />
      ))}
      <span className="bg-rail-soft mx-auto my-3 h-px w-8" />
      {secondaryNav.map((item) => (
        <NavButton key={item.href} item={item} pathname={pathname} />
      ))}
    </>
  );
}

/** Dark icon rail: 88px on the left on desktop, bottom bar on mobile. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="bg-rail fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col items-center py-6 md:flex">
        <SidebarLogo />
        <nav className="mt-10 flex flex-1 flex-col items-center gap-1.5">
          <NavList pathname={pathname} />
        </nav>
        <NavButton item={logoutItem} pathname="" />
      </aside>

      <nav className="bg-rail fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around md:hidden">
        {mainNav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "text-rail-muted flex size-11 flex-col items-center justify-center rounded-xl transition-colors",
                active && "bg-rail-soft text-rail-fg",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export { SidebarLogo, NavButton };
export type { LucideIcon };