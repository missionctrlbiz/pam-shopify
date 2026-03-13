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
import prisma from "@/lib/prisma"
import type { RenderJobStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
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

    const where = statusFilter?.length ? { status: { in: statusFilter } } : {}

    const [jobs, total] = await Promise.all([
        prisma.renderJob.findMany({
            where,
            orderBy: { queuedAt: "desc" },
            take: limitParam,
            skip,
            include: {
                contentIdea: {
                    select: {
                        id: true,
                        calendarEntry: {
                            select: {
                                id: true,
                                dayNumber: true,
                                platform: true,
                                postType: true,
                                topic: true,
                                entryDate: true,
                            },
                        },
                    },
                },
                assets: {
                    select: {
                        id: true,
                        assetType: true,
                        platform: true,
                        status: true,
                        storageUrl: true,
                        fileName: true,
                    },
                },
            },
        }),
        prisma.renderJob.count({ where }),
    ])

    const hasActive = await prisma.renderJob.count({
        where: { status: { in: ["QUEUED", "RUNNING"] } },
    }).then((n) => n > 0)

    return NextResponse.json({
        jobs,
        total,
        hasActive,
        pagination: {
            page: pageParam,
            limit: limitParam,
            totalPages: Math.ceil(total / limitParam),
        },
    })
}
