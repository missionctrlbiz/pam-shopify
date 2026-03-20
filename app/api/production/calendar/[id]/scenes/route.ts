/**
 * POST /api/production/calendar/[id]/scenes
 *
 * Expands a ProductionCalendarEntry's content idea into a full scene-by-scene
 * storyboard using sceneDirector.ts (second Gemini call).
 *
 * Body (optional):
 *   { platform?: string; postType?: string; forceRefresh?: boolean }
 *
 * Behavior:
 *   1. Auth guard — admin only
 *   2. Fetch entry + contentIdea including masterJson and existing videoScript
 *   3. If scriptJson.scenes already populated AND forceRefresh !== true → return cache
 *   4. Run expandToSceneDirectorScript(masterJson, platform, postType)
 *   5. Upsert VideoScript.scriptJson with scene data merged
 *   6. Merge scenes into ContentIdea.masterJson for convenience
 *   7. Return { scenes, voiceoverFull, platformPromptBank, totalDurationSecs }
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { expandToSceneDirectorScript } from "@/lib/production/sceneDirector"
import type { ContentIdeaMasterJson } from "@/lib/production/contentStrategist"

// sceneDirector makes up to 2 Gemini calls (retry logic) — can take 15–40 s
export const maxDuration = 60

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // ── Parse optional body ─────────────────────────────────────────────────
    let platform = undefined
    let postType = undefined
    let forceRefresh = false
    try {
        const body = await req.json()
        if (body.platform) platform = body.platform
        if (body.postType) postType = body.postType
        if (body.forceRefresh === true) forceRefresh = true
    } catch {
        // Body is optional — use defaults
    }

    // ── Fetch entry ─────────────────────────────────────────────────────────
    const { data: entry, error } = await supabaseAdmin
        .from("production_calendar_entries")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("[scenes] Entry fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!entry) {
        return NextResponse.json(
            { error: `Calendar entry not found: ${id}` },
            { status: 404 }
        )
    }

    const { data: contentIdea, error: ideaError } = await supabaseAdmin
        .from("content_ideas")
        .select("id, masterJson:master_json")
        .eq("calendar_entry_id", id)
        .maybeSingle()

    if (ideaError) {
        console.error("[scenes] Content idea fetch error:", ideaError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!contentIdea) {
        return NextResponse.json(
            { error: "Entry has no content idea — run generate first" },
            { status: 422 }
        )
    }

    const masterJson = contentIdea.masterJson as unknown as ContentIdeaMasterJson

    // ── Cache hit ────────────────────────────────────────────────────────────
    const { data: existingScript } = await supabaseAdmin
        .from("video_scripts")
        .select("scriptJson:script_json")
        .eq("content_idea_id", contentIdea.id)
        .maybeSingle()

    const existingScriptJson = existingScript?.scriptJson as Record<string, unknown> | null

    if (
        !forceRefresh &&
        existingScriptJson?.scenes &&
        Array.isArray(existingScriptJson.scenes) &&
        (existingScriptJson.scenes as unknown[]).length > 0
    ) {
        return NextResponse.json({
            cached: true,
            scenes: existingScriptJson.scenes,
            voiceoverFull: existingScriptJson.voiceoverFull,
            platformPromptBank: existingScriptJson.platformPromptBank,
            totalDurationSecs: existingScriptJson.totalDurationSecs,
        })
    }

    // ── Expand via Gemini ────────────────────────────────────────────────────
    const result = await expandToSceneDirectorScript(masterJson, platform || entry.platform, postType || entry.postType)

    // ── Upsert VideoScript ───────────────────────────────────────────────────
    const scriptJsonPayload = {
        ...(existingScriptJson ?? {}),
        scenes: result.scenes,
        voiceoverFull: result.voiceoverFull,
        platformPromptBank: result.platformPromptBank,
        totalDurationSecs: result.totalDurationSecs,
    }

    const { error: scriptError } = await supabaseAdmin
        .from("video_scripts")
        .upsert({
            content_idea_id: contentIdea.id,
            script_json: scriptJsonPayload as unknown as object,
            total_duration_secs: result.totalDurationSecs,
        }, { onConflict: "content_idea_id" })

    if (scriptError) {
        console.error("[scenes] Video script upsert error:", scriptError)
        return NextResponse.json({ error: "Failed to save video script" }, { status: 500 })
    }

    // ── Also merge back into ContentIdea.masterJson ──────────────────────────
    // (convenience — so the idea card can read scenes without joining VideoScript)
    const updatedMasterJson: ContentIdeaMasterJson = {
        ...masterJson,
        scenes: result.scenes,
        voiceoverFull: result.voiceoverFull,
        platformPromptBank: result.platformPromptBank,
        totalDurationSecs: result.totalDurationSecs,
    }

    const { error: ideaUpdateError } = await supabaseAdmin
        .from("content_ideas")
        .update({ master_json: updatedMasterJson as unknown as object })
        .eq("id", contentIdea.id)

    if (ideaUpdateError) {
        console.error("[scenes] Content idea update error:", ideaUpdateError)
        return NextResponse.json({ error: "Failed to update content idea" }, { status: 500 })
    }

    return NextResponse.json({
        cached: false,
        scenes: result.scenes,
        voiceoverFull: result.voiceoverFull,
        platformPromptBank: result.platformPromptBank,
        totalDurationSecs: result.totalDurationSecs,
    })
}
