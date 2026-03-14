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

        return NextResponse.json(
            {
                stats: { totalBuyers, totalLeads, totalUsageEvents },
                recentBuyers: recentBuyers.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })),
                recentLeads: recentLeads.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
            },
            {
                headers: {
                    // Private cache: browser reuses this response for 20 s; stale-while-revalidate
                    // means the 21st-second fetch returns instantly from cache while refetching bg.
                    // Paired with POLL_INTERVAL=30 000 this prevents any double-invocation overhead.
                    "Cache-Control": "private, max-age=20, stale-while-revalidate=10",
                },
            },
        )
    } catch (error) {
        console.error("[Admin Stats] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
