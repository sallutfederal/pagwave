"use client";

import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ReactLenis } from "lenis/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useHydrated } from "@/lib/use-hydrated";

/* -------------------------------------------------------------------------- */
/*                              Smooth scrolling                              */
/* -------------------------------------------------------------------------- */

/** Wraps the page in Lenis, disabled entirely when the user asks for less motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return <ReactLenis root options={{ autoRaf: true, smoothWheel: true }}>{children}</ReactLenis>;
}

/* -------------------------------------------------------------------------- */
/*                                Scroll progress                             */
/* -------------------------------------------------------------------------- */

export function ScrollProgress() {
  const hydrated = useHydrated();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.4 });

  // Mounted only after hydration: the scroll offset does not exist on the
  // server, so rendering it during SSR would ship a different inline style.
  if (!hydrated) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="from-lh-accent via-lh-accent-2 to-lh-accent-3 fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-linear-to-r"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Reveal                                  */
/* -------------------------------------------------------------------------- */

/**
 * Everything that ends up in the SSR HTML (`initial`, inline `style`) is kept
 * identical between server and client — the reduced-motion preference only
 * changes *durations*. Branching on `useReducedMotion` for initial styles is a
 * hydration mismatch waiting to happen.
 */
type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
};

export function Reveal({ children, delay = 0, y = 24, className, as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{
        duration: reduced ? 0 : 0.65,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Component>
  );
}

/** Staggers direct `RevealItem` children when the block scrolls in. */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y: 22 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Parallax                                  */
/* -------------------------------------------------------------------------- */

/**
 * Drifts a layer as the block scrolls through the viewport. The `lh-parallax`
 * class lets CSS neutralise the transform under `prefers-reduced-motion`.
 */
export function Parallax({
  children,
  distance = 80,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div className="lh-parallax" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Count up                                   */
/* -------------------------------------------------------------------------- */

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = useReducedMotion();
  // The rendered value only depends on animation state (never on the motion
  // preference), so the server HTML and the first client render always agree.
  const [animated, setAnimated] = useState<number | null>(null);
  const display = animated ?? 0;

  useEffect(() => {
    if (!inView) return;

    const controls = animate(0, value, {
      // Reduced motion still "animates", it just lands on the final number.
      duration: reduced ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setAnimated(Math.round(latest)),
    });

    return () => controls.stop();
  }, [duration, inView, reduced, value]);

  return (
    <span ref={ref} className="lh-numeric">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Cursor spotlight                               */
/* -------------------------------------------------------------------------- */

/** Radial gradient that follows the pointer inside the wrapper. */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const hydrated = useHydrated();
  const x = useMotionValue(50);
  const y = useMotionValue(0);

  const background = useMotionTemplate`radial-gradient(
    420px circle at ${x}% ${y}%,
    rgb(76 141 255 / 0.18),
    rgb(167 139 250 / 0.08) 35%,
    transparent 65%
  )`;

  return (
    <div
      className={className}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - rect.left) / rect.width) * 100);
        y.set(((event.clientY - rect.top) / rect.height) * 100);
      }}
    >
      {/* The template resolves to a real gradient only on the client, so the
          overlay waits for hydration instead of shipping mismatched styles. */}
      {hydrated ? (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background }} />
      ) : null}
      {children}
    </div>
  );
}