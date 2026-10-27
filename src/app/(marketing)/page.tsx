import type { Metadata } from "next";

import { Architecture } from "@/components/landing/architecture";
import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Showcase } from "@/components/landing/showcase";
import { StackGrid } from "@/components/landing/stack-grid";
import { Stats } from "@/components/landing/stats";
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
      <Marquee />
      <Stats />
      <Features />
      <Showcase />
      <Architecture />
      <StackGrid />
      <Cta />
    </>
  );
}
