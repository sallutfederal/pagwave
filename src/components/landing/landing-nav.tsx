"use client";

import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

import { LogoMark } from "@/components/brand/logo";
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

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 16));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-lh-line bg-lh-bg/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="inline-flex"
            style={
              {
                "--logo-from": "#1e1f1d",
                "--logo-to": "#1e1f1d",
                "--logo-edge": "#1e1f1d",
                "--logo-n-from": "#f7f6f1",
                "--logo-n-to": "#f7f6f1",
              } as CSSProperties
            }
          >
            <LogoMark size={30} />
          </span>
          <span className="font-display text-[17px] font-medium tracking-tight text-lh-fg">
            pagwave
          </span>
        </Link>

        <ul className="ml-8 hidden items-center gap-7 lg:flex">
          {landingCopy.nav.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-lh-muted transition-colors hover:text-lh-fg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href={landingCopy.nav.signIn.href}
            className="hidden rounded-full border border-lh-line bg-lh-surface px-4 py-2 text-sm font-medium text-lh-fg transition-colors hover:bg-white sm:inline-flex"
          >
            {landingCopy.nav.signIn.label}
          </Link>
          <Link
            href={landingCopy.nav.cta.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#cfa84a] px-4 py-2 text-sm font-medium text-[#1e1f1d] shadow-xs transition-all hover:bg-[#d7b55f]"
          >
            {landingCopy.nav.cta.label}
            <ArrowRight className="size-3.5" />
          </Link>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={landingCopy.nav.menu.open}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-lh-line bg-lh-surface text-lh-fg transition-colors hover:bg-lh-surface-strong lg:hidden"
              >
                <Menu className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="top-auto bottom-0 max-w-none translate-y-0 rounded-t-card rounded-b-none border-lh-line bg-lh-surface p-6 text-lh-fg lg:hidden">
              <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
              <ul className="mt-2 space-y-1">
                {landingCopy.nav.links.map((link) => (
                  <li key={link.href}>
                    <DialogClose asChild>
                      <a
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-3 py-3 text-sm font-medium text-lh-muted transition-colors hover:bg-lh-bg hover:text-lh-fg"
                      >
                        {link.label}
                      </a>
                    </DialogClose>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <DialogClose asChild>
                  <Link
                    href={landingCopy.nav.signIn.href}
                    className="inline-flex items-center justify-center rounded-full border border-lh-line bg-lh-bg px-4 py-2.5 text-sm font-medium text-lh-fg"
                  >
                    {landingCopy.nav.signIn.label}
                  </Link>
                </DialogClose>
                <DialogClose asChild>
                  <Link
                    href={landingCopy.nav.cta.href}
                    className="inline-flex items-center justify-center rounded-full bg-[#cfa84a] px-4 py-2.5 text-sm font-medium text-[#1e1f1d]"
                  >
                    {landingCopy.nav.cta.label}
                  </Link>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </motion.header>
  );
}
