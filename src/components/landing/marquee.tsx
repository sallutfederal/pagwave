"use client";

import { motion, useReducedMotion } from "motion/react";

import { landingCopy } from "@/lib/landing-copy";

export function Marquee() {
  const reduced = useReducedMotion();
  const items = [...landingCopy.marquee, ...landingCopy.marquee];

  return (
    <div
      aria-hidden
      className="relative flex overflow-hidden border-y border-lh-line py-5 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]"
    >
      <motion.div
        className="flex shrink-0 items-center gap-10 pr-10"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="lh-mono text-sm whitespace-nowrap text-lh-muted">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}