/**
 * POST /api/production/assets/generate
 *
 * Triggers asset generation for an APPROVED ProductionCalendarEntry.
 * When GCP_SERVICE_ACCOUNT_JSON_B64 is set, enqueues to Cloud Tasks → Cloud Run workers.
 * Otherwise runs Gemini repurposing inline (no GCP needed — Vercel Pro 60 s timeout).
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
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { AssetType, Platform, RenderJobType } from "@prisma/client"
import { runRepurposeInline, runCarouselInline, runVideoScriptInline } from "@/lib/production/repurposeInline"

// Vercel Pro: allow up to 60 s (inline Gemini call ~10–20 s)
export const maxDuration = 60

// ---------------------------------------------------------------------------
// GCP / Cloud Tasks — DISABLED during Railway migration.
// Restore getTasksClient() + enqueueTask() once WORKER_SERVER_URL is live,
// then replace gcpConfigured below with a WORKER_SERVER_URL check.
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

async function enqueueTask(workerUrl: string, payload: Record<string, unknown>): Promise<string> {
    const client = await getTasksClient()
    const projectId = process.env.GCP_PROJECT_ID!.trim()
    const location = (process.env.GCP_LOCATION ?? "us-central1").trim()
    const queue = (process.env.CLOUD_TASKS_QUEUE ?? "pam-render-queue").trim()
    const saEmail = process.env.WORKER_SA_EMAIL!.trim()
    const parent = client.queuePath(projectId, location, queue)
    const [task] = await client.createTask({
        parent,
        task: {
            httpRequest: {
                httpMethod: "POST",
                url: workerUrl,
                body: Buffer.from(JSON.stringify(payload)),
                headers: { "Content-Type": "application/json" },
                oidcToken: { serviceAccountEmail: saEmail, audience: workerUrl },
            },
        },
    })
    return task.name ?? ""
}

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
// Static worker URL map (dynamic process.env[key] breaks Turbopack)
// ---------------------------------------------------------------------------
const WORKER_URLS: Record<string, string | undefined> = {
    CAROUSEL_RENDERER_URL: process.env.CAROUSEL_RENDERER_URL,
    REPURPOSE_WORKER_URL: process.env.REPURPOSE_WORKER_URL,
    VIDEO_RENDERER_URL: process.env.VIDEO_RENDERER_URL,
}

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

        // Fetch idea + entry + existing render jobs
        const idea = await prisma.contentIdea.findUnique({
            where: { id: contentIdeaId },
            include: {
                calendarEntry: true,
                renderJobs: { select: { id: true, status: true } },
            },
        })

        if (!idea) {
            return NextResponse.json(
                { error: `ContentIdea not found: ${contentIdeaId}` },
                { status: 404 }
            )
        }

        const entry = idea.calendarEntry

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

        // Build callback URL — NEXTAUTH_URL must include https:// (no trailing slash)
        const nextAuthUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
        const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
        const baseUrl = nextAuthUrl || vercelUrl || "http://localhost:3000"
        const callbackUrl = `${baseUrl}/api/production/render-done`
        const callbackSecret = (process.env.RENDER_CALLBACK_SECRET ?? "").trim()

        // GCP/Cloud Tasks can be enabled via ENABLE_GCP_TASKS=true in Vercel
        const gcpConfigured = process.env.ENABLE_GCP_TASKS === "true" && !!process.env.WORKER_SA_EMAIL
        const jobs: Array<{ jobType: RenderJobType; taskId: string; renderJobId: string }> = []
        const errors: string[] = []

        // Determine which workers to run
        const needsCarousel = ["CAROUSEL"].includes(entry.postType)
        const needsVideo = ["VIDEO", "REEL"].includes(entry.postType)
        const needsRepurpose = true // always

        // ------------------------------------------------------------------
        // Helper: create RenderJob row + (optionally) enqueue task
        // Returns the created renderJobId.
        // ------------------------------------------------------------------
        const dispatch = async (
            jobType: RenderJobType,
            workerUrlEnvKey: string,
            assetTypes: Array<{ assetType: AssetType; platform: Platform }>,
            extraPayload: Record<string, unknown> = {}
        ): Promise<string> => {
            const workerUrl = WORKER_URLS[workerUrlEnvKey]

            // Create ContentAsset placeholders
            const assetCreates = assetTypes.map(({ assetType, platform }) => ({
                contentIdeaId,
                platform,
                assetType,
                fileName: buildFileName(platform, entry.entryDate, entry.topic, assetType, 1),
                status: "PENDING" as const,
            }))

            // Create the RenderJob row first so we have its ID for the payload
            const renderJob = await prisma.renderJob.create({
                data: {
                    contentIdeaId,
                    jobType,
                    status: "QUEUED",
                    inputPayload: {
                        contentIdeaId,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entry.entryDate.toISOString(),
                        ...extraPayload,
                    } as object,
                },
            })

            // Create assets linked to the job
            await prisma.contentAsset.createMany({
                data: assetCreates.map((a) => ({ ...a, renderJobId: renderJob.id })),
                skipDuplicates: true,
            })

            // Enqueue to Cloud Tasks — skip if GCP credentials are absent (inline path)
            if (!gcpConfigured || !workerUrl) {
                jobs.push({ jobType, taskId: "inline", renderJobId: renderJob.id })
                return renderJob.id
            }

            // TODO (Railway): dispatch to worker via fetch + X-Worker-Secret header
            // try {
            //     const taskName = await enqueueTask(workerUrl, {
            //         renderJobId: renderJob.id,
            //         contentIdeaId,
            //         masterJson: master,
            //         platform: entry.platform,
            //         postType: entry.postType,
            //         topic: entry.topic,
            //         entryDate: entry.entryDate.toISOString(),
            //         callbackUrl,
            //         callbackSecret,
            //         ...extraPayload,
            //     })
            //     await prisma.renderJob.update({
            //         where: { id: renderJob.id },
            //         data: { cloudTasksTaskId: taskName },
            //     })
            //     jobs.push({ jobType, taskId: taskName, renderJobId: renderJob.id })
            // } catch (err) {
            //     errors.push(`Failed to enqueue ${jobType}: ${(err as Error).message}`)
            //     await prisma.renderJob.update({
            //         where: { id: renderJob.id },
            //         data: { status: "FAILED", errorMessage: (err as Error).message },
            //     })
            // }

            return renderJob.id
        }

        if (needsCarousel) {
            const carouselJobId = await dispatch("CAROUSEL", "CAROUSEL_RENDERER_URL", [
                { assetType: "CAROUSEL_PNG", platform: entry.platform },
            ])
            if (!gcpConfigured) {
                try {
                    await runCarouselInline({
                        renderJobId: carouselJobId,
                        contentIdeaId,
                        calendarEntryId: entry.id,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entry.entryDate.toISOString(),
                    })
                    const j = jobs.find(j => j.renderJobId === carouselJobId)
                    if (j) j.taskId = "inline-complete"
                } catch (e) {
                    errors.push(`Inline carousel failed: ${(e as Error).message}`)
                }
            }
        }

        if (needsRepurpose) {
            const repurposeJobId = await dispatch("REPURPOSE", "REPURPOSE_WORKER_URL", REPURPOSE_ASSET_TYPES)
            // If Cloud Tasks not configured, run Gemini inline right now
            if (!gcpConfigured) {
                try {
                    await runRepurposeInline({
                        renderJobId: repurposeJobId,
                        contentIdeaId,
                        calendarEntryId: entry.id,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entry.entryDate.toISOString(),
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
            const videoJobId = await dispatch("VIDEO", "VIDEO_RENDERER_URL", [
                { assetType: "VIDEO_SCRIPT_JSON", platform: entry.platform },
                { assetType: "AUDIO_MP3", platform: entry.platform },
            ], {
                voiceId: voiceId ?? null,
            })
            if (!gcpConfigured) {
                try {
                    await runVideoScriptInline({
                        renderJobId: videoJobId,
                        contentIdeaId,
                        calendarEntryId: entry.id,
                        masterJson: master,
                        platform: entry.platform,
                        postType: entry.postType,
                        topic: entry.topic,
                        entryDate: entry.entryDate.toISOString(),
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
            await prisma.productionCalendarEntry.update({
                where: { id: entry.id },
                data: { publishStatus: "GENERATING" },
            })
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
    entryDate: Date,
    topic: string,
    assetType: AssetType,
    version: number
): string {
    const date = entryDate.toISOString().slice(0, 10).replace(/-/g, "")
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
