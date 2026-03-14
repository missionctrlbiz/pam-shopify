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
import prisma from "@/lib/prisma"
import { runRepurposeInline, runCarouselInline, runVideoScriptInline } from "@/lib/production/repurposeInline"

// Inline Gemini call can take up to ~20 s; match the generate route timeout
export const maxDuration = 60
// ---------------------------------------------------------------------------
// GCP helpers — dynamic import to avoid module-level crash on serverless
// ---------------------------------------------------------------------------

async function getTasksClient() {
    const { CloudTasksClient } = await import("@google-cloud/tasks")
    // .trim() guards against \r\n contamination from Windows copy-paste in Vercel dashboard
    const b64 = process.env.GCP_SERVICE_ACCOUNT_JSON_B64?.trim()
    if (b64) {
        const credentials = JSON.parse(
            Buffer.from(b64, "base64").toString("utf-8")
        )
        return new CloudTasksClient({ credentials })
    }
    return new CloudTasksClient()
}

const WORKER_URLS: Record<string, string | undefined> = {
    CAROUSEL: process.env.CAROUSEL_RENDERER_URL,
    VIDEO: process.env.VIDEO_RENDERER_URL,
    AUDIO: process.env.VIDEO_RENDERER_URL,
    REPURPOSE: process.env.REPURPOSE_WORKER_URL,
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: jobId } = await params

    // ------------------------------------------------------------------
    // Fetch original job
    // ------------------------------------------------------------------
    const original = await prisma.renderJob.findUnique({
        where: { id: jobId },
        include: {
            contentIdea: {
                select: {
                    id: true,
                    calendarEntry: { select: { id: true, publishStatus: true } },
                },
            },
            assets: { select: { id: true, assetType: true, platform: true, fileName: true } },
        },
    })

    if (!original) {
        return NextResponse.json({ error: "RenderJob not found" }, { status: 404 })
    }

    if (original.status === "COMPLETE") {
        return NextResponse.json(
            { error: `Job is already COMPLETE — no need to retry` },
            { status: 409 }
        )
    }



    const workerUrl = WORKER_URLS[original.jobType]
    const gcpConfigured = !!(
        process.env.GCP_PROJECT_ID?.trim() &&
        process.env.WORKER_SA_EMAIL?.trim() &&
        process.env.GCP_SERVICE_ACCOUNT_JSON_B64?.trim()
    )

    // Payload from original job — available regardless of execution path
    const storedPayload = original.inputPayload as Record<string, unknown>
    const nextAuthUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
    const baseUrl = nextAuthUrl || vercelUrl || "http://localhost:3000"
    const callbackUrl = `${baseUrl}/api/production/render-done`
    const callbackSecret = (process.env.RENDER_CALLBACK_SECRET ?? "").trim()

    // ------------------------------------------------------------------
    // Create new RenderJob + asset placeholders (both paths need this)
    // ------------------------------------------------------------------
    const newJob = await prisma.renderJob.create({
        data: {
            contentIdeaId: original.contentIdeaId,
            jobType: original.jobType,
            status: "QUEUED",
            inputPayload: (storedPayload ?? {}) as any,
        },
    })

    // Re-create asset placeholders linked to new job
    if (original.assets.length > 0) {
        await prisma.contentAsset.createMany({
            data: original.assets.map((a) => ({
                contentIdeaId: original.contentIdeaId,
                renderJobId: newJob.id,
                assetType: a.assetType,
                platform: a.platform,
                fileName: a.fileName ?? `retry_${newJob.id}`,
                status: "PENDING" as const,
            })),
        })
    }

    // ------------------------------------------------------------------
    // Inline path — GCP not configured, run synchronously like generate route
    // ------------------------------------------------------------------
    if (!gcpConfigured || !workerUrl) {
        const inlineInput = {
            renderJobId: newJob.id,
            contentIdeaId: original.contentIdeaId,
            calendarEntryId: original.contentIdea.calendarEntry.id,
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
    // Enqueue to Cloud Tasks
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
                    })).toString("base64"),
                    headers: { "Content-Type": "application/json" },
                    oidcToken: { serviceAccountEmail: saEmail, audience: workerUrl },
                },
            },
        })

        await prisma.renderJob.update({
            where: { id: newJob.id },
            data: { cloudTasksTaskId: task.name ?? "" },
        })
    } catch (err) {
        await prisma.renderJob.update({
            where: { id: newJob.id },
            data: { status: "FAILED", errorMessage: (err as Error).message },
        })
        return NextResponse.json(
            { error: `Failed to enqueue task: ${(err as Error).message}` },
            { status: 502 }
        )
    }

    // Bump calendar entry back to GENERATING
    await prisma.productionCalendarEntry.update({
        where: { id: original.contentIdea.calendarEntry.id },
        data: { publishStatus: "GENERATING" },
    })

    return NextResponse.json({
        retried: true,
        originalJobId: jobId,
        newJobId: newJob.id,
    })
}
