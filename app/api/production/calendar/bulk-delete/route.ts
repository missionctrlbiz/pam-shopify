/**
 * POST /api/production/calendar/bulk-delete
 *
 * Deletes multiple calendar entries by ID.
 *
 * Body params:
 *   ids: string[] - Array of ProductionCalendarEntry IDs to delete.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { ids } = await req.json()
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from("production_calendar_entries")
            .delete()
            .in("id", ids)
            .select("id")

        if (error) {
            console.error("[bulk-delete] Supabase error:", error)
            return NextResponse.json({ error: "Database error during deletion" }, { status: 500 })
        }

        return NextResponse.json({ deleted: data?.length ?? 0 })
    } catch (err) {
        console.error("[bulk-delete] Exception:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
