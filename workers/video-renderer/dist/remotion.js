"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderVideo = renderVideo;
const renderer_1 = require("@remotion/renderer");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
/**
 * Renders a PAM educational video using Remotion.
 *
 * SETUP REQUIRED:
 *   1. Create a Remotion composition project at workers/video-renderer/remotion-src/
 *   2. Bundle it: `npx remotion bundle remotion-src/index.ts --out dist/bundle`
 *   3. Set REMOTION_BUNDLE_PATH=/app/dist/bundle in the container env
 *      OR use a pre-bundled URL via REMOTION_BUNDLE_URL
 *
 * The composition ID is "PAMVideo" — must match the <Composition id="PAMVideo" ...>
 * declaration in remotion-src/index.ts
 */
async function renderVideo(input) {
    const bundlePath = process.env.REMOTION_BUNDLE_PATH;
    const bundleUrl = process.env.REMOTION_BUNDLE_URL;
    const serveUrl = bundleUrl ?? bundlePath;
    if (!serveUrl) {
        throw new Error("REMOTION_BUNDLE_PATH or REMOTION_BUNDLE_URL must be set. " +
            "Run: npx remotion bundle remotion-src/index.ts --out dist/bundle");
    }
    const inputProps = {
        hook: input.hook,
        teachingPoints: input.teachingPoints,
        cta: input.cta,
        audioUrl: input.audioUrl,
        topic: input.topic,
        // Pass scene-director data when available — drives per-scene timing + overlays
        ...(input.scenes && input.scenes.length > 0 ? { scenes: input.scenes } : {}),
    };
    // Select the composition to get its metadata (fps, durationInFrames, etc.)
    const composition = await (0, renderer_1.selectComposition)({
        serveUrl,
        id: "PAMVideo",
        inputProps,
    });
    // Render to a temp file then read into buffer
    const tmpFile = path_1.default.join(os_1.default.tmpdir(), `pam-video-${Date.now()}.mp4`);
    await (0, renderer_1.renderMedia)({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: tmpFile,
        inputProps,
        chromiumOptions: {
            disableWebSecurity: true, // needed for loading fonts from CDN
        },
        timeoutInMilliseconds: 600000, // 10 min — video rendering can be slow
    });
    const buffer = fs_1.default.readFileSync(tmpFile);
    fs_1.default.unlinkSync(tmpFile); // clean up temp file
    return buffer;
}
