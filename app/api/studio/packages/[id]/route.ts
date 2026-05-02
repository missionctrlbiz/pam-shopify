import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getStudioHandledError, parseStudioPackageRow, requireStudioAdmin } from "@/lib/studio/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params

        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .select("*")
            .eq("id", id)
            .eq("owner_id", ownerId)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!data) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        const { data: messages, error: messagesError } = await supabaseAdmin
            .from("studio_messages")
            .select("id,package_id,role,content,target,created_at")
            .eq("package_id", id)
            .order("created_at", { ascending: true })
            .limit(50)

        if (messagesError) {
            throw messagesError
        }

        return NextResponse.json({
            item: parseStudioPackageRow(data),
            messages: (messages ?? []).map((row) => ({
                id: row.id,
                packageId: row.package_id,
                role: row.role,
                content: row.content,
                target: row.target,
                createdAt: row.created_at,
            })),
        })
    } catch (error) {
        console.error("[studio/packages/:id] GET failed", error)
        const handled = getStudioHandledError(error, "Failed to load studio package")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params
        const body = await req.json().catch(() => ({})) as Record<string, unknown>

        const patch: Record<string, unknown> = {}
        if (typeof body.title === "string") patch.title = body.title.trim() || "Untitled"
        if (typeof body.status === "string") patch.status = body.status
        if (typeof body.sourcePrompt === "string" || body.sourcePrompt === null) patch.source_prompt = body.sourcePrompt
        if (typeof body.sourceText === "string" || body.sourceText === null) patch.source_text = body.sourceText
        if (body.carouselJson && typeof body.carouselJson === "object") patch.carousel_json = body.carouselJson
        if (body.captionsJson && typeof body.captionsJson === "object") patch.captions_json = body.captionsJson
        if (body.qualityJson && typeof body.qualityJson === "object") patch.quality_json = body.qualityJson

        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .update(patch)
            .eq("id", id)
            .eq("owner_id", ownerId)
            .select("*")
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!data) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        return NextResponse.json({ item: parseStudioPackageRow(data) })
    } catch (error) {
        console.error("[studio/packages/:id] PATCH failed", error)
        const handled = getStudioHandledError(error, "Failed to update studio package")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params

        const { error } = await supabaseAdmin
            .from("studio_packages")
            .update({ status: "ARCHIVED" })
            .eq("id", id)
            .eq("owner_id", ownerId)

        if (error) {
            throw error
        }

        return NextResponse.json({ archived: true })
    } catch (error) {
        console.error("[studio/packages/:id] DELETE failed", error)
        const handled = getStudioHandledError(error, "Failed to archive studio package")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}
