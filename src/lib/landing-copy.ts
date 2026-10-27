/**
 * Every word on the landing page lives here, typed, so the copy can be swapped
 * (or reviewed by marketing) without touching a component.
 *
 * Language: English — the product UI is English, and mixing copy languages in
 * one site reads broken. To go PT-BR, translate this file only.
 */
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  type LucideIcon,
  MessagesSquare,
  Package,
  Users,
} from "lucide-react";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  meta: string;
};

export type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

export type Step = {
  index: string;
  title: string;
  description: string;
  code: string;
};

export const landingCopy = {
  meta: {
    title: "pagwave — The fintech dashboard you can actually read",
    description:
      "Cards, statistics, sales and transactions in one screen. Typed end to end with zod, cached at the server, and ready to swap your backend in.",
  },

  nav: {
    links: [
      { href: "#features", label: "Features" },
      { href: "#showcase", label: "Showcase" },
      { href: "#architecture", label: "Architecture" },
      { href: "#stack", label: "Stack" },
    ],
    cta: { href: "/dashboard", label: "Open dashboard" },
    menu: { open: "Open menu", close: "Close menu" },
  },

  hero: {
    eyebrow: "Next.js 16 · React 19 · Tailwind v4 · TypeScript strict",
    title: "The fintech dashboard you can actually read.",
    lead:
      "Cards, statistics, sales and transactions in one screen — typed end to end with zod, cached at the server with Cache Components, and ready to swap your backend in.",
    primaryCta: { href: "/dashboard", label: "Open the dashboard" },
    secondaryCta: { href: "https://github.com/secsantander23/fintech", label: "View on GitHub" },
    note: "No signup. Runs entirely on mock data you can replace file by file.",
    preview: {
      caption: "Live preview of /dashboard",
      badges: ["Dark mode", "Responsive", "Keyboard ready"],
    },
  },

  marquee: [
    "Next.js 16",
    "React 19",
    "Tailwind CSS v4",
    "TypeScript",
    "zod",
    "TanStack Query",
    "Radix UI",
    "Turbopack",
    "Cache Components",
    "Motion",
    "next-themes",
    "Lucide",
  ],

  stats: [
    { value: 7, label: "Pages shipped" },
    { value: 8, label: "Typed endpoints" },
    { value: 100, suffix: "%", label: "zod contracts" },
    { value: 0, suffix: " kB", label: "Imagery used" },
  ] satisfies Stat[],

  features: {
    eyebrow: "Product",
    title: "Seven pages that behave like a product, not a mockup.",
    lead:
      "Every screen is wired to real components, real validation and real state — no dead links, no lorem ipsum.",
    items: [
      {
        icon: BarChart3,
        title: "Dashboard",
        description:
          "Two bank cards, quick actions, a two-arc donut that refetches on period change, recent sales and a live transaction feed.",
        href: "/dashboard",
        meta: "/dashboard",
      },
      {
        icon: CreditCard,
        title: "Cards",
        description:
          "Issue a new card from a dialog with live preview and zod validation, then track spend limits and freeze it instantly.",
        href: "/cards",
        meta: "/cards",
      },
      {
        icon: ArrowLeftRight,
        title: "Transactions",
        description:
          "Full history with money-in and money-out totals, instant search, status filters and an empty state that actually looks designed.",
        href: "/transactions",
        meta: "/transactions",
      },
      {
        icon: MessagesSquare,
        title: "Messages",
        description:
          "Two-pane inbox with unread badges, online presence, thread bubbles and a composer that collapses into a single column on mobile.",
        href: "/messages",
        meta: "/messages",
      },
      {
        icon: Package,
        title: "Products",
        description:
          "Subscriptions, cards and passes with billing cadence, renewal dates and status badges driven by one shared tone map.",
        href: "/products",
        meta: "/products",
      },
      {
        icon: Users,
        title: "Customers",
        description:
          "Segmented customer base with plan, status and lifetime value, plus search across every field of the row.",
        href: "/customers",
        meta: "/customers",
      },
    ] satisfies Feature[],
  },

  showcase: {
    eyebrow: "Showcase",
    title: "This is the real application, embedded.",
    lead:
      "The preview below is the dashboard running — not a screenshot. Everything you see is the same code that ships.",
    cta: { href: "/dashboard", label: "Open it in a full tab" },
    fallback: "The live preview needs JavaScript. Open the dashboard directly.",
  },

  architecture: {
    eyebrow: "Architecture",
    title: "One data layer, two doors.",
    lead:
      "Route handlers expose the service layer over HTTP; server components call the same functions directly. Swap the mock for your API and the UI never notices.",
    steps: [
      {
        index: "01",
        title: "Route handler",
        description: "Each endpoint validates its input with zod and answers with a typed payload.",
        code: `export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));

  return Response.json(await getStatistic(period));
}`,
      },
      {
        index: "02",
        title: "Service layer",
        description: "The same functions the UI uses, cached with Cache Components so pages stay static.",
        code: `export async function getStatistic(period: Period) {
  "use cache";
  cacheLife("hours");

  return statisticSchema.parse(statisticByPeriod[period]);
}`,
      },
      {
        index: "03",
        title: "Client fetch",
        description: "The browser revalidates the response with the identical schema before rendering.",
        code: `const { data } = useQuery({
  queryKey: ["dashboard", "statistic", period],
  queryFn: ({ signal }) => api.statistic(period, signal),
  placeholderData: keepPreviousData,
});`,
      },
    ] satisfies Step[],
    note: "○ /dashboard is prerendered with a 1h revalidate window. No client fetch needed for the first paint.",
  },

  stack: {
    eyebrow: "Stack",
    title: "Boring on purpose where it matters.",
    lead:
      "Every dependency earns its place: typed contracts, real caching, accessible primitives. Nothing for the sake of a trend.",
    groups: [
      {
        title: "Framework",
        items: ["Next.js 16 (App Router)", "React 19", "Turbopack", "Cache Components"],
      },
      {
        title: "UI",
        items: ["Tailwind CSS v4", "Radix UI primitives", "lucide-react", "Plus Jakarta Sans"],
      },
      {
        title: "Data",
        items: ["zod contracts", "Route handlers", "TanStack Query", "'use cache'"],
      },
      {
        title: "Landing",
        items: ["Motion", "Lenis", "Sora + Inter", "Zero image assets"],
      },
    ],
  },

  cta: {
    title: "Point it at your own backend.",
    lead:
      "Replace the bodies of the get* functions and every page keeps working. That is the whole pitch.",
    primary: { href: "/dashboard", label: "Open the dashboard" },
    secondary: { href: "https://github.com/secsantander23/fintech", label: "Read the code" },
  },

  footer: {
    tagline: "A fintech dashboard built as a product, not a screenshot.",
    columns: [
      {
        title: "Product",
        links: [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/cards", label: "Cards" },
          { href: "/transactions", label: "Transactions" },
          { href: "/messages", label: "Messages" },
        ],
      },
      {
        title: "More",
        links: [
          { href: "/products", label: "Products" },
          { href: "/customers", label: "Customers" },
          { href: "/settings", label: "Settings" },
          { href: "https://github.com/secsantander23/fintech", label: "GitHub" },
        ],
      },
    ],
    legal: "Built with Next.js 16. Mock data lives in a single file.",
  },
} as const;