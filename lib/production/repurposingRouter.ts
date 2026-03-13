/**
 * Repurposing Router — Gemini Service Function (for Cloud Run repurpose-worker)
 *
 * Accepts a ContentIdea's masterJson and generates platform-specific captions
 * for all 5 output channels in a single Gemini call.
 *
 * Intended to run inside the `repurpose-worker` Cloud Run container, NOT
 * directly in the Next.js app (avoids Vercel serverless timeout risk for
 * higher-quality model calls).
 *
 * The same function can be imported directly in Next.js for local dev / testing.
 *
 * Model: gemini-2.0-flash-thinking-exp-01-21 (same as contentStrategist)
 * JSON mode: prompt-enforced + code-fence stripping (thinking model limitation)
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import { PRODUCTION_MODEL } from "./contentStrategist"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepurposeInput {
    hook: string
    teachingPoints: string[]
    cta: string
    clinicalGrounding: string
    platform: string        // original scheduled platform (for tone context)
    postType: string
    topic: string
    entryDate: string       // ISO string — used for context only
}

export interface PlatformCaptions {
    ig: {
        caption: string
        hashtagBlock: string
        charEstimate: number
    }
    fb: {
        caption: string
        hashtagBlock: string
        charEstimate: number
    }
    tiktok: {
        script: string          // spoken-word TikTok script
        hashtagBlock: string
        durationEstimateSecs: number
    }
    linkedin: {
        post: string
        charEstimate: number
    }
    email: {
        subjectLine: string
        previewText: string
        body: string            // HTML-safe plain text body, ~300 words
    }
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildRepurposePrompt(input: RepurposeInput): string {
    return `
You are the Content Repurposing Specialist for Psychiatric Assessment Mastery™ (PAM).
You receive a master content idea and adapt it into 5 platform-specific formats.
Each format must preserve the clinical specificity of the original — NO generic wellness filler.

ORIGINAL CONTENT:
  Topic:            ${input.topic}
  Platform:         ${input.platform}
  Hook:             ${input.hook}
  Teaching Points:
${input.teachingPoints.map((p, i) => `    ${i + 1}. ${p}`).join("\n")}
  CTA:              ${input.cta}
  Clinical Grounding: ${input.clinicalGrounding}

BRAND VOICE RULES (non-negotiable):
- Clinical language at graduate PMHNP level
- Every piece must be unmistakably PAM-specific
- No generic phrases: "mental health matters", "self-care", "therapy helps"
- Hooks must create clinical tension or name diagnostic traps
- All CTAs drive toward PAM workbook or PAM Mastery Bundle

OUTPUT REQUIREMENTS — return a single JSON object with this exact structure:
{
  "ig": {
    "caption": "Full Instagram caption. Hook first (from original). Teaching points as numbered list. Max 2200 chars. Conversational PMHNP tone.",
    "hashtagBlock": "#PMHNP #PsychNP #PsychiatricAssessment #NursePractitioner #MentalHealthNP #PMHNPstudent #PAMastery #psychiatricnursepractitioner",
    "charEstimate": 0
  },
  "fb": {
    "caption": "Facebook post. Slightly longer form than IG. Narrative paragraphs. Max 3 hashtags at end. Link-preview friendly intro sentence.",
    "hashtagBlock": "#PMHNP #PsychiatricAssessment #PAMastery",
    "charEstimate": 0
  },
  "tiktok": {
    "script": "60-90 second spoken TikTok script. Hook-heavy opening line (must stop the scroll). Conversational. Ends with strong verbal CTA. Written as the words to be spoken aloud.",
    "hashtagBlock": "#PMHNP #NursePractitioner #PsychTok #MedTok #PAMastery #pmhnpstudent",
    "durationEstimateSecs": 75
  },
  "linkedin": {
    "post": "Professional LinkedIn post. Lead with the clinical insight. Use line breaks for readability. Close with an open-ended question to drive comments. Max 1300 chars.",
    "charEstimate": 0
  },
  "email": {
    "subjectLine": "Curiosity-gap or clinical-stakes subject line. Max 50 chars. No clickbait.",
    "previewText": "Preview text that extends the subject hook. Max 90 chars.",
    "body": "3-paragraph plain text email body. Paragraph 1: clinical hook/problem. Paragraph 2: the teaching point (actionable). Paragraph 3: CTA to PAM bundle. ~250-300 words total."
  }
}

STRICT FORMAT: Return ONLY the JSON object. No markdown code fences. No explanation text.
`.trim()
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateRepurposedContent(
    input: RepurposeInput
): Promise<PlatformCaptions> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.")
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL })

    const prompt = buildRepurposePrompt(input)
    const result = await model.generateContent(prompt)

    const text = result.response
        .text()
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()

    let captions: PlatformCaptions
    try {
        captions = JSON.parse(text) as PlatformCaptions
    } catch {
        throw new Error(
            `Repurposing router returned non-parseable JSON: ${text.slice(0, 200)}`
        )
    }

    // Compute char estimates if missing
    if (!captions.ig.charEstimate) {
        captions.ig.charEstimate = captions.ig.caption.length + captions.ig.hashtagBlock.length
    }
    if (!captions.fb.charEstimate) {
        captions.fb.charEstimate = captions.fb.caption.length
    }
    if (!captions.linkedin.charEstimate) {
        captions.linkedin.charEstimate = captions.linkedin.post.length
    }

    return captions
}
