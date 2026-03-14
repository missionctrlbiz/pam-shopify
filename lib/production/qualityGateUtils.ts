/**
 * Quality Gate Evaluation Utilities
 *
 * This file contains the scoring logic and thresholds for the Quality Gate.
 * It is separated from the main service function to allow for testing
 * without external dependencies (like Google Gen AI).
 */

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

/**
 * Parses the AI response and calculates scores, overall mean, and pass/fail status.
 */
export function evaluateQualityGateResponse(text: string): QualityGateOutput {
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
    // Handles strings, missing values (NaN becomes 1), and out-of-bounds
    const clamp = (n: any) => Math.min(5, Math.max(1, Math.round(Number(n) || 1)))

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
        reasoning1: raw.reasoning1 || "",
        reasoning2: raw.reasoning2 || "",
        reasoning3: raw.reasoning3 || "",
        reasoning4: raw.reasoning4 || "",
        reasoning5: raw.reasoning5 || "",
        overallScore,
        passed,
    }
}
