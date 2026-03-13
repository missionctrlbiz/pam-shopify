/**
 * POST /api/production/calendar/generate
 *
 * Generates a batch of ProductionCalendarEntry + ContentIdea rows by:
 *   1. Fetching a spread of active ClinicalField rows from Prisma
 *   2. Calling the Gemini Content Strategist for each day requested
 *   3. Persisting entries with status DRAFT
 *
 * Body params:
 *   startDate  — ISO date string for Day 1 (default: tomorrow)
 *   days       — number of entries to generate (default: 30, max: 30)
 *   overwrite  — if true, delete existing DRAFT entries before generating
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generateContentIdea } from "@/lib/production/contentStrategist"
import {
    Platform,
    FunnelStage,
    PostType,
} from "@prisma/client"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 30-day schedule template.
 * Defines the platform/postType/funnelStage/contentGoal rotation so the
 * generated calendar mirrors the SOP tracker columns exactly.
 * Repeat/cycle if fewer than 30 days are requested.
 */
const SCHEDULE_TEMPLATE: Array<{
    platform: Platform
    postType: PostType
    funnelStage: FunnelStage
    contentGoal: string
}> = [
        { platform: "IG", postType: "CAROUSEL", funnelStage: "AWARENESS", contentGoal: "Educate & build trust with PMHNP students" },
        { platform: "TIKTOK", postType: "VIDEO", funnelStage: "AWARENESS", contentGoal: "Hook new audience with clinical tension" },
        { platform: "LINKEDIN", postType: "TEXT_POST", funnelStage: "CONSIDERATION", contentGoal: "Establish Tonia as clinical thought leader" },
        { platform: "IG", postType: "REEL", funnelStage: "AWARENESS", contentGoal: "Convert scroll to follow with quick clinical tip" },
        { platform: "FB", postType: "TEXT_POST", funnelStage: "CONSIDERATION", contentGoal: "Drive community discussion around clinical challenges" },
        { platform: "EMAIL", postType: "EMAIL_LESSON", funnelStage: "CONVERSION", contentGoal: "Nurture leads toward PAM Mastery Bundle purchase" },
        { platform: "IG", postType: "CAROUSEL", funnelStage: "CONSIDERATION", contentGoal: "Deepen expertise, drive saves" },
        { platform: "TIKTOK", postType: "VIDEO", funnelStage: "AWARENESS", contentGoal: "Reach new PMHNP students with high-yield tip" },
        { platform: "IG", postType: "STORY", funnelStage: "RETENTION", contentGoal: "Re-engage existing followers with poll/quiz" },
        { platform: "LINKEDIN", postType: "TEXT_POST", funnelStage: "CONVERSION", contentGoal: "Drive clicks to PAM product page" },
        { platform: "IG", postType: "CAROUSEL", funnelStage: "AWARENESS", contentGoal: "Educate & build trust with PMHNP students" },
        { platform: "VIDEO", postType: "VIDEO", funnelStage: "CONSIDERATION", contentGoal: "Deliver AI voice educational video for YouTube/IG" },
        { platform: "EMAIL", postType: "EMAIL_LESSON", funnelStage: "CONVERSION", contentGoal: "Abandoned cart sequence — highlight PAM bundle value" },
        { platform: "TIKTOK", postType: "REEL", funnelStage: "AWARENESS", contentGoal: "Viral potential — clinical myth-busting" },
        { platform: "IG", postType: "CAROUSEL", funnelStage: "CONVERSION", contentGoal: "Social proof + direct offer CTA" },
        { platform: "FB", postType: "TEXT_POST", funnelStage: "RETENTION", contentGoal: "Long-form case breakdown, drive group engagement" },
        { platform: "IG", postType: "REEL", funnelStage: "AWARENESS", contentGoal: "Broad reach — hook on diagnostic mistake" },
        { platform: "LINKEDIN", postType: "TEXT_POST", funnelStage: "CONSIDERATION", contentGoal: "Build professional credibility, invite follows" },
        { platform: "EMAIL", postType: "EMAIL_LESSON", funnelStage: "CONVERSION", contentGoal: "Final nudge sequence — last chance bundle offer" },
        { platform: "IG", postType: "CAROUSEL", funnelStage: "CONSIDERATION", contentGoal: "Deep-dive clinical skill, drive saves" },
        { platform: "TIKTOK", postType: "VIDEO", funnelStage: "AWARENESS", contentGoal: "New audience acquisition — trending audio format" },
        { platform: "IG", postType: "STORY", funnelStage: "RETENTION", contentGoal: "Ask-me-anything or rapid-fire clinical tips" },
        { platform: "VIDEO", postType: "VIDEO", funnelStage: "CONSIDERATION", contentGoal: "Second weekly AI voice video — MSE deep-dive" },
        { platform: "LINKEDIN", postType: "TEXT_POST", funnelStage: "CONVERSION", contentGoal: "Testimonial + direct link to PAM bundle" },
        { platform: "IG", postType: "CAROUSEL", funnelStage: "AWARENESS", contentGoal: "Top-of-funnel awareness — shareable quick reference" },
        { platform: "FB", postType: "TEXT_POST", funnelStage: "CONSIDERATION", contentGoal: "Group warm-up, invite replies" },
        { platform: "EMAIL", postType: "EMAIL_LESSON", funnelStage: "RETENTION", contentGoal: "Post-purchase onboarding email mini-lesson" },
        { platform: "TIKTOK", postType: "REEL", funnelStage: "AWARENESS", contentGoal: "Clinical storytelling — patient scenario hook" },
        { platform: "IG", postType: "CAROUSEL", funnelStage: "CONVERSION", contentGoal: "Month-end conversion push — bundle CTA" },
        { platform: "EMAIL", postType: "EMAIL_LESSON", funnelStage: "CONVERSION", contentGoal: "Day 30 — re-engagement + strong purchase CTA" },
    ]

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    // Auth guard
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json().catch(() => ({}))
        const days = Math.min(Number(body.days ?? 30), 30)
        const overwrite = Boolean(body.overwrite ?? false)
        const startDate = body.startDate
            ? new Date(body.startDate)
            : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d })()

        const generatedById = (session.user as { id?: string })?.id
        if (!generatedById) {
            return NextResponse.json({ error: "Session user ID missing" }, { status: 400 })
        }

        // Optionally clear existing DRAFT entries
        if (overwrite) {
            await prisma.productionCalendarEntry.deleteMany({
                where: { publishStatus: "DRAFT" },
            })
        }

        // Fetch a spread of active clinical fields (all categories represented)
        const clinicalFields = await prisma.clinicalField.findMany({
            where: { isActive: true },
            orderBy: { fieldCategory: "asc" },
        })

        if (clinicalFields.length === 0) {
            return NextResponse.json(
                { error: "No active ClinicalField records found. Run the seed first." },
                { status: 422 }
            )
        }

        const results = []
        const errors: string[] = []

        for (let i = 0; i < days; i++) {
            const template = SCHEDULE_TEMPLATE[i % SCHEDULE_TEMPLATE.length]
            const field = clinicalFields[i % clinicalFields.length]
            const entryDate = new Date(startDate)
            entryDate.setDate(startDate.getDate() + i)

            try {
                const { masterJson, rawPrompt } = await generateContentIdea(
                    {
                        fieldKey: field.fieldKey,
                        displayName: field.displayName,
                        fieldCategory: field.fieldCategory,
                        description: field.description,
                        clinicalContext: field.clinicalContext,
                    },
                    {
                        platform: template.platform,
                        postType: template.postType,
                        funnelStage: template.funnelStage,
                        contentGoal: template.contentGoal,
                        dayNumber: i + 1,
                    }
                )

                // Create entry + idea in a transaction
                const entry = await prisma.$transaction(async (tx) => {
                    const calEntry = await tx.productionCalendarEntry.create({
                        data: {
                            dayNumber: i + 1,
                            entryDate,
                            platform: template.platform,
                            topic: field.displayName,
                            contentGoal: template.contentGoal,
                            funnelStage: template.funnelStage,
                            postType: template.postType,
                            hook: masterJson.hook,
                            cta: masterJson.cta,
                            publishStatus: "DRAFT",
                        },
                    })

                    await tx.contentIdea.create({
                        data: {
                            calendarEntryId: calEntry.id,
                            clinicalFieldId: field.id,
                            masterJson: masterJson as object,
                            rawGeminiPrompt: rawPrompt,
                            qualityGateStatus: "PENDING",
                            generatedById,
                        },
                    })

                    return calEntry
                })

                results.push({ dayNumber: i + 1, entryId: entry.id, topic: field.displayName })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                errors.push(`Day ${i + 1} (${field.fieldKey}): ${msg}`)
                console.error(`[calendar/generate] Day ${i + 1} failed:`, err)
            }
        }

        return NextResponse.json(
            {
                generated: results.length,
                failed: errors.length,
                entries: results,
                errors: errors.length > 0 ? errors : undefined,
            },
            { status: errors.length > 0 && results.length === 0 ? 500 : 207 }
        )
    } catch (err) {
        console.error("[calendar/generate] Unexpected error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
