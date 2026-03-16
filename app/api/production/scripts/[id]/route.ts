/**
 * GET/PUT /api/production/scripts/[id]
 *
 * GET — Fetch a VideoScript by its ID.
 *
 * PUT — Update VideoScript fields.
 *   Accepts: scriptJson, totalDurationSecs, elevenLabsJobId, audioStorageUrl,
 *            audioStatus
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { AssetStatus } from "@/lib/enums"

const VALID_AUDIO_STATUSES: AssetStatus[] = ["PENDING", "GENERATING", "COMPLETE", "FAILED"]

// ---------------------------------------------------------------------------
// GET /api/production/scripts/[id]
// ---------------------------------------------------------------------------

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: script, error } = await supabaseAdmin
        .from("video_scripts")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("[scripts/:id] Fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!script) {
        return NextResponse.json(
            { error: `VideoScript not found: ${id}` },
            { status: 404 }
        )
    }

    let contentIdeaWithEntry: Record<string, unknown> | null = null
    if (script.contentIdeaId) {
        const { data: idea, error: ideaError } = await supabaseAdmin
            .from("content_ideas")
            .select("id, calendarEntry:production_calendar_entries(id, dayNumber, entryDate, topic, platform)")
            .eq("id", script.contentIdeaId)
            .maybeSingle()

        if (ideaError) {
            console.error("[scripts/:id] Content idea fetch error:", ideaError)
        } else if (idea) {
            contentIdeaWithEntry = idea
        }
    }

    return NextResponse.json({ script: { ...script, contentIdea: contentIdeaWithEntry } })
}

// ---------------------------------------------------------------------------
// PUT /api/production/scripts/[id]
// ---------------------------------------------------------------------------

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const body = await req.json() as {
        scriptJson?: unknown
        totalDurationSecs?: number
        elevenLabsJobId?: string | null
        audioStorageUrl?: string | null
        audioStatus?: string
    }

    if (
        body.audioStatus &&
        !VALID_AUDIO_STATUSES.includes(body.audioStatus as AssetStatus)
    ) {
        return NextResponse.json(
            { error: `Invalid audioStatus: ${body.audioStatus}` },
            { status: 400 }
        )
    }

    const { data: existing, error: existingError } = await supabaseAdmin
        .from("video_scripts")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (existingError) {
        console.error("[scripts/:id] Fetch error:", existingError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!existing) {
        return NextResponse.json(
            { error: `VideoScript not found: ${id}` },
            { status: 404 }
        )
    }

    const update: Record<string, unknown> = {}
    if (body.scriptJson !== undefined) update.scriptJson = body.scriptJson
    if (body.totalDurationSecs !== undefined) update.totalDurationSecs = body.totalDurationSecs
    if (body.elevenLabsJobId !== undefined) update.elevenLabsJobId = body.elevenLabsJobId
    if (body.audioStorageUrl !== undefined) update.audioStorageUrl = body.audioStorageUrl
    if (body.audioStatus !== undefined) update.audioStatus = body.audioStatus as AssetStatus

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ script: existing })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from("video_scripts")
        .update(update)
        .eq("id", id)
        .select("*")
        .single()

    if (updateError || !updated) {
        console.error("[scripts/:id] Update error:", updateError)
        return NextResponse.json({ error: "Failed to update video script" }, { status: 500 })
    }

    return NextResponse.json({ script: updated })
}
