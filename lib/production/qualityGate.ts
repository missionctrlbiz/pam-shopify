/**
 * Quality Gate — Gemini Service Function
 *
 * Runs a drafted ContentIdea through the PAM 5-question Anti-Generic Quality
 * Filter. Returns a scored JSON object with per-question scores (1–5), an
 * overall pass/fail, and brief reasoning for each question.
 *
 * Pass threshold: 4 out of 5 questions must individually score ≥ 3.
 * Overall score is the mean of all 5 scores (stored as Decimal in DB).
 *
 * Model: gemini-2.0-flash-thinking-exp-01-21 (thinking model — prompt-based JSON).
 */

import { getAI } from "@/lib/ai"
import { PRODUCTION_MODEL } from "./contentStrategist"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const QUALITY_GATE_QUESTIONS = [
    "Could this post belong to any generic mental health page, or is it unmistakably specific to psychiatric assessment mastery?",
    "Does this post teach a real, actionable clinical skill that a PMHNP student could apply in their next patient encounter?",
    "Is this post saveable or shareable — does it contain reference-quality information worth returning to?",
    "Does the hook create genuine clinical tension, name a diagnostic trap, or challenge a common misconception?",
    "Does the content reinforce trust in Tonia's specific PAM methodology, or does it feel like generic AI output?",
] as const

export const PASS_THRESHOLD_SCORE = 3   // each question must score ≥ this
export const PASS_THRESHOLD_COUNT = 4   // at least this many questions must pass

export interface QualityGateInput {
    hook: string
    teachingPoints: string[]
    cta: string
    clinicalGrounding: string
    platform: string
    postType: string
}

export interface QualityGateOutput {
    question1: string
    question2: string
    question3: string
    question4: string
    question5: string
    score1: number
    score2: number
    score3: number
    score4: number
    score5: number
    reasoning1: string
    reasoning2: string
    reasoning3: string
    reasoning4: string
    reasoning5: string
    overallScore: number   // mean, 2 decimal places
    passed: boolean
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildQualityPrompt(idea: QualityGateInput): string {
    const [q1, q2, q3, q4, q5] = QUALITY_GATE_QUESTIONS

    return `
You are the Quality Control reviewer for Psychiatric Assessment Mastery™ (PAM), a clinical education
brand targeting PMHNP students. Your job is to evaluate drafted social media content against 5 strict
anti-generic quality criteria. Be critical — mediocre or generic content must be flagged.

CONTENT UNDER REVIEW:
  Platform:        ${idea.platform}
  Post Type:       ${idea.postType}
  Hook:            ${idea.hook}
  Teaching Points: ${idea.teachingPoints.map((p, i) => `\n    ${i + 1}. ${p}`).join("")}
  CTA:             ${idea.cta}
  Clinical Grounding: ${idea.clinicalGrounding}

EVALUATION CRITERIA (score each 1–5, where 1=fails completely, 5=exemplary):

  Q1: ${q1}
  Q2: ${q2}
  Q3: ${q3}
  Q4: ${q4}
  Q5: ${q5}

SCORING GUIDE:
  5 = Exemplary — unmistakably PAM-specific, could not be from any other source
  4 = Good — mostly specific, minor genericism
  3 = Borderline — passes minimum bar, needs watch
  2 = Weak — too generic, vague, or surface-level
  1 = Fails — could belong to any wellness page, no clinical specificity

Return a JSON object with these exact keys:
  score1, score2, score3, score4, score5 (integers 1–5)
  reasoning1, reasoning2, reasoning3, reasoning4, reasoning5 (1-sentence explanation per score)

STRICT FORMAT: Return ONLY the JSON object. No markdown fences. No extra text.
`.trim()
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runQualityGate(
    idea: QualityGateInput
): Promise<QualityGateOutput> {
    const prompt = buildQualityPrompt(idea)
    const response = await getAI().models.generateContent({
        model: PRODUCTION_MODEL,
        config: { responseMimeType: "application/json" },
        contents: prompt,
    })
    const text = response.text ?? "{}"

    let raw: {
        score1: number; score2: number; score3: number; score4: number; score5: number
        reasoning1: string; reasoning2: string; reasoning3: string; reasoning4: string; reasoning5: string
    }

    try {
        raw = JSON.parse(text)
    } catch {
        throw new Error(`Quality gate returned non-parseable JSON: ${text.slice(0, 200)}`)
    }

    // Clamp scores to valid 1–5 range
    const clamp = (n: number | string | undefined | null) => Math.min(5, Math.max(1, Math.round(Number(n) || 1)))
    const s1 = clamp(raw.score1)
    const s2 = clamp(raw.score2)
    const s3 = clamp(raw.score3)
    const s4 = clamp(raw.score4)
    const s5 = clamp(raw.score5)

    const overallScore = Math.round(((s1 + s2 + s3 + s4 + s5) / 5) * 100) / 100

    // Pass if at least PASS_THRESHOLD_COUNT questions score ≥ PASS_THRESHOLD_SCORE
    const passingCount = [s1, s2, s3, s4, s5].filter(
        (s) => s >= PASS_THRESHOLD_SCORE
    ).length
    const passed = passingCount >= PASS_THRESHOLD_COUNT

    return {
        question1: QUALITY_GATE_QUESTIONS[0],
        question2: QUALITY_GATE_QUESTIONS[1],
        question3: QUALITY_GATE_QUESTIONS[2],
        question4: QUALITY_GATE_QUESTIONS[3],
        question5: QUALITY_GATE_QUESTIONS[4],
        score1: s1, score2: s2, score3: s3, score4: s4, score5: s5,
        reasoning1: raw.reasoning1,
        reasoning2: raw.reasoning2,
        reasoning3: raw.reasoning3,
        reasoning4: raw.reasoning4,
        reasoning5: raw.reasoning5,
        overallScore,
        passed,
    }
}
