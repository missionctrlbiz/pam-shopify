/**
 * POST /api/audio/generate
 *
 * Generate (or serve from cache) an ElevenLabs TTS MP3 clip.
 *
 * ## Cache strategy
 * A SHA-256 hash of `"<voiceId>:<cleanText>"` is used as the deterministic
 * cache key stored in the `audio_cache` Supabase table.  On a cache hit the
 * route returns the existing Supabase Storage URL without calling ElevenLabs,
 * preventing duplicate billing on re-generate clicks.
 *
 * ## Response — success
 * ```json
 * {
 *   "url":         "https://…/audio-cache/<hash>.mp3",
 *   "storagePath": "audio-cache/<hash>.mp3",
 *   "durationMs":  14253.6,      // precision float for Remotion timeline use
 *   "promptHash":  "<sha256>",
 *   "cached":      false,
 *   "completedAt": "2026-03-20T14:51:46.000Z"
 * }
 * ```
 *
 * ## Response — fallback (ElevenLabs quota exceeded / unavailable)
 * ```json
 * {
 *   "fallbackRequired": true,
 *   "fallbackMode":     "browser-speech-synthesis",
 *   "text":             "<clean script text>",
 *   "error":            "ElevenLabs tier quota exceeded …"
 * }
 * ```
 * The frontend should listen for `fallbackRequired === true` and invoke
 * `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`.
 *
 * ## Request body
 * | Field       | Type   | Required | Description                                 |
 * |-------------|--------|----------|---------------------------------------------|
 * | text        | string | ✅       | Raw voiceover script (ESL markers allowed)  |
 * | voiceId     | string | —        | ElevenLabs voice ID (default: Sarah)        |
 *
 * Protected: ADMIN role required.
 */

import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { stripESLMarkers, getMp3DurationMs, ElevenLabsQuotaError, callElevenLabsWithRetry } from "@/lib/audio/elevenLabs"

export const dynamic = "force-dynamic"
// Allow up to 120 s — ElevenLabs can be slow for long scripts
export const maxDuration = 120

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "vCJ255LXSScOjTI93arO"
const STORAGE_BUCKET = "production"
const CACHE_FOLDER = "audio-cache"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hex of "<voiceId>:<cleanText>" — the deterministic cache key. */
function buildPromptHash(voiceId: string, cleanText: string): string {
    return createHash("sha256").update(`${voiceId}:${cleanText}`).digest("hex")
}

/** Upload buffer to Supabase Storage; return { url, storagePath }. */
async function uploadToStorage(
    promptHash: string,
    buf: Buffer
): Promise<{ url: string; storagePath: string }> {
    const storagePath = `${CACHE_FOLDER}/${promptHash}.mp3`

    const { error } = await supabaseAdmin
        .storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buf, {
            contentType: "audio/mpeg",
            upsert: true,
        })

    if (error) {
        throw new Error(`Supabase Storage upload failed: ${error.message}`)
    }

    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath)

    return { url: publicUrl, storagePath }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    // Auth guard — admin only
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse body
    let text: string
    let voiceId: string

    try {
        const body = await req.json() as { text?: unknown; voiceId?: unknown }
        if (!body.text || typeof body.text !== "string" || body.text.trim() === "") {
            return NextResponse.json({ error: "`text` is required and must be a non-empty string" }, { status: 400 })
        }
        text = body.text
        voiceId = typeof body.voiceId === "string" && body.voiceId.trim()
            ? body.voiceId.trim()
            : DEFAULT_VOICE_ID
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const cleanText = stripESLMarkers(text)
    const promptHash = buildPromptHash(voiceId, cleanText)

    // ------------------------------------------------------------------
    // 1. Cache lookup
    // ------------------------------------------------------------------
    const { data: cached } = await supabaseAdmin
        .from("audio_cache")
        .select("storage_url, storage_path, duration_ms")
        .eq("prompt_hash", promptHash)
        .maybeSingle()

    if (cached) {
        // Refresh last_used_at in the background (fire-and-forget)
        Promise.resolve(
            supabaseAdmin
                .from("audio_cache")
                .update({ last_used_at: new Date().toISOString() })
                .eq("prompt_hash", promptHash)
        ).catch((err: any) => console.error("[audio/generate] Failed to update last_used_at:", err))

        return NextResponse.json({
            url: cached.storage_url,
            storagePath: cached.storage_path,
            durationMs: cached.duration_ms,
            promptHash,
            cached: true,
            completedAt: new Date().toISOString(),
        })
    }

    // ------------------------------------------------------------------
    // 2. Generate via ElevenLabs
    // ------------------------------------------------------------------
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured" }, { status: 500 })
    }

    let audioBuffer: Buffer

    try {
        audioBuffer = await callElevenLabsWithRetry(cleanText, voiceId, apiKey)
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)

        // Quota exceeded — return a graceful fallback descriptor so the
        // frontend can invoke browser SpeechSynthesis instead of crashing.
        if (err instanceof ElevenLabsQuotaError) {
            console.warn("[audio/generate] Quota exceeded — returning browser-speech fallback")
            return NextResponse.json(
                {
                    fallbackRequired: true,
                    fallbackMode: "browser-speech-synthesis",
                    text: cleanText,
                    error: message,
                },
                { status: 200 }
            )
        }

        console.error("[audio/generate] ElevenLabs error:", message)
        return NextResponse.json({ error: message }, { status: 502 })
    }

    // ------------------------------------------------------------------
    // 3. Compute duration & upload
    // ------------------------------------------------------------------
    const durationMs = getMp3DurationMs(audioBuffer)

    let url: string
    let storagePath: string

    try {
        ; ({ url, storagePath } = await uploadToStorage(promptHash, audioBuffer))
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error("[audio/generate] Storage upload error:", message)
        return NextResponse.json({ error: message }, { status: 500 })
    }

    // ------------------------------------------------------------------
    // 4. Persist cache entry
    // ------------------------------------------------------------------
    const { error: cacheError } = await supabaseAdmin
        .from("audio_cache")
        .upsert(
            {
                prompt_hash: promptHash,
                storage_url: url,
                storage_path: storagePath,
                duration_ms: durationMs,
                voice_id: voiceId,
                char_count: cleanText.length,
                created_at: new Date().toISOString(),
                last_used_at: new Date().toISOString(),
            },
            { onConflict: "prompt_hash" }
        )

    if (cacheError) {
        // Non-fatal: log and continue — caller still gets the freshly generated asset
        console.error("[audio/generate] Failed to write audio_cache row:", cacheError.message)
    }

    return NextResponse.json({
        url,
        storagePath,
        durationMs,
        promptHash,
        cached: false,
        completedAt: new Date().toISOString(),
    })
}
