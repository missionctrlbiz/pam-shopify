import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// Add a buyer
export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { email } = await req.json()
        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const normalizedEmail = email.trim().toLowerCase()


        const { data: buyer, error } = await supabaseAdmin
            .from("buyers")
            .upsert({ email: normalizedEmail }, { onConflict: "email" })
            .select("id, email")
            .single()

        if (error || !buyer) {
            console.error("[Admin Buyers] Supabase upsert error:", error)
            return NextResponse.json({ error: "Failed to whitelist buyer" }, { status: 500 })
        }

        return NextResponse.json({ id: buyer.id, email: buyer.email })
    } catch (error) {
        console.error("[Admin Buyers] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// List all buyers
export async function GET() {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { data: buyers, error } = await supabaseAdmin
            .from("buyers")
            .select("id, email, createdAt")
            .order("createdAt", { ascending: false })

        if (error) {
            console.error("[Admin Buyers] Fetch error:", error)
            return NextResponse.json({ error: "Server error" }, { status: 500 })
        }

        return NextResponse.json({ buyers: buyers ?? [] })
    } catch (error) {
        console.error("[Admin Buyers] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// Delete a buyer
export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from("buyers")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("[Admin Buyers] Delete error:", error)
            return NextResponse.json({ error: "Server error" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[Admin Buyers] Error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
