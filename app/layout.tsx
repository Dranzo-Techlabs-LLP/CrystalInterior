import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { Providers } from "@/components/Providers";
import { site } from "@/data/site";
import "./globals.css";

/** Display: an editorial serif with a beautiful italic for the accent line. */
const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
  // next/font has no fallback metrics for Newsreader; Georgia is the closest system serif.
  adjustFontFallback: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** Text and interface. */
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const shareImage = "/film/walk-in/poster-desktop.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "The Crystal Interiors | Bespoke Interior Design",
  description: site.description,
  keywords: [
    "interior design Bengaluru",
    "luxury interiors",
    "bespoke interiors",
    "full home interiors",
    "turnkey interiors",
    "The Crystal Interiors",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: "The Crystal Interiors | Bespoke Interior Design",
    description: site.description,
    images: [{ url: shareImage, width: 1600, height: 900, alt: "A villa at dusk, its windows glowing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Crystal Interiors | Bespoke Interior Design",
    description: site.description,
    images: [shareImage],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1B2638",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "InteriorDesignBusiness",
  name: site.name,
  description: site.description,
  url: site.url,
  email: site.contact.email,
  telephone: site.contact.phone,
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  slogan: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script adds `js` to <html> before first paint, which the hydration check would flag.
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS before first paint, so the film's scroll runway is laid out from the start (no shift). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preload" as="image" href="/film/walk-in/poster-desktop.jpg" media="(min-aspect-ratio: 4/5)" />
        <link rel="preload" as="image" href="/film/walk-in/poster-mobile.jpg" media="(max-aspect-ratio: 4/5)" />
      </head>
      <body>
        <a href="#intro" className="skip-link">
          Skip the opening film
        </a>
        <Providers>{children}</Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
