"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { MarketingLoadingOverlay } from "@/components/marketing/LoadingOverlay";
import siteContent from "@/content/site-content.json";

const PDFPreview = dynamic(
  () => import("@/components/PDFPreview").then((mod) => ({ default: mod.PDFPreview })),
  { ssr: false }
);

/**
 * Layout for all marketing surfaces (/ and /soap-architect). The frosted-glass
 * Header is intentionally kept in the DOM for SEO and structural reasons but
 * is visually hidden via `className="hidden"` (see Header props) so marketing
 * pages read top-down without the fixed nav.
 *
 * A full-viewport loading spinner (`MarketingLoadingOverlay`) is shown on first
 * paint and removed once the page fully loads.
 *
 * Admin routes intentionally live outside this route group so they don't
 * inherit the marketing chrome.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const globalContent = siteContent.global;
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col selection:bg-psych-navy/20 selection:text-white">
      <MarketingLoadingOverlay />

      {/* Skip link for keyboard / screen-reader users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-psych-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-psych-purple"
      >
        Skip to main content
      </a>

      {/* Header kept in DOM and visible for navigation, a11y, and SEO. */}
      <Header
        navigation={globalContent.navigation}
        brandName={globalContent.brandName}
        onPreviewSample={() => setIsPDFPreviewOpen(true)}
      />
      <main id="main-content" className="flex-1 pt-20">
        {children}
      </main>
      <PDFPreview
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
      />
      <Footer
        brandName={globalContent.brandName}
        copyright={globalContent.footerCopyright}
        disclaimer={globalContent.footerDisclaimer}
        socialLinks={globalContent.socialLinks}
        footerNav={[
          { label: "Home", href: "/" },
          { label: "The Gap", href: "#problem" },
          { label: "SOAP Architect", href: "/soap-architect" },
        ]}
      />
    </div>
  );
}
