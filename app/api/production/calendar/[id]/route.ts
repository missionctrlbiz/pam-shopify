/**
 * GET/PUT /api/production/calendar/[id]
 *
 * GET — Fetch a single ProductionCalendarEntry with all nested relations:
 *   contentIdea → qualityGateResult, assets, clinicalField
 *
 * PUT — Update mutable fields on the entry or its content idea:
 *   Accepts: hook, cta, topic, contentGoal, scheduledAt, publishStatus,
 *            masterJson (partial update of the idea's draft content)
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { PublishStatus } from "@/lib/enums"

// ---------------------------------------------------------------------------
// GET /api/production/calendar/[id]
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

    const { data: entry, error } = await supabaseAdmin
        .from("production_calendar_entries")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("[calendar/:id] Fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!entry) {
        return NextResponse.json(
            { error: `Calendar entry not found: ${id}` },
            { status: 404 }
        )
    }

    const [contentIdeaRes, approvedRes] = await Promise.all([
        supabaseAdmin
            .from("content_ideas")
            .select("*")
            .eq("calendarEntryId", id)
            .maybeSingle(),
        entry.approvedById
            ? supabaseAdmin
                .from("User")
                .select("id, name, email")
                .eq("id", entry.approvedById)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
    ])

    if (contentIdeaRes.error) {
        console.error("[calendar/:id] Content idea fetch error:", contentIdeaRes.error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const contentIdea = contentIdeaRes.data

    if (contentIdea) {
        const [clinicalField, qualityGateResult, videoScript, assets, renderJobs] = await Promise.all([
            contentIdea.clinicalFieldId
                ? supabaseAdmin
                    .from("clinical_fields")
                    .select("fieldKey, displayName, fieldCategory, description")
                    .eq("id", contentIdea.clinicalFieldId)
                    .maybeSingle()
                    .then((res) => res.data)
                : Promise.resolve(null),
            supabaseAdmin
                .from("quality_gate_results")
                .select("*")
                .eq("contentIdeaId", contentIdea.id)
                .maybeSingle()
                .then((res) => res.data),
            supabaseAdmin
                .from("video_scripts")
                .select("*")
                .eq("contentIdeaId", contentIdea.id)
                .maybeSingle()
                .then((res) => res.data),
            supabaseAdmin
                .from("content_assets")
                .select("*")
                .eq("contentIdeaId", contentIdea.id)
                .order("createdAt", { ascending: true })
                .then((res) => res.data ?? []),
            supabaseAdmin
                .from("render_jobs")
                .select("*")
                .eq("contentIdeaId", contentIdea.id)
                .order("queuedAt", { ascending: false })
                .then((res) => res.data ?? []),
        ])

        contentIdea.clinicalField = clinicalField
        contentIdea.qualityGateResult = qualityGateResult ?? null
        contentIdea.videoScript = videoScript ?? null
        contentIdea.assets = assets ?? []
        contentIdea.renderJobs = renderJobs ?? []
    }

    if (approvedRes.error) {
        console.warn("[calendar/:id] Approved-by fetch warning:", approvedRes.error.message)
    }

    return NextResponse.json({
        entry: {
            ...entry,
            contentIdea: contentIdea ?? null,
            approvedBy: approvedRes.data ?? null,
        },
    })
}

// ---------------------------------------------------------------------------
// PUT /api/production/calendar/[id]
// ---------------------------------------------------------------------------

const ALLOWED_STATUSES: PublishStatus[] = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "SCHEDULED",
    "ARCHIVED",
]

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
        // Entry-level fields
        hook?: string
        cta?: string
        topic?: string
        contentGoal?: string
        scheduledAt?: string | null
        publishStatus?: string
        // Idea-level fields
        masterJson?: Record<string, unknown>
    }

    // Validate publishStatus if provided
    if (
        body.publishStatus &&
        !ALLOWED_STATUSES.includes(body.publishStatus as PublishStatus)
    ) {
        return NextResponse.json(
            { error: `Invalid publishStatus: ${body.publishStatus}` },
            { status: 400 }
        )
    }

    // Check entry exists
    const { data: existing, error: existingError } = await supabaseAdmin
        .from("production_calendar_entries")
        .select("id, contentIdeas:content_ideas(id)")
        .eq("id", id)
        .maybeSingle()

    if (existingError) {
        console.error("[calendar/:id] Fetch error:", existingError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!existing) {
        return NextResponse.json(
            { error: `Calendar entry not found: ${id}` },
            { status: 404 }
        )
    }

    // Build entry update payload (only defined fields)
    const entryUpdate: Record<string, unknown> = {}
    if (body.hook !== undefined) entryUpdate.hook = body.hook
    if (body.cta !== undefined) entryUpdate.cta = body.cta
    if (body.topic !== undefined) entryUpdate.topic = body.topic
    if (body.contentGoal !== undefined) entryUpdate.contentGoal = body.contentGoal
    if (body.scheduledAt !== undefined) {
        entryUpdate.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    }
    if (body.publishStatus !== undefined) {
        entryUpdate.publishStatus = body.publishStatus as PublishStatus
    }

    // Run both updates in a transaction if masterJson is also being updated
    let updatedEntry = existing

    if (Object.keys(entryUpdate).length > 0) {
        const { data: updated, error: updateError } = await supabaseAdmin
            .from("production_calendar_entries")
            .update(entryUpdate)
            .eq("id", id)
            .select("*")
            .single()

        if (updateError) {
            console.error("[calendar/:id] Update error:", updateError)
            return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
        }

        updatedEntry = updated
    }

    const linkedIdeaId = existing.contentIdeas?.[0]?.id
    if (body.masterJson && linkedIdeaId) {
        const { error: ideaError } = await supabaseAdmin
            .from("content_ideas")
            .update({ masterJson: body.masterJson as object })
            .eq("id", linkedIdeaId)

        if (ideaError) {
            console.error("[calendar/:id] Content idea update error:", ideaError)
            return NextResponse.json({ error: "Failed to update content idea" }, { status: 500 })
        }
    }

    return NextResponse.json({ entry: updatedEntry })
}
