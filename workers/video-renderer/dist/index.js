"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const elevenLabs_1 = require("./elevenLabs");
const remotion_1 = require("./remotion");
const upload_1 = require("./upload");
const types_1 = require("./types");
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "10mb" }));
app.get("/", (_req, res) => {
    res.json({ status: "ok", worker: "video-renderer" });
});
app.post("/", async (req, res) => {
    const payload = req.body;
    const { renderJobId, contentIdeaId, masterJson, platform, topic, entryDate, callbackUrl, callbackSecret } = payload;
    const voiceId = payload.voiceId; // undefined → generateAudio falls back to default
    console.log(`[video-renderer] Job ${renderJobId} started — topic: ${topic}`);
    res.json({ accepted: true, renderJobId });
    try {
        const date = entryDate.slice(0, 10).replace(/-/g, "");
        const topicSlug = topic
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .slice(0, 3)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("");
        const blobFolder = `production/${contentIdeaId}`;
        // Build voiceover text — prefer scene-director's full script (includes ESL cues),
        // else assemble from flat masterJson fields. ESL markers are stripped inside generateAudio.
        const voiceoverText = masterJson.voiceoverFull ?? [
            masterJson.hook,
            ...masterJson.teachingPoints,
            masterJson.cta,
        ].join(". ");
        // 1. Generate audio via ElevenLabs
        console.log(`[video-renderer] Generating audio for job ${renderJobId}`);
        const audioBuffer = await (0, elevenLabs_1.generateAudio)(voiceoverText, voiceId);
        const audioFilename = `PAM_${platform}_${date}_${topicSlug}_v1.mp3`;
        const audioBlob = await (0, upload_1.uploadAsset)(audioBuffer, `${blobFolder}/AUDIO_MP3/${audioFilename}`, "audio/mpeg");
        console.log(`[video-renderer] Audio uploaded: ${audioBlob.url}`);
        // 2. Render video via Remotion
        console.log(`[video-renderer] Rendering video for job ${renderJobId}`);
        const videoBuffer = await (0, remotion_1.renderVideo)({
            hook: masterJson.hook,
            teachingPoints: masterJson.teachingPoints,
            cta: masterJson.cta,
            audioUrl: audioBlob.url,
            topic,
            // Use scene-director scenes when available for per-scene timing + overlays
            ...(masterJson.scenes ? { scenes: masterJson.scenes } : {}),
        });
        const videoFilename = `PAM_${platform}_${date}_${topicSlug}_v1.mp4`;
        const videoBlob = await (0, upload_1.uploadAsset)(videoBuffer, `${blobFolder}/VIDEO_MP4/${videoFilename}`, "video/mp4");
        console.log(`[video-renderer] Video uploaded: ${videoBlob.url}`);
        const assets = [
            {
                assetType: "AUDIO_MP3",
                platform: platform,
                storageUrl: audioBlob.url,
                storagePath: audioBlob.pathname,
                fileName: audioFilename,
                metadata: { voiceoverChars: voiceoverText.length },
            },
            {
                assetType: "VIDEO_MP4",
                platform: platform,
                storageUrl: videoBlob.url,
                storagePath: videoBlob.pathname,
                fileName: videoFilename,
            },
        ];
        await (0, types_1.postCallback)(callbackUrl, { renderJobId, secret: callbackSecret, assets, error: null });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[video-renderer] Job ${renderJobId} FAILED:`, message);
        let dirContentBrief = "";
        try {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const path = await Promise.resolve().then(() => __importStar(require("path")));
            const testPath = process.env.REMOTION_BUNDLE_PATH || "/app/dist/bundle";
            if (fs.existsSync(testPath)) {
                const files = fs.readdirSync(testPath);
                dirContentBrief = ` (Files found inside ${testPath}: [${files.join(", ")}])`;
            }
            else {
                dirContentBrief = ` (Directory ${testPath} does not exist entirely)`;
            }
        }
        catch (dirErr) {
            dirContentBrief = ` (Failed to read dir: ${dirErr.message})`;
        }
        const finalError = `${message}${dirContentBrief}`;
        await (0, types_1.postCallback)(callbackUrl, { renderJobId, secret: callbackSecret, assets: [], error: finalError })
            .catch((e) => console.error("[video-renderer] Callback failed:", e));
    }
});
const PORT = parseInt(process.env.PORT ?? "8080", 10);
app.listen(PORT, () => {
    console.log(`[video-renderer] Listening on port ${PORT}`);
});
