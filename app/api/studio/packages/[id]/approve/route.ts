import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getStudioHandledError, parseStudioPackageRow, requireStudioAdmin } from "@/lib/studio/server"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params

        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .update({ status: "APPROVED" })
            .eq("id", id)
            .eq("owner_id", ownerId)
            .select("*")
            .maybeSingle()

        if (error) throw error
        if (!data) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        await supabaseAdmin.from("studio_messages").insert({
            package_id: id,
            role: "system",
            content: "Approved for manual distribution. Export assets and copy captions to schedule externally.",
            target: "CAROUSEL",
        })

        return NextResponse.json({ item: parseStudioPackageRow(data) })
    } catch (error) {
        console.error("[studio/packages/:id/approve] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to approve studio package")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}
