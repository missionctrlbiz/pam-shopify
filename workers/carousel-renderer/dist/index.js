"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const renderer_1 = require("./renderer");
const upload_1 = require("./upload");
const types_1 = require("./types");
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "10mb" }));
// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/", (_req, res) => {
    res.json({ status: "ok", worker: "carousel-renderer" });
});
// ---------------------------------------------------------------------------
// Main render endpoint — called by GCP Cloud Tasks
// ---------------------------------------------------------------------------
app.post("/", async (req, res) => {
    const payload = req.body;
    const { renderJobId, contentIdeaId, masterJson, platform, topic, entryDate, callbackUrl, callbackSecret } = payload;
    console.log(`[carousel-renderer] Job ${renderJobId} started — platform: ${platform}, topic: ${topic}`);
    // Respond 200 immediately — Cloud Tasks marks task complete on 2xx
    // Actual work + callback happens asynchronously
    res.json({ accepted: true, renderJobId });
    try {
        // 1. Render 6 PNG slides via Puppeteer
        const slideBuffers = await (0, renderer_1.renderSlides)({
            slideTextBlocks: masterJson.slideTextBlocks,
            hook: masterJson.hook,
            cta: masterJson.cta,
            topic,
        });
        // 2. Upload to Vercel Blob
        const date = entryDate.slice(0, 10).replace(/-/g, "");
        const topicSlug = topic
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .slice(0, 3)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("");
        const uploadedAssets = await (0, upload_1.uploadSlides)(slideBuffers, `production/${contentIdeaId}/CAROUSEL_PNG`, `PAM_${platform}_${date}_${topicSlug}`, contentIdeaId);
        // 3. Build callback assets
        const assets = uploadedAssets.map((u) => ({
            assetType: "CAROUSEL_PNG",
            platform: platform,
            storageUrl: u.url,
            storagePath: u.pathname,
            fileName: u.filename,
            metadata: { slide: u.slideIndex, widthPx: 1080, heightPx: 1080 },
        }));
        console.log(`[carousel-renderer] Job ${renderJobId} complete — ${assets.length} slides uploaded`);
        // 4. Call back to Next.js
        await (0, types_1.postCallback)(callbackUrl, {
            renderJobId,
            secret: callbackSecret,
            assets,
            error: null,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[carousel-renderer] Job ${renderJobId} FAILED:`, message);
        await (0, types_1.postCallback)(callbackUrl, {
            renderJobId,
            secret: callbackSecret,
            assets: [],
            error: message,
        }).catch((cbErr) => console.error("[carousel-renderer] Callback failed:", cbErr));
    }
});
const PORT = parseInt(process.env.PORT ?? "8080", 10);
app.listen(PORT, () => {
    console.log(`[carousel-renderer] Listening on port ${PORT}`);
});
