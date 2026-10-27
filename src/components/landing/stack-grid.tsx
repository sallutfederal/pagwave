import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function StackGrid() {
  return (
    <section id="stack" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="lh-eyebrow text-lh-accent">{landingCopy.stack.eyebrow}</p>
        <h2 className="lh-h2 text-lh-fg mt-4 max-w-2xl">{landingCopy.stack.title}</h2>
        <p className="lh-lead text-lh-muted mt-4 max-w-xl">{landingCopy.stack.lead}</p>
      </Reveal>
    </section>
  );
}