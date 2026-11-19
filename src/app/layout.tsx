import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Sora } from "next/font/google";
import localFont from "next/font/local";

import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const telegraf = localFont({
  src: [
    { path: "./fonts/telegraf-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/telegraf-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/telegraf-bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-telegraf",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Painel — pagwave",
  description: "Infraestrutura financeira global: carteira multi-moeda, Pix, cripto e pagamentos P2P.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "pagwave",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${telegraf.variable} ${jakarta.variable} ${sora.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
