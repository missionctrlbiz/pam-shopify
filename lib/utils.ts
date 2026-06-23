import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind merge conflict resolution.
 * Used across shadcn/ui primitives and marketing components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Site-wide constants used by the marketing surfaces.
 * Single source of truth so layout / SEO / footer stay aligned.
 */
function resolveSiteUrl(): string {
  const fallback = "https://www.psychassessmentguide.com";
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!candidate) return fallback;
  // Validate so a malformed env var doesn't throw at request time
  // when downstream code calls `new URL(SITE_CONFIG.url, ...)`.
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    // Normalize trailing slash so URL concatenation never produces "//".
    return parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[SITE_CONFIG] NEXT_PUBLIC_SITE_URL="${candidate}" is not a valid URL; using fallback.`
      );
    }
    return fallback;
  }
}

export const SITE_CONFIG = {
  name: "Psychiatric Assessment Mastery",
  shortName: "PAM",
  description:
    "The practical, step-by-step clinical companion for PMHNP students and new graduates. Simple English. Zero fluff.",
  url: resolveSiteUrl(),
  ogImage: "/og-image.png",
  locale: "en-US",
  author: "Tonia Ojomo, MSN, BSN, RN",
  twitterHandle: "@psychassessmastery",
} as const;
