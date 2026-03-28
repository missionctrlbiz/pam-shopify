/**
 * POST /api/production/render-jobs/[id]/retry
 *
 * Re-queues a FAILED RenderJob using its stored inputPayload.
 * Dispatches via Trigger.dev tasks, with an inline fallback.
 * Marks any FAILED ContentAsset rows linked to the old job back to PENDING.
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import {
    runRepurposeInline,
    runCarouselInline,
    runVideoScriptInline,
    type RepurposeInlineInput,
} from "@/lib/production/repurposeInline"
import { AssetType, Platform } from "@/lib/enums"
import type {
    productionCarouselTask,
    productionRepurposeTask,
    productionVideoTask,
} from "@/trigger/production"

type ExistingAsset = {
    id: string
    assetType: AssetType
    platform: Platform
    fileName: string | null
}

// Inline Gemini call can take up to ~20 s; match the generate route timeout
export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: jobId } = await params

    // ------------------------------------------------------------------
    // Fetch original job
    // ------------------------------------------------------------------
    const { data: original, error: originalError } = await supabaseAdmin
        .from("render_jobs")
        .select(`*,
            contentIdea:content_ideas(
                id,
                calendarEntry:production_calendar_entries(id, publishStatus:publish_status)
            ),
            assets:content_assets(id, assetType:asset_type, platform, fileName:file_name)
        `)
        .eq("id", jobId)
        .maybeSingle()

    if (originalError) {
        console.error("[render-jobs:retry] Failed to fetch original job:", originalError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!original) {
        return NextResponse.json({ error: "RenderJob not found" }, { status: 404 })
    }

    if (original.status === "COMPLETE") {
        return NextResponse.json(
            { error: `Job is already COMPLETE — no need to retry` },
            { status: 409 }
        )
    }

    const calendarEntryId = original.contentIdea?.calendarEntry?.id
    if (!calendarEntryId) {
        return NextResponse.json(
            { error: "Render job is missing a linked calendar entry" },
            { status: 422 }
        )
    }


    // Trigger.dev when configured, otherwise inline fallback.
    const storedPayload = (original.inputPayload ?? {}) as Record<string, unknown>
    const triggerConfigured = Boolean(process.env.TRIGGER_SECRET_KEY)

    // ------------------------------------------------------------------
    // Create new RenderJob + asset placeholders (both paths need this)
    // ------------------------------------------------------------------
    const { data: newJob, error: newJobError } = await supabaseAdmin
        .from("render_jobs")
        .insert({
            content_idea_id: original.content_idea_id,
            job_type: original.job_type,
            status: "QUEUED",
            input_payload: storedPayload as object,
        })
        .select("id")
        .single()

    if (newJobError || !newJob) {
        console.error("[render-jobs:retry] Failed to create new job:", newJobError)
        return NextResponse.json({ error: "Failed to create retry job" }, { status: 500 })
    }

    // Re-create asset placeholders linked to new job
    const originalAssets = (original.assets ?? []) as ExistingAsset[]

    if (originalAssets.length > 0) {
        const placeholders = originalAssets.map((a) => ({
            content_idea_id: original.content_idea_id,
            render_job_id: newJob.id,
            asset_type: a.assetType,
            platform: a.platform,
            file_name: a.fileName ?? `retry_${newJob.id}`,
            status: "PENDING" as const,
        }))

        const { error: assetInsertError } = await supabaseAdmin
            .from("content_assets")
            .insert(placeholders)

        if (assetInsertError) {
            console.error("[render-jobs:retry] Failed to recreate assets:", assetInsertError)
            await supabaseAdmin.from("render_jobs").delete().eq("id", newJob.id)
            return NextResponse.json({ error: "Failed to recreate job assets" }, { status: 500 })
        }
    }

    // ------------------------------------------------------------------
    // Inline path — GCP not configured, run synchronously like generate route
    // ------------------------------------------------------------------
    if (!triggerConfigured) {
        const inlineInput = {
            renderJobId: newJob.id,
            contentIdeaId: original.content_idea_id,
            calendarEntryId,
            masterJson: (storedPayload.masterJson ?? {}) as Record<string, unknown>,
            platform: (storedPayload.platform as string) ?? "",
            postType: (storedPayload.postType as string) ?? "",
            topic: (storedPayload.topic as string) ?? "",
            entryDate: (storedPayload.entryDate as string) ?? new Date().toISOString(),
            voiceId: storedPayload.voiceId as string | undefined,
        }

        try {
            if (original.job_type === "REPURPOSE") {
                await runRepurposeInline(inlineInput)
            } else if (original.job_type === "CAROUSEL") {
                await runCarouselInline(inlineInput)
            } else if (original.job_type === "VIDEO" || original.job_type === "AUDIO") {
                await runVideoScriptInline(inlineInput)
            } else {
                return NextResponse.json(
                    { error: `Inline retry not supported for job type: ${original.job_type}` },
                    { status: 422 }
                )
            }
        } catch (err) {
            return NextResponse.json(
                { error: `Inline retry failed: ${(err as Error).message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            retried: true,
            originalJobId: jobId,
            newJobId: newJob.id,
            mode: "inline",
        })
    }

    try {
        const taskPayload: RepurposeInlineInput = {
            renderJobId: newJob.id,
            contentIdeaId: original.content_idea_id,
            calendarEntryId,
            masterJson: (storedPayload.masterJson ?? {}) as Record<string, unknown>,
            platform: (storedPayload.platform as string) ?? "",
            postType: (storedPayload.postType as string) ?? "",
            topic: (storedPayload.topic as string) ?? "",
            entryDate: (storedPayload.entryDate as string) ?? new Date().toISOString(),
            voiceId: storedPayload.voiceId as string | undefined,
        }

        let handle: { id: string }
        if (original.job_type === "REPURPOSE") {
            handle = await tasks.trigger<typeof productionRepurposeTask>("production-repurpose", taskPayload)
        } else if (original.job_type === "CAROUSEL") {
            handle = await tasks.trigger<typeof productionCarouselTask>("production-carousel", taskPayload)
        } else if (original.job_type === "VIDEO" || original.job_type === "AUDIO") {
            handle = await tasks.trigger<typeof productionVideoTask>("production-video", taskPayload)
        } else {
            return NextResponse.json(
                { error: `Trigger.dev retry not supported for job type: ${original.job_type}` },
                { status: 422 }
            )
        }

    } catch (err) {
        await supabaseAdmin
            .from("render_jobs")
            .update({ status: "FAILED", error_message: (err as Error).message })
            .eq("id", newJob.id)
        return NextResponse.json(
            { error: `Failed to trigger retry task: ${(err as Error).message}` },
            { status: 502 }
        )
    }

    // Bump calendar entry back to GENERATING
    const { error: statusError } = await supabaseAdmin
        .from("production_calendar_entries")
        .update({ publish_status: "GENERATING" })
        .eq("id", calendarEntryId)

    if (statusError) {
        console.error("[render-jobs:retry] Failed to mark entry GENERATING:", statusError)
    }

    return NextResponse.json({
        retried: true,
        originalJobId: jobId,
        newJobId: newJob.id,
    })
}
