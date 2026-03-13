/**
 * Repurposing Router — self-contained copy for the Cloud Run worker.
 * (Cannot import from the Next.js app — workers are separate Node.js projects.)
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const PRODUCTION_MODEL = "gemini-2.5-flash" // gemini-2.0-flash deprecated for new API keys March 2026

export interface RepurposeInput {
    hook: string
    teachingPoints: string[]
    cta: string
    clinicalGrounding: string
    platform: string
    postType: string
    topic: string
    entryDate: string
}

export interface PlatformCaptions {
    ig: { caption: string; hashtagBlock: string; charEstimate: number }
    fb: { caption: string; hashtagBlock: string; charEstimate: number }
    tiktok: { script: string; hashtagBlock: string; durationEstimateSecs: number }
    linkedin: { post: string; charEstimate: number }
    email: { subjectLine: string; previewText: string; body: string }
}

function buildPrompt(input: RepurposeInput): string {
    return `
You are the Content Repurposing Specialist for Psychiatric Assessment Mastery™ (PAM).
Adapt the master content idea into 5 platform-specific formats.
Preserve clinical specificity — no generic wellness filler.

ORIGINAL CONTENT:
  Topic: ${input.topic}
  Platform: ${input.platform}
  Hook: ${input.hook}
  Teaching Points:
${input.teachingPoints.map((p, i) => `    ${i + 1}. ${p}`).join("\n")}
  CTA: ${input.cta}
  Clinical Grounding: ${input.clinicalGrounding}

BRAND RULES: PMHNP graduate-level language. Unmistakably PAM-specific. No "mental health matters" filler. All CTAs → PAM Mastery Bundle.

Return a single JSON object:
{
  "ig": { "caption": "...", "hashtagBlock": "#PMHNP #PsychNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
  "fb": { "caption": "...", "hashtagBlock": "#PMHNP #PsychiatricAssessment #PAMastery", "charEstimate": 0 },
  "tiktok": { "script": "...", "hashtagBlock": "#PMHNP #PsychTok #MedTok #PAMastery", "durationEstimateSecs": 75 },
  "linkedin": { "post": "...", "charEstimate": 0 },
  "email": { "subjectLine": "...", "previewText": "...", "body": "..." }
}

STRICT FORMAT: Return ONLY the JSON object. No markdown. No explanation.
`.trim()
}

export async function generateRepurposedContent(input: RepurposeInput): Promise<PlatformCaptions> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY not set")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: PRODUCTION_MODEL })

    const result = await model.generateContent(buildPrompt(input))

    const text = result.response
        .text()
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()

    const captions = JSON.parse(text) as PlatformCaptions

    // Fill in missing char estimates
    captions.ig.charEstimate ||= captions.ig.caption.length + captions.ig.hashtagBlock.length
    captions.fb.charEstimate ||= captions.fb.caption.length
    captions.linkedin.charEstimate ||= captions.linkedin.post.length

    return captions
}
