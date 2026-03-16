import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
    // 1. Authenticate with admin only for security
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")
    const filename = searchParams.get("filename") || searchParams.get("fileName")

    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

    try {
        const res = await fetch(url)

        if (!res.ok) return NextResponse.json({ error: "failed to fetch or authenticate blob" }, { status: res.status })

        const headers: Record<string, string> = {
            "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
            "Cache-Control": "public, max-age=3600",
        }

        if (filename) {
            headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(filename)}"`
        }

        return new Response(res.body, { headers })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
