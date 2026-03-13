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
import prisma from "@/lib/prisma"
import { PublishStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// GET /api/production/calendar/[id]
// ---------------------------------------------------------------------------

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const entry = await prisma.productionCalendarEntry.findUnique({
        where: { id },
        include: {
            contentIdea: {
                include: {
                    clinicalField: {
                        select: {
                            fieldKey: true,
                            displayName: true,
                            fieldCategory: true,
                            description: true,
                        },
                    },
                    qualityGateResult: true,
                    videoScript: true,
                    assets: {
                        orderBy: { createdAt: "asc" },
                    },
                    renderJobs: {
                        orderBy: { queuedAt: "desc" },
                    },
                },
            },
            approvedBy: {
                select: { id: true, name: true, email: true },
            },
        },
    })

    if (!entry) {
        return NextResponse.json(
            { error: `Calendar entry not found: ${id}` },
            { status: 404 }
        )
    }

    return NextResponse.json({ entry })
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
    if (!session || (session.user as { role?: string })?.role !== "admin") {
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
    const existing = await prisma.productionCalendarEntry.findUnique({
        where: { id },
        select: { id: true, contentIdea: { select: { id: true } } },
    })

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
    if (body.masterJson && existing.contentIdea) {
        const [updatedEntry] = await prisma.$transaction([
            prisma.productionCalendarEntry.update({
                where: { id },
                data: entryUpdate,
            }),
            prisma.contentIdea.update({
                where: { id: existing.contentIdea.id },
                data: { masterJson: body.masterJson as object },
            }),
        ])
        return NextResponse.json({ entry: updatedEntry })
    }

    const updated = await prisma.productionCalendarEntry.update({
        where: { id },
        data: entryUpdate,
    })

    return NextResponse.json({ entry: updated })
}
