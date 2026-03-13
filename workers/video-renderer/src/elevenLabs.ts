import axios from "axios"

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

// Default voice: "Rachel" — calm, professional, suitable for clinical education content
// Replace VOICE_ID with your preferred ElevenLabs voice ID
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"

interface ElevenLabsSettings {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
}

const DEFAULT_SETTINGS: ElevenLabsSettings = {
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true,
}

export async function generateAudio(
    text: string,
    voiceId: string = DEFAULT_VOICE_ID
): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set")

    const response = await axios.post(
        `${ELEVENLABS_API_URL}/${voiceId}`,
        {
            text,
            model_id: "eleven_turbo_v2_5",  // fastest model — good quality for educational content
            voice_settings: DEFAULT_SETTINGS,
        },
        {
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
            },
            responseType: "arraybuffer",
            timeout: 120_000,   // 2 min for longer texts
        }
    )

    return Buffer.from(response.data as ArrayBuffer)
}
