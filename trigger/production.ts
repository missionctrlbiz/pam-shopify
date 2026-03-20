import { logger, task } from "@trigger.dev/sdk"
import { runCalendarGenerationBatch } from "../lib/production/calendarGeneration"
import {
    runCarouselInline,
    runRepurposeInline,
    runVideoScriptInline,
    type RepurposeInlineInput,
} from "../lib/production/repurposeInline"

export const productionRepurposeTask = task({
    id: "production-repurpose",
    maxDuration: 900,
    retry: {
        maxAttempts: 3,
    },
    run: async (payload: RepurposeInlineInput) => {
        logger.info("Starting repurpose task", {
            renderJobId: payload.renderJobId,
            contentIdeaId: payload.contentIdeaId,
        })

        await runRepurposeInline(payload)

        return {
            ok: true,
            renderJobId: payload.renderJobId,
        }
    },
})

export const productionCarouselTask = task({
    id: "production-carousel",
    maxDuration: 900,
    machine: "medium-1x",
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: RepurposeInlineInput) => {
        logger.info("Starting carousel task", {
            renderJobId: payload.renderJobId,
            contentIdeaId: payload.contentIdeaId,
        })

        await runCarouselInline(payload)

        return {
            ok: true,
            renderJobId: payload.renderJobId,
        }
    },
})

export const productionVideoTask = task({
    id: "production-video",
    maxDuration: 1800,
    machine: "large-1x",
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: RepurposeInlineInput) => {
        logger.info("Starting video task", {
            renderJobId: payload.renderJobId,
            contentIdeaId: payload.contentIdeaId,
            voiceId: payload.voiceId,
        })

        await runVideoScriptInline(payload)

        return {
            ok: true,
            renderJobId: payload.renderJobId,
        }
    },
})

export const productionCalendarBatchTask = task({
    id: "production-calendar-batch",
    maxDuration: 1800,
    retry: {
        maxAttempts: 2,
    },
    run: async (payload: {
        days: number
        offset: number
        overwrite: boolean
        startDate: string
        generatedById: string
    }) => {
        logger.info("Starting calendar batch task", payload)

        const result = await runCalendarGenerationBatch(payload)

        logger.info("Completed calendar batch task", {
            generated: result.generated,
            failed: result.failed,
            entries: result.entries,
            errors: result.errors,
        })

        return result
    },
})