import type { Metadata } from "next";
import Script from "next/script";

import siteContent from "@/content/site-content.json";
import { Section } from "@/components/marketing/Section";
import { ContentPageHero } from "@/components/marketing/ContentPageHero";
import { ContentTileGrid } from "@/components/marketing/ContentTileGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildBreadcrumbLd, serialiseJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Clinical Assessments — Practice-ready frameworks",
  description:
    "Step-by-step assessment frameworks for PMHNP students — Mental Status Exam, SOAP Notes, Risk Assessment, Differential Diagnosis, and more.",
  alternates: { canonical: "/assessments" },
});

export default function AssessmentsPage() {
  const content = siteContent.assessmentsPage;

  return (
    <>
      <ContentPageHero
        eyebrow={content.eyebrow}
        headline={content.headline}
        headlineAccent={content.headlineAccent}
        accentVariant="brain"
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

      <Script
        id="ld-breadcrumb-assessments"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: serialiseJsonLd(
            buildBreadcrumbLd([
              { name: "Home", url: "/" },
              { name: "Assessments", url: "/assessments" },
            ])
          ),
        }}
      />
    </>
  );
}
