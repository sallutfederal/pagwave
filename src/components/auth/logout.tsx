"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logoutItem } from "@/components/layout/nav-items";
import { useI18n } from "@/components/locale-provider";

/** Revokes the session on the server, then leaves the signed-in area. */
export function useLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return { logout, pending };
}

/** Minimal log-out control at the bottom of the sidebar. */
export function LogoutRailButton() {
  const { logout, pending } = useLogout();
  const { messages } = useI18n();
  const Icon = logoutItem.icon;

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      title={messages.nav.logout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/85 disabled:opacity-50"
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={1.6} />
      <span className="truncate">
        {pending ? messages.nav.loggingOut : messages.nav.logout}
      </span>
    </button>
  );
}
