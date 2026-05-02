import { logger, task } from "@trigger.dev/sdk"
import { runStudioExportPackage, type StudioExportPackageInput } from "../lib/studio/exportPackage"

export const studioExportPackageTask = task({
    id: "studio-export-package",
    maxDuration: 600,
    machine: "medium-1x",
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: StudioExportPackageInput, { ctx }) => {
        const payloadWithRunContext: StudioExportPackageInput = {
            ...payload,
            exportJobId: payload.exportJobId ?? ctx.run.id,
            requestedAt: payload.requestedAt ?? ctx.run.createdAt.toISOString(),
        }

        logger.info("Starting studio package export", {
            packageId: payloadWithRunContext.packageId,
            exportJobId: payloadWithRunContext.exportJobId,
            ratios: payloadWithRunContext.ratios,
            mode: payloadWithRunContext.mode,
        })

        const assets = await runStudioExportPackage(payloadWithRunContext)

        logger.info("Completed studio package export", {
            packageId: payloadWithRunContext.packageId,
            exportJobId: payloadWithRunContext.exportJobId,
            assets: assets.length,
        })

        return {
            ok: true,
            packageId: payloadWithRunContext.packageId,
            exportJobId: payloadWithRunContext.exportJobId,
            assets,
        }
    },
})
