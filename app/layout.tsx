import type { Metadata, Viewport } from "next";
import { Jost, Manrope } from "next/font/google";
import { Cursor } from "@/components/Cursor";
import { Preloader } from "@/components/Preloader";
import { Providers } from "@/components/Providers";
import { ScrollProgress } from "@/components/ScrollProgress";
import { site } from "@/data/site";
import "./globals.css";

/**
 * Headings and labels: a geometric sans in the spirit of 1920s Futura, the
 * logo's Art Deco era, with even strokes that stay clear on every background
 * (labels set it in spaced capitals, like the logo's "INTERIO").
 */
const display = Jost({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/** Reading text and interface. */
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const title = `${site.name} | Bespoke Interior Design, Bengaluru`;
const shareImage = "/brand/og.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  keywords: [
    "interior design Bengaluru",
    "interior designers Bangalore",
    "luxury interiors",
    "bespoke interiors",
    "full home interiors",
    "turnkey interiors",
    site.name,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title,
    description: site.description,
    images: [{ url: shareImage, width: 1200, height: 630, alt: `${site.name} logo over a villa at dusk` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: [shareImage],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: site.colors.navy,
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "InteriorDesignBusiness",
  name: site.name,
  description: site.description,
  url: site.url,
  logo: `${site.url}/brand/logo-badge.png`,
  image: `${site.url}${shareImage}`,
  email: site.contact.email,
  telephone: site.contact.phone,
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  slogan: site.tagline,
};

/**
 * Runs before first paint: marks JS (so the scroll runways are laid out from
 * the start, with no shift) and whether the logo intro already played this visit.
 */
const boot = `(function(d){d.classList.add('js');try{if(sessionStorage.getItem('ci:intro'))d.classList.add('intro-seen')}catch(e){}})(document.documentElement)`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script adds classes to <html> before first paint, which the hydration check would flag.
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        {/* the collage photographs come from Unsplash's image CDN: open the connection early */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preload" as="image" href="/film/walk-in/poster-desktop.jpg" media="(min-aspect-ratio: 4/5)" />
        <link rel="preload" as="image" href="/film/walk-in/poster-mobile.jpg" media="(max-aspect-ratio: 4/5)" />
      </head>
      <body>
        <a href="#intro" className="skip-link">
          Skip the opening film
        </a>
        <Preloader />
        <Providers>{children}</Providers>
        <ScrollProgress />
        <Cursor />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
