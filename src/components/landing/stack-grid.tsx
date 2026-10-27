import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function StackGrid() {
  return (
    <section id="stack" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="lh-eyebrow text-lh-accent">{landingCopy.stack.eyebrow}</p>
        <h2 className="lh-h2 text-lh-fg mt-4 max-w-2xl">{landingCopy.stack.title}</h2>
        <p className="lh-lead text-lh-muted mt-4 max-w-xl">{landingCopy.stack.lead}</p>
      </Reveal>

      <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {landingCopy.stack.groups.map((group) => (
          <RevealItem key={group.title}>
            <div className="lh-ring h-full rounded-card bg-lh-surface p-6">
              <h3 className="lh-eyebrow text-lh-fg/70">{group.title}</h3>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="lh-mono flex items-center gap-2 text-[12px] text-lh-muted">
                    <span className="size-1 rounded-full bg-lh-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}