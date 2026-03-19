/**
 * GET /api/production/assets/[id]
 *
 * Fetch a single ContentAsset by ID, including its parent idea reference
 * and the render job that produced it (if any).
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: asset, error } = await supabaseAdmin
        .from("content_assets")
        .select(`*,
            contentIdea:content_ideas(
                id,
                qualityGateStatus:quality_gate_status,
                calendarEntry:production_calendar_entries(
                    id,
                    dayNumber:day_number,
                    entryDate:entry_date,
                    platform,
                    topic,
                    publishStatus:publish_status
                )
            ),
            renderJob:render_jobs(
                id,
                jobType:job_type,
                status,
                queuedAt:queued_at,
                startedAt:started_at,
                completedAt:completed_at,
                errorMessage:error_message,
                retryCount:retry_count
            )`)
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("[assets/:id] Fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!asset) {
        return NextResponse.json(
            { error: `ContentAsset not found: ${id}` },
            { status: 404 }
        )
    }

    return NextResponse.json({ asset })
}
