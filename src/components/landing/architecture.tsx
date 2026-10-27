import { Reveal } from "@/components/landing/motion-primitives";
import { landingCopy } from "@/lib/landing-copy";

export function Architecture() {
  return (
    <section id="architecture" className="relative scroll-mt-24 border-y border-lh-line bg-lh-bg-soft/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="lh-eyebrow text-lh-accent">{landingCopy.architecture.eyebrow}</p>
            <h2 className="lh-h2 text-lh-fg mt-4">{landingCopy.architecture.title}</h2>
            <p className="lh-lead text-lh-muted mt-4">{landingCopy.architecture.lead}</p>
            <p className="lh-mono mt-6 text-xs text-lh-muted">{landingCopy.architecture.note}</p>
          </Reveal>
        </div>

        <ol className="space-y-4">
          {landingCopy.architecture.steps.map((step, index) => (
            <Reveal as="li" key={step.index} delay={index * 0.06}>
              <div className="lh-ring overflow-hidden rounded-card bg-lh-surface">
                <div className="flex items-center gap-3 border-b border-lh-line px-6 py-4">
                  <span className="lh-mono text-xs text-lh-accent">{step.index}</span>
                  <h3 className="lh-h3 text-lh-fg">{step.title}</h3>
                </div>

                <p className="px-6 pt-4 text-sm leading-relaxed text-lh-muted">{step.description}</p>

                <pre className="lh-scanlines overflow-x-auto p-6">
                  <code className="lh-mono text-[12px] leading-relaxed text-lh-fg/90">
                    {step.code}
                  </code>
                </pre>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}