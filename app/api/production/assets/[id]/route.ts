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
import prisma from "@/lib/prisma"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const asset = await prisma.contentAsset.findUnique({
        where: { id },
        include: {
            contentIdea: {
                select: {
                    id: true,
                    qualityGateStatus: true,
                    calendarEntry: {
                        select: {
                            id: true,
                            dayNumber: true,
                            entryDate: true,
                            platform: true,
                            topic: true,
                            publishStatus: true,
                        },
                    },
                },
            },
            renderJob: {
                select: {
                    id: true,
                    jobType: true,
                    status: true,
                    queuedAt: true,
                    startedAt: true,
                    completedAt: true,
                    errorMessage: true,
                    retryCount: true,
                },
            },
        },
    })

    if (!asset) {
        return NextResponse.json(
            { error: `ContentAsset not found: ${id}` },
            { status: 404 }
        )
    }

    return NextResponse.json({ asset })
}
