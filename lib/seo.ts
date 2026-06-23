import type { Metadata } from "next";

import { SITE_CONFIG } from "@/lib/utils";

/**
 * Default OpenGraph image — references a static asset at /og-image.png.
 * If the file does not exist yet, it will gracefully 404 but never throw.
 */
const OG_IMAGE_PATH = SITE_CONFIG.ogImage;

/**
 * Build a Next.js Metadata object with the brand defaults baked in.
 * Per-page fields (title, description, etc.) override the defaults.
 */
export function buildMetadata(overrides: Metadata = {}): Metadata {
  const titleTemplate = `%s | ${SITE_CONFIG.name}`;
  const defaultTitle = `${SITE_CONFIG.name} — ${SITE_CONFIG.description}`;

  return {
    metadataBase: new URL(SITE_CONFIG.url),
    title: {
      default: defaultTitle,
      template: titleTemplate,
    },
    description: SITE_CONFIG.description,
    applicationName: SITE_CONFIG.name,
    keywords: [
      "PMHNP",
      "psychiatric assessment",
      "SOAP note",
      "mental health nursing",
      "psych NP student",
      "ESL nursing",
      "clinical documentation",
      "psychiatric evaluation",
    ],
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.name,
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: SITE_CONFIG.locale,
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      title: defaultTitle,
      description: SITE_CONFIG.description,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: SITE_CONFIG.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: SITE_CONFIG.description,
      images: [OG_IMAGE_PATH],
      creator: SITE_CONFIG.twitterHandle,
    },
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [{ url: "/favicon.webp", type: "image/webp" }],
      apple: "/logo.webp",
    },
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*                          JSON-LD Builders                          */
/* ------------------------------------------------------------------ */

interface JsonLdObject {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

/**
 * Organization schema — single source of truth for brand identity
 * in search results.
 */
export function buildOrganizationLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.webp`,
    description: SITE_CONFIG.description,
    founder: {
      "@type": "Person",
      name: SITE_CONFIG.author,
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61583718219640",
      "https://www.instagram.com/psychassessmastery",
      "https://www.tiktok.com/@psychassessmastery",
      "https://www.linkedin.com/company/psychassessmastery",
    ],
  };
}

/**
 * WebSite schema with SearchAction — enables sitelinks search box.
 */
export function buildWebsiteLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    inLanguage: SITE_CONFIG.locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      // The schema.org spec requires this even though the public site
      // doesn't currently expose a search UI — Google uses it as the
      // input name for the sitelinks search box.
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Product schema for the Digital Edition pricing card.
 * Helps Google show price + availability in SERPs.
 */
export function buildProductLd(opts?: {
  url?: string;
  price?: string;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Psychiatric Assessment Mastery — Digital Edition",
    description:
      "A practical, step-by-step clinical workbook for PMHNP students. Simple English. Zero fluff.",
    image: `${SITE_CONFIG.url}/psych-cover.png`,
    brand: { "@type": "Brand", name: SITE_CONFIG.name },
    offers: {
      "@type": "Offer",
      url: opts?.url ?? `${SITE_CONFIG.url}/#pricing`,
      price: opts?.price ?? "69.99",
      priceCurrency: opts?.currency ?? "USD",
      availability: `https://schema.org/${
        opts?.availability ?? "InStock"
      }`,
    },
  };
}

/**
 * BreadcrumbList schema — used on inner pages to show breadcrumb
 * snippets in search results.
 */
export function buildBreadcrumbLd(
  items: { name: string; url: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Compose multiple JSON-LD objects into a single <script> payload.
 * Returns the serialised string ready to drop into a dangerouslySetInnerHTML.
 */
export function serialiseJsonLd(...objects: JsonLdObject[]): string {
  return JSON.stringify(objects.length === 1 ? objects[0] : objects);
}
