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
import { createRequire } from "node:module"
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
    const { Resvg } = require("@resvg/resvg-js") as { Resvg: ResvgConstructor }
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

function makeSlideElement(slide: CarouselSlide, totalSlides: number): object {
    const isCover = slide.slideNumber === 1
    const isCTA = slide.slideNumber === totalSlides
    const isDark = isCover || isCTA
    const bgColor = isDark ? "#1F2A44" : "#FFFFFF"
    const textColor = isDark ? "#FFFFFF" : "#1F2A44"
    const bodyColor = isDark ? "#CBD5E1" : "#374151"
    const mutedColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(31,42,68,0.25)"

    const children: object[] = []

    if (!isCover) {
        children.push({
            type: "div",
            props: {
                style: { fontSize: 15, fontWeight: 600, color: mutedColor, letterSpacing: 2, marginBottom: 24 },
                children: `${slide.slideNumber} / ${totalSlides}`,
            },
        })
    }

    children.push({
        type: "div",
        props: {
            style: { fontSize: isCover ? 60 : 44, fontWeight: 700, color: textColor, textAlign: "center", lineHeight: 1.2, marginBottom: slide.bodyText ? 28 : 0 },
            children: slide.headline,
        },
    })

    if (slide.bodyText) {
        children.push({
            type: "div",
            props: {
                style: { fontSize: 28, fontWeight: 400, color: bodyColor, textAlign: "center", lineHeight: 1.6, maxWidth: 860 },
                children: slide.bodyText,
            },
        })
    }

    if (isCover) {
        children.push({
            type: "div",
            props: { style: { width: 80, height: 4, background: "#4F9CF9", borderRadius: 2, marginTop: 24 }, children: "" },
        })
    }

    children.push({
        type: "div",
        props: {
            style: { fontSize: 13, fontWeight: 700, color: mutedColor, letterSpacing: 4, marginTop: isCover ? 40 : 32 },
            children: "PSYCHIATRIC ASSESSMENT MASTERY",
        },
    })

    return {
        type: "div",
        props: {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bgColor,
                padding: "80px",
                borderTopWidth: 8,
                borderTopStyle: "solid",
                borderTopColor: "#4F9CF9",
            },
            children,
        },
    }
}

async function renderSlideToPng(
    slide: CarouselSlide,
    totalSlides: number,
    boldFont: ArrayBuffer,
    regularFont: ArrayBuffer
): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(makeSlideElement(slide, totalSlides) as any, {
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

        const { date, slug } = makeSlug(entryDate, topic)
        const slideUrls: string[] = []

        for (const slide of script.slides) {
            const png = await renderSlideToPng(slide, script.slides.length, boldFont, regularFont)
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

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
        body: JSON.stringify({ text: voiceoverText, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`ElevenLabs ${res.status}: ${errText}`)
    }

    const buf = Buffer.from(await res.arrayBuffer())
    return storeBlob(`production/${contentIdeaId}/AUDIO_MP3/${fileName}`, buf, "audio/mpeg")
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
