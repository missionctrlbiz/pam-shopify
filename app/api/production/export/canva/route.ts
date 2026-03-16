/**
 * GET /api/production/export/canva
 *
 * Exports all calendar entries that have a ContentIdea as a CSV file.
 * Designed for two workflows:
 *
 * 1. Canva Bulk Create — paste the CSV into a 6-slide carousel template.
 *    Template variables: {{hook}}, {{slide2_heading}}, {{slide2_body}},
 *    {{slide3_heading}}, {{slide3_body}}, {{slide4_heading}}, {{slide4_body}},
 *    {{slide5_heading}}, {{slide5_body}}, {{cta_slide}}, {{topic}}, {{date_label}}
 *
 * 2. ElevenLabs / video production — {{voiceover_script}} column
 *
 * 3. Buffer/Later scheduling — one row per platform post, captions included
 *    when assets are COMPLETE (blob URLs returned for download).
 *
 * Query params:
 *   ?status=APPROVED,GENERATING,COMPLETE  (comma-separated, default: all)
 *   ?format=canva|text|full               (default: full)
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { PublishStatus, AssetStatus, AssetType, Platform } from "@/lib/enums"

export const maxDuration = 30

type IdeaAssetRow = {
    status: AssetStatus
    assetType: AssetType
    platform?: Platform | null
    storageUrl?: string | null
    fileName?: string | null
}

function csvEscape(val: unknown): string {
    if (val === null || val === undefined) return ""
    const str = String(val).replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\r/g, " ")
    // Wrap in quotes if contains comma, quote, or space
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function row(values: unknown[]): string {
    return values.map(csvEscape).join(",")
}

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status")
    const statusFilter: PublishStatus[] = statusParam
        ? (statusParam.split(",").map(s => s.trim().toUpperCase()) as PublishStatus[])
        : [
            PublishStatus.DRAFT,
            PublishStatus.PENDING_APPROVAL,
            PublishStatus.APPROVED,
            PublishStatus.GENERATING,
            PublishStatus.SCHEDULED,
            PublishStatus.PUBLISHED,
        ]

    let query = supabaseAdmin
        .from("production_calendar_entries")
        .select(`*, contentIdea:content_ideas(*, assets:content_assets(status, assetType, platform, storageUrl, fileName))`)
        .order("dayNumber", { ascending: true })
        .order("entryDate", { ascending: true })

    if (statusFilter.length > 0) {
        query = query.in("publishStatus", statusFilter)
    }

    const { data: entries, error } = await query

    if (error) {
        console.error("[export/canva] Supabase fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const entriesWithIdeas = (entries ?? []).filter((entry) => entry.contentIdea)

    if (entriesWithIdeas.length === 0) {
        return NextResponse.json(
            { error: "No entries with content ideas found. Generate content ideas first." },
            { status: 404 }
        )
    }

    // ── Build CSV ────────────────────────────────────────────────────────────
    const headers = [
        // Identity
        "day_number",
        "date",
        "platform",
        "post_type",
        "funnel_stage",
        "status",
        "topic",
        "content_goal",

        // Canva carousel template vars
        "hook",             // Cover slide / slide 1 heading
        "slide2_heading",
        "slide2_body",
        "slide3_heading",
        "slide3_body",
        "slide4_heading",
        "slide4_body",
        "slide5_heading",
        "slide5_body",
        "cta_slide",        // Final slide CTA text
        "date_label",       // e.g. "March 2026" for slide branding

        // Full teaching content
        "teaching_point_1",
        "teaching_point_2",
        "teaching_point_3",
        "teaching_point_4",
        "teaching_point_5",
        "clinical_grounding",

        // Video / audio production
        "voiceover_script",

        // Generated asset URLs (populated when COMPLETE)
        "ig_caption_url",
        "fb_caption_url",
        "tiktok_url",
        "linkedin_url",
        "email_html_url",
        "carousel_slide_1_url",
        "carousel_slide_2_url",
        "carousel_slide_3_url",
        "carousel_slide_4_url",
        "carousel_slide_5_url",
        "carousel_slide_6_url",
        "audio_mp3_url",
        "video_mp4_url",
    ]

    const csvRows: string[] = [headers.join(",")]

    for (const entry of entriesWithIdeas) {
        const idea = entry.contentIdea
        const m = idea.masterJson as Record<string, unknown>

        const tp = (m.teachingPoints as string[] | undefined) ?? []
        const slides = (m.slideTextBlocks as Array<{ heading?: string; body?: string }> | undefined) ?? []

        // Build voiceover from voiceoverFull or assemble from parts
        const voiceover = (m.voiceoverFull as string | undefined) ??
            [m.hook, ...(tp), m.cta].filter(Boolean).join(". ")

        const dateObj = new Date(entry.entryDate)
        const dateLabel = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        const dateISO = dateObj.toISOString().slice(0, 10)

        // Map completed assets to known types
        const assets = ((idea.assets ?? []) as IdeaAssetRow[]).filter(
            (asset) => asset.status === AssetStatus.COMPLETE
        )
        const assetUrl = (type: AssetType, platform?: Platform) =>
            assets.find(a =>
                a.assetType === type && (!platform || a.platform === platform)
            )?.storageUrl ?? ""

        const carouselSlides = assets
            .filter(a => a.assetType === AssetType.CAROUSEL_PNG)
            .sort((a, b) => (a.fileName ?? "").localeCompare(b.fileName ?? ""))

        csvRows.push(row([
            entry.dayNumber,
            dateISO,
            entry.platform,
            entry.postType,
            entry.funnelStage,
            entry.publishStatus,
            entry.topic,
            entry.contentGoal,

            // Canva template vars
            m.hook ?? entry.hook,
            slides[1]?.heading ?? tp[0] ?? "",
            slides[1]?.body ?? tp[1] ?? "",
            slides[2]?.heading ?? tp[1] ?? "",
            slides[2]?.body ?? tp[2] ?? "",
            slides[3]?.heading ?? tp[2] ?? "",
            slides[3]?.body ?? tp[3] ?? "",
            slides[4]?.heading ?? tp[3] ?? "",
            slides[4]?.body ?? tp[4] ?? "",
            m.cta ?? entry.cta,
            dateLabel,

            // Teaching points
            tp[0] ?? "",
            tp[1] ?? "",
            tp[2] ?? "",
            tp[3] ?? "",
            tp[4] ?? "",
            m.clinicalGrounding ?? "",

            // Voiceover
            voiceover,

            // Asset URLs
            assetUrl(AssetType.TEXT_POST, Platform.IG),
            assetUrl(AssetType.TEXT_POST, Platform.FB),
            assetUrl(AssetType.TEXT_POST, Platform.TIKTOK),
            assetUrl(AssetType.TEXT_POST, Platform.LINKEDIN),
            assetUrl(AssetType.EMAIL_HTML, Platform.EMAIL),
            carouselSlides[0]?.storageUrl ?? "",
            carouselSlides[1]?.storageUrl ?? "",
            carouselSlides[2]?.storageUrl ?? "",
            carouselSlides[3]?.storageUrl ?? "",
            carouselSlides[4]?.storageUrl ?? "",
            carouselSlides[5]?.storageUrl ?? "",
            assetUrl(AssetType.AUDIO_MP3),
            assetUrl(AssetType.VIDEO_MP4),
        ]))
    }

    const csv = csvRows.join("\r\n")
    const filename = `PAM_ContentCalendar_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
        },
    })
}
