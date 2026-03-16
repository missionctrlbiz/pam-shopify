import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { auth } from "@/lib/auth"

// ── DELETE /api/production/render-jobs/bulk ───────────────────────────────
// Body: { ids: string[] }
export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as { ids?: unknown }
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : []
    if (ids.length === 0) return NextResponse.json({ error: "No IDs provided" }, { status: 400 })

    const { error, count } = await supabaseAdmin
        .from("render_jobs")
        .delete({ count: "exact" })
        .in("id", ids)

    if (error) {
        console.error("[render-jobs/bulk] Delete error:", error)
        return NextResponse.json({ error: "Failed to delete render jobs" }, { status: 500 })
    }

    return NextResponse.json({ deleted: count ?? 0 })
}
