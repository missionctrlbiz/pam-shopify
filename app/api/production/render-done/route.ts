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
import { supabaseAdmin } from "@/lib/supabase"
import { AssetType, Platform } from "@/lib/enums"
import { checkAllRenderJobsComplete } from "@/lib/production/repurposeInline"

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
        const expectedBuf = Buffer.from(expected.trim(), "utf-8")
        const receivedBuf = Buffer.from(secret.trim(), "utf-8")
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
    const { data: renderJob, error: renderJobError } = await supabaseAdmin
        .from("render_jobs")
        .select(`*, contentIdea:content_ideas(id, calendarEntryId)`)
        .eq("id", renderJobId)
        .maybeSingle()

    if (renderJobError) {
        console.error("[render-done] Failed to fetch render job:", renderJobError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!renderJob) {
        console.error("[render-done] RenderJob not found:", renderJobId)
        return NextResponse.json(
            { error: `RenderJob not found: ${renderJobId}` },
            { status: 404 }
        )
    }

    const contentIdeaId = renderJob.contentIdeaId
    const calendarEntryId = renderJob.contentIdea?.calendarEntryId ?? null

    // ------------------------------------------------------------------
    // Handle FAILED job
    // ------------------------------------------------------------------
    if (jobError) {
        console.error(`[render-done] Job ${renderJobId} failed:`, jobError)

        const failedAt = new Date().toISOString()
        const [jobUpdate, assetUpdate] = await Promise.all([
            supabaseAdmin
                .from("render_jobs")
                .update({ status: "FAILED", completedAt: failedAt, errorMessage: jobError })
                .eq("id", renderJobId),
            supabaseAdmin
                .from("content_assets")
                .update({ status: "FAILED" })
                .eq("renderJobId", renderJobId),
        ])

        if (jobUpdate.error) {
            console.error("[render-done] Failed to update job status to FAILED:", jobUpdate.error)
        }
        if (assetUpdate.error) {
            console.error("[render-done] Failed to mark assets FAILED:", assetUpdate.error)
        }

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

    const { error: jobCompleteError } = await supabaseAdmin
        .from("render_jobs")
        .update({ status: "COMPLETE", completedAt: now.toISOString() })
        .eq("id", renderJobId)

    if (jobCompleteError) {
        console.error("[render-done] Failed to mark job COMPLETE:", jobCompleteError)
    }

    // Update each ContentAsset row based on the incoming asset data
    for (const asset of assets ?? []) {
        const update = supabaseAdmin
            .from("content_assets")
            .update({
                status: "COMPLETE",
                storageUrl: asset.storageUrl,
                storagePath: asset.storagePath ?? null,
                fileName: asset.fileName,
                ...(asset.metadata ? { metadata: asset.metadata as object } : {}),
            })
            .eq("renderJobId", renderJobId)
            .eq("assetType", asset.assetType)
            .eq("platform", asset.platform)

        const { error: assetError } = await update
        if (assetError) {
            console.error("[render-done] Failed to update asset status:", assetError)
        }
    }
    let allDone = false
    if (calendarEntryId) {
        allDone = await checkAllRenderJobsComplete(contentIdeaId, calendarEntryId)
    }

    return NextResponse.json({
        received: true,
        status: "COMPLETE",
        renderJobId,
        assetsUpdated: assets?.length ?? 0,
        calendarStatus: allDone ? "APPROVED" : "GENERATING",
    })
}
