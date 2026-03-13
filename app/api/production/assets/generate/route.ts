/**
 * POST /api/production/assets/generate
 *
 * Triggers asset generation for an APPROVED ProductionCalendarEntry.
 * Creates ContentAsset + RenderJob rows, then enqueues tasks to GCP Cloud Tasks
 * for each required worker (carousel-renderer, repurpose-worker, video-renderer).
 *
 * Returns 202 Accepted immediately — rendering is async via Cloud Run workers.
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

// ---------------------------------------------------------------------------
// GCP helpers — dynamic import to avoid module-level crash when native
// gRPC bindings are unavailable (e.g. Vercel serverless cold start).
// ---------------------------------------------------------------------------

async function getTasksClient() {
    const { CloudTasksClient } = await import("@google-cloud/tasks")
    const b64 = process.env.GCP_SERVICE_ACCOUNT_JSON_B64
    if (b64) {
        const credentials = JSON.parse(
            Buffer.from(b64, "base64").toString("utf-8")
        )
        return new CloudTasksClient({ credentials })
    }
    // Falls back to Application Default Credentials (local dev with gcloud auth)
    return new CloudTasksClient()
}

async function enqueueTask(
    workerUrl: string,
    payload: Record<string, unknown>
): Promise<string> {
    const client = await getTasksClient()
    const projectId = process.env.GCP_PROJECT_ID!
    const location = process.env.GCP_LOCATION ?? "us-central1"
    const queue = process.env.CLOUD_TASKS_QUEUE ?? "pam-render-queue"
    const saEmail = process.env.WORKER_SA_EMAIL!

    const parent = client.queuePath(projectId, location, queue)

    const [task] = await client.createTask({
        parent,
        task: {
            httpRequest: {
                httpMethod: "POST",
                url: workerUrl,
                body: Buffer.from(JSON.stringify(payload)).toString("base64"),
                headers: { "Content-Type": "application/json" },
                oidcToken: {
                    serviceAccountEmail: saEmail,
                    audience: workerUrl,
                },
            },
        },
    })

    return task.name ?? ""
}

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
    if (!session || (session.user as { role?: string })?.role !== "admin") {
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

        // Block if any job is actively running
        const running = idea.renderJobs.some((j) =>
            ["QUEUED", "RUNNING"].includes(j.status)
        )
        if (running) {
            return NextResponse.json(
                { error: "Asset generation already in progress for this entry." },
                { status: 409 }
            )
        }

        const master = idea.masterJson as Record<string, unknown>

        // Build callback URL — NEXTAUTH_URL must include https:// (no trailing slash)
        const nextAuthUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
        const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
        const baseUrl = nextAuthUrl || vercelUrl || "http://localhost:3000"
        const callbackUrl = `${baseUrl}/api/production/render-done`
        const callbackSecret = process.env.RENDER_CALLBACK_SECRET ?? ""

        // All three must be present — GCP_SERVICE_ACCOUNT_JSON_B64 is the actual credential;
        // without it getTasksClient() falls back to ADC which fails in local dev / Vercel.
        const gcpConfigured = !!(
            process.env.GCP_PROJECT_ID &&
            process.env.WORKER_SA_EMAIL &&
            process.env.GCP_SERVICE_ACCOUNT_JSON_B64
        )
        const jobs: Array<{ jobType: RenderJobType; taskId: string; renderJobId: string }> = []
        const errors: string[] = []

        // Determine which workers to run
        const needsCarousel = ["CAROUSEL"].includes(entry.postType)
        const needsVideo = ["VIDEO", "REEL"].includes(entry.postType)
        const needsRepurpose = true // always

        // ------------------------------------------------------------------
        // Helper: create RenderJob row + enqueue task
        // ------------------------------------------------------------------
        const dispatch = async (
            jobType: RenderJobType,
            workerUrlEnvKey: string,
            assetTypes: Array<{ assetType: AssetType; platform: Platform }>,
            extraPayload: Record<string, unknown> = {}
        ) => {
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

            // Enqueue to Cloud Tasks (skipped if GCP not configured or worker URL missing — dev mode)
            if (!gcpConfigured || !workerUrl) {
                const reason = !workerUrl ? `${workerUrlEnvKey} not set` : "GCP not configured"
                errors.push(`[dev] ${reason} — ${jobType} job queued in DB only`)
                jobs.push({ jobType, taskId: "dev-no-gcp", renderJobId: renderJob.id })
                return
            }

            try {
                const taskName = await enqueueTask(workerUrl, {
                    renderJobId: renderJob.id,
                    contentIdeaId,
                    masterJson: master,
                    platform: entry.platform,
                    postType: entry.postType,
                    topic: entry.topic,
                    entryDate: entry.entryDate.toISOString(),
                    callbackUrl,
                    callbackSecret,
                    ...extraPayload,
                })

                // Store the task name on the job
                await prisma.renderJob.update({
                    where: { id: renderJob.id },
                    data: { cloudTasksTaskId: taskName },
                })

                jobs.push({ jobType, taskId: taskName, renderJobId: renderJob.id })
            } catch (err) {
                errors.push(`Failed to enqueue ${jobType}: ${(err as Error).message}`)
                await prisma.renderJob.update({
                    where: { id: renderJob.id },
                    data: { status: "FAILED", errorMessage: (err as Error).message },
                })
            }
        }

        if (needsCarousel) {
            await dispatch("CAROUSEL", "CAROUSEL_RENDERER_URL", [
                { assetType: "CAROUSEL_PNG", platform: entry.platform },
            ])
        }

        if (needsRepurpose) {
            await dispatch("REPURPOSE", "REPURPOSE_WORKER_URL", REPURPOSE_ASSET_TYPES)
        }

        if (needsVideo) {
            await dispatch("VIDEO", "VIDEO_RENDERER_URL", [
                { assetType: "VIDEO_MP4", platform: entry.platform },
                { assetType: "AUDIO_MP3", platform: entry.platform },
            ], {
                voiceId: voiceId ?? null,
            })
        }

        // Transition entry to GENERATING while workers are running
        if (jobs.length > 0) {
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
