import "server-only"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject, streamObject } from "ai"
import {
    StudioCaptionGenerationSchema,
    StudioPackageGenerationSchema,
    StudioQualityGateSchema,
    StudioSlideGenerationSchema,
} from "@/lib/studio/schemas"
import type { StudioPackage, StudioSettings } from "@/lib/studio/types"

type StudioTarget = "CAROUSEL" | `SLIDE:${string}` | `CAPTION:${keyof StudioPackage["captionsJson"]}`

const SLIDE_COUNT_WORDS: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
}

function clampSlideCount(value: number) {
    return Math.max(1, Math.min(Math.round(value), 12))
}

export function getRequestedSlideCount(...inputs: Array<string | null | undefined>) {
    const message = inputs.filter(Boolean).join("\n")
    const hyphenatedMatch = message.match(/\b(\d{1,2})\s*[- ]\s*slide\b/i)
    if (hyphenatedMatch?.[1]) {
        return clampSlideCount(Number(hyphenatedMatch[1]))
    }

    const digitMatch = message.match(/\b(\d{1,2})\b(?:\s+[\w-]+){0,4}\s+(?:carousel\s+)?slides?\b/i)
    if (digitMatch?.[1]) {
        return clampSlideCount(Number(digitMatch[1]))
    }

    const wordPattern = Object.keys(SLIDE_COUNT_WORDS).join("|")
    const wordMatch = message.match(new RegExp(`\\b(${wordPattern})\\b(?:\\s+[\\w-]+){0,4}\\s+(?:carousel\\s+)?slides?\\b`, "i"))
    if (wordMatch?.[1]) {
        return SLIDE_COUNT_WORDS[wordMatch[1].toLowerCase()]
    }

    const slideMarkers = Array.from(message.matchAll(/\bslide\s*(?:#|no\.?|number)?\s*(\d{1,2})\b/gi))
        .map((match) => Number(match[1]))
        .filter((value) => Number.isFinite(value))
    const highestSlideMarker = Math.max(0, ...slideMarkers)
    if (highestSlideMarker >= 3) {
        return clampSlideCount(highestSlideMarker)
    }

    return null
}

export function getTargetSlideCount(pkg: StudioPackage, settings: StudioSettings, message: string) {
    return getRequestedSlideCount(message, pkg.sourcePrompt, pkg.sourceText) ?? clampSlideCount(settings.defaultSlides || 8)
}

function getGoogleModel(modelId: string) {
    const google = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
    })

    return google(modelId)
}

function buildSharedContext(pkg: StudioPackage, settings: StudioSettings) {
    const sourceText = pkg.sourceText?.slice(0, 12000) ?? ""
    return `You are Carousel Studio for Psychiatric Assessment Mastery.
Create clinically specific carousel content for nursing students and NCLEX-focused psychiatric assessment education.

Brand:
- Name: ${settings.brandJson.brand_name}
- Site: ${settings.brandJson.site_url}
- Product URL: ${settings.brandJson.product_url}
- Audience: ${settings.brandJson.audience}
- Tone: ${settings.tone}
- Hook style: ${settings.hookStyle}
- CTA presets: ${settings.ctaPresets.join(" | ")}
- Hashtag cluster: ${settings.hashtagCluster}
- Always say: ${settings.alwaysSay ?? ""}
- Never say: ${settings.neverSay ?? ""}

Current package:
- Title: ${pkg.title}
- Source prompt: ${pkg.sourcePrompt ?? ""}
- Normalized source: ${sourceText}
- Current slides: ${pkg.carouselJson.slides.map((slide, index) => `${index + 1}. ${slide.kind}/${slide.layout ?? "AUTO"}: ${slide.headline}`).join(" | ")}

Quality bar:
- Avoid generic wellness content.
- Use concrete psych-assessment language: MSE, affect, mood, thought process/content, perception, insight, judgment, risk/safety, documentation.
- Keep claims safe and educational. Never imply a diagnosis or replace clinical judgment.`
}

function buildCarouselPrompt(pkg: StudioPackage, settings: StudioSettings, message: string) {
    const requestedSlideCount = getRequestedSlideCount(message, pkg.sourcePrompt, pkg.sourceText)
    const targetSlideCount = getTargetSlideCount(pkg, settings, message)

    return `${buildSharedContext(pkg, settings)}

User instruction:
${message}

Generate a complete carousel package.

Return a package with:
- Exactly ${targetSlideCount} slides. ${requestedSlideCount ? "The user explicitly requested this count; do not shorten, merge, omit, or summarize slides." : "Use this default count unless the user later asks for a different number."}
- carouselJson.slides.length must be ${targetSlideCount}.
- First slide: strong non-generic hook.
- Middle slides: practical clinical teaching.
- Last slide: CTA using the brand/product destination.
- A deliberate visual sequence, not repeated blocks:
  - Use the slide.kind field as a layout contract. Valid kinds are COVER, STAT, INSIGHT, QUOTE, CTA.
  - Use the slide.layout field as the specific visual composition. Valid layouts: HERO_ICON, FEATURE_CARDS, TITLE_CARD, TAXONOMY_LIST, SCIENCE_SPLIT, CHECKLIST, QUOTE_CARD, STAT_CARD, DARK_NOTE.
  - Use the slide.bg field as a visual contract. Valid backgrounds are WHITE, SLATE, GRADIENT, NAVY, INK.
  - Default visual preference: use WHITE, SLATE, or a restrained brand GRADIENT for carousel covers and inner slides. Use NAVY or INK only when the user's prompt explicitly asks for dark, navy, black, night, high-drama, or high-contrast styling.
  - For 6+ slides, include at least 5 different layouts across the carousel and at least 4 different middle-slide layouts.
  - Do not place more than 2 consecutive middle slides with the same kind, layout, or bg.
  - Choose layout based on the source:
    * HERO_ICON for broad title/opening slides with a central clinical icon.
    * FEATURE_CARDS for exactly 3 skills, tools, domains, or benefits. Body must be 3 lines: "Label — description".
    * TITLE_CARD for one focused concept with an icon slab, divider, accent bar, headline, and short explanation.
    * TAXONOMY_LIST for types, categories, criteria, or comparisons. Body must be 3-4 lines: "Type — definition".
    * SCIENCE_SPLIT for neural pathways, mechanisms, brain systems, feedback loops, physiology, or process maps. Body format: subtitle line, explanation line, then 3-5 "Label — annotation" diagram labels.
    * CHECKLIST for steps, assessment questions, documentation checks, or red flags. Body must be 3-5 lines starting with "✓ ".
    * QUOTE_CARD for a memorable clinical field note, student warning, or documentation phrase.
    * STAT_CARD for numbered checkpoints, percentages, prevalence, thresholds, or high-emphasis warnings. Include stat.value and stat.label.
    * DARK_NOTE for contrast slides that need compact emphasis without a list.
  - Use STAT when a clinical number, step, warning sign, or checkpoint can anchor the slide. Include stat.value and stat.label.
  - Use QUOTE for a memorable clinical field note, documentation phrasing, or student-facing warning.
  - Use checklist-style INSIGHT slides by writing 3-5 short body lines that start with "✓ " when the slide is a checklist.
  - Rotate backgrounds: WHITE for clarity, SLATE for soft editorial contrast, GRADIENT for one high-emphasis stat/CTA. Avoid default dark covers.
  - Set assets.logo to WHITE on NAVY/INK/GRADIENT and COLOR on WHITE/SLATE. Use assets.book only on the first and last slides.
- Four captions adapted separately for Instagram, Facebook, LinkedIn, and TikTok.
- Captions must include hashtags as separate array values, and chars must equal body length.
- Hashtag floors: instagram must include at least 20 topic-specific hashtags, facebook at least 20, linkedin 8-10, and tiktok at least 10.
- Hashtags must be relevant to the carousel topic, psychiatric assessment, nursing students, PMHNP/NCLEX study, clinical documentation, and the specific symptoms or interview structure being taught.
- Quality score is a 0-5 estimate of specificity and clinical usefulness.`
}

function buildSlidePrompt(pkg: StudioPackage, settings: StudioSettings, slideId: string, message: string) {
    const slide = pkg.carouselJson.slides.find((item) => item.id === slideId)
    if (!slide) {
        throw new Error("Slide not found")
    }

    return `${buildSharedContext(pkg, settings)}

Regenerate only this slide:
${JSON.stringify(slide)}

User instruction:
${message}

Return one replacement slide. Preserve the same id. Make it sharper, more visually scannable, and clinically specific.`
    + ` Keep its visual role intentional: use kind/layout/bg/stat/assets to avoid making the carousel feel like repeated blocks.`
}

function buildCaptionPrompt(
    pkg: StudioPackage,
    settings: StudioSettings,
    platform: keyof StudioPackage["captionsJson"],
    message: string,
) {
    return `${buildSharedContext(pkg, settings)}

Regenerate only the ${platform} caption.

User instruction:
${message}

Platform rules:
- instagram: punchy, save/share language, at least 20 useful topic-specific hashtags.
- facebook: warmer explanatory framing, slightly more context, at least 20 useful topic-specific hashtags.
- linkedin: professional, education-focused, 8-10 useful topic-specific hashtags.
- tiktok: direct hook, short lines, at least 10 discoverability hashtags.
- Hashtags must be returned as separate array values, not embedded only in the body.

Return one caption. chars must equal body length.`
}

export function getStudioGenerationModels(settings: StudioSettings) {
    return Array.from(new Set([
        settings.modelStrategist,
        "gemini-2.5-flash",
    ].filter(Boolean)))
}

export function isStudioModelUnavailable(error: unknown) {
    if (!error || typeof error !== "object") {
        return false
    }

    const candidate = error as {
        statusCode?: number
        reason?: string
        message?: string
        lastError?: { statusCode?: number; message?: string }
        errors?: Array<{ statusCode?: number; message?: string }>
    }

    return candidate.statusCode === 503
        || candidate.lastError?.statusCode === 503
        || candidate.reason === "maxRetriesExceeded"
        || candidate.message?.includes("high demand")
        || candidate.lastError?.message?.includes("high demand")
        || candidate.errors?.some((item) => item.statusCode === 503 || item.message?.includes("high demand")) === true
}

export function streamStudioGeneration(
    pkg: StudioPackage,
    settings: StudioSettings,
    message: string,
    target: StudioTarget,
    modelId = settings.modelStrategist,
) {
    const model = getGoogleModel(modelId)

    if (target.startsWith("CAPTION:")) {
        const platform = target.replace("CAPTION:", "") as keyof StudioPackage["captionsJson"]
        return streamObject({
            model,
            schema: StudioCaptionGenerationSchema,
            prompt: buildCaptionPrompt(pkg, settings, platform, message),
            temperature: 0.55,
        })
    }

    if (target.startsWith("SLIDE:")) {
        const slideId = target.replace("SLIDE:", "")
        return streamObject({
            model,
            schema: StudioSlideGenerationSchema,
            prompt: buildSlidePrompt(pkg, settings, slideId, message),
            temperature: 0.55,
        })
    }

    return streamObject({
        model,
        schema: StudioPackageGenerationSchema,
        prompt: buildCarouselPrompt(pkg, settings, message),
        temperature: 0.58,
    })
}

export async function runStudioQualityGate(pkg: StudioPackage, settings: StudioSettings) {
    const models = Array.from(new Set([settings.modelGate, "gemini-2.5-flash"].filter(Boolean)))
    const prompt = `${buildSharedContext(pkg, settings)}

Score this carousel package for publish readiness.
Assess whether it is clinically specific, non-generic, visually scannable, platform-ready, and safe.

Return:
- score: 0 to 5
- passed: true when score >= ${settings.gateThreshold}
- notes: short concrete fixes or strengths`

    let lastError: unknown
    for (const modelId of models) {
        try {
            const result = await generateObject({
                model: getGoogleModel(modelId),
                schema: StudioQualityGateSchema,
                prompt,
                temperature: 0.2,
            })

            return result.object
        } catch (error) {
            lastError = error
            if (!isStudioModelUnavailable(error)) {
                throw error
            }
        }
    }

    throw lastError
}
