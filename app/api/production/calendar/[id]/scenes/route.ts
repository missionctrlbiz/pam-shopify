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
import prisma from "@/lib/prisma"
import { expandToSceneDirectorScript } from "@/lib/production/sceneDirector"
import type { ContentIdeaMasterJson } from "@/lib/production/contentStrategist"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // ── Parse optional body ─────────────────────────────────────────────────
    let platform = "IG"
    let postType = "CAROUSEL"
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
    const entry = await prisma.productionCalendarEntry.findUnique({
        where: { id },
        include: {
            contentIdea: {
                include: {
                    videoScript: true,
                },
            },
        },
    })

    if (!entry) {
        return NextResponse.json(
            { error: `Calendar entry not found: ${id}` },
            { status: 404 }
        )
    }

    if (!entry.contentIdea) {
        return NextResponse.json(
            { error: "Entry has no content idea — run generate first" },
            { status: 422 }
        )
    }

    const masterJson = entry.contentIdea.masterJson as unknown as ContentIdeaMasterJson

    // ── Cache hit ────────────────────────────────────────────────────────────
    const existingScript = entry.contentIdea.videoScript
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
    const result = await expandToSceneDirectorScript(masterJson, platform, postType)

    // ── Upsert VideoScript ───────────────────────────────────────────────────
    const scriptJsonPayload = {
        ...(existingScriptJson ?? {}),
        scenes: result.scenes,
        voiceoverFull: result.voiceoverFull,
        platformPromptBank: result.platformPromptBank,
        totalDurationSecs: result.totalDurationSecs,
    }

    await prisma.videoScript.upsert({
        where: { contentIdeaId: entry.contentIdea.id },
        create: {
            contentIdeaId: entry.contentIdea.id,
            scriptJson: scriptJsonPayload as unknown as object,
            totalDurationSecs: result.totalDurationSecs,
        },
        update: {
            scriptJson: scriptJsonPayload as unknown as object,
            totalDurationSecs: result.totalDurationSecs,
        },
    })

    // ── Also merge back into ContentIdea.masterJson ──────────────────────────
    // (convenience — so the idea card can read scenes without joining VideoScript)
    const updatedMasterJson: ContentIdeaMasterJson = {
        ...masterJson,
        scenes: result.scenes,
        voiceoverFull: result.voiceoverFull,
        platformPromptBank: result.platformPromptBank,
        totalDurationSecs: result.totalDurationSecs,
    }

    await prisma.contentIdea.update({
        where: { id: entry.contentIdea.id },
        data: { masterJson: updatedMasterJson as unknown as object },
    })

    return NextResponse.json({
        cached: false,
        scenes: result.scenes,
        voiceoverFull: result.voiceoverFull,
        platformPromptBank: result.platformPromptBank,
        totalDurationSecs: result.totalDurationSecs,
    })
}
