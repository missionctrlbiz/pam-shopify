import { defineConfig } from "@trigger.dev/sdk"
import { puppeteer } from "@trigger.dev/build/extensions/puppeteer"

export default defineConfig({
    project: process.env.TRIGGER_PROJECT_REF ?? "",
    dirs: ["./trigger"],
    maxDuration: 1800,
    retries: {
        enabledInDev: false,
        default: {
            maxAttempts: 3,
            minTimeoutInMs: 1000,
            maxTimeoutInMs: 10000,
            factor: 2,
            randomize: true,
        },
    },
    additionalFiles: ["./workers/video-renderer/build/**/*"],
    build: {
        extensions: [puppeteer()]
    }
})