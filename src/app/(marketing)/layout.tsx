import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { ScrollProgress, SmoothScroll } from "@/components/landing/motion-primitives";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lh-grain lh-sans lh-bg relative min-h-dvh text-lh-fg">
      <SmoothScroll>
        <ScrollProgress />
        <LandingNav />
        <main className="relative z-2">{children}</main>
        <LandingFooter />
      </SmoothScroll>
    </div>
  );
}