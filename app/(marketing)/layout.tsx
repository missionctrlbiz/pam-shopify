import type { ReactNode } from "react";

import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import siteContent from "@/content/site-content.json";

/**
 * Layout for all marketing surfaces (/, /soap-architect, /assessments,
 * /guides, /resources). Mounts the shared frosted-glass Header and the
 * motion-grid Footer so individual pages stay focused on content.
 *
 * Admin routes intentionally live outside this route group so they
 * don't inherit the marketing chrome.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const globalContent = siteContent.global;

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col selection:bg-psych-navy/20 selection:text-white">
      <Header
        navigation={globalContent.navigation}
        brandName={globalContent.brandName}
      />
      {/* Spacer for fixed header */}
      <main className="flex-1 pt-20">{children}</main>
      <Footer
        brandName={globalContent.brandName}
        copyright={globalContent.footerCopyright}
        disclaimer={globalContent.footerDisclaimer}
        socialLinks={globalContent.socialLinks}
        footerNav={[
          { label: "Home", href: "/" },
          { label: "SOAP Architect", href: "/soap-architect" },
          { label: "Assessments", href: "/assessments" },
          { label: "Guides", href: "/guides" },
          { label: "Resources", href: "/resources" },
        ]}
      />
    </div>
  );
}
