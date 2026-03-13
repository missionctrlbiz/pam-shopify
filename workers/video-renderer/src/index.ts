import express, { Request, Response } from "express"
import { generateAudio } from "./elevenLabs"
import { renderVideo } from "./remotion"
import { uploadAsset } from "./upload"
import { RenderPayload, CallbackAsset, postCallback } from "./types"

const app = express()
app.use(express.json({ limit: "10mb" }))

app.get("/", (_req: Request, res: Response) => {
    res.json({ status: "ok", worker: "video-renderer" })
})

app.post("/", async (req: Request, res: Response) => {
    const payload = req.body as RenderPayload
    const { renderJobId, contentIdeaId, masterJson, platform, topic, entryDate, callbackUrl, callbackSecret } = payload
    const voiceId = payload.voiceId  // undefined → generateAudio falls back to default

    console.log(`[video-renderer] Job ${renderJobId} started — topic: ${topic}`)

    res.json({ accepted: true, renderJobId })

    try {
        const date = entryDate.slice(0, 10).replace(/-/g, "")
        const topicSlug = topic
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .slice(0, 3)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("")

        const blobFolder = `production/${contentIdeaId}`

        // Build voiceover text — prefer scene-director's full script (includes ESL cues),
        // else assemble from flat masterJson fields. ESL markers are stripped inside generateAudio.
        const voiceoverText = masterJson.voiceoverFull ?? [
            masterJson.hook,
            ...masterJson.teachingPoints,
            masterJson.cta,
        ].join(". ")

        // 1. Generate audio via ElevenLabs
        console.log(`[video-renderer] Generating audio for job ${renderJobId}`)
        const audioBuffer = await generateAudio(voiceoverText, voiceId)

        const audioFilename = `PAM_${platform}_${date}_${topicSlug}_v1.mp3`
        const audioBlob = await uploadAsset(
            audioBuffer,
            `${blobFolder}/AUDIO_MP3/${audioFilename}`,
            "audio/mpeg"
        )
        console.log(`[video-renderer] Audio uploaded: ${audioBlob.url}`)

        // 2. Render video via Remotion
        console.log(`[video-renderer] Rendering video for job ${renderJobId}`)
        const videoBuffer = await renderVideo({
            hook: masterJson.hook,
            teachingPoints: masterJson.teachingPoints,
            cta: masterJson.cta,
            audioUrl: audioBlob.url,
            topic,
            // Use scene-director scenes when available for per-scene timing + overlays
            ...(masterJson.scenes ? { scenes: masterJson.scenes } : {}),
        })

        const videoFilename = `PAM_${platform}_${date}_${topicSlug}_v1.mp4`
        const videoBlob = await uploadAsset(
            videoBuffer,
            `${blobFolder}/VIDEO_MP4/${videoFilename}`,
            "video/mp4"
        )
        console.log(`[video-renderer] Video uploaded: ${videoBlob.url}`)

        const assets: CallbackAsset[] = [
            {
                assetType: "AUDIO_MP3",
                platform: platform as CallbackAsset["platform"],
                storageUrl: audioBlob.url,
                storagePath: audioBlob.pathname,
                fileName: audioFilename,
                metadata: { voiceoverChars: voiceoverText.length },
            },
            {
                assetType: "VIDEO_MP4",
                platform: platform as CallbackAsset["platform"],
                storageUrl: videoBlob.url,
                storagePath: videoBlob.pathname,
                fileName: videoFilename,
            },
        ]

        await postCallback(callbackUrl, { renderJobId, secret: callbackSecret, assets, error: null })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[video-renderer] Job ${renderJobId} FAILED:`, message)
        await postCallback(callbackUrl, { renderJobId, secret: callbackSecret, assets: [], error: message })
            .catch((e) => console.error("[video-renderer] Callback failed:", e))
    }
})

const PORT = parseInt(process.env.PORT ?? "8080", 10)
app.listen(PORT, () => {
    console.log(`[video-renderer] Listening on port ${PORT}`)
})
