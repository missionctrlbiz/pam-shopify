/**
 * POST /api/production/render-done
 *
 * Webhook called by Cloud Run workers when a render job completes (or fails).
 *
 * Security: The request body must include a `secret` field matching
 * RENDER_CALLBACK_SECRET (constant-time comparison). This mirrors the shared
 * HMAC secret pattern used for Shopify webhooks.
 *
 * Body contract:
 * {
 *   renderJobId: string
 *   secret: string
 *   assets: Array<{
 *     assetType: AssetType
 *     platform: Platform
 *     storageUrl: string
 *     storagePath?: string
 *     fileName: string
 *     metadata?: Record<string, unknown>
 *   }>
 *   error: string | null   — present and non-null if job failed
 * }
 *
 * On success:
 *   RenderJob.status → COMPLETE, completedAt set
 *   ContentAsset rows for this job → status COMPLETE, storageUrl populated
 *
 * On error:
 *   RenderJob.status → FAILED, errorMessage set
 *   ContentAsset rows → status FAILED
 *
 * After update: if ALL RenderJobs for the contentIdeaId are now COMPLETE,
 *   ProductionCalendarEntry.publishStatus → APPROVED (assets ready, admin schedules)
 *
 * Not admin-guarded — guarded by shared secret instead.
 */

import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import prisma from "@/lib/prisma"
import { AssetType, Platform } from "@prisma/client"

interface IncomingAsset {
    assetType: AssetType
    platform: Platform
    storageUrl: string
    storagePath?: string
    fileName: string
    metadata?: Record<string, unknown>
}

interface RenderDoneBody {
    renderJobId: string
    secret: string
    assets: IncomingAsset[]
    error: string | null
}

export async function POST(req: NextRequest) {
    // ------------------------------------------------------------------
    // Parse body
    // ------------------------------------------------------------------
    let body: RenderDoneBody
    try {
        body = await req.json() as RenderDoneBody
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { renderJobId, secret, assets, error: jobError } = body

    // ------------------------------------------------------------------
    // Validate required fields
    // ------------------------------------------------------------------
    if (!renderJobId || !secret) {
        return NextResponse.json(
            { error: "renderJobId and secret are required" },
            { status: 400 }
        )
    }

    // ------------------------------------------------------------------
    // Verify shared secret (constant-time to prevent timing attacks)
    // ------------------------------------------------------------------
    const expected = process.env.RENDER_CALLBACK_SECRET?.trim()
    if (!expected) {
        console.error("[render-done] RENDER_CALLBACK_SECRET is not set")
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    let secretValid = false
    try {
        const expectedBuf = Buffer.from(expected, "utf-8")
        const receivedBuf = Buffer.from(secret, "utf-8")
        if (expectedBuf.length === receivedBuf.length) {
            secretValid = timingSafeEqual(expectedBuf, receivedBuf)
        }
    } catch {
        secretValid = false
    }

    if (!secretValid) {
        console.warn("[render-done] Invalid callback secret for job:", renderJobId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ------------------------------------------------------------------
    // Fetch the RenderJob
    // ------------------------------------------------------------------
    const renderJob = await prisma.renderJob.findUnique({
        where: { id: renderJobId },
        include: {
            contentIdea: {
                select: {
                    id: true,
                    calendarEntryId: true,
                },
            },
            assets: { select: { id: true } },
        },
    })

    if (!renderJob) {
        console.error("[render-done] RenderJob not found:", renderJobId)
        return NextResponse.json(
            { error: `RenderJob not found: ${renderJobId}` },
            { status: 404 }
        )
    }

    const contentIdeaId = renderJob.contentIdeaId
    const calendarEntryId = renderJob.contentIdea.calendarEntryId

    // ------------------------------------------------------------------
    // Handle FAILED job
    // ------------------------------------------------------------------
    if (jobError) {
        console.error(`[render-done] Job ${renderJobId} failed:`, jobError)

        await prisma.$transaction([
            prisma.renderJob.update({
                where: { id: renderJobId },
                data: {
                    status: "FAILED",
                    completedAt: new Date(),
                    errorMessage: jobError,
                },
            }),
            prisma.contentAsset.updateMany({
                where: { renderJobId },
                data: { status: "FAILED" },
            }),
        ])

        return NextResponse.json({
            received: true,
            status: "FAILED",
            renderJobId,
        })
    }

    // ------------------------------------------------------------------
    // Handle SUCCESS — update job + upsert assets
    // ------------------------------------------------------------------
    const now = new Date()

    await prisma.renderJob.update({
        where: { id: renderJobId },
        data: {
            status: "COMPLETE",
            completedAt: now,
        },
    })

    // Update each ContentAsset row based on the incoming asset data
    for (const asset of assets ?? []) {
        await prisma.contentAsset.updateMany({
            where: {
                renderJobId,
                assetType: asset.assetType,
                platform: asset.platform,
            },
            data: {
                status: "COMPLETE",
                storageUrl: asset.storageUrl,
                storagePath: asset.storagePath ?? null,
                fileName: asset.fileName,
                ...(asset.metadata ? { metadata: asset.metadata as object } : {}),
            },
        })
    }

    // ------------------------------------------------------------------
    // Check if ALL render jobs for this idea are complete → APPROVED
    // ------------------------------------------------------------------
    const allJobs = await prisma.renderJob.findMany({
        where: { contentIdeaId },
        orderBy: { queuedAt: "desc" },
    })

    const latestJobs = new Map<string, string>()
    for (const job of allJobs) {
        if (!latestJobs.has(job.jobType)) {
            latestJobs.set(job.jobType, job.status)
        }
    }

    const allDone = Array.from(latestJobs.values()).every((status) => status === "COMPLETE")

    if (allDone) {
        await prisma.productionCalendarEntry.update({
            where: { id: calendarEntryId },
            data: { publishStatus: "APPROVED" },
        })
        console.log(
            `[render-done] All jobs complete for idea ${contentIdeaId} — entry ${calendarEntryId} → APPROVED`
        )
    }

    return NextResponse.json({
        received: true,
        status: "COMPLETE",
        renderJobId,
        assetsUpdated: assets?.length ?? 0,
        calendarStatus: allDone ? "APPROVED" : "GENERATING",
    })
}
