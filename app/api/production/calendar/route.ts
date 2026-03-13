/**
 * GET /api/production/calendar
 *
 * Returns all ProductionCalendarEntry rows ordered by entryDate, with their
 * associated ContentIdea (and QualityGateResult if available) included.
 *
 * Query params:
 *   status   — filter by PublishStatus (optional)
 *   platform — filter by Platform enum value (optional)
 *   page     — 1-based page number (default: 1)
 *   limit    — rows per page (default: 30, max: 30)
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PublishStatus, Platform } from "@prisma/client"

export async function GET(req: NextRequest) {
    // Auth guard
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)

        const statusParam = searchParams.get("status") as PublishStatus | null
        const platformParam = searchParams.get("platform") as Platform | null
        const page = Math.max(1, Number(searchParams.get("page") ?? 1))
        const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") ?? 30)))
        const skip = (page - 1) * limit

        // Validate enum values if provided
        const validStatuses: PublishStatus[] = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "GENERATING", "SCHEDULED", "PUBLISHED", "ARCHIVED"]
        const validPlatforms: Platform[] = ["IG", "FB", "TIKTOK", "LINKEDIN", "EMAIL", "VIDEO"]

        const statusFilter = statusParam && validStatuses.includes(statusParam) ? statusParam : undefined
        const platformFilter = platformParam && validPlatforms.includes(platformParam) ? platformParam : undefined

        const [entries, total] = await Promise.all([
            prisma.productionCalendarEntry.findMany({
                where: {
                    ...(statusFilter && { publishStatus: statusFilter }),
                    ...(platformFilter && { platform: platformFilter }),
                },
                include: {
                    contentIdea: {
                        include: {
                            qualityGateResult: true,
                            clinicalField: {
                                select: { fieldKey: true, displayName: true, fieldCategory: true },
                            },
                        },
                    },
                },
                orderBy: { entryDate: "asc" },
                skip,
                take: limit,
            }),

            prisma.productionCalendarEntry.count({
                where: {
                    ...(statusFilter && { publishStatus: statusFilter }),
                    ...(platformFilter && { platform: platformFilter }),
                },
            }),
        ])

        return NextResponse.json({
            entries,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (err) {
        console.error("[calendar] GET error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
