import { supabaseAdmin } from "@/lib/supabase"
import { generateContentIdea } from "@/lib/production/contentStrategist"
import {
  Platform,
  FunnelStage,
  PostType,
} from "@/lib/enums"

export const SCHEDULE_TEMPLATE: Array<{
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

export interface CalendarGenerationInput {
  days: number
  offset: number
  overwrite: boolean
  startDate: string
  generatedById: string
}

export interface CalendarGenerationResult {
  generated: number
  failed: number
  entries: { dayNumber: number; entryId: string; topic: string }[]
  errors?: string[]
}

export async function runCalendarGenerationBatch(input: CalendarGenerationInput): Promise<CalendarGenerationResult> {
  const days = Math.min(Math.max(input.days, 1), 30)
  const offset = Math.max(input.offset, 0)
  const startDate = new Date(input.startDate)

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid startDate")
  }

  if (input.overwrite) {
    const { error: deleteError } = await supabaseAdmin
      .from("production_calendar_entries")
      .delete()
      .eq("publish_status", "DRAFT")

    if (deleteError) {
      throw new Error(`Failed to clear drafts: ${deleteError.message}`)
    }
  }

  const { data: clinicalFields, error: clinicalError } = await supabaseAdmin
    .from("clinical_fields")
    .select(`
      id,
      fieldKey:field_key,
      displayName:display_name,
      fieldCategory:field_category,
      description,
      clinicalContext:clinical_context,
      exampleValues:example_values
    `)
    .eq("is_active", true)
    .order("field_category", { ascending: true })

  if (clinicalError) {
    throw new Error(`Failed to read clinical fields: ${clinicalError.message}`)
  }

  if (!clinicalFields || clinicalFields.length === 0) {
    throw new Error("No active ClinicalField records found. Run the seed first.")
  }

  const results: CalendarGenerationResult["entries"] = []
  const errors: string[] = []

  const tasks = Array.from({ length: days }).map(async (_, i) => {
    const absoluteDay = offset + i
    const template = SCHEDULE_TEMPLATE[absoluteDay % SCHEDULE_TEMPLATE.length]
    const field = clinicalFields[absoluteDay % clinicalFields.length]
    const entryDate = new Date(startDate)
    entryDate.setDate(startDate.getDate() + absoluteDay)

    try {
      const { masterJson, rawPrompt } = await generateContentIdea(
        {
          fieldKey: field.fieldKey,
          displayName: field.displayName,
          fieldCategory: field.fieldCategory,
          description: field.description,
          clinicalContext: field.clinicalContext,
          exampleValues: field.exampleValues,
        },
        {
          platform: template.platform,
          postType: template.postType,
          funnelStage: template.funnelStage,
          contentGoal: template.contentGoal,
          dayNumber: i + 1,
        },
      )

      const { data: calEntry, error: entryError } = await supabaseAdmin
        .from("production_calendar_entries")
        .insert({
          day_number: absoluteDay + 1,
          entry_date: entryDate.toISOString(),
          platform: template.platform,
          topic: masterJson.title || masterJson.hook || field.displayName,
          content_goal: template.contentGoal,
          funnel_stage: template.funnelStage,
          post_type: template.postType,
          hook: masterJson.hook,
          cta: masterJson.cta,
          publish_status: "DRAFT",
        })
        .select("id")
        .single()

      if (entryError || !calEntry) {
        throw new Error(entryError?.message ?? "Failed to create calendar entry")
      }

      const { error: ideaError } = await supabaseAdmin
        .from("content_ideas")
        .insert({
          calendar_entry_id: calEntry.id,
          clinical_field_id: field.id,
          master_json: masterJson,
          raw_gemini_prompt: rawPrompt,
          quality_gate_status: "PENDING",
          generated_by_id: input.generatedById,
        })

      if (ideaError) {
        throw new Error(ideaError.message)
      }

      results.push({
        dayNumber: absoluteDay + 1,
        entryId: calEntry.id,
        topic: masterJson.title || masterJson.hook || field.displayName,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Day ${absoluteDay + 1} (${field.fieldKey}): ${message}`)
    }
  })

  await Promise.allSettled(tasks)

  return {
    generated: results.length,
    failed: errors.length,
    entries: results,
    errors: errors.length > 0 ? errors : undefined,
  }
}
