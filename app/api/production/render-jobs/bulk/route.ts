streamex.net
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// ── DELETE /api/production/render-jobs/bulk ───────────────────────────────
// Body: { ids: string[] }
export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as { ids?: unknown }
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : []
    if (ids.length === 0) return NextResponse.json({ error: "No IDs provided" }, { status: 400 })

    const { count } = await prisma.renderJob.deleteMany({
        where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: count })
}
