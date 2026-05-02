import { logger, task } from "@trigger.dev/sdk"
import { runStudioExportPackage, type StudioExportPackageInput } from "../lib/studio/exportPackage"

export const studioExportPackageTask = task({
    id: "studio-export-package",
    maxDuration: 600,
    machine: "medium-1x",
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: StudioExportPackageInput) => {
        logger.info("Starting studio package export", {
            packageId: payload.packageId,
            ratios: payload.ratios,
            mode: payload.mode,
        })

        const assets = await runStudioExportPackage(payload)

        logger.info("Completed studio package export", {
            packageId: payload.packageId,
            assets: assets.length,
        })

        return {
            ok: true,
            packageId: payload.packageId,
            assets,
        }
    },
})
