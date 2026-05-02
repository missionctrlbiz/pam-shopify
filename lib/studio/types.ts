export type StudioRatio = "1:1" | "4:5" | "9:16"
export type StudioPackageStatus = "DRAFT" | "READY" | "APPROVED" | "PUBLISHED" | "ARCHIVED"
export type StudioSourceType = "PROMPT" | "PDF" | "CSV" | "PASTE"
export type StudioSlideKind = "COVER" | "INSIGHT" | "CTA" | "STAT" | "QUOTE"
export type StudioSlideBackground = "NAVY" | "WHITE" | "INK" | "GRADIENT" | "SLATE"
export type StudioSlideLayout =
    | "AUTO"
    | "HERO_ICON"
    | "FEATURE_CARDS"
    | "TITLE_CARD"
    | "TAXONOMY_LIST"
    | "SCIENCE_SPLIT"
    | "CHECKLIST"
    | "QUOTE_CARD"
    | "STAT_CARD"
    | "DARK_NOTE"
export type StudioAssetKind = "SLIDE_PNG" | "CAPTION_TXT" | "BUNDLE_ZIP"

export interface StudioSlideAssets {
    logo: "COLOR" | "WHITE" | "NONE"
    book?: boolean
}

export interface StudioSlideStat {
    value: string
    label: string
}

export interface StudioSlide {
    id: string
    kind: StudioSlideKind
    layout?: StudioSlideLayout
    headline: string
    body: string
    stat?: StudioSlideStat
    bg: StudioSlideBackground
    assets?: StudioSlideAssets
}

export interface StudioCarouselJson {
    ratio: StudioRatio
    slides: StudioSlide[]
    meta: {
        palette: string[]
        font: "Montserrat" | "Inter"
    }
}

export interface StudioCaption {
    body: string
    hashtags: string[]
    chars: number
}

export interface StudioCaptionsJson {
    instagram: StudioCaption
    facebook: StudioCaption
    linkedin: StudioCaption
    tiktok: StudioCaption
}

export interface StudioQualityJson {
    score?: number
    passed?: boolean
    notes?: string[]
}

export interface StudioPackage {
    id: string
    ownerId: string
    title: string
    status: StudioPackageStatus
    sourceType: StudioSourceType
    sourcePrompt: string | null
    sourceBlobPath: string | null
    sourceText: string | null
    carouselJson: StudioCarouselJson
    captionsJson: StudioCaptionsJson
    qualityJson: StudioQualityJson
    createdAt: string
    updatedAt: string
}

export interface StudioMessage {
    id: string
    packageId: string
    role: "user" | "assistant" | "system"
    content: string
    target: string | null
    createdAt: string
}

export interface StudioAsset {
    id: string
    packageId: string
    kind: StudioAssetKind
    ratio: StudioRatio | null
    slideId: string | null
    storagePath: string
    bytes: number | null
    createdAt: string
}

export interface StudioBrandJson {
    brand_name: string
    site_url: string
    product_url: string
    audience: string
    logo_path: string
    book_path: string
    alt_path?: string
    palette: string[]
    logo_url?: string | null
    book_url?: string | null
    alt_url?: string | null
}

export interface StudioSettings {
    ownerId: string
    brandJson: StudioBrandJson
    ctaPresets: string[]
    tone: string
    hookStyle: string
    hashtagCluster: string
    modelStrategist: string
    modelGate: string
    gateThreshold: number
    defaultSlides: number
    alwaysSay: string | null
    neverSay: string | null
    updatedAt: string
}

export interface StudioPackageListItem {
    id: string
    title: string
    status: StudioPackageStatus
    sourceType: StudioSourceType
    updatedAt: string
    createdAt: string
    slideCount: number
    qualityScore?: number | null
    coverHeadline?: string | null
    coverKind?: StudioSlideKind | null
}

export interface StudioSourceIngestResult {
    item: StudioPackage
    sourceType: StudioSourceType
    sourceTextLength: number
    fileName?: string | null
}

export interface StudioExportJobResult {
    dispatched: boolean
    taskId: string
    inline: boolean
    assets?: StudioAsset[]
}

const DEFAULT_PALETTE = ["#041f50", "#af5ce9", "#ec5185", "#ed415b"]

export function createDefaultCaptions(): StudioCaptionsJson {
    const instagramBody = ""
    const facebookBody = ""
    const linkedinBody = ""
    const tiktokBody = ""

    return {
        instagram: { body: instagramBody, hashtags: [], chars: instagramBody.length },
        facebook: { body: facebookBody, hashtags: [], chars: facebookBody.length },
        linkedin: { body: linkedinBody, hashtags: [], chars: linkedinBody.length },
        tiktok: { body: tiktokBody, hashtags: [], chars: tiktokBody.length },
    }
}

export function createDefaultCarouselJson(): StudioCarouselJson {
    return {
        ratio: "1:1",
        meta: {
            palette: DEFAULT_PALETTE,
            font: "Montserrat",
        },
        slides: [],
    }
}

export function normalizeStudioCarouselJson(input: unknown): StudioCarouselJson {
    const defaults = createDefaultCarouselJson()
    if (!input || typeof input !== "object") {
        return defaults
    }

    const candidate = input as Partial<StudioCarouselJson>
    return {
        ratio: candidate.ratio === "4:5" || candidate.ratio === "9:16" || candidate.ratio === "1:1"
            ? candidate.ratio
            : defaults.ratio,
        slides: Array.isArray(candidate.slides) ? candidate.slides.filter((slide): slide is StudioSlide => {
            return Boolean(
                slide
                && typeof slide === "object"
                && typeof (slide as StudioSlide).id === "string"
                && typeof (slide as StudioSlide).headline === "string"
                && typeof (slide as StudioSlide).body === "string",
            )
        }) : defaults.slides,
        meta: {
            palette: Array.isArray(candidate.meta?.palette) && candidate.meta.palette.length > 0
                ? candidate.meta.palette
                : defaults.meta.palette,
            font: candidate.meta?.font === "Inter" || candidate.meta?.font === "Montserrat"
                ? candidate.meta.font
                : defaults.meta.font,
        },
    }
}

export function normalizeStudioCaptionsJson(input: unknown): StudioCaptionsJson {
    const defaults = createDefaultCaptions()
    if (!input || typeof input !== "object") {
        return defaults
    }

    const candidate = input as Partial<StudioCaptionsJson>
    return {
        instagram: normalizeCaption(candidate.instagram?.body ?? defaults.instagram.body, candidate.instagram?.hashtags ?? defaults.instagram.hashtags),
        facebook: normalizeCaption(candidate.facebook?.body ?? defaults.facebook.body, candidate.facebook?.hashtags ?? defaults.facebook.hashtags),
        linkedin: normalizeCaption(candidate.linkedin?.body ?? defaults.linkedin.body, candidate.linkedin?.hashtags ?? defaults.linkedin.hashtags),
        tiktok: normalizeCaption(candidate.tiktok?.body ?? defaults.tiktok.body, candidate.tiktok?.hashtags ?? defaults.tiktok.hashtags),
    }
}

export function normalizeStudioQualityJson(input: unknown): StudioQualityJson {
    if (!input || typeof input !== "object") {
        return {}
    }

    const candidate = input as StudioQualityJson
    return {
        score: typeof candidate.score === "number" ? candidate.score : undefined,
        passed: typeof candidate.passed === "boolean" ? candidate.passed : undefined,
        notes: Array.isArray(candidate.notes) ? candidate.notes.filter((note): note is string => typeof note === "string") : undefined,
    }
}

const STUDIO_VARIETY_PATTERNS: Array<Pick<StudioSlide, "kind" | "layout" | "bg" | "assets">> = [
    { kind: "STAT", layout: "STAT_CARD", bg: "GRADIENT", assets: { logo: "WHITE" } },
    { kind: "INSIGHT", layout: "FEATURE_CARDS", bg: "WHITE", assets: { logo: "COLOR" } },
    { kind: "INSIGHT", layout: "TITLE_CARD", bg: "WHITE", assets: { logo: "COLOR" } },
    { kind: "INSIGHT", layout: "TAXONOMY_LIST", bg: "WHITE", assets: { logo: "COLOR" } },
    { kind: "QUOTE", layout: "QUOTE_CARD", bg: "SLATE", assets: { logo: "COLOR" } },
    { kind: "INSIGHT", layout: "SCIENCE_SPLIT", bg: "WHITE", assets: { logo: "COLOR" } },
    { kind: "INSIGHT", layout: "DARK_NOTE", bg: "SLATE", assets: { logo: "COLOR" } },
    { kind: "INSIGHT", layout: "CHECKLIST", bg: "WHITE", assets: { logo: "COLOR" } },
]

function hasWeakVisualVariety(slides: StudioSlide[]) {
    const middleSlides = slides.slice(1, -1)
    if (middleSlides.length < 3) {
        return false
    }

    const middleKinds = new Set(middleSlides.map((slide) => slide.kind))
    const middleLayouts = new Set(middleSlides.map((slide) => slide.layout ?? "AUTO"))
    const middleBackgrounds = new Set(middleSlides.map((slide) => slide.bg))
    const repeatedRuns = middleSlides.some((slide, index) => {
        const prior = middleSlides[index - 1]
        const next = middleSlides[index + 1]
        return Boolean(prior && next && prior.kind === slide.kind && next.kind === slide.kind && prior.bg === slide.bg && next.bg === slide.bg)
    })

    return middleKinds.size < 3 || middleLayouts.size < 4 || middleBackgrounds.size < 3 || repeatedRuns
}

export function applyStudioCarouselVariety(slides: StudioSlide[]): StudioSlide[] {
    if (slides.length <= 2) {
        return slides
    }

    const forcePattern = hasWeakVisualVariety(slides)

    return slides.map((slide, index) => {
        const isFirst = index === 0
        const isLast = index === slides.length - 1

        if (isFirst) {
            return {
                ...slide,
                kind: slide.kind === "STAT" ? "STAT" : "COVER",
                layout: slide.layout && slide.layout !== "AUTO" ? slide.layout : "HERO_ICON",
                bg: slide.bg === "GRADIENT" || slide.bg === "SLATE" ? slide.bg : "WHITE",
                assets: { ...slide.assets, logo: slide.bg === "GRADIENT" || slide.bg === "NAVY" || slide.bg === "INK" ? "WHITE" : "COLOR", book: true },
            }
        }

        if (isLast) {
            return {
                ...slide,
                kind: "CTA",
                layout: "HERO_ICON",
                bg: slide.bg === "GRADIENT" || slide.bg === "NAVY" || slide.bg === "INK" ? slide.bg : "SLATE",
                assets: { ...slide.assets, logo: slide.bg === "GRADIENT" || slide.bg === "NAVY" || slide.bg === "INK" ? "WHITE" : "COLOR", book: true },
            }
        }

        const pattern = STUDIO_VARIETY_PATTERNS[(index - 1) % STUDIO_VARIETY_PATTERNS.length]
        const prior = slides[index - 1]
        const shouldApplyPattern = forcePattern || slide.kind === "COVER" || slide.kind === "CTA" || (prior?.kind === slide.kind && prior.bg === slide.bg)
        const nextKind = shouldApplyPattern ? pattern.kind : slide.kind
        const nextBg = shouldApplyPattern ? pattern.bg : slide.bg
        const nextLayout = shouldApplyPattern || !slide.layout || slide.layout === "AUTO" ? pattern.layout : slide.layout

        return {
            ...slide,
            kind: nextKind,
            layout: nextLayout,
            bg: nextBg,
            stat: nextKind === "STAT"
                ? slide.stat ?? { value: `0${index + 1}`, label: "Clinical checkpoint" }
                : slide.stat,
            assets: {
                ...slide.assets,
                ...pattern.assets,
                logo: nextBg === "WHITE" || nextBg === "SLATE" ? "COLOR" : "WHITE",
                book: false,
            },
        }
    })
}

export function createDefaultStudioPackage(ownerId: string): Omit<StudioPackage, "id" | "createdAt" | "updatedAt"> {
    return {
        ownerId,
        title: "Untitled Carousel",
        status: "DRAFT",
        sourceType: "PROMPT",
        sourcePrompt: null,
        sourceBlobPath: null,
        sourceText: null,
        carouselJson: createDefaultCarouselJson(),
        captionsJson: createDefaultCaptions(),
        qualityJson: {},
    }
}

export function createDefaultStudioSettings(ownerId: string): StudioSettings {
    return {
        ownerId,
        brandJson: {
            brand_name: "Psychiatric Assessment Mastery",
            site_url: "psychassessmentguide.com",
            product_url: "psychassessmentguide.com/pocket-guide",
            audience: "Nursing students · NCLEX preppers",
            logo_path: "/logo.webp",
            book_path: "/1.png",
            palette: DEFAULT_PALETTE,
        },
        ctaPresets: [
            "Get the Complete Pocket Guide",
            "Free clinical reference — link in bio",
            "Save this for your psych rotation",
        ],
        tone: "AUTHORITATIVE",
        hookStyle: "STAT_LED",
        hashtagCluster: "#NursingStudent #PsychNurse #NCLEX #ClinicalEducation",
        modelStrategist: "gemini-2.5-pro",
        modelGate: "gemini-2.5-flash",
        gateThreshold: 3,
        defaultSlides: 8,
        alwaysSay: "Pocket Guide PDF · NCLEX prep · psychassessmentguide.com as the destination for free clinical references.",
        neverSay: "Never imply diagnosis · never use cure · never replace clinical judgment.",
        updatedAt: new Date().toISOString(),
    }
}

export function normalizeCaption(body: unknown, hashtags: unknown): StudioCaption {
    const cleanBody = typeof body === "string" ? body.trim() : ""
    const bodyHashtags = cleanBody.match(/#[\p{L}\p{N}_]+/gu) ?? []
    const cleanHashtags = Array.isArray(hashtags)
        ? Array.from(new Set([
            ...hashtags.filter((tag): tag is string => typeof tag === "string" && tag.trim().startsWith("#")).map((tag) => tag.trim()),
            ...bodyHashtags,
        ]))
        : []

    return {
        body: cleanBody,
        hashtags: cleanHashtags,
        chars: cleanBody.length,
    }
}
