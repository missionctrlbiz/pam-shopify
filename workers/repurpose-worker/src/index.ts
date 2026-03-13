import express, { Request, Response } from "express"
import { generateRepurposedContent } from "./repurposingRouter"
import { storeTextAssets } from "./upload"
import { RenderPayload, CallbackAsset, postCallback } from "./types"

const app = express()
app.use(express.json({ limit: "10mb" }))

app.get("/", (_req: Request, res: Response) => {
    res.json({ status: "ok", worker: "repurpose-worker" })
})

app.post("/", async (req: Request, res: Response) => {
    const payload = req.body as RenderPayload
    const { renderJobId, contentIdeaId, masterJson, platform, postType, topic, entryDate, callbackUrl, callbackSecret } = payload

    console.log(`[repurpose-worker] Job ${renderJobId} started — topic: ${topic}`)

    res.json({ accepted: true, renderJobId })

    try {
        // 1. Generate all 5 platform captions via Gemini
        const captions = await generateRepurposedContent({
            hook: masterJson.hook,
            teachingPoints: masterJson.teachingPoints,
            cta: masterJson.cta,
            clinicalGrounding: masterJson.clinicalGrounding,
            platform,
            postType,
            topic,
            entryDate,
        })

        const date = entryDate.slice(0, 10).replace(/-/g, "")
        const topicSlug = topic
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .slice(0, 3)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("")

        // 2. Store each text variant to Vercel Blob
        const stored = await storeTextAssets(
            [
                { text: `${captions.ig.caption}\n\n${captions.ig.hashtagBlock}`, platform: "IG", ext: "txt" },
                { text: `${captions.fb.caption}\n\n${captions.fb.hashtagBlock}`, platform: "FB", ext: "txt" },
                { text: captions.tiktok.script + `\n\n${captions.tiktok.hashtagBlock}`, platform: "TIKTOK", ext: "txt" },
                { text: captions.linkedin.post, platform: "LINKEDIN", ext: "txt" },
                {
                    text: `Subject: ${captions.email.subjectLine}\nPreview: ${captions.email.previewText}\n\n${captions.email.body}`,
                    platform: "EMAIL",
                    ext: "html",
                },
            ],
            `production/${contentIdeaId}/TEXT_POST`,
            `PAM`,
            date,
            topicSlug
        )

        const assets: CallbackAsset[] = stored.map((s) => ({
            assetType: s.platform === "EMAIL" ? "EMAIL_HTML" as const : "TEXT_POST" as const,
            platform: s.platform as CallbackAsset["platform"],
            storageUrl: s.url,
            storagePath: s.pathname,
            fileName: s.filename,
        }))

        console.log(`[repurpose-worker] Job ${renderJobId} complete — ${assets.length} text assets stored`)

        await postCallback(callbackUrl, { renderJobId, secret: callbackSecret, assets, error: null })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[repurpose-worker] Job ${renderJobId} FAILED:`, message)
        await postCallback(callbackUrl, { renderJobId, secret: callbackSecret, assets: [], error: message })
            .catch((e) => console.error("[repurpose-worker] Callback failed:", e))
    }
})

const PORT = parseInt(process.env.PORT ?? "8080", 10)
app.listen(PORT, () => {
    console.log(`[repurpose-worker] Listening on port ${PORT}`)
})
