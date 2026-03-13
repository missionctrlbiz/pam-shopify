/**
 * Content Strategist — Gemini Service Function
 *
 * Accepts a ClinicalField record and content scheduling metadata, and returns a
 * fully-structured master JSON idea ready for storage in ContentIdea.masterJson.
 *
 * Uses Gemini structured output (responseMimeType: "application/json") so the
 * response is always a valid, parseable JSON object — never free-form text.
 *
 * Model: gemini-2.0-flash (stable as of March 2026; thinking variant deprecated)
 * JSON mode: prompt-enforced + code-fence stripping.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// ---------------------------------------------------------------------------
// Model config
// ---------------------------------------------------------------------------

// Primary model — stable flash. Thinking variant was deprecated March 2026.
export const PRODUCTION_MODEL = "gemini-2.0-flash"

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

// ─── Story Bank scene model ───────────────────────────────────────────────────

export interface PAMScene {
    type: "COVER" | "TEACHING" | "CTA"
    /** Seconds: COVER=5, TEACHING=4–8 (word-count based), CTA=5–6 */
    durationSecs: number
    /** Voiceover text including [pause] / [breath] / [emphasize:word] cues */
    voiceoverText: string
    /** 1–2 sentence Canva / Remotion visual direction */
    visualDirection: string
    /** Headline shown on-screen */
    textOverlay: string
    emojiAccent?: string
}

export interface PlatformPromptBank {
    IG_CAROUSEL: {
        canvaSlidePrompts: string[]   // 1 per slide, up to 10
        captionHook: string
        hashtagSet: string[]
    }
    TIKTOK_VIDEO: {
        spokenScript: string          // complete TikTok voiceover, hook-first
        textOverlays: string[]        // per-scene overlay text
        soundSuggestion: string
    }
    LINKEDIN: {
        professionalPost: string      // 150–300 word authority post
        postHook: string
        cta: string
    }
    EMAIL: {
        subjectLine: string
        preheaderText: string
        bodyThreeParagraphs: string[] // [hook_para, teaching_para, cta_para]
    }
    VIDEO: {
        sceneDirectorNotes: string[]  // one note per PAMScene
        thumbnailConceptPrompt: string
        descriptionSEO: string
    }
}

// ─── Master idea JSON ─────────────────────────────────────────────────────────

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
    slideTextBlocks: string[]        // up to 10 condensed lines for carousel slides
    estimatedReadTimeSecs: number
    // ─── Story Bank fields (populated by sceneDirector.ts) ────────────────────
    scenes?: PAMScene[]
    voiceoverFull?: string           // complete script with gesture cue markers
    platformPromptBank?: PlatformPromptBank
    totalDurationSecs?: number
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
  Description:     ${field.description || `This field maps to the psychiatric assessment concept: "${field.displayName}" in the ${field.fieldCategory} domain.`}
  ${field.clinicalContext ? `Extended Clinical Context: ${field.clinicalContext}` : `Provide clinically accurate context for ${field.displayName} as it applies to PMHNP-level assessment.`}

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
  "slideTextBlocks": ["Slide 1 text (title/hook — max 12 words)", "Slide 2 teaching point", "Slide 3", "Slide 4", "Slide 5", "Slide 6", "Slide 7 (optional)", "Slide 8 (optional)", "Slide 9 (optional)", "Slide 10 CTA (optional)"],
  "estimatedReadTimeSecs": 60
}

INSTRUCTIONS for slideTextBlocks:
- Minimum 6 slides, maximum 10 slides. Remove optional slots you do not use.
- Each slide text must be 8-12 words maximum — designed for on-screen Canva layout.
- estimatedReadTimeSecs should reflect actual slide count: 6 slides ≈ 45s, 8 slides ≈ 60s, 10 slides ≈ 80s.

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

    // Ensure slideTextBlocks has 6–10 entries
    while (masterJson.slideTextBlocks.length < 6) {
        masterJson.slideTextBlocks.push("")
    }
    masterJson.slideTextBlocks = masterJson.slideTextBlocks.slice(0, 10)

    return { masterJson, rawPrompt }
}
