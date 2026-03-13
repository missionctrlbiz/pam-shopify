/**
 * Remotion composition entry point.
 *
 * This file is the `serveUrl` target bundled via:
 *   npx remotion bundle remotion-src/index.tsx --out dist/bundle
 *
 * The bundle is then served by @remotion/renderer during video rendering.
 * The composition ID "PAMVideo" must match what selectComposition() uses
 * in workers/video-renderer/src/remotion.ts
 */
import { registerRoot } from "remotion"
import { RemotionRoot } from "./Root"

registerRoot(RemotionRoot)
