import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getStudioHandledError, parseStudioPackageListRow, parseStudioPackageRow, requireStudioAdmin } from "@/lib/studio/server"
import { createDefaultStudioPackage } from "@/lib/studio/types"

export async function GET() {
    try {
        const ownerId = await requireStudioAdmin()

        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .select("id,title,status,source_type,carousel_json,quality_json,created_at,updated_at")
            .eq("owner_id", ownerId)
            .neq("status", "ARCHIVED")
            .order("updated_at", { ascending: false })

        if (error) {
            throw error
        }

        return NextResponse.json({ items: (data ?? []).map(parseStudioPackageListRow) })
    } catch (error) {
        console.error("[studio/packages] GET failed", error)
        const handled = getStudioHandledError(error, "Failed to load studio packages")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}

export async function POST(req: Request) {
    try {
        const ownerId = await requireStudioAdmin()
        const body = await req.json().catch(() => ({})) as { title?: string; sourcePrompt?: string | null }
        const defaults = createDefaultStudioPackage(ownerId)

        const payload = {
            owner_id: ownerId,
            title: body.title?.trim() || defaults.title,
            status: defaults.status,
            source_type: defaults.sourceType,
            source_prompt: body.sourcePrompt ?? defaults.sourcePrompt,
            source_blob_path: defaults.sourceBlobPath,
            source_text: defaults.sourceText,
            carousel_json: defaults.carouselJson,
            captions_json: defaults.captionsJson,
            quality_json: defaults.qualityJson,
        }

        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .insert(payload)
            .select("*")
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ item: parseStudioPackageRow(data) }, { status: 201 })
    } catch (error) {
        console.error("[studio/packages] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to create studio package")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}
