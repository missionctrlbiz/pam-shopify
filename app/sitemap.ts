import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/utils";

/**
 * Marketing surfaces that should be indexed by search engines.
 * Admin / API / gated content are deliberately excluded.
 */
const MARKETING_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/soap-architect", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/assessments", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/guides", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/resources", priority: 0.8, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return MARKETING_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_CONFIG.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
