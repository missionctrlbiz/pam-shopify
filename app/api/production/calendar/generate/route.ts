/**
 * POST /api/production/calendar/generate
 *
 * Generates a batch of ProductionCalendarEntry + ContentIdea rows by:
 *   1. Fetching a spread of active ClinicalField rows from Supabase
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
import { tasks } from "@trigger.dev/sdk"
import { auth } from "@/lib/auth"
import { runCalendarGenerationBatch } from "@/lib/production/calendarGeneration"
import type { productionCalendarBatchTask } from "@/trigger/production"

// Allow up to 5 minutes for batch generation (Vercel Pro / Fluid compute)
export const maxDuration = 300

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    // Auth guard
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json().catch(() => ({}))
        const days = Math.min(Number(body.days ?? 30), 30)
        const offset = Math.max(Number(body.offset ?? 0), 0)
        const overwrite = Boolean(body.overwrite ?? false)
        const startDate = body.startDate
            ? new Date(body.startDate)
            : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d })()

        const generatedById = (session.user as { id?: string })?.id
        if (!generatedById) {
            return NextResponse.json({ error: "Session user ID missing" }, { status: 400 })
        }

        const triggerConfigured = Boolean(process.env.TRIGGER_SECRET_KEY)

        if (triggerConfigured && days > 1) {
            const handle = await tasks.triggerAndWait<typeof productionCalendarBatchTask>("production-calendar-batch", {
                days,
                offset,
                overwrite,
                startDate: startDate.toISOString(),
                generatedById,
            })

            if (!handle.ok) {
                return NextResponse.json({
                    error: `Trigger run failed: ${String(handle.error)}`,
                }, { status: 500 })
            }

            const runData = handle.output as { generated?: number, failed?: number, entries?: unknown[], errors?: string[] } | undefined

            return NextResponse.json({
                generated: runData?.generated ?? 0,
                failed: runData?.failed ?? 0,
                entries: runData?.entries ?? [],
                queued: false,
                batchId: handle.id,
                requestedDays: days,
                message: `Successfully generated ${runData?.generated ?? 0} entries.`,
            }, { status: 200 })
        }
        const result = await runCalendarGenerationBatch({
            days,
            offset,
            overwrite,
            startDate: startDate.toISOString(),
            generatedById,
        })

        return NextResponse.json(
            result,
            { status: result.failed > 0 && result.generated === 0 ? 500 : 207 }
        )
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error("[calendar/generate] Unexpected error:", err)
        const isDev = process.env.NODE_ENV === "development"
        return NextResponse.json(
            { error: "Internal server error", ...(isDev && { detail: errMsg }) },
            { status: 500 }
        )
    }
}
