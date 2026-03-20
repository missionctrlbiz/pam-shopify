import "dotenv/config"
import { runCarouselInline, type RepurposeInlineInput } from "./lib/production/repurposeInline"
import { supabaseAdmin } from "./lib/supabase"

async function testCarouselRender() {
    console.log("Starting Debug Carousel Render Script...")

    // 1. Fetch any valid render job to satisfy startup guards
    const { data: job, error: jobErr } = await supabaseAdmin
        .from("render_jobs")
        .select("*")
        .limit(1)
        .single()

    if (jobErr || !job) {
        console.error("Could not find any render jobs inside Supabase:", jobErr)
        return
    }

    console.log(`Using row ID: ${job.id} for isolation test...`)

    const payload: RepurposeInlineInput = {
        renderJobId: job.id,
        contentIdeaId: job.content_idea_id ?? job.contentIdeaId ?? "00000000-0000-0000-0000-000000000000",
        calendarEntryId: job.calendar_entry_id ?? job.calendarEntryId ?? "00000000-0000-0000-0000-000000000000",
        masterJson: {},
        platform: "IG",
        postType: "CAROUSEL",
        topic: "Mental Health Awareness Tips",
        entryDate: "2026-04-01",
    }

    try {
        console.log("Triggering runCarouselInline...")
        await runCarouselInline(payload)
        console.log("✅ Success!")
    } catch (err) {
        console.error("❌ CRASHED WITH ERROR:")
        console.error(err)
    }
}

testCarouselRender()
