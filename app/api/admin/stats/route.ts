import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const [totalBuyers, totalLeads, totalUsageEvents, recentBuyers, recentLeads] =
            await Promise.all([
                prisma.buyer.count(),
                prisma.lead.count(),
                prisma.usageEvent.count(),
                prisma.buyer.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
                prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
            ])

        return NextResponse.json({
            stats: { totalBuyers, totalLeads, totalUsageEvents },
            recentBuyers: recentBuyers.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })),
            recentLeads: recentLeads.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
        })
    } catch (error) {
        console.error("[Admin Stats] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
