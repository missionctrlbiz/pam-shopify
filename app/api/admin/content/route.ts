import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"

const CONTENT_PATH = path.join(process.cwd(), "content", "site-content.json")

function readContent() {
    const raw = fs.readFileSync(CONTENT_PATH, "utf-8")
    return JSON.parse(raw)
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const content = readContent()
        return NextResponse.json({ content })
    } catch (err) {
        console.error("[content GET]", err)
        return NextResponse.json({ error: "Failed to read content" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        if (!body?.content || typeof body.content !== "object") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        // Validate required top-level keys
        const required = ["meta", "global", "homePage", "soapArchitectPage"]
        for (const key of required) {
            if (!(key in body.content)) {
                return NextResponse.json({ error: `Missing required key: ${key}` }, { status: 400 })
            }
        }

        fs.writeFileSync(CONTENT_PATH, JSON.stringify(body.content, null, 4), "utf-8")
        return NextResponse.json({ success: true, message: "Content updated successfully." })
    } catch (err) {
        console.error("[content PUT]", err)
        return NextResponse.json({ error: "Failed to write content" }, { status: 500 })
    }
}
