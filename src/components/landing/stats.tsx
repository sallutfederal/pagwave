import { CountUp, RevealGroup, RevealItem } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function Stats() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-lh-line bg-lh-line lg:grid-cols-4">
        {landingCopy.stats.map((stat) => (
          <RevealItem key={stat.label} className="bg-lh-bg p-7 text-center">
            <p className="font-display text-4xl font-bold tracking-tight text-lh-fg sm:text-5xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-sm text-lh-muted">{stat.label}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}