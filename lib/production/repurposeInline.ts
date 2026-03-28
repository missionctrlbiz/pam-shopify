/**
 * Inline generation — runs all Gemini jobs directly inside the
 * Next.js serverless function. No Cloud Tasks or Cloud Run required.
 *
 * Covers:
 *   REPURPOSE  → IG / FB / TikTok / LinkedIn / Email captions
 *   CAROUSEL   → 6 PNG slides rendered via satori + @resvg/resvg-js
 *   VIDEO      → shot-by-shot script (Gemini) + MP3 voiceover (ElevenLabs)
 *
 * All assets are uploaded to Vercel Blob (real public URLs).
 */

import { getAI, PRODUCTION_MODEL } from "@/lib/ai"
import { supabaseAdmin } from "@/lib/supabase"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { callElevenLabsWithRetry, stripESLMarkers } from "@/lib/audio/elevenLabs"
import satori from "satori"

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

    // Fallback to 45s if undefined
    const duration = m.estimatedDurationSecs ?? m.estimatedReadTimeSecs ?? 45

    return `You are the Video Production Specialist for Psychiatric Assessment Mastery(tm) (PAM).
Write a short, targeted ${duration}-second Instagram Reel / TikTok video script based on the content below.

TOPIC: ${input.topic}
HOOK: ${m.hook ?? ""}
TEACHING POINTS: ${(m.teachingPoints ?? []).join(" | ")}
CTA: ${m.cta ?? ""}

RULES:
- Hook in first 3 seconds. 4-5 segments. CTA at end: PAM Mastery Bundle.
- STRICTLY limit the total voiceover spoken word count to approximately ${Math.round(duration * 2.3)} words total so it comfortably fits a ${duration}-second playback.
- PLAIN TEXT ONLY. No asterisks, no markdown.

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
// CAROUSEL inline — renders actual 1080x1080 PNGs via satori + @resvg/resvg-js
// ---------------------------------------------------------------------------

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
    const css = await (await fetch(cssUrl)).text()
    // Match .ttf fonts delivered by Google Fonts without header override
    const matches = [...css.matchAll(/src:\s*url\(['"]?([^'")\s]+\.ttf)['"]?\)/g)]
    const fontUrl = matches[matches.length - 1]?.[1]
    if (!fontUrl) throw new Error(`No ttf URL in Google Fonts CSS for ${family} ${weight}`)
    return (await fetch(fontUrl)).arrayBuffer()
}

function makeSlideElement(slide: CarouselSlide, totalSlides: number, logoBase64: string): object {
    const isCover = slide.slideNumber === 1
    const isCTA = slide.slideNumber === totalSlides
    const isDark = isCover

    const innerBg = isDark ? "#0F172A" : "#FFFFFF"
    const textColor = isDark ? "#FFFFFF" : "#0F172A"
    const bodyColor = isDark ? "#E2E8F0" : "#475569"
    const accentColor = "#A855F7"
    const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)"

    const innerChildren: object[] = []

    // Pagination top-left counter style
    if (!isCover && !isCTA) {
        innerChildren.push({
            type: "div",
            props: {
                style: { position: "absolute", top: 40, left: 50, fontSize: 18, fontWeight: 700, color: accentColor, letterSpacing: 1 },
                children: `${String(slide.slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`,
            },
        })
    }

    // Determine layout variations based on slideIndex
    const isBulletList = slide.bodyText ? slide.bodyText.includes("•") || slide.bodyText.includes("- ") || slide.bodyText.includes("1. ") : false;
    const contentAlign = (slide.slideNumber % 2 === 0 || isBulletList) && !isCover ? "flex-start" : "center";
    const textAlign = (slide.slideNumber % 2 === 0 || isBulletList) && !isCover ? "left" : "center";
    
    // Label above headline
    if (!isCover && slide.slideNumber % 2 !== 0 && !isCTA) {
        innerChildren.push({
            type: "div",
            props: {
                style: { fontSize: 16, fontWeight: 700, color: accentColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
                children: "CLINICAL PEARL"
            }
        });
    }

    // Headline
    innerChildren.push({
        type: "div",
        props: {
            style: {
                fontSize: isCover ? 88 : 48,
                fontWeight: 800,
                color: textColor,
                textAlign: textAlign,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                maxWidth: 920,
                marginBottom: slide.bodyText ? 32 : 0,
                borderBottom: (contentAlign === "flex-start" && !isCover) ? `6px solid ${accentColor}` : "none",
                paddingBottom: (contentAlign === "flex-start" && !isCover) ? 16 : 0,
            },
            children: slide.headline,
        },
    })

    // Divider Line accent (only for centered covers)
    if (isCover) {
        innerChildren.push({
            type: "div",
            props: { style: { width: 120, height: 6, background: "linear-gradient(90deg, #A855F7, #6D28D9)", borderRadius: 3, marginTop: 32 }, children: "" },
        })
    }

    // Body Text
    if (slide.bodyText) {
        // Bullet list renderer
        if (isBulletList && !isCover && !isCTA) {
            const bullets = slide.bodyText.split(/\n|•/).map(b => b.trim().replace(/^- /,"")).filter(Boolean);
            const listItems = bullets.map(b => ({
                type: "div",
                props: {
                    style: { display: "flex", alignItems: "flex-start", marginBottom: 16 },
                    children: [
                        {
                            type: "div",
                            props: { style: { width: 12, height: 12, background: accentColor, borderRadius: "50%", marginTop: 14, marginRight: 24, flexShrink: 0 }, children: "" }
                        },
                        {
                            type: "div",
                            props: { style: { fontSize: 28, fontWeight: 400, color: bodyColor, lineHeight: 1.5, maxWidth: 840 }, children: b }
                        }
                    ]
                }
            }));

            innerChildren.push({
                type: "div",
                props: {
                    style: { display: "flex", flexDirection: "column", width: "100%", marginTop: 12 },
                    children: listItems
                }
            });
        } else {
            // Standard body paragraph
            innerChildren.push({
                type: "div",
                props: {
                    style: {
                        fontSize: 28,
                        fontWeight: 400,
                        color: bodyColor,
                        textAlign: textAlign,
                        lineHeight: 1.6,
                        maxWidth: 820
                    },
                    children: slide.bodyText,
                },
            })
        }
    }

    // "Swipe" lucide icon edge widget for body slides (bottom right corner)
    if (!isCover && !isCTA) {
        innerChildren.push({
            type: "div",
            props: {
                style: { position: "absolute", bottom: 40, right: 50, display: "flex", alignItems: "center", color: mutedColor, fontSize: 16, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" },
                children: [
                    { type: "span", props: { style: { marginRight: 8 }, children: "Swipe" } },
                    { type: "svg", props: {
                        xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
                        children: [
                            { type: "path", props: { d: "M5 12h14" } },
                            { type: "path", props: { d: "m12 5 7 7-7 7" } }
                        ]
                    }}
                ]
            }
        });
    }

    // Footer Watermark (Logo + 'psychassessmentguide.com')
    const footerContent = logoBase64 
        ? [
            {
                type: "img",
                props: {
                    src: logoBase64,
                    style: { height: 32, opacity: isDark ? 0.9 : 0.6, marginBottom: 8 }
                }
            },
            {
                type: "div",
                props: {
                    style: { fontSize: 13, fontWeight: 600, color: mutedColor, letterSpacing: 1 },
                    children: "psychassessmentguide.com"
                }
            }
        ]
        : {
            type: "div",
            props: {
                style: { fontSize: 16, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" },
                children: "psychassessmentguide.com"
            }
        };

    innerChildren.push({
        type: "div",
        props: {
            style: {
                position: "absolute",
                bottom: 40,
                color: mutedColor,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            },
            children: footerContent,
        },
    })

    // Outer Wrapper creates the V2 CapCut Gradient Border
    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                backgroundImage: "linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)",
                padding: "8px",
            },
            children: {
                type: "div",
                props: {
                    style: {
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: contentAlign,
                        justifyContent: "center",
                        background: innerBg,
                        position: "relative",
                        borderRadius: "12px",
                        padding: "100px",
                    },
                    children: innerChildren
                }
            }
        },
    }
}

async function renderSlideToPng(
    slide: CarouselSlide,
    totalSlides: number,
    boldFont: ArrayBuffer,
    regularFont: ArrayBuffer,
    logoBase64: string
): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(makeSlideElement(slide, totalSlides, logoBase64) as any, {
        width: 1080,
        height: 1080,
        fonts: [
            { name: "Montserrat", data: boldFont, weight: 700, style: "normal" },
            { name: "Montserrat", data: regularFont, weight: 400, style: "normal" },
        ],
    })
    const Resvg = getResvg()
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } })
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

        script.title = cleanText(script.title)
        script.coverText = cleanText(script.coverText)
        script.ctaSlide = cleanText(script.ctaSlide)
        script.slides = script.slides.map(s => ({
            ...s,
            headline: cleanText(s.headline),
            bodyText: cleanText(s.bodyText),
            speakerNote: s.speakerNote ? cleanText(s.speakerNote) : undefined,
        }))

        const [boldFont, regularFont] = await Promise.all([
            loadGoogleFont("Montserrat", 700),
            loadGoogleFont("Montserrat", 400),
        ])

        const logoPath = await import("node:path").then((p) => p.join(process.cwd(), "public", "logo.webp"));
        const logoBuffer = await import("node:fs").then((f) => f.promises.readFile(logoPath)).catch(() => Buffer.from(""));
        const logoBase64 = logoBuffer.length ? `data:image/webp;base64,${logoBuffer.toString("base64")}` : "";

        const { date, slug } = makeSlug(entryDate, topic)
        const slideUrls: string[] = []

        for (const slide of script.slides) {
            const png = await renderSlideToPng(slide, script.slides.length, boldFont, regularFont, logoBase64)
            const fileName = `PAM_CAROUSEL_${date}_${slug}_slide${slide.slideNumber}_v1.png`
            const url = await storeBlob(`production/${contentIdeaId}/CAROUSEL_PNG/${fileName}`, png, "image/png")
            slideUrls.push(url)
        }

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
                storage_url: slideUrls[0],
                metadata: JSON.parse(JSON.stringify({ content: readable, slideUrls, script })),
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

    const voice = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL"

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
    const { renderMedia, selectComposition } = await import("@remotion/renderer")
    const { join } = await import("node:path")
    const { tmpdir } = await import("node:os")
    const { readFileSync, unlinkSync } = await import("node:fs")

    const serveUrl = process.env.REMOTION_BUNDLE_PATH || join(process.cwd(), "workers", "video-renderer", "build")

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
        const raw = await callGemini(buildVideoPrompt(input))
        const script = JSON.parse(raw) as VideoScript

        script.title = cleanText(script.title)
        script.hook = cleanText(script.hook)
        script.ctaOutro = cleanText(script.ctaOutro)
        script.captionVersion = cleanText(script.captionVersion)
        script.segments = (script.segments || []).map(s => ({ ...s, visual: cleanText(s.visual), voiceover: cleanText(s.voiceover) }))

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

        const scriptUrl = await storeBlob(
            `production/${contentIdeaId}/VIDEO_SCRIPT_JSON/PAM_VIDEO_SCRIPT_${date}_${slug}_v1.txt`,
            readable,
            "text/plain"
        )

        const scriptMeta = JSON.parse(JSON.stringify({ content: readable, script }))
        const { error: scriptAssetError } = await supabaseAdmin
            .from("content_assets")
            .update({ status: "COMPLETE", storage_url: scriptUrl, metadata: scriptMeta })
            .eq("render_job_id", renderJobId)
            .eq("asset_type", "VIDEO_SCRIPT_JSON")

        if (scriptAssetError) {
            throw new Error(`Failed to update video script asset: ${scriptAssetError.message}`)
        }

        // ElevenLabs audio (non-fatal if it fails)
        let generatedAudioUrl: string | undefined = undefined;

        try {
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
            const { error: audioAssetError } = await supabaseAdmin
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

            if (audioAssetError) {
                console.error("[videoScriptInline] Failed to update audio asset:", audioAssetError)
            }
        } catch (audioErr) {
            console.error("[videoScriptInline] ElevenLabs failed:", audioErr)
            const { error: audioFailError } = await supabaseAdmin
                .from("content_assets")
                .update({ status: "FAILED" })
                .eq("render_job_id", renderJobId)
                .eq("asset_type", "AUDIO_MP3")

            if (audioFailError) {
                console.error("[videoScriptInline] Failed to mark audio asset FAILED:", audioFailError)
            }
        }

        // Remotion MP4 generation
        if (generatedAudioUrl) {
            console.log(`[videoScriptInline] Triggering local Remotion renderer...`)
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

                const { error: videoAssetError } = await supabaseAdmin
                    .from("content_assets")
                    .update({ status: "COMPLETE", storage_url: videoUrl })
                    .eq("render_job_id", renderJobId)
                    .eq("asset_type", "VIDEO_MP4")

                if (videoAssetError) {
                    throw new Error(`Failed to update video asset metadata: ${videoAssetError.message}`)
                }
                console.log(`[videoScriptInline] Remotion MP4 generated successfully locally: ${videoUrl}`)
            } catch (videoErr) {
                console.error("[videoScriptInline] Remotion local failed:", videoErr)
                await supabaseAdmin
                    .from("content_assets")
                    .update({ status: "FAILED" })
                    .eq("render_job_id", renderJobId)
                    .eq("asset_type", "VIDEO_MP4")
                throw videoErr
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


        const { error: completeError } = await supabaseAdmin
            .from("render_jobs")
            .update({ status: "COMPLETE", completed_at: new Date().toISOString() })
            .eq("id", renderJobId)

        if (completeError) {
            console.error("[videoScriptInline] Failed to mark job COMPLETE:", completeError)
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
