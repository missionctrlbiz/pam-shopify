import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { runStudioQualityGate } from "@/lib/studio/ai"
import { ensureStudioSettings, getStudioHandledError, parseStudioPackageRow, requireStudioAdmin } from "@/lib/studio/server"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params

        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .select("*")
            .eq("id", id)
            .eq("owner_id", ownerId)
            .maybeSingle()

        if (error) throw error
        if (!data) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        const pkg = parseStudioPackageRow(data)
        if (pkg.carouselJson.slides.length === 0) {
            return NextResponse.json({ error: "Generate or add slides before running the quality gate" }, { status: 400 })
        }

        const settings = await ensureStudioSettings(ownerId)
        const qualityJson = await runStudioQualityGate(pkg, settings)

        const { data: updated, error: updateError } = await supabaseAdmin
            .from("studio_packages")
            .update({
                quality_json: qualityJson,
                status: qualityJson.passed ? "READY" : "DRAFT",
            })
            .eq("id", id)
            .eq("owner_id", ownerId)
            .select("*")
            .single()

        if (updateError) throw updateError

        return NextResponse.json({ item: parseStudioPackageRow(updated) })
    } catch (error) {
        console.error("[studio/packages/:id/quality-gate] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to run studio quality gate")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}
