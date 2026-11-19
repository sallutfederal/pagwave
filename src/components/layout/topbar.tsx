"use client";

import { ChevronDown, LogOut, Settings, User, Wallet } from "lucide-react";

import Link from "next/link";
import { useLogout } from "@/components/auth/logout";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/locale-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/session-provider";

export function Topbar() {
  const user = useSession();
  const { logout, pending } = useLogout();
  const { messages } = useI18n();

  return (
    <header className="bg-background/75 border-line sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 md:px-8">
        <div className="flex shrink-0 items-center gap-3" />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationBell />
          <LanguageToggle />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-xs">
                <span className="size-2 rounded-full bg-success" aria-hidden />
                <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-60">
              <div className="space-y-0.5 px-3 py-2">
                <p className="text-foreground truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <User /> {messages.topbar.profile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallet">
                  <Wallet /> {messages.topbar.walletBalances}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings /> {messages.topbar.settings}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={pending}
                onSelect={() => void logout()}
                className="text-rose-400 hover:text-rose-300 focus:text-rose-300"
              >
                <LogOut /> {messages.topbar.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
