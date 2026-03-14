/**
 * POST /api/production/quality-gate
 *
 * Runs the 5-question Anti-Generic Quality Filter on a ContentIdea.
 *
 * Body params:
 *   contentIdeaId — required. The ID of the ContentIdea to evaluate.
 *
 * Behaviour:
 *   - Calls the Gemini quality gate service function
 *   - Creates a QualityGateResult row (upserts if re-running)
 *   - If PASSED:
 *       ContentIdea.qualityGateStatus  → PASSED
 *       ProductionCalendarEntry.publishStatus → PENDING_APPROVAL
 *   - If FAILED:
 *       ContentIdea.qualityGateStatus  → FAILED
 *       ProductionCalendarEntry.publishStatus → DRAFT  (returned for editing)
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { runQualityGate, QualityGateInput } from "@/lib/production/qualityGate"

// Gemini call can take 8–20 s on gemini-2.5-flash
export const maxDuration = 60

export async function POST(req: NextRequest) {
    // Auth guard
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { contentIdeaId } = await req.json()

        if (!contentIdeaId || typeof contentIdeaId !== "string") {
            return NextResponse.json(
                { error: "contentIdeaId is required" },
                { status: 400 }
            )
        }

        // Fetch the ContentIdea with its parent calendar entry
        const idea = await prisma.contentIdea.findUnique({
            where: { id: contentIdeaId },
            include: {
                calendarEntry: {
                    select: {
                        id: true,
                        platform: true,
                        postType: true,
                        publishStatus: true,
                    },
                },
            },
        })

        if (!idea) {
            return NextResponse.json(
                { error: `ContentIdea not found: ${contentIdeaId}` },
                { status: 404 }
            )
        }

        // Extract typed fields from the stored masterJson
        const master = idea.masterJson as {
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
            platform: idea.calendarEntry.platform,
            postType: idea.calendarEntry.postType,
        }

        // Run the quality gate via Gemini
        const result = await runQualityGate(gateInput)

        // Persist result + update statuses in a single transaction
        const [qgResult] = await prisma.$transaction([
            // Upsert the QualityGateResult (safe to re-run)
            prisma.qualityGateResult.upsert({
                where: { contentIdeaId },
                update: {
                    question1: result.question1, question2: result.question2,
                    question3: result.question3, question4: result.question4,
                    question5: result.question5,
                    score1: result.score1, score2: result.score2,
                    score3: result.score3, score4: result.score4,
                    score5: result.score5,
                    overallScore: result.overallScore,
                    passed: result.passed,
                    geminiRawResponse: result as object,
                    evaluatedAt: new Date(),
                },
                create: {
                    contentIdeaId,
                    question1: result.question1, question2: result.question2,
                    question3: result.question3, question4: result.question4,
                    question5: result.question5,
                    score1: result.score1, score2: result.score2,
                    score3: result.score3, score4: result.score4,
                    score5: result.score5,
                    overallScore: result.overallScore,
                    passed: result.passed,
                    geminiRawResponse: result as object,
                },
            }),

            // Update ContentIdea qualityGateStatus
            prisma.contentIdea.update({
                where: { id: contentIdeaId },
                data: { qualityGateStatus: result.passed ? "PASSED" : "FAILED" },
            }),

            // Update parent calendar entry publishStatus
            prisma.productionCalendarEntry.update({
                where: { id: idea.calendarEntry.id },
                data: { publishStatus: result.passed ? "PENDING_APPROVAL" : "DRAFT" },
            }),
        ])

        return NextResponse.json({
            passed: result.passed,
            overallScore: result.overallScore,
            scores: {
                q1: result.score1, q2: result.score2, q3: result.score3,
                q4: result.score4, q5: result.score5,
            },
            reasoning: {
                q1: result.reasoning1, q2: result.reasoning2, q3: result.reasoning3,
                q4: result.reasoning4, q5: result.reasoning5,
            },
            qualityGateResultId: qgResult.id,
            newCalendarStatus: result.passed ? "PENDING_APPROVAL" : "DRAFT",
        })
    } catch (err) {
        console.error("[quality-gate] POST error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
