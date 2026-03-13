/**
 * POST /api/production/calendar/import
 *
 * Accepts a JSON body: { csv: string }
 * Parses and bulk-upserts ProductionCalendarEntry rows.
 *
 * Required CSV columns (case-insensitive, trimmed):
 *   day_number, entry_date, platform, post_type, topic, content_goal
 *
 * Optional CSV columns:
 *   funnel_stage, hook, cta
 *
 * Returns: { imported: number, skipped: number, errors: string[] }
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { Platform, PostType, FunnelStage } from "@prisma/client"

const VALID_PLATFORMS   = new Set(["IG", "FB", "TIKTOK", "LINKEDIN", "EMAIL", "VIDEO"])
const VALID_POST_TYPES  = new Set(["CAROUSEL", "VIDEO", "TEXT_POST", "REEL", "STORY", "EMAIL_LESSON"])
const VALID_FUNNEL_STAGES = new Set(["AWARENESS", "CONSIDERATION", "CONVERSION", "RETENTION"])

function parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []

    // Parse header row (handle quoted headers)
    const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"(.*)"$/, "$1"))

    return lines.slice(1).map(line => {
        // Simple CSV split (not handling commas inside quotes for basic use)
        const vals = line.split(",").map(v => v.trim().replace(/^"(.*)"$/, "$1"))
        const row: Record<string, string> = {}
        header.forEach((h, i) => { row[h] = vals[i] ?? "" })
        return row
    })
}

export async function POST(req: Request) {
    // Auth check
    const session = await auth()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let csv: string
    try {
        const body = await req.json()
        csv = body.csv as string
        if (!csv || typeof csv !== "string") throw new Error("csv field missing")
    } catch {
        return NextResponse.json({ error: "Body must be JSON with { csv: string }" }, { status: 400 })
    }

    const rows = parseCSV(csv)
    if (rows.length === 0) {
        return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 })
    }

    let imported = 0
    let skipped  = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowLabel = `Row ${i + 2}` // +2 for 1-based + header row

        // Required fields
        const dayNumber   = parseInt(row["day_number"] ?? "", 10)
        const entryDateRaw = row["entry_date"] ?? ""
        const platform    = (row["platform"] ?? "").toUpperCase() as Platform
        const postType    = (row["post_type"] ?? "").toUpperCase().replace(/ /g, "_") as PostType
        const topic       = row["topic"] ?? ""
        const contentGoal = row["content_goal"] ?? ""

        if (isNaN(dayNumber) || dayNumber < 1) {
            errors.push(`${rowLabel}: invalid day_number "${row["day_number"]}"`)
            skipped++
            continue
        }
        const entryDate = new Date(entryDateRaw)
        if (isNaN(entryDate.getTime())) {
            errors.push(`${rowLabel}: invalid entry_date "${entryDateRaw}" (use YYYY-MM-DD)`)
            skipped++
            continue
        }
        if (!VALID_PLATFORMS.has(platform)) {
            errors.push(`${rowLabel}: invalid platform "${platform}"`)
            skipped++
            continue
        }
        if (!VALID_POST_TYPES.has(postType)) {
            errors.push(`${rowLabel}: invalid post_type "${row["post_type"]}"`)
            skipped++
            continue
        }
        if (!topic) {
            errors.push(`${rowLabel}: topic is empty`)
            skipped++
            continue
        }

        // Optional fields with defaults
        const funnelStageRaw = (row["funnel_stage"] ?? "").toUpperCase()
        const funnelStage: FunnelStage = VALID_FUNNEL_STAGES.has(funnelStageRaw)
            ? (funnelStageRaw as FunnelStage)
            : "AWARENESS"
        const hook = row["hook"] ?? ""
        const cta  = row["cta"]  ?? ""

        try {
            await prisma.productionCalendarEntry.create({
                data: {
                    dayNumber,
                    entryDate,
                    platform,
                    postType,
                    topic,
                    contentGoal: contentGoal || topic,
                    funnelStage,
                    hook,
                    cta,
                    publishStatus: "DRAFT",
                },
            })
            imported++
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`${rowLabel}: DB error — ${msg}`)
            skipped++
        }
    }

    return NextResponse.json({
        imported,
        skipped,
        errors: errors.slice(0, 20), // Cap error list
    })
}
