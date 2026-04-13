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

import { getAI, PRODUCTION_MODEL, FALLBACK_MODEL } from "@/lib/ai"
import {
    QUALITY_GATE_QUESTIONS,
    QualityGateInput,
    QualityGateOutput,
    PASS_THRESHOLD_SCORE,
    PASS_THRESHOLD_COUNT,
    evaluateQualityGateResponse
} from "./qualityGateUtils"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export { QUALITY_GATE_QUESTIONS, PASS_THRESHOLD_SCORE, PASS_THRESHOLD_COUNT, PRODUCTION_MODEL }
export type { QualityGateInput, QualityGateOutput }

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
    const ai = getAI()
    
    let responseText = "{}"
    let currentModel = PRODUCTION_MODEL
    let lastError: any = null

    // Retry loop with exponential backoff and model fallback
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: currentModel,
                config: { responseMimeType: "application/json" },
                contents: prompt,
            })
            responseText = response.text ?? "{}"
            lastError = null
            break
        } catch (error: any) {
            lastError = error
            const errorMsg = error?.message?.toLowerCase() || ""
            const is503 = error?.status === 503 || errorMsg.includes("high demand") || errorMsg.includes("overloaded")
            
            if (is503 && attempt < 2) {
                const delay = Math.pow(2, attempt) * 1500
                console.warn(`[QualityGate] 503 High Demand for ${currentModel}. Retrying in ${delay}ms...`)
                await sleep(delay)
                if (attempt === 1) {
                    currentModel = FALLBACK_MODEL
                }
            } else {
                break
            }
        }
    }

    if (lastError) {
        throw lastError
    }

    return evaluateQualityGateResponse(responseText)
}
