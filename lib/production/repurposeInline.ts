/**
 * Inline generation — runs all Gemini jobs directly inside the
 * Runs as Trigger.dev background tasks, with an inline fallback for local dev.
 *
 * Covers:
 *   REPURPOSE  → IG / FB / TikTok / LinkedIn / Email captions
 *   CAROUSEL   → 6 PNG slides rendered via satori + @resvg/resvg-js
 *   VIDEO      → shot-by-shot script (Gemini) + MP3 voiceover (ElevenLabs)
 *
 * All assets are uploaded to Supabase Storage (real public URLs).
 */

import { getAI, PRODUCTION_MODEL } from "@/lib/ai"
import { supabaseAdmin } from "@/lib/supabase"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { callElevenLabsWithRetry, stripESLMarkers } from "@/lib/audio/elevenLabs"
import satori from "satori"
import JSZip from "jszip"

type ResvgRenderer = {
    render(): {
        asPng(): Uint8Array
    }
}

type ResvgConstructor = new (
    svg: string,
    options: {
        fitTo: {
            mode: "width"
            value: number
        }
    }
) => ResvgRenderer

const require = createRequire(import.meta.url)
let cachedResvg: ResvgConstructor | null = null

function getResvg(): ResvgConstructor {
    if (cachedResvg) return cachedResvg;
    const requireModule = createRequire(import.meta.url)
    const { Resvg } = requireModule("@resvg/resvg-js") as { Resvg: ResvgConstructor }
    cachedResvg = Resvg
    return Resvg
}

// ---------------------------------------------------------------------------
// Markdown stripper
// ---------------------------------------------------------------------------
function cleanText(s: string | undefined | null): string {
    if (typeof s !== "string") return ""
    return s
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/#{1,6}\s+/g, "")
        .replace(/`{1,3}[^`]*`{1,3}/g, "")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .trim()
}

function cleanObj<T extends Record<string, unknown>>(obj: T): T {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
        out[k] = typeof v === "string" ? cleanText(v) : v
    }
    return out as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepurposeInlineInput {
    renderJobId: string
    contentIdeaId: string
    calendarEntryId: string
    masterJson: Record<string, unknown>
    platform: string
    postType: string
    topic: string
    entryDate: string
    voiceId?: string
}

interface PlatformCaptions {
    ig: { caption: string; hashtagBlock: string; charEstimate: number }
    fb: { caption: string; hashtagBlock: string; charEstimate: number }
    tiktok: { script: string; hashtagBlock: string; durationEstimateSecs: number }
    linkedin: { post: string; charEstimate: number }
    email: { subjectLine: string; previewText: string; body: string }
}

export interface CarouselSlide {
    slideNumber: number
    headline: string
    bodyText: string
    speakerNote?: string
}

export interface CarouselScript {
    title: string
    slides: CarouselSlide[]
    coverText: string
    ctaSlide: string
}

export interface VideoScript {
    title: string
    durationEstimateSecs: number
    hook: string
    segments: Array<{ timecode: string; visual: string; voiceover: string }>
    ctaOutro: string
    captionVersion: string
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function buildRepurposePrompt(input: RepurposeInlineInput): string {
    const m = input.masterJson as { hook?: string; teachingPoints?: string[]; cta?: string; clinicalGrounding?: string }
    const tp = (m.teachingPoints ?? []).map((p, i) => `    ${i + 1}. ${p}`).join("\n")
    return `You are the Content Repurposing Specialist for Psychiatric Assessment Mastery(tm) (PAM).
Adapt the master content idea into 5 platform-specific formats. Preserve clinical specificity.

ORIGINAL CONTENT:
  Topic: ${input.topic}
  Platform: ${input.platform}
  Hook: ${m.hook ?? ""}
  Teaching Points:
${tp}
  CTA: ${m.cta ?? ""}
  Clinical Grounding: ${m.clinicalGrounding ?? ""}

BRAND RULES:
- PMHNP graduate-level language. Unmistakably PAM-specific.
- No "mental health matters" filler. All CTAs to PAM Mastery Bundle.
- PLAIN TEXT ONLY. No asterisks, no bold, no markdown of any kind.

Return ONLY a JSON object (no fences):
{
  "ig":       { "caption": "...", "hashtagBlock": "#PMHNP #PsychNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
  "fb":       { "caption": "...", "hashtagBlock": "#PMHNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
  "tiktok":   { "script": "...", "hashtagBlock": "#PMHNP #PsychTok #MedTok #PAMastery", "durationEstimateSecs": 75 },
  "linkedin": { "post": "...", "charEstimate": 0 },
  "email":    { "subjectLine": "...", "previewText": "...", "body": "..." }
}`
}

function buildCarouselPrompt(input: RepurposeInlineInput): string {
    const m = input.masterJson as { hook?: string; teachingPoints?: string[]; cta?: string; clinicalGrounding?: string }
    return `You are the Visual Content Specialist for Psychiatric Assessment Mastery(tm) (PAM).
Create a 6-slide carousel script for Instagram/LinkedIn.

TOPIC: ${input.topic}
HOOK: ${m.hook ?? ""}
TEACHING POINTS: ${(m.teachingPoints ?? []).join(" | ")}
CTA: ${m.cta ?? ""}
CLINICAL GROUNDING: ${m.clinicalGrounding ?? ""}

RULES:
- Slide 1: Hook/cover headline (max 10 words), bodyText = ""
- Slides 2-5: headline (max 8 words) + 2-3 sentence body
- Slide 6: CTA slide headline + action sentence
- PLAIN TEXT ONLY. No asterisks, bold, markdown.

Return ONLY a JSON object:
{
  "title": "...",
  "coverText": "...",
  "slides": [
    { "slideNumber": 1, "headline": "...", "bodyText": "", "speakerNote": "..." },
    { "slideNumber": 2, "headline": "...", "bodyText": "...", "speakerNote": "..." },
    { "slideNumber": 3, "headline": "...", "bodyText": "...", "speakerNote": "..." },
    { "slideNumber": 4, "headline": "...", "bodyText": "...", "speakerNote": "..." },
    { "slideNumber": 5, "headline": "...", "bodyText": "...", "speakerNote": "..." },
    { "slideNumber": 6, "headline": "...", "bodyText": "CTA + link", "speakerNote": "..." }
  ],
  "ctaSlide": "..."
}`
}

function buildVideoPrompt(input: RepurposeInlineInput): string {
    const m = input.masterJson as {
        hook?: string;
        teachingPoints?: string[];
        cta?: string;
        estimatedDurationSecs?: number;
        estimatedReadTimeSecs?: number;
    }

    const duration = m.estimatedDurationSecs ?? m.estimatedReadTimeSecs ?? 45

    return `You are the Lead Producer for Psychiatric Assessment Mastery(tm).
Write a short, targeted ${duration}-second Instagram Reel / TikTok video script based on the content below.

TOPIC: ${input.topic}
HOOK: ${m.hook ?? ""}
TEACHING POINTS: ${(m.teachingPoints ?? []).join(" | ")}
CTA: ${m.cta ?? ""}

STYLE TEMPLATE (USE THIS TONE AND TAGGING):
"This is why your psychiatric notes feel difficult. <break time="0.5s" /> [thoughtful] The interview feels scattered. <break time="0.5s" /> Your MSE feels incomplete. <break time="0.5s" /> The diagnostic reasoning is unclear. <break time="0.5s" /> And you freeze at a blank SOAP note. <break time="0.5s" /> That is where many learners get stuck. <break time="0.7s" /> [emphatic] The problem isn't knowledge. It's structure. <break time="0.7s" /> This is exactly what Psychiatric Assessment Mastery was built to solve."

RULES:
- Use <break time="X.Xs" /> tags for natural pacing.
- Use [bracketed] emotive markers like [thoughtful], [emphatic], [gentle] to guide the voice actor.
- Hook in first 3 seconds. 4-5 segments. CTA at end: PAM Mastery Bundle.
- STRICTLY limit word count to ~${Math.round(duration * 2.1)} words total for ${duration}s.
- PLAIN TEXT ONLY. No markdown.

Return ONLY a JSON object:
{
  "title": "...",
  "durationEstimateSecs": ${duration},
  "hook": "...",
  "segments": [
    { "timecode": "0:00-0:03", "visual": "...", "voiceover": "..." }
  ],
  "ctaOutro": "...",
  "captionVersion": "..."
}`
}

// ---------------------------------------------------------------------------
// Gemini caller
// ---------------------------------------------------------------------------

async function callGemini(prompt: string): Promise<string> {
    const response = await getAI().models.generateContent({
        model: PRODUCTION_MODEL,
        config: { responseMimeType: "application/json" },
        contents: prompt,
    })
    return response.text ?? "{}"
}

// ---------------------------------------------------------------------------
// Supabase Storage helper
// ---------------------------------------------------------------------------

async function storeBlob(pathname: string, content: string | Buffer, contentType: string): Promise<string> {
    const bucket = 'production'

    const { data, error } = await supabaseAdmin
        .storage
        .from(bucket)
        .upload(pathname, content, {
            contentType,
            upsert: true // Overwrite if exists, standard for Vercel Blob
        })

    if (error) {
        throw new Error(`Supabase Storage upload failed for ${pathname}: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from(bucket)
        .getPublicUrl(pathname)

    return publicUrl
}

// ---------------------------------------------------------------------------
// File name slug helper
// ---------------------------------------------------------------------------

function makeSlug(entryDate: string, topic: string): { date: string; slug: string } {
    const date = new Date(entryDate).toISOString().slice(0, 10).replace(/-/g, "")
    const slug = topic
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(" ")
        .slice(0, 3)
        .map(w => (w[0]?.toUpperCase() ?? "") + w.slice(1))
        .join("")
    return { date, slug }
}

// ---------------------------------------------------------------------------
// REPURPOSE platform map
// ---------------------------------------------------------------------------

const PLATFORM_MAP: Array<{
    key: keyof PlatformCaptions
    platform: "IG" | "FB" | "TIKTOK" | "LINKEDIN" | "EMAIL"
    assetType: "TEXT_POST" | "EMAIL_HTML"
    extractContent: (c: PlatformCaptions) => string
    extractMeta: (c: PlatformCaptions) => Record<string, unknown>
}> = [
        {
            key: "ig", platform: "IG", assetType: "TEXT_POST",
            extractContent: c => `${cleanText(c.ig.caption)}\n\n${c.ig.hashtagBlock}`,
            extractMeta: c => cleanObj({ caption: c.ig.caption, hashtagBlock: c.ig.hashtagBlock, charEstimate: c.ig.charEstimate }),
        },
        {
            key: "fb", platform: "FB", assetType: "TEXT_POST",
            extractContent: c => `${cleanText(c.fb.caption)}\n\n${c.fb.hashtagBlock}`,
            extractMeta: c => cleanObj({ caption: c.fb.caption, hashtagBlock: c.fb.hashtagBlock, charEstimate: c.fb.charEstimate }),
        },
        {
            key: "tiktok", platform: "TIKTOK", assetType: "TEXT_POST",
            extractContent: c => `${cleanText(c.tiktok.script)}\n\n${c.tiktok.hashtagBlock}`,
            extractMeta: c => cleanObj({ script: c.tiktok.script, hashtagBlock: c.tiktok.hashtagBlock, durationEstimateSecs: c.tiktok.durationEstimateSecs }),
        },
        {
            key: "linkedin", platform: "LINKEDIN", assetType: "TEXT_POST",
            extractContent: c => cleanText(c.linkedin.post),
            extractMeta: c => cleanObj({ post: c.linkedin.post, charEstimate: c.linkedin.charEstimate }),
        },
        {
            key: "email", platform: "EMAIL", assetType: "EMAIL_HTML",
            extractContent: c => cleanText(c.email.body),
            extractMeta: c => cleanObj({ subjectLine: c.email.subjectLine, previewText: c.email.previewText, body: c.email.body }),
        },
    ]

// ---------------------------------------------------------------------------
// Shared: post-job completion check
// ---------------------------------------------------------------------------

export async function checkAllRenderJobsComplete(contentIdeaId: string, calendarEntryId: string): Promise<boolean> {
    try {
        const { data: allJobs, error } = await supabaseAdmin
            .from("render_jobs")
            .select("jobType:job_type, status")
            .eq("content_idea_id", contentIdeaId)
            .order("queued_at", { ascending: false })

        if (error) {
            console.error("[inline] Failed to fetch render jobs for completion check:", error)
            return false
        }

        const latestStatus = new Map<string, string>()
        for (const job of allJobs ?? []) {
            if (!latestStatus.has(job.jobType)) {
                latestStatus.set(job.jobType, job.status)
            }
        }

        const statuses = Array.from(latestStatus.values())
        const allDone = statuses.length > 0 && statuses.every((status) => status === "COMPLETE")

        if (allDone && calendarEntryId) {
            const { error: entryError } = await supabaseAdmin
                .from("production_calendar_entries")
                .update({ publish_status: "APPROVED" })
                .eq("id", calendarEntryId)

            if (entryError) {
                console.error("[inline] Failed to mark entry APPROVED after completion:", entryError)
            } else {
                console.log(`[inline] All jobs done -> entry ${calendarEntryId} -> APPROVED`)
            }
        }

        return allDone
    } catch (e) {
        console.error("[inline] Post-completion check failed:", e)
        return false
    }
}

// ---------------------------------------------------------------------------
// REPURPOSE inline
// ---------------------------------------------------------------------------

export async function runRepurposeInline(input: RepurposeInlineInput): Promise<void> {
    const { renderJobId, contentIdeaId, calendarEntryId, entryDate, topic } = input
    const startTime = new Date().toISOString()
    const { error: startError } = await supabaseAdmin
        .from("render_jobs")
        .update({ status: "RUNNING", started_at: startTime })
        .eq("id", renderJobId)

    if (startError) {
        console.error("[repurposeInline] Unable to mark job RUNNING:", startError)
        throw new Error(`Unable to start render job ${renderJobId}`)
    }

    try {
        const raw = await callGemini(buildRepurposePrompt(input))
        const captions = JSON.parse(raw) as PlatformCaptions
        const { date, slug } = makeSlug(entryDate, topic)

        for (const mapping of PLATFORM_MAP) {
            const content = mapping.extractContent(captions)
            const meta = mapping.extractMeta(captions)
            const ext = mapping.assetType === "EMAIL_HTML" ? "html" : "txt"
            const fileName = `PAM_${mapping.platform}_${date}_${slug}_v1.${ext}`
            const contentType = mapping.assetType === "EMAIL_HTML" ? "text/html" : "text/plain"
            const storageUrl = await storeBlob(`production/${contentIdeaId}/${mapping.assetType}/${fileName}`, content, contentType)

            const { error: assetError } = await supabaseAdmin
                .from("content_assets")
                .update({ status: "COMPLETE", storage_url: storageUrl, metadata: { content, ...meta } })
                .eq("render_job_id", renderJobId)
                .eq("platform", mapping.platform)
                .eq("asset_type", mapping.assetType)

            if (assetError) {
                throw new Error(`Failed to update ${mapping.platform} asset: ${assetError.message}`)
            }
        }

        const { error: completeError } = await supabaseAdmin
            .from("render_jobs")
            .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
            .eq("id", renderJobId)

        if (completeError) {
            console.error("[repurposeInline] Failed to mark job COMPLETE:", completeError)
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[repurposeInline] failed:", msg)
        const failureTime = new Date().toISOString()
        const { error: failJobError } = await supabaseAdmin
            .from("render_jobs")
            .update({ status: "FAILED", completed_at: failureTime, error_message: msg })
            .eq("id", renderJobId)

        if (failJobError) {
            console.error("[repurposeInline] Failed to mark job FAILED:", failJobError)
        }

        const { error: failAssetsError } = await supabaseAdmin
            .from("content_assets")
            .update({ status: "FAILED" })
            .eq("render_job_id", renderJobId)

        if (failAssetsError) {
            console.error("[repurposeInline] Failed to mark assets FAILED:", failAssetsError)
        }
        throw err
    }

    await checkAllRenderJobsComplete(contentIdeaId, calendarEntryId)
}

// ---------------------------------------------------------------------------
// CAROUSEL inline — renders actual 1080×1080 / 1080×1350 / 1080×1920 PNGs
//                   via satori + @resvg/resvg-js
// ---------------------------------------------------------------------------

// ── Brand design tokens (exact PAM palette from globals.css) ──────────────
const PAM_C = {
    navy:       "#041f50",
    blue:       "#1f6cb9",
    red:        "#ed415b",
    pink:       "#ec5185",
    purple:     "#af5ce9",
    purpleDk:   "#8d39c5",
    white:      "#ffffff",
    slate200:   "#e2e8f0",
    slate600:   "#475569",
} as const

const GRAD_PSYCH = `linear-gradient(135deg, #ed415b 0%, #ec5185 50%, #af5ce9 100%)`
const GRAD_BRAIN = `linear-gradient(135deg, #af5ce9 0%, #1f6cb9 100%)`
const GRAD_NAVY  = `linear-gradient(135deg, #041f50 0%, #0a3175 100%)`

// ── Per-ratio layout config ───────────────────────────────────────────────
const RATIO_CFG = {
    "1:1":  { w: 1080, h: 1080, fs: 1.00, pv: 100, ph: 100 },
    "4:5":  { w: 1080, h: 1350, fs: 1.05, pv: 110, ph: 100 },
    "9:16": { w: 1080, h: 1920, fs: 1.25, pv: 140, ph:  90 },
} as const
type RatioKey = keyof typeof RATIO_CFG

// ── Deck themes — picked once per generation run ──────────────────────────
interface DeckTheme {
    bgCover:     string   // gradient for cover / CTA
    bgTeach:     string   // background for teaching slides (solid colour)
    bgTeachGrad: boolean  // true → bgTeach is a gradient string
    hl:          string   // headline colour
    body:        string   // body text colour
    accent:      string   // accent / bullet colour
    muted:       string   // muted / footer colour
    dark:        boolean  // dark background — affects opacity values
}

const DECK_THEMES: DeckTheme[] = [
    // 0 — GRADIENT_SPLASH: full PAM gradient throughout
    { bgCover: GRAD_PSYCH, bgTeach: GRAD_PSYCH, bgTeachGrad: true,
      hl: "#ffffff", body: "rgba(255,255,255,0.88)", accent: "#ffffff",
      muted: "rgba(255,255,255,0.55)", dark: true },
    // 1 — NAVY_PREMIUM: deep navy, pink accents
    { bgCover: GRAD_NAVY, bgTeach: PAM_C.navy, bgTeachGrad: false,
      hl: "#ffffff", body: PAM_C.slate200, accent: PAM_C.pink,
      muted: "rgba(255,255,255,0.45)", dark: true },
    // 2 — CLEAN_CLINICAL: white background, purple accents
    { bgCover: GRAD_PSYCH, bgTeach: PAM_C.white, bgTeachGrad: false,
      hl: PAM_C.navy, body: PAM_C.slate600, accent: PAM_C.purple,
      muted: "rgba(4,31,80,0.45)", dark: false },
    // 3 — DEEP_PURPLE: rich purple, red-pink accents
    { bgCover: GRAD_BRAIN, bgTeach: PAM_C.purple, bgTeachGrad: false,
      hl: "#ffffff", body: "rgba(255,255,255,0.88)", accent: PAM_C.red,
      muted: "rgba(255,255,255,0.50)", dark: true },
]

function pickDeckTheme(contentIdeaId: string): DeckTheme {
    const hex = contentIdeaId.replace(/-/g, "").slice(-4)
    const idx = parseInt(hex, 16) % DECK_THEMES.length
    return DECK_THEMES[isNaN(idx) ? 0 : idx]
}

// ── Assets fetched once per run (logo + watermark icon) ───────────────────
interface CarouselAssets { logoBase64: string; iconBase64: string }

async function fetchCarouselAssets(): Promise<CarouselAssets> {
    const logoPromise = (async () => {
        try {
            const path = await import("node:path")
            const fsp  = await import("node:fs/promises")
            const local = path.join(process.cwd(), "public", "logo.png")
            try {
                const buf = await fsp.readFile(local)
                return `data:image/png;base64,${buf.toString("base64")}`
            } catch {
                const r = await fetch("https://pam-shopify.vercel.app/logo.png")
                if (r.ok) return `data:image/png;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`
            }
        } catch (e) { console.error("[Carousel] logo fetch failed:", e) }
        return ""
    })()

    const iconPromise = (async () => {
        try {
            const path = await import("node:path")
            const fsp  = await import("node:fs/promises")
            const local = path.join(process.cwd(), "public", "favicon-white.png")
            try {
                const buf = await fsp.readFile(local)
                return `data:image/png;base64,${buf.toString("base64")}`
            } catch {
                const r = await fetch("https://pam-shopify.vercel.app/favicon-white.png")
                if (r.ok) return `data:image/png;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`
            }
        } catch (e) { console.error("[Carousel] icon fetch failed:", e) }
        return ""
    })()

    const [logoBase64, iconBase64] = await Promise.all([logoPromise, iconPromise])
    return { logoBase64, iconBase64 }
}

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
    const css = await (await fetch(cssUrl)).text()
    const matches = [...css.matchAll(/src:\s*url\(['"]?([^'")\s]+\.ttf)['"]?\)/g)]
    const fontUrl = matches[matches.length - 1]?.[1]
    if (!fontUrl) throw new Error(`No ttf URL in Google Fonts CSS for ${family} ${weight}`)
    return (await fetch(fontUrl)).arrayBuffer()
}

// ── Slide renderer ────────────────────────────────────────────────────────
function makeSlideElement(
    slide:      CarouselSlide,
    slideIndex: number,          // 0-based
    totalSlides: number,
    theme:      DeckTheme,
    ratioKey:   RatioKey,
    assets:     CarouselAssets,
    emoji:      string,
): object {
    const c  = RATIO_CFG[ratioKey]
    const fs = c.fs
    const { pv, ph } = c

    const isCover = slideIndex === 0
    const isCTA   = slideIndex === totalSlides - 1

    type Variant = "COVER" | "CTA" | "BOLD" | "NUMBER" | "LIST" | "SPLIT"
    const TEACH: Variant[] = ["BOLD", "NUMBER", "LIST", "SPLIT"]
    const variant: Variant = isCover ? "COVER" : isCTA ? "CTA" : TEACH[(slideIndex - 1) % 4]

    const hasBullets = !!(slide.bodyText &&
        (slide.bodyText.includes("•") || slide.bodyText.includes("- ") || /^\d+\.\s/m.test(slide.bodyText)))

    // Scaled helpers
    const r = (n: number) => Math.round(n * fs)
    const maxW = (base: number) => Math.round(base * Math.min(fs, 1.1))  // cap width growth

    // ── Shared: bullet list ───────────────────────────────────────────────
    function bulletList(text: string): object {
        const items = text.split(/\n|•/).map(b => b.trim().replace(/^(?:\d+\.\s+|[-•]\s+)/, "")).filter(Boolean)
        return {
            type: "div",
            props: {
                style: { display: "flex", flexDirection: "column", width: "100%" },
                children: items.map(b => ({
                    type: "div",
                    props: {
                        style: { display: "flex", alignItems: "flex-start", marginBottom: r(16) },
                        children: [
                            { type: "div", props: { style: { width: r(12), height: r(12), borderRadius: "50%", backgroundImage: GRAD_PSYCH, marginTop: r(11), marginRight: r(18), flexShrink: 0 }, children: "" } },
                            { type: "div", props: { style: { fontSize: r(25), fontWeight: 400, color: theme.body, lineHeight: 1.55, maxWidth: maxW(820) }, children: b } },
                        ],
                    },
                })),
            },
        }
    }

    // ── Shared: footer (absolute, bottom-center) ──────────────────────────
    const footer: object = {
        type: "div",
        props: {
            style: { position: "absolute", bottom: r(38), left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" },
            children: assets.logoBase64
                ? [
                    { type: "img", props: { src: assets.logoBase64, style: { height: r(28), opacity: 0.72, marginBottom: r(5) } } },
                    { type: "div", props: { style: { fontSize: r(11), fontWeight: 700, color: theme.muted, letterSpacing: 1.5 }, children: "psychassessmentguide.com" } },
                ]
                : { type: "div", props: { style: { fontSize: r(12), fontWeight: 700, color: theme.muted, letterSpacing: 2 }, children: "psychassessmentguide.com" } },
        },
    }

    // ── Shared: watermark icon (bottom-right, rotated) ────────────────────
    const iconSz     = r(300)
    const iconOffset = Math.round(iconSz * 0.15)
    const watermark: object | null = assets.iconBase64 ? {
        type: "img",
        props: {
            src: assets.iconBase64,
            style: {
                position: "absolute",
                bottom: -iconOffset,
                right:  -iconOffset,
                width:  iconSz,
                height: iconSz,
                opacity: variant === "BOLD" ? 0.07 : theme.dark ? 0.15 : 0.09,
                transform: "rotate(15deg)",
            },
        },
    } : null

    // ── Pagination label ──────────────────────────────────────────────────
    const currentSlideNumber = Number.isFinite(slide.slideNumber) ? slide.slideNumber : (slideIndex + 1)
    const pageLabel = `${String(currentSlideNumber).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`

    // ─────────────────────────────────────────────────────────────────────
    // Layout variants
    // ─────────────────────────────────────────────────────────────────────

    // COVER ─────────────────────────────────────────────────────────────
    if (variant === "COVER") {
        return {
            type: "div",
            props: {
                style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundImage: theme.bgCover, position: "relative", overflow: "hidden" },
                children: [
                    // Main content (space-between: logo top, headline center, swipe bottom)
                    {
                        type: "div",
                        props: {
                            style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", flex: 1, padding: `${pv}px ${ph}px` },
                            children: [
                                // Top zone: logo + brand label
                                {
                                    type: "div",
                                    props: {
                                        style: { display: "flex", flexDirection: "column", alignItems: "center" },
                                        children: [
                                            assets.logoBase64 ? { type: "img", props: { src: assets.logoBase64, style: { height: r(44), opacity: 0.92, marginBottom: r(8) } } } : null,
                                            { type: "div", props: { style: { fontSize: r(11), fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 3 }, children: "PSYCHIATRIC ASSESSMENT MASTERY" } },
                                        ].filter(Boolean),
                                    },
                                },
                                // Center zone: emoji + headline + divider
                                {
                                    type: "div",
                                    props: {
                                        style: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
                                        children: [
                                            emoji ? { type: "div", props: { style: { fontSize: r(72), lineHeight: 1, marginBottom: r(20) }, children: emoji } } : null,
                                            { type: "div", props: { style: { fontSize: r(80), fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.03em", textAlign: "center", maxWidth: maxW(900) }, children: slide.headline } },
                                            { type: "div", props: { style: { width: r(140), height: 4, background: "rgba(255,255,255,0.38)", borderRadius: 2, marginTop: r(28) }, children: "" } },
                                            slide.bodyText ? { type: "div", props: { style: { fontSize: r(22), fontWeight: 400, color: "rgba(255,255,255,0.75)", marginTop: r(18), textAlign: "center", maxWidth: maxW(780) }, children: slide.bodyText } } : null,
                                        ].filter(Boolean),
                                    },
                                },
                                // Bottom zone: swipe hint + dots
                                {
                                    type: "div",
                                    props: {
                                        style: { display: "flex", flexDirection: "column", alignItems: "center" },
                                        children: [
                                            { type: "div", props: { style: { fontSize: r(15), fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 1, marginBottom: r(10) }, children: "Swipe to learn →" } },
                                            {
                                                type: "div",
                                                props: {
                                                    style: { display: "flex", flexDirection: "row" },
                                                    children: Array.from({ length: Math.min(totalSlides, 6) }).map((_, di) => ({
                                                        type: "div",
                                                        props: { style: { width: di === 0 ? r(20) : r(8), height: r(8), borderRadius: 4, background: di === 0 ? "#ffffff" : "rgba(255,255,255,0.32)", marginRight: r(5) }, children: "" },
                                                    })),
                                                },
                                            },
                                        ],
                                    },
                                },
                            ].filter(Boolean),
                        },
                    },
                    footer,
                    watermark,
                ].filter(Boolean),
            },
        }
    }

    // CTA ───────────────────────────────────────────────────────────────
    if (variant === "CTA") {
        return {
            type: "div",
            props: {
                style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundImage: theme.bgCover, position: "relative", overflow: "hidden" },
                children: [
                    {
                        type: "div",
                        props: {
                            style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: `${pv}px ${ph}px`, textAlign: "center" },
                            children: [
                                emoji ? { type: "div", props: { style: { fontSize: r(68), lineHeight: 1, marginBottom: r(20) }, children: emoji } } : null,
                                { type: "div", props: { style: { fontSize: r(66), fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.03em", textAlign: "center", maxWidth: maxW(900), marginBottom: r(24) }, children: slide.headline } },
                                slide.bodyText ? { type: "div", props: { style: { fontSize: r(24), fontWeight: 400, color: "rgba(255,255,255,0.82)", lineHeight: 1.55, textAlign: "center", maxWidth: maxW(820), marginBottom: r(36) }, children: slide.bodyText } } : null,
                                { type: "div", props: { style: { width: r(70), height: 2, background: "rgba(255,255,255,0.28)", borderRadius: 1, marginBottom: r(22) }, children: "" } },
                                { type: "div", props: { style: { fontSize: r(19), fontWeight: 700, color: "rgba(255,255,255,0.70)", letterSpacing: 1 }, children: "Follow @psychassessmentguide" } },
                            ].filter(Boolean),
                        },
                    },
                    footer,
                    watermark,
                ].filter(Boolean),
            },
        }
    }

    // BOLD_STATEMENT ────────────────────────────────────────────────────
    if (variant === "BOLD") {
        const bgStyle = theme.bgTeachGrad ? { backgroundImage: theme.bgTeach } : { background: theme.bgTeach }
        return {
            type: "div",
            props: {
                style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", ...bgStyle, position: "relative", overflow: "hidden" },
                children: [
                    {
                        type: "div",
                        props: {
                            style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: `${pv}px ${ph}px`, textAlign: "center", position: "relative" },
                            children: [
                                // Pagination top-left
                                { type: "div", props: { style: { position: "absolute", top: r(pv * 0.4), left: ph, fontSize: r(14), fontWeight: 700, color: theme.accent, letterSpacing: 1.5 }, children: pageLabel } },
                                emoji ? { type: "div", props: { style: { fontSize: r(60), lineHeight: 1, marginBottom: r(18) }, children: emoji } } : null,
                                { type: "div", props: { style: { fontSize: r(72), fontWeight: 800, color: theme.hl, lineHeight: 1.1, letterSpacing: "-0.03em", textAlign: "center", maxWidth: maxW(880), marginBottom: slide.bodyText ? r(26) : 0 }, children: slide.headline } },
                                slide.bodyText && !hasBullets ? { type: "div", props: { style: { fontSize: r(26), fontWeight: 400, color: theme.body, lineHeight: 1.6, textAlign: "center", maxWidth: maxW(820) }, children: slide.bodyText } } : null,
                                slide.bodyText && hasBullets ? bulletList(slide.bodyText) : null,
                            ].filter(Boolean),
                        },
                    },
                    footer,
                    watermark,
                ].filter(Boolean),
            },
        }
    }

    // NUMBER_BLOCK ──────────────────────────────────────────────────────
    if (variant === "NUMBER") {
        const bgStyle = theme.bgTeachGrad ? { backgroundImage: theme.bgTeach } : { background: theme.bgTeach }
        return {
            type: "div",
            props: {
                style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", ...bgStyle, position: "relative", overflow: "hidden" },
                children: [
                    {
                        type: "div",
                        props: {
                            style: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", flex: 1, padding: `${pv}px ${ph}px`, position: "relative" },
                            children: [
                                // Giant slide number at 50% opacity (decorative)
                                { type: "div", props: { style: { position: "absolute", top: -r(20), right: r(30), fontSize: r(280), fontWeight: 800, color: theme.accent, opacity: 0.10, lineHeight: 1, letterSpacing: "-0.05em" }, children: String(slideIndex + 1) } },
                                // Pagination label
                                { type: "div", props: { style: { fontSize: r(14), fontWeight: 700, color: theme.accent, letterSpacing: 2, marginBottom: r(18) }, children: pageLabel } },
                                // Headline with left accent bar
                                {
                                    type: "div",
                                    props: {
                                        style: { display: "flex", flexDirection: "row", alignItems: "stretch", marginBottom: r(26), maxWidth: maxW(900) },
                                        children: [
                                            { type: "div", props: { style: { width: 6, backgroundImage: GRAD_PSYCH, borderRadius: 3, marginRight: r(20), flexShrink: 0 }, children: "" } },
                                            { type: "div", props: { style: { fontSize: r(50), fontWeight: 800, color: theme.hl, lineHeight: 1.12, letterSpacing: "-0.02em" }, children: slide.headline } },
                                        ],
                                    },
                                },
                                slide.bodyText && !hasBullets ? { type: "div", props: { style: { fontSize: r(26), fontWeight: 400, color: theme.body, lineHeight: 1.6, maxWidth: maxW(840) }, children: slide.bodyText } } : null,
                                slide.bodyText && hasBullets ? bulletList(slide.bodyText) : null,
                            ].filter(Boolean),
                        },
                    },
                    footer,
                    watermark,
                ].filter(Boolean),
            },
        }
    }

    // LIST_PULL ─────────────────────────────────────────────────────────
    if (variant === "LIST") {
        const bgStyle = theme.bgTeachGrad ? { backgroundImage: theme.bgTeach } : { background: theme.bgTeach }
        return {
            type: "div",
            props: {
                style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", ...bgStyle, position: "relative", overflow: "hidden" },
                children: [
                    // Left gradient accent bar (full height)
                    { type: "div", props: { style: { position: "absolute", top: 0, left: 0, width: r(8), height: "100%", backgroundImage: GRAD_PSYCH }, children: "" } },
                    {
                        type: "div",
                        props: {
                            style: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", flex: 1, padding: `${pv}px ${ph}px` },
                            children: [
                                { type: "div", props: { style: { fontSize: r(13), fontWeight: 700, color: theme.accent, letterSpacing: 2, marginBottom: r(14) }, children: pageLabel } },
                                { type: "div", props: { style: { fontSize: r(48), fontWeight: 800, color: theme.hl, lineHeight: 1.12, letterSpacing: "-0.025em", marginBottom: r(26), maxWidth: maxW(880) }, children: slide.headline } },
                                slide.bodyText && hasBullets ? bulletList(slide.bodyText) : null,
                                slide.bodyText && !hasBullets ? { type: "div", props: { style: { fontSize: r(26), fontWeight: 400, color: theme.body, lineHeight: 1.6, maxWidth: maxW(840) }, children: slide.bodyText } } : null,
                            ].filter(Boolean),
                        },
                    },
                    footer,
                    watermark,
                ].filter(Boolean),
            },
        }
    }

    // SPLIT_BAND ────────────────────────────────────────────────────────
    // Top 38% gradient band (headline), lower 62% body area
    const bandH    = Math.round(c.h * 0.38)
    const bandIconSz = r(200)
    const bandBgStyle = theme.bgTeachGrad ? { backgroundImage: theme.bgTeach } : { background: theme.bgTeach }
    return {
        type: "div",
        props: {
            style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
            children: [
                // Gradient band (top)
                {
                    type: "div",
                    props: {
                        style: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", width: "100%", height: bandH, backgroundImage: theme.bgCover, padding: `0 ${ph}px ${r(32)}px`, position: "relative", overflow: "hidden", flexShrink: 0 },
                        children: [
                            // 50% opacity watermark inside the band (top-right corner)
                            assets.iconBase64 ? { type: "img", props: { src: assets.iconBase64, style: { position: "absolute", top: -Math.round(bandIconSz * 0.2), right: -Math.round(bandIconSz * 0.2), width: bandIconSz, height: bandIconSz, opacity: 0.50, transform: "rotate(25deg)" } } } : null,
                            { type: "div", props: { style: { fontSize: r(13), fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginBottom: r(10) }, children: pageLabel } },
                            { type: "div", props: { style: { fontSize: r(50), fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.025em", maxWidth: maxW(900) }, children: slide.headline } },
                        ].filter(Boolean),
                    },
                },
                // Body area (bottom)
                {
                    type: "div",
                    props: {
                        style: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", flex: 1, ...bandBgStyle, padding: `${r(36)}px ${ph}px` },
                        children: [
                            slide.bodyText && hasBullets ? bulletList(slide.bodyText) : null,
                            slide.bodyText && !hasBullets ? { type: "div", props: { style: { fontSize: r(28), fontWeight: 400, color: theme.body, lineHeight: 1.6, maxWidth: maxW(880) }, children: slide.bodyText } } : null,
                        ].filter(Boolean),
                    },
                },
                footer,
            ].filter(Boolean),
        },
    }
}

async function renderSlideToPng(
    slide:       CarouselSlide,
    slideIndex:  number,
    totalSlides: number,
    boldFont:    ArrayBuffer,
    regularFont: ArrayBuffer,
    theme:       DeckTheme,
    ratioKey:    RatioKey,
    assets:      CarouselAssets,
    emoji:       string,
): Promise<Buffer> {
    const { w, h } = RATIO_CFG[ratioKey]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(makeSlideElement(slide, slideIndex, totalSlides, theme, ratioKey, assets, emoji) as any, {
        width: w,
        height: h,
        fonts: [
            { name: "Montserrat", data: boldFont, weight: 800, style: "normal" },
            { name: "Montserrat", data: regularFont, weight: 400, style: "normal" },
        ],
    })
    const Resvg = getResvg()
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: w } })
    return Buffer.from(resvg.render().asPng())
}

export async function runCarouselInline(input: RepurposeInlineInput): Promise<void> {
    const { renderJobId, contentIdeaId, calendarEntryId, entryDate, topic } = input
    const { error: startError } = await supabaseAdmin
        .from("render_jobs")
        .update({ status: "RUNNING", started_at: new Date().toISOString() })
        .eq("id", renderJobId)

    if (startError) {
        console.error("[carouselInline] Unable to mark job RUNNING:", startError)
        throw new Error(`Unable to start render job ${renderJobId}`)
    }

    try {
        const raw = await callGemini(buildCarouselPrompt(input))
        const script = JSON.parse(raw) as CarouselScript

        if (!script || !Array.isArray(script.slides) || script.slides.length === 0) {
            throw new Error("AI generated an invalid or empty carousel script.")
        }

        script.title    = cleanText(script.title)
        script.coverText = cleanText(script.coverText)
        script.ctaSlide  = cleanText(script.ctaSlide)
        script.slides    = script.slides.map(s => ({
            ...s,
            headline:    cleanText(s.headline),
            bodyText:    cleanText(s.bodyText),
            speakerNote: s.speakerNote ? cleanText(s.speakerNote) : undefined,
        }))

        // Fetch fonts + brand assets in parallel
        const [boldFont, regularFont, assets] = await Promise.all([
            loadGoogleFont("Montserrat", 800),
            loadGoogleFont("Montserrat", 400),
            fetchCarouselAssets(),
        ])

        // Deterministic theme per content idea
        const theme = pickDeckTheme(contentIdeaId)

        // Emoji accents: pull from masterJson.scenes if available, else default sequence
        const masterScenes = (input.masterJson as { scenes?: Array<{ emojiAccent?: string }> }).scenes ?? []
        const defaultEmojis = ["🧠","🔬","💊","📋","⚡","🎯"]
        const getEmoji = (i: number) => masterScenes[i]?.emojiAccent ?? defaultEmojis[i % defaultEmojis.length]

        const { date, slug } = makeSlug(entryDate, topic)
        const zip = new JSZip()
        const ratioVariants: Record<string, string[]> = { "1:1": [], "4:5": [], "9:16": [] }
        const RATIOS: RatioKey[] = ["1:1", "4:5", "9:16"]

        for (const ratioKey of RATIOS) {
            for (let i = 0; i < script.slides.length; i++) {
                const slide = script.slides[i]
                const png = await renderSlideToPng(
                    slide, i, script.slides.length,
                    boldFont, regularFont,
                    theme, ratioKey, assets, getEmoji(i),
                )
                const ratioSlug = ratioKey.replace(":", "x")
                const fileName  = `PAM_CAROUSEL_${ratioSlug}_${date}_${slug}_slide${slide.slideNumber}_v1.png`
                const url = await storeBlob(`production/${contentIdeaId}/CAROUSEL_PNG/${fileName}`, png, "image/png")
                ratioVariants[ratioKey].push(url)
                zip.folder(ratioSlug)?.file(`slide${slide.slideNumber}.png`, png)
            }
        }

        const primarySlideUrls = ratioVariants["1:1"]

        // ── Upload ZIP archive ────────────────────────────────────────────────
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
        const zipFileName = `PAM_CAROUSEL_${date}_${slug}_batch.zip`
        const zipUrl = await storeBlob(`production/${contentIdeaId}/CAROUSEL_PNG/${zipFileName}`, zipBuffer, "application/zip")

        const readable = [
            `CAROUSEL: ${script.title}`,
            `COVER: ${script.coverText}`,
            "",
            ...script.slides.map(s =>
                `SLIDE ${s.slideNumber}: ${s.headline}${s.bodyText ? `\n${s.bodyText}` : ""}${s.speakerNote ? `\nNote: ${s.speakerNote}` : ""}`
            ),
            "",
            `CTA: ${script.ctaSlide}`,
        ].join("\n")

        const { error: assetError } = await supabaseAdmin
            .from("content_assets")
            .update({
                status: "COMPLETE",
                storage_url: primarySlideUrls[0],
                metadata: JSON.parse(JSON.stringify({
                    content: readable,
                    slideUrls: primarySlideUrls,
                    ratioVariants,
                    zipUrl,
                    script
                })),
            })
            .eq("render_job_id", renderJobId)
            .eq("asset_type", "CAROUSEL_PNG")

        if (assetError) {
            throw new Error(`Failed to update carousel metadata: ${assetError.message}`)
        }

        const { error: completeError } = await supabaseAdmin
            .from("render_jobs")
            .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
            .eq("id", renderJobId)

        if (completeError) {
            console.error("[carouselInline] Failed to mark job COMPLETE:", completeError)
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[carouselInline] failed:", msg)
        const failureTime = new Date().toISOString()
        const { error: failJobError } = await supabaseAdmin
            .from("render_jobs")
            .update({ status: "FAILED", completed_at: failureTime, error_message: msg })
            .eq("id", renderJobId)

        if (failJobError) {
            console.error("[carouselInline] Failed to mark job FAILED:", failJobError)
        }

        const { error: failAssetsError } = await supabaseAdmin
            .from("content_assets")
            .update({ status: "FAILED" })
            .eq("render_job_id", renderJobId)

        if (failAssetsError) {
            console.error("[carouselInline] Failed to mark assets FAILED:", failAssetsError)
        }
        throw err
    }

    await checkAllRenderJobsComplete(contentIdeaId, calendarEntryId)
}

// ---------------------------------------------------------------------------
// AUDIO inline — ElevenLabs TTS -> Vercel Blob MP3
// ---------------------------------------------------------------------------

async function runAudioInline(
    contentIdeaId: string,
    voiceoverText: string,
    fileName: string,
    voiceId?: string
): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set")

    const voice = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "vCJ255LXSScOjTI93arO"

    // Strip ESL markers before hashing so the key is stable regardless of
    // whether the caller already cleaned the text.
    const cleanText = stripESLMarkers(voiceoverText)
    const promptHash = createHash("sha256").update(`${voice}:${cleanText}`).digest("hex")

    // 1. Hash-based cache lookup in audio_cache — prevents duplicate ElevenLabs billing
    const { data: cachedAudio } = await supabaseAdmin
        .from("audio_cache")
        .select("storage_url")
        .eq("prompt_hash", promptHash)
        .maybeSingle()

    if (cachedAudio?.storage_url) {
        Promise.resolve(
            supabaseAdmin
                .from("audio_cache")
                .update({ last_used_at: new Date().toISOString() })
                .eq("prompt_hash", promptHash)
        ).catch((err: any) => console.error("[runAudioInline] Failed to update last_used_at:", err))
        return cachedAudio.storage_url
    }

    // 2. Legacy content_assets lookup as a secondary fallback (preserves old behaviour)
    const { data: existingAsset } = await supabaseAdmin
        .from("content_assets")
        .select("storage_url, status")
        .eq("content_idea_id", contentIdeaId)
        .eq("asset_type", "AUDIO_MP3")
        .maybeSingle()

    if (existingAsset?.status === "COMPLETE" && existingAsset?.storage_url) {
        console.log(`[runAudioInline] 🔄 Utilizing cached audio asset for content idea: ${contentIdeaId}`)
        return existingAsset.storage_url
    }

    // 3. Generate via ElevenLabs with exponential back-off retry (shared lib)
    let audioBuffer: Buffer | null = null;
    try {
        audioBuffer = await callElevenLabsWithRetry(cleanText, voice, apiKey)
    } catch (err) {
        console.warn("[runAudioInline] ElevenLabs API generation failed (exhausted/error). Degrading gracefully to silent video.", err);
        return ""; // Empty string instructs the renderer to produce a silent pass.
    }

    // 4. Upload to Supabase Storage
    const storageUrl = await storeBlob(
        `production/${contentIdeaId}/AUDIO_MP3/${fileName}`,
        audioBuffer,
        "audio/mpeg"
    )

    // 5. Persist in audio_cache so subsequent identical scripts are served from cache
    await supabaseAdmin
        .from("audio_cache")
        .upsert(
            {
                prompt_hash: promptHash,
                storage_url: storageUrl,
                storage_path: `production/${contentIdeaId}/AUDIO_MP3/${fileName}`,
                duration_ms: 0, // duration not computed in inline path; updated by video renderer
                voice_id: voice,
                char_count: cleanText.length,
                created_at: new Date().toISOString(),
                last_used_at: new Date().toISOString(),
            },
            { onConflict: "prompt_hash" }
        )

    return storageUrl
}

// ---------------------------------------------------------------------------
// VIDEO SCRIPT inline — Gemini script + ElevenLabs audio + Remotion MP4
// ---------------------------------------------------------------------------

async function renderVideoInline(input: {
    hook: string
    teachingPoints: string[]
    cta: string
    audioUrl: string
    topic: string
}): Promise<Buffer> {
    const { join } = await import("node:path")
    const { tmpdir } = await import("node:os")
    const { readFileSync, unlinkSync } = await import("node:fs")
    const remotionRendererPackage = ["@remotion", "renderer"].join("/")
    const remotionBundlerPackage = ["@remotion", "bundler"].join("/")
    const { renderMedia, selectComposition } = require(remotionRendererPackage) as typeof import("@remotion/renderer")
    const { bundle } = require(remotionBundlerPackage) as typeof import("@remotion/bundler")
    const entry = join(process.cwd(), "workers", "video-renderer", "remotion-src", "index.tsx")
    const publicDir = join(process.cwd(), "workers", "video-renderer", "remotion-src", "public")
    
    // Force re-bundle from source so we Pick up changes to PAMLogo.tsx
    const serveUrl = await bundle(entry, () => { }, { publicDir })

    const composition = await selectComposition({
        serveUrl,
        id: "PAMVideo",
        inputProps: input,
    })

    const tmpFile = join(tmpdir(), `pam-video-${Date.now()}.mp4`)

    await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: tmpFile,
        inputProps: input,
        chromiumOptions: {
            disableWebSecurity: true,
        },
        timeoutInMilliseconds: 600_000,
    })

    const buffer = readFileSync(tmpFile)
    unlinkSync(tmpFile)

    return buffer
}

export async function runVideoScriptInline(input: RepurposeInlineInput): Promise<void> {
    const { renderJobId, contentIdeaId, calendarEntryId, entryDate, topic, voiceId } = input
    const { error: startError } = await supabaseAdmin
        .from("render_jobs")
        .update({ status: "RUNNING", started_at: new Date().toISOString() })
        .eq("id", renderJobId)

    if (startError) {
        console.error("[videoScriptInline] Unable to mark job RUNNING:", startError)
        throw new Error(`Unable to start render job ${renderJobId}`)
    }

    try {
        // 1. Check for existing COMPLETE script to avoid Gemini re-generation & audio cache miss
        let script: VideoScript | null = null;
        const { data: existingScriptAsset } = await supabaseAdmin
            .from("content_assets")
            .select("status, storage_url, metadata")
            .eq("content_idea_id", contentIdeaId)
            .eq("asset_type", "VIDEO_SCRIPT_JSON")
            .eq("status", "COMPLETE")
            .maybeSingle()

        if (existingScriptAsset?.metadata && (existingScriptAsset.metadata as any).script) {
            console.log(`[videoScriptInline] 🔄 Reusing existing video script for content idea: ${contentIdeaId}`)
            script = (existingScriptAsset.metadata as any).script as VideoScript
        } else {
            const raw = await callGemini(buildVideoPrompt(input))
            script = JSON.parse(raw) as VideoScript
            script.title = cleanText(script.title)
            script.hook = cleanText(script.hook)
            script.ctaOutro = cleanText(script.ctaOutro)
            script.captionVersion = cleanText(script.captionVersion)
            script.segments = (script.segments || []).map(s => ({ ...s, visual: cleanText(s.visual), voiceover: cleanText(s.voiceover) }))
        }

        if (!script) throw new Error("Could not obtain video script.")

        const { date, slug } = makeSlug(entryDate, topic)
        const readable = [
            `VIDEO SCRIPT: ${script.title}`,
            `Duration: ~${script.durationEstimateSecs}s`,
            `HOOK (0:00): ${script.hook}`,
            "",
            ...script.segments.map(s => `[${s.timecode}]\nVISUAL: ${s.visual}\nSPEAK: ${s.voiceover}`),
            "",
            `CTA OUTRO: ${script.ctaOutro}`,
            "",
            `CAPTION:\n${script.captionVersion}`,
        ].join("\n")

        // Store script if we just generated it or need to update the job's asset row
        const scriptUrl = existingScriptAsset?.storage_url || await storeBlob(
            `production/${contentIdeaId}/VIDEO_SCRIPT_JSON/PAM_VIDEO_SCRIPT_${date}_${slug}_v1.txt`,
            readable,
            "text/plain"
        )

        const scriptMeta = JSON.parse(JSON.stringify({ content: readable, script }))
        await supabaseAdmin
            .from("content_assets")
            .update({ status: "COMPLETE", storage_url: scriptUrl, metadata: scriptMeta })
            .eq("render_job_id", renderJobId)
            .eq("asset_type", "VIDEO_SCRIPT_JSON")

        // 2. ElevenLabs audio (Reuse if already COMPLETE for this idea)
        let generatedAudioUrl: string | undefined = undefined;

        const { data: existingAudioAsset } = await supabaseAdmin
            .from("content_assets")
            .select("status, storage_url")
            .eq("content_idea_id", contentIdeaId)
            .eq("asset_type", "AUDIO_MP3")
            .eq("status", "COMPLETE")
            .maybeSingle()

        if (existingAudioAsset?.storage_url) {
            console.log(`[videoScriptInline] 🔄 Reusing existing audio asset for content idea: ${contentIdeaId}`)
            generatedAudioUrl = existingAudioAsset.storage_url
        } else {
            const voiceoverText = [
                script.hook,
                ...script.segments.map(s => s.voiceover),
                script.ctaOutro
            ].filter(Boolean).join(" ");

            generatedAudioUrl = await runAudioInline(
                contentIdeaId,
                voiceoverText,
                `PAM_AUDIO_${date}_${slug}_v1.mp3`,
                voiceId
            )
        }

        if (generatedAudioUrl) {
            await supabaseAdmin
                .from("content_assets")
                .update({
                    status: "COMPLETE",
                    storage_url: generatedAudioUrl,
                    metadata: {
                        content: `Audio voiceover: ${script.title} (~${script.durationEstimateSecs}s)`,
                        durationEstimateSecs: script.durationEstimateSecs,
                    },
                })
                .eq("render_job_id", renderJobId)
                .eq("asset_type", "AUDIO_MP3")
        }

        // 3. Local Remotion MP4 rendering (Reuse if already COMPLETE for this idea)
        const { data: existingVideoAsset } = await supabaseAdmin
            .from("content_assets")
            .select("status, storage_url")
            .eq("content_idea_id", contentIdeaId)
            .eq("asset_type", "VIDEO_MP4")
            .eq("status", "COMPLETE")
            .maybeSingle()

        if (existingVideoAsset?.storage_url) {
            console.log(`[videoScriptInline] 🔄 Reusing existing MP4 for content idea: ${contentIdeaId}`)
            await supabaseAdmin
                .from("render_jobs")
                .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
                .eq("id", renderJobId)
            return
        }

        if (generatedAudioUrl) {
            console.log(`[videoScriptInline] Video MP4 not found — triggering Remotion renderer...`)
            try {
                const videoBuffer = await renderVideoInline({
                    hook: script.hook,
                    teachingPoints: script.segments.map(s => s.voiceover),
                    cta: script.ctaOutro,
                    audioUrl: generatedAudioUrl,
                    topic,
                })

                const videoUrl = await storeBlob(
                    `production/${contentIdeaId}/VIDEO_MP4/PAM_VIDEO_${date}_${slug}_v1.mp4`,
                    videoBuffer,
                    "video/mp4"
                )

                await supabaseAdmin
                    .from("content_assets")
                    .update({ status: "COMPLETE", storage_url: videoUrl })
                    .eq("render_job_id", renderJobId)
                    .eq("asset_type", "VIDEO_MP4")

                await supabaseAdmin
                    .from("render_jobs")
                    .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
                    .eq("id", renderJobId)

                console.log(`[videoScriptInline] Remotion MP4 generated successfully locally: ${videoUrl}`)
            } catch (renderErr: unknown) {
                console.error("[videoScriptInline] Movie render failed (Partial success):", renderErr)
                // Mark job as PARTIAL since script/audio ARE finished
                await supabaseAdmin
                    .from("render_jobs")
                    .update({ 
                        status: "PARTIAL", 
                        errorMessage: `Script/Audio OK. MP4 failed: ${(renderErr as Error).message}` 
                    })
                    .eq("id", renderJobId)
                
                // Also mark the specific asset as failed
                await supabaseAdmin
                    .from("content_assets")
                    .update({ status: "FAILED" })
                    .eq("render_job_id", renderJobId)
                    .eq("asset_type", "VIDEO_MP4")
            }
        } else {
            console.warn("[videoScriptInline] Skipping MP4 generation because audio generation failed.")
            await supabaseAdmin
                .from("content_assets")
                .update({ status: "FAILED" })
                .eq("render_job_id", renderJobId)
                .eq("asset_type", "VIDEO_MP4")
            throw new Error("No audio available to orchestrate the MP4 Remotion engine.")
        }


        // 4. Mark job as truly COMPLETE only if we reached here without errors or PARTIAL status
        const { data: currentJob } = await supabaseAdmin
            .from("render_jobs")
            .select("status")
            .eq("id", renderJobId)
            .single()

        if (currentJob?.status !== "PARTIAL") {
            const { error: completeError } = await supabaseAdmin
                .from("render_jobs")
                .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
                .eq("id", renderJobId)

            if (completeError) {
                console.error("[videoScriptInline] Failed to mark job COMPLETE:", completeError)
            }
        } else {
            console.log("[videoScriptInline] Job finalized as PARTIAL/INCOMPLETE for later retry.")
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[videoScriptInline] failed:", msg)
        const failureTime = new Date().toISOString()
        const { error: failJobError } = await supabaseAdmin
            .from("render_jobs")
            .update({ status: "FAILED", completed_at: failureTime, error_message: msg })
            .eq("id", renderJobId)

        if (failJobError) {
            console.error("[videoScriptInline] Failed to mark job FAILED:", failJobError)
        }

        const { error: failAssetsError } = await supabaseAdmin
            .from("content_assets")
            .update({ status: "FAILED" })
            .eq("render_job_id", renderJobId)

        if (failAssetsError) {
            console.error("[videoScriptInline] Failed to mark assets FAILED:", failAssetsError)
        }
        throw err
    }

    await checkAllRenderJobsComplete(contentIdeaId, calendarEntryId)
}
