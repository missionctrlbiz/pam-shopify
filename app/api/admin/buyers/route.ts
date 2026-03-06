import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Add a buyer
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { email } = await req.json()
        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const normalizedEmail = email.trim().toLowerCase()

        const buyer = await prisma.buyer.upsert({
            where: { email: normalizedEmail },
            update: {},
            create: { email: normalizedEmail },
        })

        return NextResponse.json({ id: buyer.id, email: buyer.email })
    } catch (error) {
        console.error("[Admin Buyers] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// List all buyers
export async function GET() {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const buyers = await prisma.buyer.findMany({ orderBy: { createdAt: "desc" } })
        return NextResponse.json({ buyers })
    } catch (error) {
        console.error("[Admin Buyers] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// Delete a buyer
export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 })
        }

        await prisma.buyer.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[Admin Buyers] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
