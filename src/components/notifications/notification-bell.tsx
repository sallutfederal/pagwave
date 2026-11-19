"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/locale-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLocaleDateTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: { url?: string } | null;
  isRead: boolean;
  createdAt: string;
};

export const NOTIFICATIONS_REFRESH_EVENT = "pagwave:notifications-refresh";

export function triggerNotificationsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { locale } = useI18n();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const syncNow = () => {
      void fetch("/api/notifications", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            json: {
              ok?: boolean;
              unreadCount?: number;
              notifications?: NotificationItem[];
            } | null,
          ) => {
            if (!active || !json?.ok) return;
            setUnreadCount(json.unreadCount ?? 0);
            setItems(json.notifications ?? []);
          },
        )
        .catch(() => undefined);
    };

    syncNow();
    const timer = window.setInterval(syncNow, 25_000);
    window.addEventListener("focus", syncNow);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, syncNow);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", syncNow);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, syncNow);
    };
  }, []);

  async function markOneRead(item: NotificationItem) {
    if (!item.isRead) {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      void fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", id: item.id }),
      });
    }
    const targetUrl = item.data && typeof item.data.url === "string" ? item.data.url : null;
    if (targetUrl) {
      router.push(targetUrl);
    }
  }

  async function markAllRead() {
    if (busy || unreadCount === 0) return;
    setBusy(true);
    try {
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_all" }),
      });
    } finally {
      setBusy(false);
    }
  }

  const label =
    locale === "en"
      ? "Notifications"
      : locale === "es"
        ? "Notificaciones"
        : locale === "ar"
          ? "الإشعارات"
          : locale === "fr"
            ? "Notifications"
            : locale === "de"
              ? "Benachrichtigungen"
              : "Notificações";

  return (
    <DropdownMenu onOpenChange={(open) => open && triggerNotificationsRefresh()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="bg-surface text-muted-foreground hover:text-foreground border-line relative grid size-10 place-items-center rounded-full border transition-colors"
        >
          <Bell className="size-4" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="bg-accent text-accent-fg absolute -top-1 -right-1 grid min-w-4.5 place-items-center rounded-full px-1 text-[10px] font-bold leading-4">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-2 sm:w-96">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-foreground text-xs font-semibold">{label}</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={busy}
              className="text-accent inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
            >
              <CheckCheck className="size-3.5" />
              {locale === "en" ? "Mark all read" : "Marcar lidas"}
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs">
              {locale === "en"
                ? "No notifications yet."
                : "Nenhuma notificação recebida ainda."}
            </p>
          ) : (
            items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => void markOneRead(item)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl px-3 py-2.5",
                  !item.isRead && "bg-surface-subtle/80",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                    {!item.isRead ? (
                      <span className="bg-accent size-1.5 shrink-0 rounded-full" />
                    ) : null}
                    <span className="line-clamp-1">{item.title}</span>
                  </span>
                  <span className="text-subtle-foreground shrink-0 text-[10px]">
                    {formatLocaleDateTime(item.createdAt, locale)}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-[11px] leading-snug">
                  {item.body}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-xs font-medium">
          <Link href="/settings">
            {locale === "en" ? "Push & alert settings" : "Configurar alertas & Push"}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
