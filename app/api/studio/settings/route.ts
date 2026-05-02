import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureStudioSettings, getStudioHandledError, parseStudioSettingsRow, requireStudioAdmin } from "@/lib/studio/server"

export async function GET() {
    try {
        const ownerId = await requireStudioAdmin()
        const settings = await ensureStudioSettings(ownerId)
        return NextResponse.json({ item: settings })
    } catch (error) {
        console.error("[studio/settings] GET failed", error)
        const handled = getStudioHandledError(error, "Failed to load studio settings")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}

export async function PATCH(req: Request) {
    try {
        const ownerId = await requireStudioAdmin()
        const body = await req.json().catch(() => ({})) as Record<string, unknown>

        const patch: Record<string, unknown> = {}
        if (body.brandJson && typeof body.brandJson === "object") patch.brand_json = body.brandJson
        if (Array.isArray(body.ctaPresets)) patch.cta_presets = body.ctaPresets
        if (typeof body.tone === "string") patch.tone = body.tone
        if (typeof body.hookStyle === "string") patch.hook_style = body.hookStyle
        if (typeof body.hashtagCluster === "string") patch.hashtag_cluster = body.hashtagCluster
        if (typeof body.modelStrategist === "string") patch.model_strategist = body.modelStrategist
        if (typeof body.modelGate === "string") patch.model_gate = body.modelGate
        if (typeof body.gateThreshold === "number") patch.gate_threshold = body.gateThreshold
        if (typeof body.defaultSlides === "number") patch.default_slides = body.defaultSlides
        if (typeof body.alwaysSay === "string" || body.alwaysSay === null) patch.always_say = body.alwaysSay
        if (typeof body.neverSay === "string" || body.neverSay === null) patch.never_say = body.neverSay

        const ensured = await ensureStudioSettings(ownerId)
        const { data, error } = await supabaseAdmin
            .from("studio_settings")
            .update(patch)
            .eq("owner_id", ensured.ownerId)
            .select("*")
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ item: parseStudioSettingsRow(data) })
    } catch (error) {
        console.error("[studio/settings] PATCH failed", error)
        const handled = getStudioHandledError(error, "Failed to update studio settings")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}