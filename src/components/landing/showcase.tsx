"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/landing/motion-primitives";
import { buttonVariants } from "@/components/ui/button";
import { landingCopy } from "@/lib/landing-copy";

/**
 * Embeds the real dashboard. The iframe is only mounted once the block is close
 * to the viewport, so it never competes with the hero for bandwidth.
 */
export function Showcase() {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="showcase" ref={ref} className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="lh-eyebrow text-lh-accent">{landingCopy.showcase.eyebrow}</p>
          <h2 className="lh-h2 text-lh-fg mt-4 max-w-2xl">{landingCopy.showcase.title}</h2>
          <p className="lh-lead text-lh-muted mt-4 max-w-xl">{landingCopy.showcase.lead}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="lh-ring relative mt-12 overflow-hidden rounded-card bg-lh-bg-soft">
            <div className="flex items-center gap-2 border-b border-lh-line px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="lh-mono ml-3 hidden text-[10px] text-lh-muted sm:block">
                {landingCopy.hero.preview.caption}
              </span>
            </div>

            {mounted ? (
              <iframe
                src="/dashboard"
                title="pagwave dashboard preview"
                loading="lazy"
                className="block h-[520px] w-full border-0 sm:h-[680px]"
              />
            ) : (
              <div className="grid h-[520px] place-items-center sm:h-[680px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="lh-mono size-8 animate-spin rounded-full border-2 border-lh-line border-t-lh-accent" />
                  <p className="text-sm text-lh-muted">{landingCopy.showcase.fallback}</p>
                  <Link
                    href={landingCopy.showcase.cta.href}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "border-lh-line bg-lh-surface text-lh-fg" })}
                  >
                    {landingCopy.showcase.cta.label}
                    <ExternalLink />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}