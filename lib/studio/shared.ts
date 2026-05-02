import type { StudioRatio, StudioSlideBackground, StudioSlideKind, StudioSlideLayout } from "@/lib/studio/types"

export type StudioSlideRenderSpec = {
    id: string
    label: string
    variant: "cover" | "insight" | "darkInsight" | "stat" | "quote" | "checklist" | "cta" | "heroIcon" | "featureCards" | "titleCard" | "taxonomyList" | "scienceSplit"
    kind: StudioSlideKind
    layout: StudioSlideLayout
    bg: StudioSlideBackground
    eyebrow: string
    headline: string
    body?: string[]
    stat?: string
    statNote?: string
    cta?: string
    footer: string
}

export const STUDIO_RATIOS: StudioRatio[] = ["1:1", "4:5", "9:16"]

export const STUDIO_PAM_GRADIENT = "linear-gradient(135deg, #ed415b 0%, #ec5185 50%, #af5ce9 100%)"

export const STUDIO_TYPOGRAPHY = {
    headingFamily: "Montserrat",
    bodyFamily: "Open Sans",
} as const

export const STUDIO_RENDERER_VERSION = "satori-resvg-v2026.05.02"
