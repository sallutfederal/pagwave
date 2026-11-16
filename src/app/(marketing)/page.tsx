import type { Metadata } from "next";

import { CardsAndScale } from "@/components/landing/cards-and-scale";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { Cta } from "@/components/landing/cta";
import { Hero } from "@/components/landing/hero";
import { MarketsSection } from "@/components/landing/markets-section";
import { PlatformBento } from "@/components/landing/platform-bento";
import { ProblemSection } from "@/components/landing/problem-section";
import { TransparencySection } from "@/components/landing/transparency-section";
import { landingCopy } from "@/lib/landing-copy";

export const metadata: Metadata = {
  title: {
    default: landingCopy.meta.title,
    template: "%s — pagwave",
  },
  description: landingCopy.meta.description,
  openGraph: {
    title: landingCopy.meta.title,
    description: landingCopy.meta.description,
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <PlatformBento />
      <MarketsSection />
      <ComparisonSection />
      <CardsAndScale />
      <TransparencySection />
      <Cta />
    </>
  );
}
