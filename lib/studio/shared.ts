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
