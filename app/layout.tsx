import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";
import { SITE_CONFIG } from "@/lib/utils";
import {
  buildMetadata,
  buildOrganizationLd,
  buildWebsiteLd,
  serialiseJsonLd,
} from "@/lib/seo";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = buildMetadata({
  description: SITE_CONFIG.description,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#041f50" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${openSans.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-white text-psych-navy antialiased">
        {children}
        <Analytics />

        {/* JSON-LD: brand identity + WebSite schema */}
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: serialiseJsonLd(
              buildOrganizationLd(),
              buildWebsiteLd()
            ),
          }}
        />
      </body>
    </html>
  );
}
