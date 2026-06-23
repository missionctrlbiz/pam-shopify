import type { StudioRatio, StudioSlideLayout } from "./types"

export interface SlideLayoutSpec {
    headlineSize: number
    bodySize: number
    iconSize: number
    statSize: number
    labelSize: number
    paddingX: number
    paddingY: number
    maxBodyLines: number
    maxHeadlineChars: number
}

export const STUDIO_FRAME_DIMENSIONS: Record<StudioRatio, { width: number; height: number }> = {
    "1:1": { width: 1080, height: 1080 },
    "4:5": { width: 1080, height: 1350 },
    "9:16": { width: 1080, height: 1920 },
}

export const STUDIO_DOM_FRAME_DIMENSIONS: Record<StudioRatio, { width: number; height: number }> = {
    "1:1": { width: 380, height: 380 },
    "4:5": { width: 360, height: 450 },
    "9:16": { width: 290, height: 516 },
}

function scale(ratio: StudioRatio): number {
    if (ratio === "1:1") return 0.72
    if (ratio === "4:5") return 0.88
    return 1.02
}

function r(base: number, ratio: StudioRatio): number {
    return Math.round(base * scale(ratio))
}

const SPEC: Partial<Record<StudioSlideLayout | "INSIGHT" | "STAT" | "QUOTE" | "CHECKLIST" | "CTA" | "DARK_NOTE", Record<StudioRatio, SlideLayoutSpec>>> = {
    HERO_ICON: {
        "1:1":  { headlineSize: r(52, "1:1"), bodySize: r(24, "1:1"), iconSize: r(148, "1:1"), statSize: r(96, "1:1"), labelSize: r(24, "1:1"), paddingX: 58, paddingY: 58, maxBodyLines: 3, maxHeadlineChars: 80 },
        "4:5":  { headlineSize: r(52, "4:5"), bodySize: r(24, "4:5"), iconSize: r(148, "4:5"), statSize: r(96, "4:5"), labelSize: r(24, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 2, maxHeadlineChars: 70 },
        "9:16": { headlineSize: r(52, "9:16"), bodySize: r(24, "9:16"), iconSize: r(148, "9:16"), statSize: r(96, "9:16"), labelSize: r(24, "9:16"), paddingX: 72, paddingY: 88, maxBodyLines: 2, maxHeadlineChars: 60 },
    },
    FEATURE_CARDS: {
        "1:1":  { headlineSize: r(48, "1:1"), bodySize: r(21, "1:1"), iconSize: r(72, "1:1"), statSize: r(48, "1:1"), labelSize: r(22, "1:1"), paddingX: 60, paddingY: 48, maxBodyLines: 0, maxHeadlineChars: 90 },
        "4:5":  { headlineSize: r(48, "4:5"), bodySize: r(21, "4:5"), iconSize: r(72, "4:5"), statSize: r(48, "4:5"), labelSize: r(22, "4:5"), paddingX: 56, paddingY: 52, maxBodyLines: 0, maxHeadlineChars: 80 },
        "9:16": { headlineSize: r(48, "9:16"), bodySize: r(21, "9:16"), iconSize: r(72, "9:16"), statSize: r(48, "9:16"), labelSize: r(22, "9:16"), paddingX: 52, paddingY: 56, maxBodyLines: 0, maxHeadlineChars: 70 },
    },
    TITLE_CARD: {
        "1:1":  { headlineSize: r(38, "1:1"), bodySize: r(21, "1:1"), iconSize: r(62, "1:1"), statSize: r(38, "1:1"), labelSize: r(18, "1:1"), paddingX: 70, paddingY: 62, maxBodyLines: 6, maxHeadlineChars: 110 },
        "4:5":  { headlineSize: r(38, "4:5"), bodySize: r(21, "4:5"), iconSize: r(62, "4:5"), statSize: r(38, "4:5"), labelSize: r(18, "4:5"), paddingX: 66, paddingY: 68, maxBodyLines: 5, maxHeadlineChars: 95 },
        "9:16": { headlineSize: r(38, "9:16"), bodySize: r(21, "9:16"), iconSize: r(62, "9:16"), statSize: r(38, "9:16"), labelSize: r(18, "9:16"), paddingX: 62, paddingY: 76, maxBodyLines: 3, maxHeadlineChars: 80 },
    },
    TAXONOMY_LIST: {
        "1:1":  { headlineSize: r(46, "1:1"), bodySize: r(24, "1:1"), iconSize: r(58, "1:1"), statSize: r(46, "1:1"), labelSize: r(20, "1:1"), paddingX: 76, paddingY: 70, maxBodyLines: 0, maxHeadlineChars: 60 },
        "4:5":  { headlineSize: r(46, "4:5"), bodySize: r(24, "4:5"), iconSize: r(58, "4:5"), statSize: r(46, "4:5"), labelSize: r(20, "4:5"), paddingX: 72, paddingY: 74, maxBodyLines: 0, maxHeadlineChars: 54 },
        "9:16": { headlineSize: r(46, "9:16"), bodySize: r(24, "9:16"), iconSize: r(58, "9:16"), statSize: r(46, "9:16"), labelSize: r(20, "9:16"), paddingX: 66, paddingY: 78, maxBodyLines: 0, maxHeadlineChars: 48 },
    },
    SCIENCE_SPLIT: {
        "1:1":  { headlineSize: r(36, "1:1"), bodySize: r(19, "1:1"), iconSize: r(36, "1:1"), statSize: r(36, "1:1"), labelSize: r(17, "1:1"), paddingX: 54, paddingY: 46, maxBodyLines: 4, maxHeadlineChars: 80 },
        "4:5":  { headlineSize: r(36, "4:5"), bodySize: r(19, "4:5"), iconSize: r(36, "4:5"), statSize: r(36, "4:5"), labelSize: r(17, "4:5"), paddingX: 52, paddingY: 52, maxBodyLines: 5, maxHeadlineChars: 70 },
        "9:16": { headlineSize: r(36, "9:16"), bodySize: r(19, "9:16"), iconSize: r(36, "9:16"), statSize: r(36, "9:16"), labelSize: r(17, "9:16"), paddingX: 50, paddingY: 58, maxBodyLines: 6, maxHeadlineChars: 60 },
    },
    INSIGHT: {
        "1:1":  { headlineSize: r(72, "1:1"), bodySize: r(24, "1:1"), iconSize: r(48, "1:1"), statSize: r(64, "1:1"), labelSize: r(20, "1:1"), paddingX: 64, paddingY: 64, maxBodyLines: 6, maxHeadlineChars: 110 },
        "4:5":  { headlineSize: r(72, "4:5"), bodySize: r(24, "4:5"), iconSize: r(48, "4:5"), statSize: r(64, "4:5"), labelSize: r(20, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 5, maxHeadlineChars: 95 },
        "9:16": { headlineSize: r(72, "9:16"), bodySize: r(24, "9:16"), iconSize: r(48, "9:16"), statSize: r(64, "9:16"), labelSize: r(20, "9:16"), paddingX: 68, paddingY: 80, maxBodyLines: 3, maxHeadlineChars: 80 },
    },
    STAT_CARD: {
        "1:1":  { headlineSize: r(72, "1:1"), bodySize: r(26, "1:1"), iconSize: r(48, "1:1"), statSize: r(160, "1:1"), labelSize: r(28, "1:1"), paddingX: 64, paddingY: 64, maxBodyLines: 3, maxHeadlineChars: 80 },
        "4:5":  { headlineSize: r(72, "4:5"), bodySize: r(26, "4:5"), iconSize: r(48, "4:5"), statSize: r(160, "4:5"), labelSize: r(28, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 3, maxHeadlineChars: 70 },
        "9:16": { headlineSize: r(72, "9:16"), bodySize: r(26, "9:16"), iconSize: r(48, "9:16"), statSize: r(200, "9:16"), labelSize: r(28, "9:16"), paddingX: 68, paddingY: 80, maxBodyLines: 2, maxHeadlineChars: 60 },
    },
    QUOTE_CARD: {
        "1:1":  { headlineSize: r(60, "1:1"), bodySize: r(27, "1:1"), iconSize: r(104, "1:1"), statSize: r(60, "1:1"), labelSize: r(22, "1:1"), paddingX: 64, paddingY: 64, maxBodyLines: 3, maxHeadlineChars: 90 },
        "4:5":  { headlineSize: r(60, "4:5"), bodySize: r(27, "4:5"), iconSize: r(104, "4:5"), statSize: r(60, "4:5"), labelSize: r(22, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 2, maxHeadlineChars: 80 },
        "9:16": { headlineSize: r(60, "9:16"), bodySize: r(27, "9:16"), iconSize: r(104, "9:16"), statSize: r(60, "9:16"), labelSize: r(22, "9:16"), paddingX: 68, paddingY: 80, maxBodyLines: 2, maxHeadlineChars: 70 },
    },
    CHECKLIST: {
        "1:1":  { headlineSize: r(66, "1:1"), bodySize: r(22, "1:1"), iconSize: r(26, "1:1"), statSize: r(48, "1:1"), labelSize: r(18, "1:1"), paddingX: 64, paddingY: 64, maxBodyLines: 5, maxHeadlineChars: 100 },
        "4:5":  { headlineSize: r(66, "4:5"), bodySize: r(22, "4:5"), iconSize: r(26, "4:5"), statSize: r(48, "4:5"), labelSize: r(18, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 5, maxHeadlineChars: 90 },
        "9:16": { headlineSize: r(66, "9:16"), bodySize: r(22, "9:16"), iconSize: r(26, "9:16"), statSize: r(48, "9:16"), labelSize: r(18, "9:16"), paddingX: 68, paddingY: 80, maxBodyLines: 4, maxHeadlineChars: 80 },
    },
    CTA: {
        "1:1":  { headlineSize: r(64, "1:1"), bodySize: r(22, "1:1"), iconSize: r(48, "1:1"), statSize: r(38, "1:1"), labelSize: r(18, "1:1"), paddingX: 64, paddingY: 64, maxBodyLines: 1, maxHeadlineChars: 90 },
        "4:5":  { headlineSize: r(64, "4:5"), bodySize: r(22, "4:5"), iconSize: r(48, "4:5"), statSize: r(38, "4:5"), labelSize: r(18, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 1, maxHeadlineChars: 80 },
        "9:16": { headlineSize: r(64, "9:16"), bodySize: r(22, "9:16"), iconSize: r(48, "9:16"), statSize: r(38, "9:16"), labelSize: r(18, "9:16"), paddingX: 68, paddingY: 80, maxBodyLines: 1, maxHeadlineChars: 70 },
    },
    DARK_NOTE: {
        "1:1":  { headlineSize: r(66, "1:1"), bodySize: r(20, "1:1"), iconSize: r(48, "1:1"), statSize: r(48, "1:1"), labelSize: r(18, "1:1"), paddingX: 64, paddingY: 64, maxBodyLines: 4, maxHeadlineChars: 80 },
        "4:5":  { headlineSize: r(66, "4:5"), bodySize: r(20, "4:5"), iconSize: r(48, "4:5"), statSize: r(48, "4:5"), labelSize: r(18, "4:5"), paddingX: 66, paddingY: 72, maxBodyLines: 4, maxHeadlineChars: 70 },
        "9:16": { headlineSize: r(66, "9:16"), bodySize: r(20, "9:16"), iconSize: r(48, "9:16"), statSize: r(48, "9:16"), labelSize: r(18, "9:16"), paddingX: 68, paddingY: 80, maxBodyLines: 3, maxHeadlineChars: 60 },
    },
}

export function getSlideLayoutSpec(
    layout: StudioSlideLayout | "INSIGHT" | "STAT" | "QUOTE" | "CHECKLIST" | "CTA" | "DARK_NOTE",
    ratio: StudioRatio,
): SlideLayoutSpec {
    const key = layout === "STAT_CARD" || layout === "STAT" ? "STAT_CARD"
        : layout === "QUOTE_CARD" || layout === "QUOTE" ? "QUOTE_CARD"
        : layout === "AUTO" ? "INSIGHT"
        : layout
    return SPEC[key]?.[ratio] ?? SPEC.INSIGHT![ratio]
}

export function scaleSpecForDOM(spec: SlideLayoutSpec, ratio: StudioRatio): SlideLayoutSpec {
    const frame = STUDIO_DOM_FRAME_DIMENSIONS[ratio]
    const factor = frame.width / 1080
    return {
        headlineSize: Math.round(spec.headlineSize * factor),
        bodySize: Math.round(spec.bodySize * factor),
        iconSize: Math.round(spec.iconSize * factor),
        statSize: Math.round(spec.statSize * factor),
        labelSize: Math.round(spec.labelSize * factor),
        paddingX: Math.round(spec.paddingX * factor),
        paddingY: Math.round(spec.paddingY * factor),
        maxBodyLines: spec.maxBodyLines,
        maxHeadlineChars: spec.maxHeadlineChars,
    }
}
