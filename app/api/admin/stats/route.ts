import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const [totalBuyers, totalLeads, totalSoapNotes, totalUsageEvents, recentBuyers, recentLeads, recentSoapNotes] =
            await Promise.all([
                prisma.buyer.count(),
                prisma.lead.count(),
                prisma.soapHistory.count(),
                prisma.usageEvent.count(),
                prisma.buyer.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
                prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
                prisma.soapHistory.findMany({
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: { user: { select: { email: true, name: true } } },
                }),
            ])

        return NextResponse.json({
            stats: { totalBuyers, totalLeads, totalSoapNotes, totalUsageEvents },
            recentBuyers: recentBuyers.map(b => ({ ...b, createdAt: b.createdAt.toISOString() })),
            recentLeads: recentLeads.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
            recentSoapNotes: recentSoapNotes.map(s => ({
                ...s,
                createdAt: s.createdAt.toISOString(),
                user: s.user ? { email: s.user.email, name: s.user.name } : null,
            })),
        })
    } catch (error) {
        console.error("[Admin Stats] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
