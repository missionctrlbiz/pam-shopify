/**
 * POST /api/production/assets/generate
 *
 * Triggers asset generation for an APPROVED ProductionCalendarEntry.
 * GCP / Cloud Tasks dispatch is currently disabled during the Trigger.dev migration.
 * For now, assets run through the inline path only.
 *
 * Body params:
 *   contentIdeaId — required. The ContentIdea of the approved entry.
 *
 * Worker dispatch logic (based on postType):
 *   CAROUSEL              → carousel-renderer + repurpose-worker
 *   VIDEO / REEL          → video-renderer + repurpose-worker
 *   TEXT_POST / STORY     → repurpose-worker only
 *   EMAIL_LESSON          → repurpose-worker only
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { AssetType, Platform, RenderJobType } from "@/lib/enums"
import {
    runRepurposeInline,
    runCarouselInline,
    runVideoScriptInline,
    type RepurposeInlineInput,
} from "@/lib/production/repurposeInline"
import type {
    productionCarouselTask,
    productionRepurposeTask,
    productionVideoTask,
} from "@/trigger/production"

// Vercel Pro: allow up to 60 s (inline Gemini call ~10–20 s)
export const maxDuration = 60
export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// GCP / Cloud Tasks integration is intentionally commented out while we move
// background execution over to Trigger.dev.
// ---------------------------------------------------------------------------
// async function getTasksClient() {
//     const { CloudTasksClient } = await import("@google-cloud/tasks")
//     const b64 = process.env.GCP_SERVICE_ACCOUNT_JSON_B64?.trim()
//     if (b64) {
//         const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"))
//         return new CloudTasksClient({ credentials })
//     }
//     return new CloudTasksClient()
// }
//
// async function enqueueTask(workerUrl: string, payload: Record<string, unknown>): Promise<string> {
//     const client = await getTasksClient()
//     const projectId = process.env.GCP_PROJECT_ID!.trim()
//     const location = (process.env.GCP_LOCATION ?? "us-central1").trim()
//     const queue = (process.env.CLOUD_TASKS_QUEUE ?? "pam-render-queue").trim()
//     const saEmail = process.env.WORKER_SA_EMAIL!.trim()
//     const parent = client.queuePath(projectId, location, queue)
//     const [task] = await client.createTask({
//         parent,
//         task: {
//             httpRequest: {
//                 httpMethod: "POST",
//                 url: workerUrl,
//                 body: Buffer.from(JSON.stringify(payload)),
//                 headers: { "Content-Type": "application/json" },
//                 oidcToken: { serviceAccountEmail: saEmail, audience: workerUrl },
//             },
//         },
//     })
//     return task.name ?? ""
// }

// TODO (Railway): uncomment and use instead of gcpConfigured=false:
// async function dispatchToWorker(payload: Record<string, unknown>): Promise<void> {
//     const res = await fetch(process.env.WORKER_SERVER_URL!, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", "X-Worker-Secret": process.env.WORKER_AUTH_SECRET! },
//         body: JSON.stringify(payload),
//     })
//     if (!res.ok) throw new Error(`Worker rejected job: ${res.status}`)
// }

// ---------------------------------------------------------------------------
// Asset type map per worker
// ---------------------------------------------------------------------------

const REPURPOSE_ASSET_TYPES: Array<{ assetType: AssetType; platform: Platform }> = [
    { assetType: "TEXT_POST", platform: "IG" },
    { assetType: "TEXT_POST", platform: "FB" },
    { assetType: "TEXT_POST", platform: "TIKTOK" },
    { assetType: "TEXT_POST", platform: "LINKEDIN" },
    { assetType: "EMAIL_HTML", platform: "EMAIL" },
]

// ---------------------------------------------------------------------------
// Worker URL env mappings are commented out while external GCP workers remain
// disabled for the Trigger.dev migration.
// ---------------------------------------------------------------------------
// const WORKER_URLS: Record<string, string | undefined> = {
//     CAROUSEL_RENDERER_URL: process.env.CAROUSEL_RENDERER_URL,
//     REPURPOSE_WORKER_URL: process.env.REPURPOSE_WORKER_URL,
//     VIDEO_RENDERER_URL: process.env.VIDEO_RENDERER_URL,
// }

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json() as { contentIdeaId?: string; voiceId?: string; scope?: string }
        const { contentIdeaId, voiceId } = body

        if (!contentIdeaId || typeof contentIdeaId !== "string") {
            return NextResponse.json(
                { error: "contentIdeaId is required" },
                { status: 400 }
            )
        }

        const { data: idea, error: ideaError } = await supabaseAdmin
            .from("content_ideas")
            .select(`
                id,
                masterJson:master_json,
                calendarEntry:production_calendar_entries(
                    id,
                    entryDate:entry_date,
                    publishStatus:publish_status,
                    platform,
                    postType:post_type,
                    topic
                )
            `)
            .eq("id", contentIdeaId)
            .maybeSingle()

        if (ideaError) {
            console.error("[assets/generate] Failed to fetch content idea:", ideaError)
            return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }

        if (!idea) {
            return NextResponse.json(
                { error: `ContentIdea not found: ${contentIdeaId}` },
                { status: 404 }
            )
        }

        const entry = (Array.isArray(idea.calendarEntry) ? idea.calendarEntry[0] : idea.calendarEntry) as {
            id: string
            entryDate: string
            publishStatus: string
            platform: Platform
            postType: string
            topic: string
        } | null

        if (!entry) {
            return NextResponse.json(
                { error: `ContentIdea ${contentIdeaId} has no linked calendar entry` },
                { status: 422 }
            )
        }

        if (!["APPROVED", "GENERATING"].includes(entry.publishStatus)) {
            return NextResponse.json(
                {
                    error: `Entry must be APPROVED or GENERATING before generating assets. Current: ${entry.publishStatus}`,
                },
                { status: 409 }
            )
        }

        const master = idea.masterJson as Record<string, unknown>
        const entryDateIso = new Date(entry.entryDate).toISOString()

        const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000"
        const protocol = host.includes("localhost") ? "http" : "https"
        const baseUrl = `${protocol}://${host}`
        // const callbackUrl = `${baseUrl}/api/production/render-done`
        // const callbackSecret = (process.env.RENDER_CALLBACK_SECRET ?? "").trim()

        const triggerConfigured = Boolean(process.env.TRIGGER_SECRET_KEY)
        const jobs: Array<{ jobType: RenderJobType; taskId: string; renderJobId: string }> = []
        const errors: string[] = []

        // Deduplicate jobs by checking if COMPLETE assets already exist for this contentIdeaId
        const { data: existingAssets } = await supabaseAdmin
            .from("content_assets")
            .select("asset_type")
            .eq("content_idea_id", contentIdeaId)
            .eq("status", "COMPLETE")

        const completedTypes = new Set(existingAssets?.map(a => a.asset_type) || [])

        // Determine which workers to run (skip if already COMPLETE)
        const needsCarousel = ["CAROUSEL"].includes(entry.postType) && !completedTypes.has("CAROUSEL_PNG")
        const needsVideo = ["VIDEO", "REEL"].includes(entry.postType) && !completedTypes.has("VIDEO_MP4")
        const needsRepurpose = !completedTypes.has("TEXT_POST") || !completedTypes.has("EMAIL_HTML")

        if (!needsCarousel && !needsVideo && !needsRepurpose) {
            return NextResponse.json(
                { message: "All assets are already marked as COMPLETE. No rendering queued." },
                { status: 200 }
            )
        }

        // ------------------------------------------------------------------
        // Helper: create RenderJob row + (optionally) enqueue task
        // Returns the created renderJobId.
        // ------------------------------------------------------------------
        const dispatch = async (
            jobType: RenderJobType,
            assetTypes: Array<{ assetType: AssetType; platform: Platform }>,
            extraPayload: Record<string, unknown> = {}
        ): Promise<string> => {

            const payload = {
                contentIdeaId,
                masterJson: master,
                platform: entry.platform,
                postType: entry.postType,
                topic: entry.topic,
                entryDate: entryDateIso,
                ...extraPayload,
            }

            const { data: renderJob, error: renderJobError } = await supabaseAdmin
                .from("render_jobs")
                .insert({
                    content_idea_id: contentIdeaId,
                    job_type: jobType,
                    status: "QUEUED",
                    input_payload: payload as object,
                })
                .select("id")
                .single()

            if (renderJobError || !renderJob) {
                throw new Error(`Failed to create ${jobType} job: ${renderJobError?.message ?? "unknown error"}`)
            }

            const placeholders = assetTypes.map(({ assetType, platform }) => ({
                content_idea_id: contentIdeaId,
                platform,
                asset_type: assetType,
                render_job_id: renderJob.id,
                file_name: buildFileName(platform, entryDateIso, entry.topic, assetType, 1),
                status: "PENDING" as const,
            }))

            if (placeholders.length > 0) {
                const { error: assetInsertError } = await supabaseAdmin
                    .from("content_assets")
                    .insert(placeholders)

                if (assetInsertError) {
                    await supabaseAdmin.from("render_jobs").delete().eq("id", renderJob.id)
                    throw new Error(`Failed to create asset placeholders for ${jobType}: ${assetInsertError.message}`)
                }
            }

            if (!triggerConfigured) {
                jobs.push({ jobType, taskId: "inline", renderJobId: renderJob.id })
                return renderJob.id
            }

            try {
                const taskPayload: RepurposeInlineInput = {
                    renderJobId: renderJob.id,
                    contentIdeaId,
                    calendarEntryId: entry.id,
                    masterJson: master,
                    platform: entry.platform,
                    postType: entry.postType,
                    topic: entry.topic,
                    entryDate: entryDateIso,
                    voiceId: typeof extraPayload.voiceId === "string" ? extraPayload.voiceId : undefined,
                }

                let handle: { id: string }
                if (jobType === "CAROUSEL") {
                    handle = await tasks.trigger<typeof productionCarouselTask>("production-carousel", taskPayload)
                } else if (jobType === "REPURPOSE") {
                    handle = await tasks.trigger<typeof productionRepurposeTask>("production-repurpose", taskPayload)
                } else {
                    handle = await tasks.trigger<typeof productionVideoTask>("production-video", taskPayload)
                }

                jobs.push({ jobType, taskId: handle.id, renderJobId: renderJob.id })
            } catch (err) {
                errors.push(`Failed to trigger ${jobType}: ${(err as Error).message}`)
                await supabaseAdmin
                    .from("render_jobs")
                    .update({ status: "FAILED", error_message: (err as Error).message })
                    .eq("id", renderJob.id)
            }

            return renderJob.id
        }

        if (needsCarousel) {
            const carouselJobId = await dispatch("CAROUSEL", [
                { assetType: "CAROUSEL_PNG", platform: entry.platform },
            ])
            if (!triggerConfigured) {
                try {
                    await runCarouselInline({
                        renderJobId: carouselJobId,
                        contentIdeaId,
                        calendarEntryId: entry.id,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entryDateIso,
                    })
                    const j = jobs.find(j => j.renderJobId === carouselJobId)
                    if (j) j.taskId = "inline-complete"
                } catch (e) {
                    errors.push(`Inline carousel failed: ${(e as Error).message}`)
                }
            }
        }

        if (needsRepurpose) {
            const repurposeJobId = await dispatch("REPURPOSE", REPURPOSE_ASSET_TYPES)
            if (!triggerConfigured) {
                try {
                    await runRepurposeInline({
                        renderJobId: repurposeJobId,
                        contentIdeaId,
                        calendarEntryId: entry.id,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entryDateIso,
                    })
                    // Update the job record in our local list to reflect completion
                    const j = jobs.find(j => j.renderJobId === repurposeJobId)
                    if (j) j.taskId = "inline-complete"
                } catch (e) {
                    errors.push(`Inline repurpose failed: ${(e as Error).message}`)
                }
            }
        }

        if (needsVideo) {
            const videoJobId = await dispatch("VIDEO", [
                { assetType: "VIDEO_SCRIPT_JSON", platform: entry.platform },
                { assetType: "AUDIO_MP3", platform: entry.platform },
                { assetType: "VIDEO_MP4", platform: entry.platform },
            ], {
                voiceId: voiceId ?? null,
            })
            if (!triggerConfigured) {
                try {
                    await runVideoScriptInline({
                        renderJobId: videoJobId,
                        contentIdeaId,
                        calendarEntryId: entry.id,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entryDateIso,
                        voiceId: voiceId ?? undefined,
                    })
                    const j = jobs.find(j => j.renderJobId === videoJobId)
                    if (j) j.taskId = "inline-complete"
                } catch (e) {
                    errors.push(`Inline video script failed: ${(e as Error).message}`)
                }
            }
        }

        // Transition entry to GENERATING only if there are still-running async jobs.
        // Inline jobs (taskId="inline-complete") already completed and set entry to APPROVED
        // via runRepurposeInline — don't overwrite that.
        const hasAsyncJobs = jobs.some(j => j.taskId !== "inline-complete")
        if (jobs.length > 0 && hasAsyncJobs) {
            const { error: statusError } = await supabaseAdmin
                .from("production_calendar_entries")
                .update({ publish_status: "GENERATING" })
                .eq("id", entry.id)

            if (statusError) {
                console.error("[assets/generate] Failed to move entry to GENERATING:", statusError)
            }
        }

        return NextResponse.json(
            {
                queued: jobs.length,
                jobs,
                errors: errors.length > 0 ? errors : undefined,
            },
            { status: 202 }
        )
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[assets/generate] Unhandled error:", err)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFileName(
    platform: string,
    entryDateIso: string,
    topic: string,
    assetType: AssetType,
    version: number
): string {
    const date = new Date(entryDateIso).toISOString().slice(0, 10).replace(/-/g, "")
    const topicSlug = topic
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(" ")
        .slice(0, 3)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("")

    const extMap: Record<AssetType, string> = {
        CAROUSEL_PNG: "png",
        VIDEO_MP4: "mp4",
        TEXT_POST: "txt",
        EMAIL_HTML: "html",
        AUDIO_MP3: "mp3",
        VIDEO_SCRIPT_JSON: "json",
    }

    return `PAM_${platform}_${date}_${topicSlug}_v${version}.${extMap[assetType]}`
}
