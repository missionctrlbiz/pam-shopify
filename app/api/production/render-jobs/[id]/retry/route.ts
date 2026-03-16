/**
 * POST /api/production/render-jobs/[id]/retry
 *
 * Re-queues a FAILED RenderJob using its stored inputPayload.
 * Creates a fresh RenderJob row and re-enqueues to Cloud Tasks.
 * Marks any FAILED ContentAsset rows linked to the old job back to PENDING.
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { runRepurposeInline, runCarouselInline, runVideoScriptInline } from "@/lib/production/repurposeInline"
import { AssetType, Platform } from "@/lib/enums"

type ExistingAsset = {
    id: string
    assetType: AssetType
    platform: Platform
    fileName: string | null
}

// Inline Gemini call can take up to ~20 s; match the generate route timeout
export const maxDuration = 60
// GCP / Cloud Tasks — DISABLED during Railway migration.
// ---------------------------------------------------------------------------
async function getTasksClient() {
    const { CloudTasksClient } = await import("@google-cloud/tasks")
    const b64 = process.env.GCP_SERVICE_ACCOUNT_JSON_B64?.trim()
    if (b64) {
        const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"))
        return new CloudTasksClient({ credentials })
    }
    return new CloudTasksClient()
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: jobId } = await params

    // Worker URL map — kept for Railway restoration; unused while gcpConfigured=false
    const WORKER_URLS: Record<string, string | undefined> = {
        CAROUSEL: process.env.CAROUSEL_RENDERER_URL?.trim(),
        VIDEO: process.env.VIDEO_RENDERER_URL?.trim(),
        AUDIO: process.env.VIDEO_RENDERER_URL?.trim(),
        REPURPOSE: process.env.REPURPOSE_WORKER_URL?.trim(),
    }

    // ------------------------------------------------------------------
    // Fetch original job
    // ------------------------------------------------------------------
    const { data: original, error: originalError } = await supabaseAdmin
        .from("render_jobs")
        .select(`*,
            contentIdea:content_ideas(
                id,
                calendarEntry:production_calendar_entries(id, publishStatus)
            ),
            assets:content_assets(id, assetType, platform, fileName)
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



    // GCP/Cloud Tasks disabled — Railway migration in progress. All retries run inline.
    const storedPayload = (original.inputPayload ?? {}) as Record<string, unknown>
    const gcpConfigured = process.env.ENABLE_GCP_TASKS === "true" && !!process.env.WORKER_SA_EMAIL
    const workerUrl = WORKER_URLS[original.jobType]

    const host = _req.headers.get("x-forwarded-host") || _req.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`
    const callbackUrl = `${baseUrl}/api/production/render-done`
    const callbackSecret = (process.env.RENDER_CALLBACK_SECRET ?? "").trim()

    // ------------------------------------------------------------------
    // Create new RenderJob + asset placeholders (both paths need this)
    // ------------------------------------------------------------------
    const { data: newJob, error: newJobError } = await supabaseAdmin
        .from("render_jobs")
        .insert({
            contentIdeaId: original.contentIdeaId,
            jobType: original.jobType,
            status: "QUEUED",
            inputPayload: storedPayload as object,
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
            contentIdeaId: original.contentIdeaId,
            renderJobId: newJob.id,
            assetType: a.assetType,
            platform: a.platform,
            fileName: a.fileName ?? `retry_${newJob.id}`,
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
    if (!gcpConfigured) {
        const inlineInput = {
            renderJobId: newJob.id,
            contentIdeaId: original.contentIdeaId,
            calendarEntryId,
            masterJson: (storedPayload.masterJson ?? {}) as Record<string, unknown>,
            platform: (storedPayload.platform as string) ?? "",
            postType: (storedPayload.postType as string) ?? "",
            topic: (storedPayload.topic as string) ?? "",
            entryDate: (storedPayload.entryDate as string) ?? new Date().toISOString(),
            voiceId: storedPayload.voiceId as string | undefined,
        }

        try {
            if (original.jobType === "REPURPOSE") {
                await runRepurposeInline(inlineInput)
            } else if (original.jobType === "CAROUSEL") {
                await runCarouselInline(inlineInput)
            } else if (original.jobType === "VIDEO" || original.jobType === "AUDIO") {
                await runVideoScriptInline(inlineInput)
            } else {
                return NextResponse.json(
                    { error: `Inline retry not supported for job type: ${original.jobType}` },
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

    // ------------------------------------------------------------------
    // Cloud Tasks enqueue — DISABLED (gcpConfigured is always false during Railway migration)
    // TODO (Railway): restore this block, replacing getTasksClient() with dispatchToWorker()
    // ------------------------------------------------------------------
    try {
        const tasks = await getTasksClient()
        const projectId = process.env.GCP_PROJECT_ID!.trim()
        const location = (process.env.GCP_LOCATION ?? "us-central1").trim()
        const queue = (process.env.CLOUD_TASKS_QUEUE ?? "pam-render-queue").trim()
        const saEmail = process.env.WORKER_SA_EMAIL!.trim()
        const parent = tasks.queuePath(projectId, location, queue)

        const [task] = await tasks.createTask({
            parent,
            task: {
                httpRequest: {
                    httpMethod: "POST",
                    url: workerUrl,
                    body: Buffer.from(JSON.stringify({
                        ...storedPayload,
                        renderJobId: newJob.id,
                        callbackUrl,
                        callbackSecret,
                    })),
                    headers: { "Content-Type": "application/json" },
                    oidcToken: { serviceAccountEmail: saEmail, audience: workerUrl },
                },
            },
        })
        const { error: taskUpdateError } = await supabaseAdmin
            .from("render_jobs")
            .update({ cloudTasksTaskId: task.name ?? "" })
            .eq("id", newJob.id)

        if (taskUpdateError) {
            console.error("[render-jobs:retry] Failed to save Cloud Task id:", taskUpdateError)
        }
    } catch (err) {
        await supabaseAdmin
            .from("render_jobs")
            .update({ status: "FAILED", errorMessage: (err as Error).message })
            .eq("id", newJob.id)
        return NextResponse.json(
            { error: `Failed to enqueue task: ${(err as Error).message}` },
            { status: 502 }
        )
    }

    // Bump calendar entry back to GENERATING
    const { error: statusError } = await supabaseAdmin
        .from("production_calendar_entries")
        .update({ publishStatus: "GENERATING" })
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
