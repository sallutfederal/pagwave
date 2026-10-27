"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

import { LogoMark } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { landingCopy } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 24));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-lh-line bg-lh-bg/70 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="font-display text-[15px] font-semibold tracking-tight text-lh-fg">
            pagwave
          </span>
        </Link>

        <ul className="ml-auto hidden items-center gap-7 md:flex">
          {landingCopy.nav.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-lh-muted transition-colors hover:text-lh-fg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs font-medium text-lh-muted hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href={landingCopy.nav.cta.href}
            className={buttonVariants({ size: "sm" })}
          >
            {landingCopy.nav.cta.label}
          </Link>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={landingCopy.nav.menu.open}
                className="border-lh-line bg-lh-surface text-lh-fg md:hidden"
              >
                <Menu />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-lh-bg-soft border-lh-line text-lh-fg top-auto bottom-0 max-w-none translate-y-0 rounded-b-none rounded-t-card p-6 md:hidden">
              <DialogTitle className="text-lh-fg sr-only">Menu</DialogTitle>
              <ul className="mt-2 space-y-1">
                {landingCopy.nav.links.map((link) => (
                  <li key={link.href}>
                    <DialogClose asChild>
                      <a
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-3 text-sm text-lh-muted transition-colors hover:bg-lh-surface-strong hover:text-lh-fg"
                      >
                        {link.label}
                      </a>
                    </DialogClose>
                  </li>
                ))}
                <li>
                  <DialogClose asChild>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-sm text-lh-muted transition-colors hover:bg-lh-surface-strong hover:text-lh-fg"
                    >
                      Sign in
                    </Link>
                  </DialogClose>
                </li>
              </ul>
              <DialogClose asChild>
                <Link href="/create" className={buttonVariants({ className: "mt-4 w-full" })}>
                  Create account
                </Link>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </motion.header>
  );
}