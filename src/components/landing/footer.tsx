import Link from "next/link";
import type { CSSProperties } from "react";

import { LogoMark } from "@/components/brand/logo";
import { landingCopy } from "@/lib/landing-copy";

export function LandingFooter() {
  return (
    <footer className="border-t border-lh-line bg-lh-bg-soft/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.65fr))]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
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
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-lh-muted">
            {landingCopy.footer.tagline}
          </p>
        </div>

        {landingCopy.footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="lh-eyebrow text-lh-fg/75">{column.title}</h2>
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
          <p className="text-xs text-lh-muted">{landingCopy.footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}
