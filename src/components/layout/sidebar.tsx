"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoMark } from "@/components/brand/logo";
import { LogoutRailButton } from "@/components/auth/logout";
import { adminNav, mainNav, secondaryNav, type NavItem } from "@/components/layout/nav-items";
import { SidebarNavIcon } from "@/components/layout/sidebar-icons";
import { useI18n } from "@/components/locale-provider";
import { useSession } from "@/components/session-provider";
import { isAdminRole } from "@/lib/admin-auth";
import type { AppMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/dashboard" || href === "/admin"
    ? pathname === href
    : pathname.startsWith(href);
}

function localizedNavLabel(href: string, fallback: string, messages: AppMessages): string {
  switch (href) {
    case "/dashboard":
      return messages.nav.dashboard;
    case "/wallet":
      return messages.nav.wallet;
    case "/transactions":
      return messages.nav.transactions;
    case "/integrations":
      return messages.nav.integrations;
    case "/admin":
      return messages.nav.adminOverview;
    case "/admin/users":
      return messages.nav.adminUsers;
    case "/admin/transactions":
      return messages.nav.adminTransactions;
    case "/admin/integrations":
      return messages.nav.adminIntegrations;
    case "/admin/settings":
      return messages.nav.adminSettings;
    default:
      return fallback.replace(/^Admin ·\s*/, "");
  }
}

function NavRow({
  item,
  pathname,
  label,
}: {
  item: NavItem;
  pathname: string;
  label: string;
}) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-white/[0.09] text-white"
          : "text-white/55 hover:bg-white/[0.04] hover:text-white/90",
      )}
    >
      <SidebarNavIcon
        href={item.href}
        active={active}
        className={active ? "text-[#e2be72]" : "text-white/50"}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/** Clean, minimalist full-height sidebar on desktop and sleek bottom bar on mobile. */
export function Sidebar() {
  const pathname = usePathname();
  const user = useSession();
  const { messages } = useI18n();
  const showAdmin = isAdminRole(user?.role);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-white/[0.07] bg-[#090a0e]/95 px-3 py-5 backdrop-blur-xl md:flex">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2.5 px-2.5 transition-opacity hover:opacity-90"
        >
          <LogoMark size={28} radius={26} />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            pagwave
          </span>
        </Link>

        <nav className="no-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {mainNav.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              pathname={pathname}
              label={localizedNavLabel(item.href, item.label, messages)}
            />
          ))}

          <div className="my-3 h-px bg-white/[0.06]" />

          {secondaryNav.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              pathname={pathname}
              label={localizedNavLabel(item.href, item.label, messages)}
            />
          ))}

          {showAdmin ? (
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <p className="mb-1.5 px-3 text-[11px] font-medium text-white/35">
                {messages.nav.adminGroup}
              </p>
              <div className="flex flex-col gap-0.5">
                {adminNav.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    label={localizedNavLabel(item.href, item.label, messages)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </nav>

        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <LogoutRailButton />
        </div>
      </aside>

      {/* Minimalist mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-white/[0.08] bg-[#090a0e]/95 px-2 backdrop-blur-xl md:hidden">
        {mainNav.slice(0, 4).map((item) => {
          const active = isActive(pathname, item.href);
          const label = localizedNavLabel(item.href, item.label, messages);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg transition-colors",
                active ? "bg-white/[0.09] text-[#e2be72]" : "text-white/50 hover:text-white",
              )}
            >
              <SidebarNavIcon href={item.href} active={active} />
            </Link>
          );
        })}
        {secondaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          const label = localizedNavLabel(item.href, item.label, messages);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg transition-colors",
                active ? "bg-white/[0.09] text-[#e2be72]" : "text-white/50 hover:text-white",
              )}
            >
              <SidebarNavIcon href={item.href} active={active} />
            </Link>
          );
        })}
        {showAdmin ? (
          <Link
            href="/admin"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            aria-label={messages.nav.adminGroup}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors",
              pathname.startsWith("/admin")
                ? "bg-white/[0.09] text-[#e2be72]"
                : "text-white/50 hover:text-white",
            )}
          >
            <SidebarNavIcon href="/admin" active={pathname.startsWith("/admin")} />
          </Link>
        ) : null}
      </nav>
    </>
  );
}
