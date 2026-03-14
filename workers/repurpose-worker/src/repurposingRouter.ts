/**
 * Repurposing Router — self-contained copy for the Cloud Run worker.
 * (Cannot import from the Next.js app — workers are separate Node.js projects.)
 *
 * SDK: @google/genai (new, GA March 2025)
 * — response.text is a PROPERTY not a method
 * — responseMimeType: "application/json" eliminates markdown-fenced responses
 * — GoogleGenAI({ apiKey }) replaces GoogleGenerativeAI + getGenerativeModel() chain
 */

import { GoogleGenAI } from "@google/genai"

const PRODUCTION_MODEL = "gemini-2.5-flash"

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

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: PRODUCTION_MODEL,
    config: { responseMimeType: "application/json" },
    contents: buildPrompt(input),
  })

  // response.text is a property (not a method) in @google/genai
  const text = response.text ?? "{}"

  let captions: PlatformCaptions
  try {
    captions = JSON.parse(text) as PlatformCaptions
  } catch {
    throw new Error(`Repurposing router returned non-parseable JSON: ${text.slice(0, 200)}`)
  }

  // Fill in missing char estimates
  captions.ig = captions.ig ?? { caption: "", hashtagBlock: "", charEstimate: 0 }
  captions.ig.charEstimate ||= (captions.ig.caption?.length ?? 0) + (captions.ig.hashtagBlock?.length ?? 0)

  captions.fb = captions.fb ?? { caption: "", hashtagBlock: "", charEstimate: 0 }
  captions.fb.charEstimate ||= captions.fb.caption?.length ?? 0

  captions.linkedin = captions.linkedin ?? { post: "", charEstimate: 0 }
  captions.linkedin.charEstimate ||= captions.linkedin.post?.length ?? 0

  return captions
}
