import type { Metadata } from "next";

import siteContent from "@/content/site-content.json";
import { Section } from "@/components/marketing/Section";
import { ContentPageHero } from "@/components/marketing/ContentPageHero";
import { ContentTileGrid } from "@/components/marketing/ContentTileGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildBreadcrumbLd, serialiseJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Study Guides — Phrase banks, cheat sheets, workflows",
  description:
    "Plain-English study guides for PMHNP students — phrase banks, documentation phrases, ESL glossary, preceptor red flags, and clinical workflows.",
  alternates: { canonical: "/guides" },
});

export default function GuidesPage() {
  const content = siteContent.guidesPage;

  // JSON-LD should be a plain inline <script> — next/script is intended for
  // executable JS, and `afterInteractive` defers structured-data parsing.
  const breadcrumbLd = serialiseJsonLd(
    buildBreadcrumbLd([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
    ])
  );

  return (
    <>
      <ContentPageHero
        eyebrow={content.eyebrow}
        headline={content.headline}
        headlineAccent={content.headlineAccent}
        accentVariant="psych"
        subheadline={content.subheadline}
      />

      <Section background="slate" spacing="lg">
        <ContentTileGrid items={content.items} />
      </Section>

      <CTASection
        eyebrow={content.cta.eyebrow}
        headline={content.cta.headline}
        description={content.cta.description}
        ctaLabel={content.cta.ctaLabel}
        ctaHref={content.cta.ctaHref}
        disclaimer={content.disclaimer}
      />

      <script
        id="ld-breadcrumb-guides"
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />
    </>
  );
}
