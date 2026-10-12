import { StorefrontChrome } from "@/components/storefront-chrome";
import { cookies } from "next/headers";
import { LiveStorefront } from "@/components/live-storefront";
import { PublicCampaignPlacement } from "@/components/campaign-banners";
import { PreferencesProvider } from "@/components/preferences";
import {
  defaultPreferences,
  markets,
  currencies,
  type Preferences,
} from "@/lib/markets";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { menuProducts } from "@/server/navigation";
import { StoreProvider } from "@/components/store-provider";
import { ShoppingBagLauncher } from "@/components/shopping-bag-launcher";
import { HomeHeroShell } from "@/components/home-hero-shell";
import { StoreNavigation } from "@/components/store-navigation";
import { SmoothScroll } from "@/components/smooth-scroll";
import { WhatsAppFloatingWidget } from "@/components/whatsapp-widget";
import "lenis/dist/lenis.css";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN || "http://localhost:3000"),
  title: { default: "OVIA — Space for the journey", template: "%s | OVIA" },
  description:
    "Considered travel goods for an open world. Discover the OVIA concept collection of luggage, bags and everyday essentials.",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let preferences: Preferences = defaultPreferences;
  try {
    const stored = JSON.parse(
      (await cookies()).get("ovia_preferences")?.value || "null",
    );
    if (
      stored &&
      markets.some((m) => m.code === stored.country) &&
      currencies.includes(stored.currency) &&
      typeof stored.locale === "string"
    )
      preferences = stored;
  } catch {}

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PreferencesProvider initial={preferences}>
          <StoreProvider>
            <LiveStorefront />
            <StoreNavigation />
            <SmoothScroll />
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <StorefrontChrome><Header menuProducts={menuProducts} /><ShoppingBagLauncher /></StorefrontChrome>
            <main id="main"><StorefrontChrome><HomeHeroShell /><PublicCampaignPlacement /></StorefrontChrome>{children}</main>
            <StorefrontChrome hideOnCheckout><Footer /><WhatsAppFloatingWidget /></StorefrontChrome>
          </StoreProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
