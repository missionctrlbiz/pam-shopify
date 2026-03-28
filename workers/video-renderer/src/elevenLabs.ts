import axios, { AxiosError } from "axios"

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

// Default voice: Pro Female (vCJ255LXSScOjTI93arO)
// Pro Male (GOTYSPXtooRVmkiNYcw0) — alternative
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "vCJ255LXSScOjTI93arO"

interface ElevenLabsSettings {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
}

/**
 * Settings tuned for clinical educational content:
 *   • Higher stability → consistent pacing, no unexpected intonation jumps
 *   • High similarity_boost → preserves voice character at clinical speech pace
 *   • Low style → neutral, professional; avoids over-expressiveness
 */
const DEFAULT_SETTINGS: ElevenLabsSettings = {
    stability: 0.72,
    similarity_boost: 0.85,
    style: 0.1,
    use_speaker_boost: true,
}

/**
 * Thrown when ElevenLabs returns HTTP 429 (tier quota exceeded).
 * Callers can catch this specifically to trigger a graceful fallback.
 */
export class ElevenLabsQuotaError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ElevenLabsQuotaError"
    }
}

/**
 * Strip ESL gesture cues that are meaningful for on-screen display
 * but should not be spoken aloud. Replace [pause] and [breath] with
 * natural pause punctuation so ElevenLabs still honours the rhythm.
 */
export function stripESLMarkers(text: string): string {
    return text
        .replace(/\[pause\]/g, ". ")          // full stop → natural TTS pause
        .replace(/\[breath\]/g, ", ")          // comma → brief pause
        .replace(/\[emphasize:([^\]]+)\]/g, "$1") // keep the word, drop the marker
        .replace(/\s{2,}/g, " ")                  // collapse double spaces
        .trim()
}

/**
 * Parse an MPEG-1 Layer 3 (MP3) buffer and return the audio duration in
 * milliseconds.  Skips any leading ID3v2 tag, then walks the frame stream
 * to detect bitrate and sample-rate.
 *
 * Falls back to a 128 kbps CBR estimate when frame-walking yields no frames.
 */
export function getMp3DurationMs(buf: Buffer): number {
    // Bitrate table for MPEG-1 Layer 3 (kbps), indices 1–14 are valid
    const BITRATE_TABLE = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    // Sample-rate table for MPEG-1 (Hz); index 3 is reserved/invalid
    const SAMPLE_RATE_TABLE = [44100, 48000, 32000]

    let offset = 0

    // Skip ID3v2 tag if present ("ID3" magic bytes)
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
        // Sync word: 0xFF followed by 0xE0..0xFF
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
 * Internal: call the ElevenLabs TTS endpoint with exponential back-off.
 *
 * Retry schedule (attempt → delay before next attempt):
 *   1 → 1 000 ms
 *   2 → 2 000 ms
 *   3 → 4 000 ms   (then gives up and re-throws)
 *
 * A HTTP 429 is re-thrown as `ElevenLabsQuotaError` immediately (no retries)
 * so callers can switch to a graceful fallback path.
 */
async function callElevenLabsApi(
    cleanText: string,
    voiceId: string,
    apiKey: string
): Promise<Buffer> {
    const MAX_ATTEMPTS = 4
    const BASE_DELAY_MS = 1_000

    let lastError: unknown

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await axios.post(
                `${ELEVENLABS_API_URL}/${voiceId}`,
                {
                    text: cleanText,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: DEFAULT_SETTINGS,
                },
                {
                    headers: {
                        "xi-api-key": apiKey,
                        "Content-Type": "application/json",
                        Accept: "audio/mpeg",
                    },
                    responseType: "arraybuffer",
                    timeout: 120_000,
                }
            )

            return Buffer.from(response.data as ArrayBuffer)
        } catch (err) {
            lastError = err

            if (err instanceof AxiosError) {
                const status = err.response?.status

                // Quota exceeded — surface immediately, caller decides on fallback
                if (status === 429) {
                    throw new ElevenLabsQuotaError(
                        `ElevenLabs tier quota exceeded (HTTP 429) on attempt ${attempt}.`
                    )
                }

                // Other 4xx client errors won't improve with retries
                if (status !== undefined && status >= 400 && status < 500) {
                    throw err
                }
            }

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

/**
 * Generate an MP3 buffer from `text` using the ElevenLabs TTS API.
 *
 * Includes automatic exponential back-off (up to 3 retries on transient
 * errors).  Throws `ElevenLabsQuotaError` on HTTP 429 so callers can
 * switch to a graceful fallback instead of crashing.
 */
export async function generateAudio(
    text: string,
    voiceId: string = DEFAULT_VOICE_ID
): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set")

    const cleanText = stripESLMarkers(text)
    return callElevenLabsApi(cleanText, voiceId, apiKey)
}

/**
 * Generate an MP3 buffer from `text` and also return the audio duration
 * in milliseconds — useful for wiring the clip length into a Remotion
 * timeline without a second read-pass on the rendered file.
 */
export async function generateAudioWithDuration(
    text: string,
    voiceId: string = DEFAULT_VOICE_ID
): Promise<{ buffer: Buffer; durationMs: number }> {
    const buffer = await generateAudio(text, voiceId)
    const durationMs = getMp3DurationMs(buffer)
    return { buffer, durationMs }
}
