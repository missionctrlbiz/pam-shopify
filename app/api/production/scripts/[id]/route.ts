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
import prisma from "@/lib/prisma"
import { AssetStatus } from "@prisma/client"

const VALID_AUDIO_STATUSES: AssetStatus[] = ["PENDING", "GENERATING", "COMPLETE", "FAILED"]

// ---------------------------------------------------------------------------
// GET /api/production/scripts/[id]
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

    const script = await prisma.videoScript.findUnique({
        where: { id },
        include: {
            contentIdea: {
                select: {
                    id: true,
                    calendarEntry: {
                        select: {
                            id: true,
                            dayNumber: true,
                            entryDate: true,
                            topic: true,
                            platform: true,
                        },
                    },
                },
            },
        },
    })

    if (!script) {
        return NextResponse.json(
            { error: `VideoScript not found: ${id}` },
            { status: 404 }
        )
    }

    return NextResponse.json({ script })
}

// ---------------------------------------------------------------------------
// PUT /api/production/scripts/[id]
// ---------------------------------------------------------------------------

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

    const existing = await prisma.videoScript.findUnique({ where: { id } })
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

    const updated = await prisma.videoScript.update({ where: { id }, data: update })

    return NextResponse.json({ script: updated })
}
