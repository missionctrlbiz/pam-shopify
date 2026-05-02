import { z } from "zod"

export const StudioRatioSchema = z.enum(["1:1", "4:5", "9:16"])
export const StudioSlideKindSchema = z.enum(["COVER", "INSIGHT", "CTA", "STAT", "QUOTE"])
export const StudioSlideBackgroundSchema = z.enum(["NAVY", "WHITE", "INK", "GRADIENT", "SLATE"])
export const StudioSlideLayoutSchema = z.enum([
    "AUTO",
    "HERO_ICON",
    "FEATURE_CARDS",
    "TITLE_CARD",
    "TAXONOMY_LIST",
    "SCIENCE_SPLIT",
    "CHECKLIST",
    "QUOTE_CARD",
    "STAT_CARD",
    "DARK_NOTE",
])

export const StudioCaptionSchema = z.object({
    body: z.string(),
    hashtags: z.array(z.string()).default([]),
    chars: z.number().int().nonnegative().default(0),
})

export const StudioCaptionsSchema = z.object({
    instagram: StudioCaptionSchema,
    facebook: StudioCaptionSchema,
    linkedin: StudioCaptionSchema,
    tiktok: StudioCaptionSchema,
})

export const StudioSlideSchema = z.object({
    id: z.string().min(1).describe("Stable slide id. Preserve ids when regenerating a specific slide."),
    kind: StudioSlideKindSchema.describe("Visual/layout role. Rotate COVER, STAT, INSIGHT, QUOTE, CTA so middle slides do not repeat the same block."),
    layout: StudioSlideLayoutSchema.default("AUTO").describe("Specific visual composition. Use HERO_ICON for title/icon slides, FEATURE_CARDS for 3 icon cards, TITLE_CARD for icon slab plus headline/body, TAXONOMY_LIST for 3 type/category rows, SCIENCE_SPLIT for mechanism/brain/pathway diagrams, CHECKLIST for checklists, QUOTE_CARD for field notes, STAT_CARD for data/checkpoint slides, DARK_NOTE for dark contrast notes."),
    headline: z.string().describe("Main on-slide headline. Specific, scannable, and clinically useful."),
    body: z.string().describe("Supporting text. Use newline-separated short lines. For FEATURE_CARDS/TAXONOMY_LIST use 'Label — description' rows. For CHECKLIST prefix lines with ✓. For SCIENCE_SPLIT include one subtitle line, one explanation line, then 3-5 'Label — annotation' diagram labels."),
    stat: z.object({
        value: z.string().describe("Large visual anchor, e.g. 01, 3 checks, Red flag, 74%."),
        label: z.string().describe("Small label explaining the stat/checkpoint."),
    }).optional().describe("Required for STAT slides; optional elsewhere."),
    bg: StudioSlideBackgroundSchema.describe("Visual background. Prefer WHITE, SLATE, or GRADIENT unless the user explicitly asks for dark/navy/ink styling."),
    assets: z.object({
        logo: z.enum(["COLOR", "WHITE", "NONE"]).describe("Use WHITE on dark/gradient backgrounds and COLOR on white backgrounds."),
        book: z.boolean().optional().describe("Use the book only on cover and CTA unless specifically needed."),
    }).optional().describe("Visual asset choices for the slide."),
})

export const StudioCarouselSchema = z.object({
    ratio: StudioRatioSchema,
    slides: z.array(StudioSlideSchema).min(1),
    meta: z.object({
        palette: z.array(z.string()).min(1),
        font: z.enum(["Montserrat", "Inter"]),
    }),
})

export const StudioQualitySchema = z.object({
    score: z.number().min(0).max(5).optional(),
    passed: z.boolean().optional(),
    notes: z.array(z.string()).optional(),
})

export const StudioPackageGenerationSchema = z.object({
    title: z.string(),
    carouselJson: StudioCarouselSchema,
    captionsJson: StudioCaptionsSchema,
    qualityJson: StudioQualitySchema,
})

export const StudioSlideGenerationSchema = z.object({
    slide: StudioSlideSchema,
})

export const StudioCaptionGenerationSchema = z.object({
    caption: StudioCaptionSchema,
})

export const StudioQualityGateSchema = z.object({
    score: z.number().min(0).max(5),
    passed: z.boolean(),
    notes: z.array(z.string()),
})

export type StudioPackageGeneration = z.infer<typeof StudioPackageGenerationSchema>
export type StudioSlideGeneration = z.infer<typeof StudioSlideGenerationSchema>
export type StudioCaptionGeneration = z.infer<typeof StudioCaptionGenerationSchema>
