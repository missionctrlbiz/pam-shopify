import express, { Request, Response } from "express"
import { renderSlides } from "./renderer"
import { uploadSlides } from "./upload"
import { RenderPayload, CallbackAsset, postCallback } from "./types"

const app = express()
app.use(express.json({ limit: "10mb" }))

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/", (_req: Request, res: Response) => {
    res.json({ status: "ok", worker: "carousel-renderer" })
})

// ---------------------------------------------------------------------------
// Main render endpoint — called by GCP Cloud Tasks
// ---------------------------------------------------------------------------
app.post("/", async (req: Request, res: Response) => {
    const payload = req.body as RenderPayload

    const { renderJobId, contentIdeaId, masterJson, platform, topic, entryDate, callbackUrl, callbackSecret } = payload

    console.log(`[carousel-renderer] Job ${renderJobId} started — platform: ${platform}, topic: ${topic}`)

    // Respond 200 immediately — Cloud Tasks marks task complete on 2xx
    // Actual work + callback happens asynchronously
    res.json({ accepted: true, renderJobId })

    try {
        // 1. Render 6 PNG slides via Puppeteer
        const slideBuffers = await renderSlides({
            slideTextBlocks: masterJson.slideTextBlocks,
            hook: masterJson.hook,
            cta: masterJson.cta,
            topic,
        })

        // 2. Upload to Vercel Blob
        const date = entryDate.slice(0, 10).replace(/-/g, "")
        const topicSlug = topic
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .slice(0, 3)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("")

        const uploadedAssets = await uploadSlides(
            slideBuffers,
            `production/${contentIdeaId}/CAROUSEL_PNG`,
            `PAM_${platform}_${date}_${topicSlug}`,
            contentIdeaId
        )

        // 3. Build callback assets
        const assets: CallbackAsset[] = uploadedAssets.map((u) => ({
            assetType: "CAROUSEL_PNG" as const,
            platform: platform as CallbackAsset["platform"],
            storageUrl: u.url,
            storagePath: u.pathname,
            fileName: u.filename,
            metadata: { slide: u.slideIndex, widthPx: 1080, heightPx: 1080 },
        }))

        console.log(`[carousel-renderer] Job ${renderJobId} complete — ${assets.length} slides uploaded`)

        // 4. Call back to Next.js
        await postCallback(callbackUrl, {
            renderJobId,
            secret: callbackSecret,
            assets,
            error: null,
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[carousel-renderer] Job ${renderJobId} FAILED:`, message)

        await postCallback(callbackUrl, {
            renderJobId,
            secret: callbackSecret,
            assets: [],
            error: message,
        }).catch((cbErr) =>
            console.error("[carousel-renderer] Callback failed:", cbErr)
        )
    }
})

const PORT = parseInt(process.env.PORT ?? "8080", 10)
app.listen(PORT, () => {
    console.log(`[carousel-renderer] Listening on port ${PORT}`)
})
