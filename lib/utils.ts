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
export const SITE_CONFIG = {
  name: "Psychiatric Assessment Mastery",
  shortName: "PAM",
  description:
    "The practical, step-by-step clinical companion for PMHNP students and new graduates. Simple English. Zero fluff.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.psychassessmentguide.com",
  ogImage: "/og-image.png",
  locale: "en-US",
  author: "Tonia Ojomo, MSN, BSN, RN",
  twitterHandle: "@psychassessmastery",
} as const;
