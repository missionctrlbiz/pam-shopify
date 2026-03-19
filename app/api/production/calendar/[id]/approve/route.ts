/**
 * PUT /api/production/calendar/[id]/approve
 *
 * Triggers the Quality Gate on the entry's ContentIdea, then transitions
 * the entry's publishStatus based on the result:
 *
 *   PASSED  → ProductionCalendarEntry.publishStatus = APPROVED
 *              ContentIdea.qualityGateStatus = PASSED
 *              approvedAt + approvedById set
 *
 *   FAILED  → ProductionCalendarEntry.publishStatus = DRAFT
 *              ContentIdea.qualityGateStatus = FAILED
 *              (admin must edit and re-submit)
 *
 * Optionally accepts { bypass: true } to skip the quality gate and force-approve.
 * This is logged — bypass reason string recommended.
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { runQualityGate, QualityGateInput } from "@/lib/production/qualityGate"

// Quality gate makes a Gemini call — can take 8–20 s on gemini-2.5-flash
export const maxDuration = 60

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json() as { bypass?: boolean; bypassReason?: string }

    // Fetch entry with idea
    const { data: entry, error } = await supabaseAdmin
        .from("production_calendar_entries")
        .select(`
            id,
            platform,
            postType:post_type,
            publishStatus:publish_status
        `)
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("[approve] Fetch error:", error)
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
        .select("id, masterJson:master_json, qualityGateStatus:quality_gate_status")
        .eq("calendar_entry_id", id)
        .maybeSingle()

    if (ideaError) {
        console.error("[approve] Content idea fetch error:", ideaError)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!contentIdea) {
        return NextResponse.json(
            { error: "This entry has no ContentIdea yet. Generate content first." },
            { status: 409 }
        )
    }

    if (!["DRAFT", "PENDING_APPROVAL", "APPROVED", "GENERATING", "FAILED"].includes(entry.publishStatus)) {
        return NextResponse.json(
            {
                error: `Entry is not in an approvable state. Current status: ${entry.publishStatus}`,
            },
            { status: 409 }
        )
    }

    const adminId = (session.user as { id?: string })?.id

    // ------------------------------------------------------------------
    // BYPASS path — skip quality gate, force-approve
    // ------------------------------------------------------------------
    if (body.bypass === true) {
        const [entryUpdate, ideaUpdate] = await Promise.all([
            supabaseAdmin
                .from("production_calendar_entries")
                .update({
                    publish_status: "APPROVED",
                    approved_at: new Date().toISOString(),
                    approved_by_id: adminId ?? null,
                })
                .eq("id", id),
            supabaseAdmin
                .from("content_ideas")
                .update({ quality_gate_status: "BYPASSED" })
                .eq("id", contentIdea.id),
        ])

        if (entryUpdate.error || ideaUpdate.error) {
            console.error("[approve] Bypass update error:", entryUpdate.error || ideaUpdate.error)
            return NextResponse.json({ error: "Failed to approve entry" }, { status: 500 })
        }

        return NextResponse.json({
            approved: true,
            bypass: true,
            bypassReason: body.bypassReason ?? null,
            entryId: id,
            newStatus: "APPROVED",
        })
    }

    // ------------------------------------------------------------------
    // QUALITY GATE path
    // ------------------------------------------------------------------
    const master = contentIdea.masterJson as {
        hook: string
        teachingPoints: string[]
        cta: string
        clinicalGrounding: string
    }

    const gateInput: QualityGateInput = {
        hook: master.hook ?? "",
        teachingPoints: master.teachingPoints ?? [],
        cta: master.cta ?? "",
        clinicalGrounding: master.clinicalGrounding ?? "",
        platform: entry.platform,
        postType: entry.postType,
    }

    let gateOutput
    try {
        gateOutput = await runQualityGate(gateInput)
    } catch (err) {
        console.error("[approve] Quality gate error:", err)
        return NextResponse.json(
            { error: "Quality gate service failed. Check logs." },
            { status: 502 }
        )
    }

    const newEntryStatus = gateOutput.passed ? "APPROVED" : "DRAFT"
    const newIdeaStatus = gateOutput.passed ? "PASSED" : "FAILED"

    const qgUpsert = await supabaseAdmin
        .from("quality_gate_results")
        .upsert({
            content_idea_id: contentIdea.id,
            question1: gateOutput.question1,
            question2: gateOutput.question2,
            question3: gateOutput.question3,
            question4: gateOutput.question4,
            question5: gateOutput.question5,
            score1: gateOutput.score1,
            score2: gateOutput.score2,
            score3: gateOutput.score3,
            score4: gateOutput.score4,
            score5: gateOutput.score5,
            overall_score: gateOutput.overallScore,
            passed: gateOutput.passed,
            gemini_raw_response: gateOutput as object,
            evaluated_at: new Date().toISOString(),
        }, { onConflict: "content_idea_id" })

    if (qgUpsert.error) {
        console.error("[approve] qgUpsert error:", qgUpsert.error)
        return NextResponse.json({ error: `upsert quality_gate_results: ${(qgUpsert.error as Error).message || qgUpsert.error.code}` }, { status: 500 })
    }

    const ideaUpdate = await supabaseAdmin
        .from("content_ideas")
        .update({ quality_gate_status: newIdeaStatus })
        .eq("id", contentIdea.id)

    if (ideaUpdate.error) {
        console.error("[approve] ideaUpdate error:", ideaUpdate.error)
        return NextResponse.json({ error: `update content_ideas: ${(ideaUpdate.error as Error).message || ideaUpdate.error.code}` }, { status: 500 })
    }

    const entryUpdate = await supabaseAdmin
        .from("production_calendar_entries")
        .update({
            publish_status: newEntryStatus,
            ...(gateOutput.passed
                ? { approved_at: new Date().toISOString(), approved_by_id: adminId ?? null }
                : {}),
        })
        .eq("id", id)

    if (entryUpdate.error) {
        console.error("[approve] entryUpdate error:", entryUpdate.error)
        return NextResponse.json({ error: `update entry: ${(entryUpdate.error as Error).message || entryUpdate.error.code}` }, { status: 500 })
    }

    return NextResponse.json({
        approved: gateOutput.passed,
        bypass: false,
        entryId: id,
        newStatus: newEntryStatus,
        qualityGate: {
            passed: gateOutput.passed,
            overallScore: gateOutput.overallScore,
            scores: {
                q1: gateOutput.score1,
                q2: gateOutput.score2,
                q3: gateOutput.score3,
                q4: gateOutput.score4,
                q5: gateOutput.score5,
            },
            reasoning: {
                q1: gateOutput.reasoning1,
                q2: gateOutput.reasoning2,
                q3: gateOutput.reasoning3,
                q4: gateOutput.reasoning4,
                q5: gateOutput.reasoning5,
            },
        },
    })
}
