import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // 1. Get counts
        const [countBuyers, countLeads, countUsage] = await Promise.all([
            supabaseAdmin.from('buyers').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('usage_events').select('id', { count: 'exact', head: true })
        ])

        // 2. Get recent lists
        const [recentBuyersRes, recentLeadsRes] = await Promise.all([
            supabaseAdmin.from('buyers').select('*').order('created_at', { ascending: false }).limit(50),
            supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(50)
        ])

        const totalBuyers = countBuyers.count || 0;
        const totalLeads = countLeads.count || 0;
        const totalUsageEvents = countUsage.count || 0;
        const recentBuyers = recentBuyersRes.data || [];
        const recentLeads = recentLeadsRes.data || [];

        return NextResponse.json(
            {
                stats: { totalBuyers, totalLeads, totalUsageEvents },
                recentBuyers: recentBuyers.map((b: any) => ({ ...b, createdAt: b.created_at || new Date().toISOString() })),
                recentLeads: recentLeads.map((l: any) => ({ ...l, createdAt: l.created_at || new Date().toISOString() })),
            },
            {
                headers: {
                    "Cache-Control": "private, max-age=20, stale-while-revalidate=10",
                },
            }
        )
    } catch (error) {
        console.error("[Admin Stats] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
