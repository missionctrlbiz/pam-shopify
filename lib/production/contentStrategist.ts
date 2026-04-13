/**
 * Content Strategist — Gemini Service Function
 *
 * Accepts a ClinicalField record and content scheduling metadata, and returns a
 * fully-structured master JSON idea ready for storage in ContentIdea.masterJson.
 *
 * Uses Gemini structured output (responseMimeType + responseSchema) so the
 * response is always a valid, schema-validated JSON object — never free-form text.
 * Zod validation with safe fallback placeholders prevents parsing crashes and
 * protects continuous generation loops from missing-field timeouts.
 *
 * Model: gemini-2.5-pro (providing high-fidelity reasoning for clinical psychiatric content)
 * JSON mode: native responseSchema (type: OBJECT) + Zod-backed guardrail validation.
 */

import { getAI, PRODUCTION_MODEL, FALLBACK_MODEL } from "@/lib/ai"
import {
    CONTENT_IDEA_RESPONSE_SCHEMA,
    validateContentIdeaOutput,
    buildContextBlock,
} from "@/lib/ai/prompts"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// PRODUCTION_MODEL re-exported so qualityGate / repurposingRouter / sceneDirector
// can import it from this module without touching lib/ai directly.
export { PRODUCTION_MODEL }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClinicalFieldInput {
    fieldKey: string
    displayName: string
    fieldCategory: string
    description: string
    clinicalContext?: string | null
    exampleValues?: string[] | null
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
    title?: string
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

const FIELD_TOKEN_MAP: Record<string, string> = {
    app: "appearance",
    assess: "assessment",
    b12: "vitamin B12",
    cbc: "CBC",
    cbt: "CBT",
    cmp: "CMP",
    cogn: "cognition",
    cont: "content",
    dbt: "DBT",
    diff: "differential",
    dx: "diagnosis",
    ekg: "EKG",
    et: "etiology",
    fu: "follow-up",
    hi: "homicidal ideation",
    hx: "history",
    iop: "intensive outpatient",
    lab: "labs",
    loc: "level of care",
    med: "medication",
    mse: "mental status exam",
    nssi: "non-suicidal self-injury",
    outpt: "outpatient",
    plan: "plan",
    risk: "risk",
    si: "suicidal ideation",
    sub: "substance-related",
    tf: "trauma-focused",
    tsh: "TSH",
    tx: "treatment",
    uds: "urine drug screen",
}

function cleanGeneratedText(value: string): string {
    return value
        .replace(/```[\s\S]*?```/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/[\u2022\u25CF\u25AA]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

function sentenceCase(value: string): string {
    const cleaned = cleanGeneratedText(value)
    if (!cleaned) return cleaned
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function expandFieldKey(fieldKey: string): string {
    return fieldKey
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((token) => FIELD_TOKEN_MAP[token.toLowerCase()] ?? token)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function looksLowSignal(value: string): boolean {
    const cleaned = cleanGeneratedText(value)
    if (!cleaned) return true

    const tokens = cleaned.split(/\s+/).filter(Boolean)
    const shortTokens = tokens.filter((token) => token.length <= 2).length

    return (
        cleaned.includes("_") ||
        /^[a-z0-9_]+$/i.test(cleaned) ||
        cleaned.length < 8 ||
        shortTokens >= Math.max(2, Math.ceil(tokens.length / 2))
    )
}

function normalizeFieldContext(field: ClinicalFieldInput) {
    const expandedFieldKey = expandFieldKey(field.fieldKey)
    const normalizedDisplayName = looksLowSignal(field.displayName)
        ? expandedFieldKey
        : sentenceCase(field.displayName)

    const normalizedDescription = !field.description || looksLowSignal(field.description)
        ? `This clinical concept focuses on ${normalizedDisplayName} in the ${sentenceCase(field.fieldCategory.replace(/_/g, " ").toLowerCase())} domain.`
        : sentenceCase(field.description)

    const normalizedClinicalContext = field.clinicalContext
        ? sentenceCase(field.clinicalContext)
        : `Provide clinically accurate PMHNP-level teaching on ${normalizedDisplayName}, including why it changes assessment quality and documentation accuracy.`

    const normalizedExamples = (field.exampleValues ?? [])
        .map((value) => sentenceCase(value))
        .filter(Boolean)
        .slice(0, 5)

    return {
        expandedFieldKey,
        normalizedDisplayName,
        normalizedDescription,
        normalizedClinicalContext,
        normalizedExamples,
    }
}

function sanitizeMasterJson<T>(value: T): T {
    if (typeof value === "string") {
        return cleanGeneratedText(value) as T
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeMasterJson(item)) as T
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, sanitizeMasterJson(item)])
        ) as T
    }

    return value
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(field: ClinicalFieldInput, meta: ContentIdeaInput): string {
    const {
        expandedFieldKey,
        normalizedDisplayName,
        normalizedDescription,
        normalizedClinicalContext,
        normalizedExamples,
    } = normalizeFieldContext(field)

    // Build the structured context block via the typed StructuredPromptContext
    // node — day_number, clinical_field, and platform are injected as schema
    // nodes rather than ad-hoc string interpolation.
    const contextBlock = buildContextBlock({
        day_number: meta.dayNumber,
        clinical_field: normalizedDisplayName,
        platform: meta.platform,
    })

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
- Treat raw source labels as internal shorthand only. Never surface field keys, CSV fragments, underscores, abbreviations, or truncated labels in final copy.
- Write clean prose only. No markdown, no asterisks, no code fences, and no placeholder-style formatting.

CLINICAL FIELD CONTEXT:
    Raw Field Key:            ${field.fieldKey}
    Expanded Field Key:       ${expandedFieldKey}
    Raw Source Label:         ${field.displayName}
    Normalized Clinical Name: ${normalizedDisplayName}
    Category:                 ${field.fieldCategory}
    Description:              ${normalizedDescription}
    Extended Clinical Context:${" "}${normalizedClinicalContext}
    ${normalizedExamples.length > 0 ? `Example Phrases:          ${normalizedExamples.map((value) => `"${value}"`).join(" | ")}` : `Example Phrases:          Use polished PMHNP clinical terminology only.`}

${contextBlock}
  Post Type:       ${meta.postType}
  Funnel Stage:    ${meta.funnelStage}
  Content Goal:    ${meta.contentGoal}

DELIVERABLES — return a single JSON object matching this exact structure:
{
  "title": "A clear, compelling 5-8 word content title. Examples: 'The 3 Risks Behind Every Depressed Mood', 'Why Your MSE Thought Process Is Wrong', 'Bipolar vs MDD: The Assessment Trap'. Must be readable, specific, and professional — never abbreviated or cryptic.",
  "body": "One compelling sentence (10-20 words). Must create clinical tension, name a real diagnostic mistake, or challenge a common assumption. Write it as a complete, clear English sentence — NOT an abbreviation or code. Examples: 'Most PMHNPs miss these three critical risks hiding behind a depressed mood chief complaint.', 'Your MSE thought process documentation probably confuses content with process — here is why it matters.'",
  "teachingPoints": ["3-5 bullet points — each a concrete, actionable clinical insight rooted in ${normalizedDisplayName}"],
  "cta": "One sentence driving the reader toward PAM workbook, the PAM Mastery Bundle, or saving/sharing.",
  "clinicalGrounding": "1-2 sentences explaining WHY this topic matters clinically, citing DSM-5-TR patterns or assessment evidence.",
  "platformAdaptations": {
    "IG": { "caption": "Full IG caption (max 2200 chars). Hook first. Teaching points as numbered list. Hashtag block at end.", "hashtagBlock": "#PMHNP #PsychNP #PsychiatricAssessment #NursePractitioner #MentalHealthNP #PAMastery", "charEstimate": 0 },
    "FB": { "caption": "FB-optimised version — longer narrative style, no hashtag spam (max 3 hashtags), link-preview friendly.", "hashtagBlock": "#PMHNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
    "TIKTOK": { "caption": "60-90 second spoken-word TikTok script. Hook-heavy. Conversational. Ends with strong CTA.", "hashtagBlock": "#PMHNP #NursePractitioner #PsychTok #MedTok #PAMastery", "charEstimate": 0 },
    "LINKEDIN": { "caption": "Professional 1300-char LinkedIn post. Lead with the clinical insight. Close with a question to drive comments.", "charEstimate": 0 },
    "EMAIL": { "subjectLine": "Subject line — curiosity-gap or clinical-stakes driven, max 50 chars", "previewText": "Preview text, max 90 chars", "bodyOutline": "3-paragraph outline: (1) hook/problem, (2) teaching point, (3) CTA to PAM bundle" }
  },
  "slideText": ["Slide 1 text (title/hook — max 12 words)", "Slide 2 teaching point", "Slide 3", "Slide 4", "Slide 5", "Slide 6", "Slide 7 (optional)", "Slide 8 (optional)", "Slide 9 (optional)", "Slide 10 CTA (optional)"],
  "estimatedReadTimeSecs": 60
}

CRITICAL — title and body quality requirements:
- The "title" must be a SHORT, READABLE phrase a human would use as a content title. NEVER use field codes, abbreviations, or technical variable names.
- The "body" must be a complete English sentence that creates curiosity. It must make sense when read aloud.
- Both title and body must reference the CLINICAL CONCEPT, not the field key or field code.
- If the source data is abbreviated, silently translate it into polished clinical language before writing.
- Do not include markdown characters such as **, *, _, #, backticks, or code fences anywhere in the JSON values.

INSTRUCTIONS for slideText:
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
    const rawPrompt = buildPrompt(field, meta)
    const ai = getAI()

    let responseText = "{}"
    let currentModel = PRODUCTION_MODEL
    let lastError: any = null

    // Retry loop with exponential backoff and model fallback (Fixes 503 High Demand)
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const result = await ai.models.generateContent({
                model: currentModel,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: CONTENT_IDEA_RESPONSE_SCHEMA,
                },
                contents: rawPrompt,
            })
            responseText = result.text ?? "{}"
            lastError = null
            break
        } catch (error: any) {
            lastError = error
            // Detect 503 High Demand or Overloaded
            const errorMsg = error?.message?.toLowerCase() || ""
            const is503 = error?.status === 503 || errorMsg.includes("high demand") || errorMsg.includes("overloaded")
            
            if (is503 && attempt < 2) {
                const delay = Math.pow(2, attempt) * 1500
                console.warn(`[Gemini] 503 High Demand for ${currentModel}. Retrying in ${delay}ms... (Attempt ${attempt + 1})`)
                await sleep(delay)
                
                // On the final attempt, fallback to Flash if Pro is still failing
                if (attempt === 1) {
                    console.info(`[Gemini] Pro model still busy. Falling back to ${FALLBACK_MODEL} for final attempt.`)
                    currentModel = FALLBACK_MODEL
                }
            } else {
                // Not a retryable error or max retries reached
                break
            }
        }
    }

    if (lastError) {
        throw lastError
    }

    // Safe try/catch parser — defaults to empty object so validateContentIdeaOutput
    // can apply Zod fallback placeholders rather than crashing the loop.
    let rawParsed: unknown
    try {
        rawParsed = JSON.parse(responseText || "{}")
    } catch {
        rawParsed = {}
    }

    // Zod-backed guardrail: validates all fields and fills in safe fallback
    // placeholders for any missing or malformed values.
    const validated = validateContentIdeaOutput(
        sanitizeMasterJson(rawParsed as Record<string, unknown>),
        field.fieldKey
    )

    // Map the structured output fields back to the ContentIdeaMasterJson shape
    // used throughout the rest of the codebase.  Destructure to exclude the
    // core-schema keys (body, slideText) so they don't silently sit alongside
    // their legacy aliases in the final object.
    const {
        body,
        slideText,
        hook: _hookAlias,
        slideTextBlocks: _sbAlias,
        ...rest
    } = validated

    const masterJson: ContentIdeaMasterJson = {
        ...rest,
        // body → hook  (DB column and all downstream routes read `hook`)
        hook: body,
        // slideText → slideTextBlocks  (carousel renderer reads `slideTextBlocks`)
        slideTextBlocks: slideText.length > 0 ? slideText : validated.slideTextBlocks,
    }

    // Enforce 6–10 slide constraint
    while (masterJson.slideTextBlocks.length < 6) {
        masterJson.slideTextBlocks.push("")
    }
    masterJson.slideTextBlocks = masterJson.slideTextBlocks.slice(0, 10)

    return { masterJson, rawPrompt }
}
