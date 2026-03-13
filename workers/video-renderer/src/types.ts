/** Mirrors PAMScene from lib/production/contentStrategist.ts */
export interface PAMSceneData {
    type: "COVER" | "TEACHING" | "CTA"
    durationSecs: number
    voiceoverText: string       // includes [pause]/[breath]/[emphasize:word] — stripped before TTS
    visualDirection: string
    textOverlay: string
    emojiAccent?: string
}

export interface MasterJson {
    hook: string
    teachingPoints: string[]
    cta: string
    clinicalGrounding: string
    slideTextBlocks: string[]
    platformAdaptations: Record<string, unknown>
    estimatedReadTimeSecs: number
    // Story Bank fields — populated by sceneDirector.ts
    scenes?: PAMSceneData[]
    voiceoverFull?: string
    totalDurationSecs?: number
}

export interface RenderPayload {
    renderJobId: string
    contentIdeaId: string
    masterJson: MasterJson
    platform: string
    postType: string
    topic: string
    entryDate: string
    callbackUrl: string
    callbackSecret: string
    /** ElevenLabs voice ID — defaults to Sarah (EXAVITQu4vr4xnSDxMaL) */
    voiceId?: string
    /** Background music track key: "ambient" | "pulse" | null */
    backgroundMusic?: string | null
}

export interface CallbackAsset {
    assetType: "CAROUSEL_PNG" | "VIDEO_MP4" | "TEXT_POST" | "EMAIL_HTML" | "AUDIO_MP3"
    platform: "IG" | "FB" | "TIKTOK" | "LINKEDIN" | "EMAIL" | "VIDEO"
    storageUrl: string
    storagePath?: string
    fileName: string
    metadata?: Record<string, unknown>
}

export interface CallbackBody {
    renderJobId: string
    secret: string
    assets: CallbackAsset[]
    error: string | null
}

export async function postCallback(url: string, body: CallbackBody): Promise<void> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Callback failed [${res.status}]: ${text}`)
    }
}
