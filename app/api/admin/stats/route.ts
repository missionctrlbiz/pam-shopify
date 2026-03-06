import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const [totalBuyers, totalLeads, totalUsageEvents, recentBuyers, recentLeads] =
            await Promise.all([
                (prisma as any).buyer.count(),
                (prisma as any).lead.count(),
                (prisma as any).usageEvent.count(),
                (prisma as any).buyer.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
                (prisma as any).lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
            ])

        return NextResponse.json({
            stats: { totalBuyers, totalLeads, totalUsageEvents },
            recentBuyers: recentBuyers.map((b: any) => ({ ...b, createdAt: b.createdAt.toISOString() })),
            recentLeads: recentLeads.map((l: any) => ({ ...l, createdAt: l.createdAt.toISOString() })),
        })
    } catch (error) {
        console.error("[Admin Stats] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
