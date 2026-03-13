/**
 * Content Strategist — Gemini Service Function
 *
 * Accepts a ClinicalField record and content scheduling metadata, and returns a
 * fully-structured master JSON idea ready for storage in ContentIdea.masterJson.
 *
 * Uses Gemini structured output (responseMimeType: "application/json") so the
 * response is always a valid, parseable JSON object — never free-form text.
 *
 * Model: gemini-2.0-flash-thinking-exp-01-21
 * Note: thinking models do not support responseMimeType/responseSchema —
 * JSON is enforced via strict prompt instructions + code-fence stripping.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

export const PRODUCTION_MODEL = "gemini-2.0-flash-thinking-exp-01-21"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClinicalFieldInput {
    fieldKey: string
    displayName: string
    fieldCategory: string
    description: string
    clinicalContext?: string | null
}

export interface ContentIdeaInput {
    platform: string        // Platform enum value e.g. "IG"
    postType: string        // PostType enum value e.g. "CAROUSEL"
    funnelStage: string     // FunnelStage enum value e.g. "AWARENESS"
    contentGoal: string     // Free text, e.g. "Build trust with PMHNP students"
    dayNumber: number
}

export interface PlatformAdaptation {
    caption: string
    hashtagBlock?: string
    charEstimate: number
}

export interface ContentIdeaMasterJson {
    hook: string
    teachingPoints: string[]
    cta: string
    clinicalGrounding: string
    platformAdaptations: {
        IG: PlatformAdaptation
        FB: PlatformAdaptation
        TIKTOK: PlatformAdaptation
        LINKEDIN: PlatformAdaptation
        EMAIL: { subjectLine: string; previewText: string; bodyOutline: string }
    }
    slideTextBlocks: string[]   // 6 condensed lines for carousel slides
    estimatedReadTimeSecs: number
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(field: ClinicalFieldInput, meta: ContentIdeaInput): string {
    return `
You are the Content Strategist for Psychiatric Assessment Mastery™ (PAM), an educational brand
created by Tonia Ojomo, PMHNP-BC. Your audience is psychiatric nurse practitioner (PMHNP) students
and new graduates who need practical, high-yield clinical education — NOT generic wellness advice.

BRAND VOICE RULES (non-negotiable):
- All content must be grounded in Tonia's specific methodology from PAM.
- Use clinical language at a PMHNP graduate level — not dumbed-down, not overly academic.
- Every hook must create CLINICAL TENSION or surface a real diagnostic trap practitioners face.
- Teaching points must be actionable: things the reader can DO in their next assessment.
- NO generic phrases like "mental health matters", "self-care is important", "therapy can help".
- Content must be specific enough that it could ONLY come from a psychiatric assessment expert.

CLINICAL FIELD CONTEXT:
  Field Key:       ${field.fieldKey}
  Category:        ${field.fieldCategory}
  Display Name:    ${field.displayName}
  Description:     ${field.description || "See field key for context."}
  ${field.clinicalContext ? `Extended Clinical Context: ${field.clinicalContext}` : ""}

CONTENT SCHEDULING CONTEXT:
  Platform:        ${meta.platform}
  Post Type:       ${meta.postType}
  Funnel Stage:    ${meta.funnelStage}
  Content Goal:    ${meta.contentGoal}
  Day Number:      ${meta.dayNumber} of 30

DELIVERABLES — return a single JSON object matching this exact structure:
{
  "hook": "One sentence (max 15 words). Must create clinical tension or name a real diagnostic mistake.",
  "teachingPoints": ["3-5 bullet points — each a concrete, actionable clinical insight rooted in ${field.displayName}"],
  "cta": "One sentence driving the reader toward PAM workbook, the PAM Mastery Bundle, or saving/sharing.",
  "clinicalGrounding": "1-2 sentences explaining WHY this topic matters clinically, citing DSM-5-TR patterns or assessment evidence.",
  "platformAdaptations": {
    "IG": { "caption": "Full IG caption (max 2200 chars). Hook first. Teaching points as numbered list. Hashtag block at end.", "hashtagBlock": "#PMHNP #PsychNP #PsychiatricAssessment #NursePractitioner #MentalHealthNP #PAMastery", "charEstimate": 0 },
    "FB": { "caption": "FB-optimised version — longer narrative style, no hashtag spam (max 3 hashtags), link-preview friendly.", "hashtagBlock": "#PMHNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
    "TIKTOK": { "caption": "60-90 second spoken-word TikTok script. Hook-heavy. Conversational. Ends with strong CTA.", "hashtagBlock": "#PMHNP #NursePractitioner #PsychTok #MedTok #PAMastery", "charEstimate": 0 },
    "LINKEDIN": { "caption": "Professional 1300-char LinkedIn post. Lead with the clinical insight. Close with a question to drive comments.", "charEstimate": 0 },
    "EMAIL": { "subjectLine": "Subject line — curiosity-gap or clinical-stakes driven, max 50 chars", "previewText": "Preview text, max 90 chars", "bodyOutline": "3-paragraph outline: (1) hook/problem, (2) teaching point, (3) CTA to PAM bundle" }
  },
  "slideTextBlocks": ["Slide 1 text (title/hook)", "Slide 2", "Slide 3", "Slide 4", "Slide 5", "Slide 6 (CTA)"],
  "estimatedReadTimeSecs": 45
}

STRICT FORMAT: Return ONLY the JSON object. No markdown code fences. No explanation text.
`.trim()
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateContentIdea(
    field: ClinicalFieldInput,
    meta: ContentIdeaInput
): Promise<{ masterJson: ContentIdeaMasterJson; rawPrompt: string }> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.")
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL })

    const rawPrompt = buildPrompt(field, meta)
    const result = await model.generateContent(rawPrompt)

    // Strip markdown code fences the thinking model may emit around JSON output
    const text = result.response
        .text()
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()

    let masterJson: ContentIdeaMasterJson
    try {
        masterJson = JSON.parse(text) as ContentIdeaMasterJson
    } catch {
        throw new Error(
            `Gemini returned non-parseable JSON for field "${field.fieldKey}": ${text.slice(0, 200)}`
        )
    }

    // Ensure slideTextBlocks always has exactly 6 entries
    while (masterJson.slideTextBlocks.length < 6) {
        masterJson.slideTextBlocks.push("")
    }
    masterJson.slideTextBlocks = masterJson.slideTextBlocks.slice(0, 6)

    return { masterJson, rawPrompt }
}
