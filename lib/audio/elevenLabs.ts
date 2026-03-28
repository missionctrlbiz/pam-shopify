/**
 * Shared ElevenLabs TTS utilities for Next.js app routes and Trigger.dev tasks.
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

const DEFAULT_ELEVENLABS_SETTINGS = {
    stability: 0.72,
    similarity_boost: 0.85,
    style: 0.1,
    use_speaker_boost: true,
}

/**
 * Thrown when ElevenLabs returns HTTP 429 (tier quota exceeded).
 * Callers should catch this and switch to a graceful fallback path.
 */
export class ElevenLabsQuotaError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ElevenLabsQuotaError"
    }
}

/**
 * Strip ESL gesture markers that are meaningful for on-screen display
 * but should not be spoken aloud.
 */
export function stripESLMarkers(text: string): string {
    return text
        .replace(/\[pause\]/g, ". ")
        .replace(/\[breath\]/g, ", ")
        .replace(/\[emphasize:([^\]]+)\]/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim()
}

/**
 * Parse an MPEG-1 Layer 3 buffer and return the audio duration in
 * milliseconds.  Walks MP3 frame headers after skipping any leading ID3v2
 * tag.  Falls back to a 128 kbps CBR estimate when no frames are found.
 */
export function getMp3DurationMs(buf: Buffer): number {
    const BITRATE_TABLE = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    const SAMPLE_RATE_TABLE = [44100, 48000, 32000]

    let offset = 0

    // Skip ID3v2 tag if present
    if (buf.length > 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
        const id3Size =
            ((buf[6] & 0x7f) << 21) |
            ((buf[7] & 0x7f) << 14) |
            ((buf[8] & 0x7f) << 7) |
            (buf[9] & 0x7f)
        offset = 10 + id3Size
    }

    let totalFrames = 0
    let detectedSampleRate = 44100

    while (offset + 4 <= buf.length) {
        if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0) {
            offset++
            continue
        }

        const h2 = buf[offset + 2]
        const bitrateIdx = (h2 >> 4) & 0x0f
        const srIdx = (h2 >> 2) & 0x03
        const padding = (h2 >> 1) & 0x01

        if (bitrateIdx === 0 || bitrateIdx === 15 || srIdx === 3) {
            offset++
            continue
        }

        const bitrateKbps = BITRATE_TABLE[bitrateIdx]
        const sampleRate = SAMPLE_RATE_TABLE[srIdx]
        const frameSize = Math.floor((144 * bitrateKbps * 1000) / sampleRate) + padding

        if (frameSize < 4) {
            offset++
            continue
        }

        if (totalFrames === 0) detectedSampleRate = sampleRate
        totalFrames++
        offset += frameSize
    }

    if (totalFrames === 0) {
        // CBR fallback: assume 128 kbps
        return Math.round((buf.length * 8) / 128)
    }

    // Each MPEG-1 Layer 3 frame contains 1152 audio samples
    return Math.round((totalFrames * 1152 * 1000) / detectedSampleRate)
}

/**
 * Call the ElevenLabs TTS endpoint with exponential back-off retry.
 *
 * - Retries up to 3 times on transient 5xx / network errors.
 * - Throws `ElevenLabsQuotaError` immediately on HTTP 429 (no retries).
 * - Throws on 4xx client errors (bad voice ID, etc.) without retrying.
 */
export async function callElevenLabsWithRetry(
    cleanText: string,
    voiceId: string,
    apiKey: string
): Promise<Buffer> {
    const MAX_ATTEMPTS = 4
    const BASE_DELAY_MS = 1_000

    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const res = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey,
                    "Content-Type": "application/json",
                    Accept: "audio/mpeg",
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: DEFAULT_ELEVENLABS_SETTINGS,
                }),
                signal: AbortSignal.timeout(120_000),
            })

            if (!res.ok) {
                const errBody = await res.text().catch(() => "")
                if (res.status === 429) {
                    throw new ElevenLabsQuotaError(
                        `ElevenLabs tier quota exceeded (HTTP 429) on attempt ${attempt}. ${errBody}`
                    )
                }
                if (res.status >= 400 && res.status < 500) {
                    throw new Error(`ElevenLabs HTTP ${res.status}: ${errBody}`)
                }
                throw new Error(`ElevenLabs HTTP ${res.status}: ${errBody}`)
            }

            return Buffer.from(await res.arrayBuffer())
        } catch (err) {
            if (err instanceof ElevenLabsQuotaError) throw err

            lastError = err

            if (attempt < MAX_ATTEMPTS) {
                const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1)
                console.warn(
                    `[elevenLabs] Attempt ${attempt}/${MAX_ATTEMPTS} failed — retrying in ${delayMs} ms`
                )
                await new Promise((r) => setTimeout(r, delayMs))
            }
        }
    }

    throw lastError
}
