/**
 * Inline repurposing — runs the Gemini repurpose job directly inside the
 * Next.js serverless function. No Cloud Tasks or Cloud Run required.
 *
 * Used when GCP_SERVICE_ACCOUNT_JSON_B64 is not configured (Vercel-only deploy).
 * One Gemini call produces all 5 platform variants in ~5–15 s, well within
 * Vercel Pro's 60 s function timeout.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "@/lib/prisma"

const PRODUCTION_MODEL = "gemini-2.5-flash"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepurposeInlineInput {
  renderJobId: string
  contentIdeaId: string
  calendarEntryId: string
  masterJson: Record<string, unknown>
  platform: string
  postType: string
  topic: string
  entryDate: string
}

interface PlatformCaptions {
  ig:       { caption: string; hashtagBlock: string; charEstimate: number }
  fb:       { caption: string; hashtagBlock: string; charEstimate: number }
  tiktok:   { script: string;  hashtagBlock: string; durationEstimateSecs: number }
  linkedin: { post: string;    charEstimate: number }
  email:    { subjectLine: string; previewText: string; body: string }
}

// ---------------------------------------------------------------------------
// Prompt builder — identical to the Cloud Run worker
// ---------------------------------------------------------------------------

function buildPrompt(input: RepurposeInlineInput): string {
  const m = input.masterJson as {
    hook?: string
    teachingPoints?: string[]
    cta?: string
    clinicalGrounding?: string
  }
  const teachingPoints = (m.teachingPoints ?? [])
    .map((p, i) => `    ${i + 1}. ${p}`)
    .join("\n")

  return `
You are the Content Repurposing Specialist for Psychiatric Assessment Mastery™ (PAM).
Adapt the master content idea into 5 platform-specific formats.
Preserve clinical specificity — no generic wellness filler.

ORIGINAL CONTENT:
  Topic: ${input.topic}
  Platform: ${input.platform}
  Hook: ${m.hook ?? ""}
  Teaching Points:
${teachingPoints}
  CTA: ${m.cta ?? ""}
  Clinical Grounding: ${m.clinicalGrounding ?? ""}

BRAND RULES: PMHNP graduate-level language. Unmistakably PAM-specific. No "mental health matters" filler. All CTAs → PAM Mastery Bundle.

Return a single JSON object:
{
  "ig":       { "caption": "...", "hashtagBlock": "#PMHNP #PsychNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
  "fb":       { "caption": "...", "hashtagBlock": "#PMHNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
  "tiktok":   { "script": "...", "hashtagBlock": "#PMHNP #PsychTok #MedTok #PAMastery", "durationEstimateSecs": 75 },
  "linkedin": { "post": "...", "charEstimate": 0 },
  "email":    { "subjectLine": "...", "previewText": "...", "body": "..." }
}

STRICT FORMAT: Return ONLY the JSON object. No markdown. No explanation.
`.trim()
}

// ---------------------------------------------------------------------------
// Gemini call
// ---------------------------------------------------------------------------

async function callGemini(input: RepurposeInlineInput): Promise<PlatformCaptions> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY not set")

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL })
  const result = await model.generateContent(buildPrompt(input))

  const raw = result.response.text().trim()
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const text = match ? match[1].trim() : raw

  const captions = JSON.parse(text) as PlatformCaptions
  captions.ig.charEstimate      ||= (captions.ig.caption?.length ?? 0) + (captions.ig.hashtagBlock?.length ?? 0)
  captions.fb.charEstimate      ||= captions.fb.caption?.length ?? 0
  captions.linkedin.charEstimate ||= captions.linkedin.post?.length ?? 0
  return captions
}

// ---------------------------------------------------------------------------
// Platform → DB asset mapping
// ---------------------------------------------------------------------------

const PLATFORM_MAP: Array<{
  key: keyof PlatformCaptions
  platform: "IG" | "FB" | "TIKTOK" | "LINKEDIN" | "EMAIL"
  assetType: "TEXT_POST" | "EMAIL_HTML"
  extractContent: (c: PlatformCaptions) => string
  extractMeta:    (c: PlatformCaptions) => Record<string, unknown>
}> = [
  {
    key: "ig", platform: "IG", assetType: "TEXT_POST",
    extractContent: c => `${c.ig.caption}\n\n${c.ig.hashtagBlock}`,
    extractMeta:    c => ({ caption: c.ig.caption, hashtagBlock: c.ig.hashtagBlock, charEstimate: c.ig.charEstimate }),
  },
  {
    key: "fb", platform: "FB", assetType: "TEXT_POST",
    extractContent: c => `${c.fb.caption}\n\n${c.fb.hashtagBlock}`,
    extractMeta:    c => ({ caption: c.fb.caption, hashtagBlock: c.fb.hashtagBlock, charEstimate: c.fb.charEstimate }),
  },
  {
    key: "tiktok", platform: "TIKTOK", assetType: "TEXT_POST",
    extractContent: c => `${c.tiktok.script}\n\n${c.tiktok.hashtagBlock}`,
    extractMeta:    c => ({ script: c.tiktok.script, hashtagBlock: c.tiktok.hashtagBlock, durationEstimateSecs: c.tiktok.durationEstimateSecs }),
  },
  {
    key: "linkedin", platform: "LINKEDIN", assetType: "TEXT_POST",
    extractContent: c => c.linkedin.post,
    extractMeta:    c => ({ post: c.linkedin.post, charEstimate: c.linkedin.charEstimate }),
  },
  {
    key: "email", platform: "EMAIL", assetType: "EMAIL_HTML",
    extractContent: c => c.email.body,
    extractMeta:    c => ({ subjectLine: c.email.subjectLine, previewText: c.email.previewText, body: c.email.body }),
  },
]

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Runs the REPURPOSE job inline:
 * 1. Marks job RUNNING
 * 2. Calls Gemini (single request → all 5 platforms)
 * 3. Updates ContentAsset rows with generated content in metadata
 * 4. Marks job COMPLETE
 * 5. If all jobs for the idea are now COMPLETE → transitions entry → APPROVED
 *
 * Errors are caught, stored on the job as FAILED, and re-thrown so the
 * caller can surface them in the API response.
 */
export async function runRepurposeInline(input: RepurposeInlineInput): Promise<void> {
  const { renderJobId, contentIdeaId, calendarEntryId } = input
  const now = new Date()

  // ── 1. Mark RUNNING ────────────────────────────────────────────────────
  await prisma.renderJob.update({
    where: { id: renderJobId },
    data: { status: "RUNNING", startedAt: now },
  })

  try {
    // ── 2. Call Gemini ────────────────────────────────────────────────────
    const captions = await callGemini(input)

    // ── 3. Update each ContentAsset ───────────────────────────────────────
    for (const mapping of PLATFORM_MAP) {
      const content = mapping.extractContent(captions)
      const meta    = mapping.extractMeta(captions)
    
      await prisma.contentAsset.updateMany({
        where: {
          renderJobId,
          platform: mapping.platform,
          assetType: mapping.assetType,
        },
        data: {
          status: "COMPLETE",
          // Store content in storageUrl as a data URI so it can be copied/previewed
          storageUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
          metadata: { content, ...meta },
        },
      })
    }

    // ── 4. Mark job COMPLETE ───────────────────────────────────────────────
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: { status: "COMPLETE", completedAt: new Date() },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[repurposeInline] Job failed:", renderJobId, msg)
    await prisma.renderJob.update({
      where: { id: renderJobId },
      data: { status: "FAILED", completedAt: new Date(), errorMessage: msg },
    })
    await prisma.contentAsset.updateMany({
      where: { renderJobId },
      data: { status: "FAILED" },
    })
    throw err
  }

  // ── 5. Check if ALL render jobs for this idea are done → APPROVED ───────
  try {
    const allJobs = await prisma.renderJob.findMany({
      where: { contentIdeaId },
      orderBy: { queuedAt: "desc" },
    })

    // Keep only the latest job of each type
    const latestStatus = new Map<string, string>()
    for (const job of allJobs) {
      if (!latestStatus.has(job.jobType)) latestStatus.set(job.jobType, job.status)
    }

    const allDone = Array.from(latestStatus.values()).every(s => s === "COMPLETE")
    if (allDone && calendarEntryId) {
      await prisma.productionCalendarEntry.update({
        where: { id: calendarEntryId },
        data: { publishStatus: "APPROVED" },
      })
      console.log(`[repurposeInline] All jobs done → entry ${calendarEntryId} → APPROVED`)
    }
  } catch (e) {
    // Non-fatal — job succeeded even if status transition fails
    console.error("[repurposeInline] Post-completion status update failed:", e)
  }
}
