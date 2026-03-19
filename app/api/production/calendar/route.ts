/**
 * GET /api/production/calendar
 *
 * Returns all ProductionCalendarEntry rows ordered by entryDate, with their
 * associated ContentIdea (and QualityGateResult if available) included.
 *
 * Query params:
 *   status   — filter by PublishStatus (optional)
 *   platform — filter by Platform enum value (optional)
 *   page     — 1-based page number (default: 1)
 *   limit    — rows per page (default: 30, max: 30)
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { PublishStatus, Platform } from "@/lib/enums"

export async function GET(req: NextRequest) {
    // Auth guard
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)

        const statusParam = searchParams.get("status") as PublishStatus | null
        const platformParam = searchParams.get("platform") as Platform | null
        const page = Math.max(1, Number(searchParams.get("page") ?? 1))
        const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? 10)))
        const skip = (page - 1) * limit

        // Validate enum values if provided
        const validStatuses: PublishStatus[] = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "GENERATING", "SCHEDULED", "PUBLISHED", "ARCHIVED"]
        const validPlatforms: Platform[] = ["IG", "FB", "TIKTOK", "LINKEDIN", "EMAIL", "VIDEO"]

        const statusFilter = statusParam && validStatuses.includes(statusParam) ? statusParam : undefined
        const platformFilter = platformParam && validPlatforms.includes(platformParam) ? platformParam : undefined

        const selectClause = `
            id,
            dayNumber:day_number,
            entryDate:entry_date,
            platform,
            postType:post_type,
            publishStatus:publish_status,
            topic,
            contentGoal:content_goal,
            contentIdea:content_ideas(
                id,
                masterJson:master_json,
                qualityGateStatus:quality_gate_status,
                qualityGateResult:quality_gate_results(*),
                clinicalField:clinical_fields(fieldKey:field_key, displayName:display_name, fieldCategory:field_category)
            )`

        let query = supabaseAdmin
            .from("production_calendar_entries")
            .select(selectClause, { count: "exact" })

        if (statusFilter) {
            query = query.eq("publish_status", statusFilter)
        }

        if (platformFilter) {
            query = query.eq("platform", platformFilter)
        }

        query = query
            .order("entry_date", { ascending: true })
            .range(skip, skip + limit - 1)

        const { data: entries, error, count } = await query

        if (error) {
            console.error("[calendar] Supabase fetch error:", error)
            return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }

        const normalizedEntries = (entries ?? []).map((entry) => {
            const rawIdea = Array.isArray(entry.contentIdea) ? entry.contentIdea[0] : entry.contentIdea
            const rawMasterJson = rawIdea?.masterJson as Record<string, unknown> | null | undefined
            const rawQualityGateResult = Array.isArray(rawIdea?.qualityGateResult)
                ? rawIdea.qualityGateResult[0]
                : rawIdea?.qualityGateResult
            const rawClinicalField = Array.isArray(rawIdea?.clinicalField)
                ? rawIdea.clinicalField[0]
                : rawIdea?.clinicalField

            return {
                ...entry,
                contentIdea: rawIdea
                    ? {
                        id: rawIdea.id,
                        hook: typeof rawMasterJson?.hook === "string" ? rawMasterJson.hook : null,
                        qualityGateStatus: rawIdea.qualityGateStatus,
                        qualityGateResult: rawQualityGateResult ?? null,
                        clinicalField: rawClinicalField ?? null,
                    }
                    : null,
            }
        })

        return NextResponse.json({
            entries: normalizedEntries,
            pagination: {
                total: count ?? 0,
                page,
                limit,
                totalPages: count ? Math.ceil(count / limit) : 0,
            },
        })
    } catch (err) {
        console.error("[calendar] GET error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
