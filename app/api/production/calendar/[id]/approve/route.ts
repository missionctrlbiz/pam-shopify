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
import prisma from "@/lib/prisma"
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
    const entry = await prisma.productionCalendarEntry.findUnique({
        where: { id },
        include: {
            contentIdea: {
                select: {
                    id: true,
                    masterJson: true,
                    qualityGateStatus: true,
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
        await prisma.$transaction([
            prisma.productionCalendarEntry.update({
                where: { id },
                data: {
                    publishStatus: "APPROVED",
                    approvedAt: new Date(),
                    approvedById: adminId ?? null,
                },
            }),
            prisma.contentIdea.update({
                where: { id: entry.contentIdea.id },
                data: { qualityGateStatus: "BYPASSED" },
            }),
        ])

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
    const master = entry.contentIdea.masterJson as {
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

    await prisma.$transaction([
        // Upsert the QualityGateResult
        prisma.qualityGateResult.upsert({
            where: { contentIdeaId: entry.contentIdea.id },
            create: {
                contentIdeaId: entry.contentIdea.id,
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
                overallScore: gateOutput.overallScore,
                passed: gateOutput.passed,
                geminiRawResponse: gateOutput as object,
            },
            update: {
                score1: gateOutput.score1,
                score2: gateOutput.score2,
                score3: gateOutput.score3,
                score4: gateOutput.score4,
                score5: gateOutput.score5,
                overallScore: gateOutput.overallScore,
                passed: gateOutput.passed,
                geminiRawResponse: gateOutput as object,
                evaluatedAt: new Date(),
            },
        }),
        // Update ContentIdea status
        prisma.contentIdea.update({
            where: { id: entry.contentIdea.id },
            data: { qualityGateStatus: newIdeaStatus },
        }),
        // Update Calendar Entry status
        prisma.productionCalendarEntry.update({
            where: { id },
            data: {
                publishStatus: newEntryStatus,
                ...(gateOutput.passed
                    ? { approvedAt: new Date(), approvedById: adminId ?? null }
                    : {}),
            },
        }),
    ])

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
