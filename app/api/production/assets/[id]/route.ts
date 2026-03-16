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
                qualityGateStatus,
                calendarEntry:production_calendar_entries(
                    id,
                    dayNumber,
                    entryDate,
                    platform,
                    topic,
                    publishStatus
                )
            ),
            renderJob:render_jobs(
                id,
                jobType,
                status,
                queuedAt,
                startedAt,
                completedAt,
                errorMessage,
                retryCount
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
