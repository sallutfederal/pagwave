"use client";

import { ChevronDown, LogOut, Search, Settings, User, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userProfile } from "@/data/user-profile";
import { useProfile } from "@/lib/profile-store";

export function Topbar() {
  const [query, setQuery] = useState("");
  const profile = useProfile();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Wired to the real search route later; keeps the input from reloading.
    event.preventDefault();
  }

  return (
    <header className="bg-background/85 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 md:px-8">
        <div className="flex shrink-0 items-center gap-3" />

        <form onSubmit={handleSubmit} role="search" className="mx-auto hidden w-full max-w-sm md:block">
          <label className="bg-surface-subtle flex h-10 w-full items-center gap-2 rounded-full px-4 transition-colors focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/20">
            <Search className="text-subtle-foreground size-4 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="placeholder:text-subtle-foreground text-foreground w-full bg-transparent text-xs outline-none"
            />
          </label>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="dark" size="sm" className="h-10 px-4 text-xs">
                <span className="hidden sm:inline">{userProfile.accountLabel}</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56">
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wallet /> Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login" className="flex w-full items-center gap-2">
                  <LogOut /> Sign out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}