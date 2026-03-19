/**
 * GET /api/production/render-jobs
 *
 * Returns recent render jobs across all entries, ordered by queuedAt desc.
 * Used by the RenderJobsTab queue management panel.
 *
 * Query params:
 *   status  — comma-separated filter: QUEUED,RUNNING,COMPLETE,FAILED (default: all)
 *   limit   — max rows (default 60, max 200)
 *   page    — 1-based (default 1)
 *
 * Returns:
 *   { jobs: RenderJobRow[], total: number, hasActive: boolean }
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import type { RenderJobStatus } from "@/lib/enums"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status") ?? ""
    const limitParam = Math.min(parseInt(searchParams.get("limit") ?? "60", 10), 200)
    const pageParam = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const skip = (pageParam - 1) * limitParam

    const VALID: RenderJobStatus[] = ["QUEUED", "RUNNING", "COMPLETE", "FAILED"]
    const statusFilter = statusParam
        ? (statusParam.split(",").filter((s) => VALID.includes(s as RenderJobStatus)) as RenderJobStatus[])
        : undefined

    const selectClause = `*,
        contentIdea:content_ideas(
            id,
            calendarEntry:production_calendar_entries(id, dayNumber:day_number, platform, postType:post_type, topic, entryDate:entry_date)
        ),
        assets:content_assets(id, assetType:asset_type, platform, status, storageUrl:storage_url, fileName:file_name, metadata)
    `

    let jobsQuery = supabaseAdmin
        .from("render_jobs")
        .select(selectClause, { count: "exact" })

    if (statusFilter?.length) {
        jobsQuery = jobsQuery.in("status", statusFilter)
    }

    jobsQuery = jobsQuery.order("queued_at", { ascending: false }).range(skip, skip + limitParam - 1)

    const { data: jobs, error, count } = await jobsQuery

    if (error) {
        console.error("[render-jobs] Supabase fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const { count: activeCount, error: activeError } = await supabaseAdmin
        .from("render_jobs")
        .select("id", { count: "exact", head: true })
        .in("status", ["QUEUED", "RUNNING"])

    if (activeError) {
        console.error("[render-jobs] Active count error:", activeError)
    }

    const total = count ?? 0
    const hasActive = (activeCount ?? 0) > 0

    return NextResponse.json({
        jobs: jobs ?? [],
        total,
        hasActive,
        pagination: {
            page: pageParam,
            limit: limitParam,
            totalPages: Math.ceil(total / limitParam),
        },
    })
}
