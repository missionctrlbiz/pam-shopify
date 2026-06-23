import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/utils";

/**
 * Marketing surfaces that should be indexed by search engines.
 * Admin / API / gated content are deliberately excluded.
 */
const MARKETING_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/soap-architect", priority: 0.9, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return MARKETING_ROUTES.map(({ path, priority, changeFrequency }) => ({
    // Use the URL constructor so a trailing slash in SITE_CONFIG.url
    // can't produce malformed entries like `https://x.com//path`.
    url: new URL(path, SITE_CONFIG.url).toString(),
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
