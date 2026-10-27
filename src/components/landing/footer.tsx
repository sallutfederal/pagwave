import { Github } from "lucide-react";
import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <footer className="border-t border-lh-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.6fr))]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-display text-[15px] font-semibold tracking-tight text-lh-fg">
              pagwave
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-lh-muted">
            {landingCopy.footer.tagline}
          </p>
          <a
            href="https://github.com/secsantander23/fintech"
            target="_blank"
            rel="noreferrer"
            className="lh-mono mt-5 inline-flex items-center gap-2 text-xs text-lh-muted transition-colors hover:text-lh-fg"
          >
            <Github className="size-4" />
            secsantander23/fintech
          </a>
        </div>

        {landingCopy.footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="lh-eyebrow text-lh-fg/70">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-lh-muted transition-colors hover:text-lh-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-lh-line">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <p className="lh-mono text-xs text-lh-muted">{landingCopy.footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}