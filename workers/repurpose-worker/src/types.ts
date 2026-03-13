export interface MasterJson {
    hook: string
    teachingPoints: string[]
    cta: string
    clinicalGrounding: string
    slideTextBlocks: string[]
    platformAdaptations: Record<string, unknown>
    estimatedReadTimeSecs: number
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
