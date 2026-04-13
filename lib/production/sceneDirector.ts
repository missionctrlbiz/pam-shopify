/**
 * Scene Director — Expands a ContentIdeaMasterJson into a full scene-by-scene
 * storyboard, voiceover script, and per-platform prompt bank via a second
 * Gemini call.
 *
 * Called by: POST /api/production/calendar/[id]/scenes
 * Results saved to: VideoScript.scriptJson (merged, not replaced)
 *
 * Scene rules (from Psychiatric Assessment Mastery Storyboard Pack):
 *   • COVER   — always first,  5 s,   strong hook
 *   • TEACHING — one per point, 4–8 s (word-count: Math.min(8, ceil(words/2.5)))
 *   • CTA      — always last,   5–6 s
 *   • Total: 30–60 s enforced; under → add 2 s to TEACHING; over → trim TEACHING
 *
 * ESL gesture cues embedded in every voiceoverText:
 *   [pause]          → 0.5 s break after clinical terms
 *   [breath]         → 0.3 s breath cue between scene transitions
 *   [emphasize:word] → the single most critical term per scene
 *
 * Model: gemini-2.5-flash via PRODUCTION_MODEL import from contentStrategist
 */

import { getAI, FALLBACK_MODEL } from "@/lib/ai"
import {
    PRODUCTION_MODEL,
    ContentIdeaMasterJson,
    PAMScene,
    PlatformPromptBank,
} from "./contentStrategist"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SceneDirectorResult {
    scenes: PAMScene[]
    voiceoverFull: string
    platformPromptBank: PlatformPromptBank
    totalDurationSecs: number
}

// ─── ESL marker validation ────────────────────────────────────────────────────

function hasRequiredESLMarkers(scenes: PAMScene[]): boolean {
    const voiceover = scenes.map((s) => s.voiceoverText).join(" ")
    return (
        voiceover.includes("[pause]") &&
        voiceover.includes("[breath]") &&
        /\[emphasize:[^\]]+\]/.test(voiceover)
    )
}

// ─── Duration enforcement ─────────────────────────────────────────────────────

function enforceDurationBounds(scenes: PAMScene[]): PAMScene[] {
    const total = scenes.reduce((s, sc) => s + sc.durationSecs, 0)

    if (total >= 30 && total <= 60) return scenes

    const teaching = scenes.filter((s) => s.type === "TEACHING")

    if (total < 30) {
        const deficit = 30 - total
        const addPerScene = Math.ceil(deficit / Math.max(teaching.length, 1))
        return scenes.map((s) =>
            s.type === "TEACHING"
                ? { ...s, durationSecs: Math.min(8, s.durationSecs + addPerScene) }
                : s
        )
    }

    if (total > 60) {
        // Trim the longest TEACHING scenes
        let excess = total - 60
        const sorted = [...teaching].sort((a, b) => b.durationSecs - a.durationSecs)
        const trimMap = new Map<PAMScene, number>()
        for (const scene of sorted) {
            if (excess <= 0) break
            const canTrim = scene.durationSecs - 4 // minimum 4 s
            const trim = Math.min(canTrim, excess)
            if (trim > 0) {
                trimMap.set(scene, trim)
                excess -= trim
            }
        }
        return scenes.map((s) => {
            const trim = trimMap.get(s)
            return trim ? { ...s, durationSecs: s.durationSecs - trim } : s
        })
    }

    return scenes
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildScenePrompt(
    masterJson: ContentIdeaMasterJson,
    platform: string,
    postType: string
): string {
    const teachingList = masterJson.teachingPoints
        .map((tp, i) => `  ${i + 1}. ${tp}`)
        .join("\n")

    return `
You are a medical education video director and content strategist for Psychiatric Assessment Mastery™ (PAM).
Created by Tonia Ojomo PMHNP-BC for PMHNP students and psychiatric nurses.

BRAND VOICE: Calm. Instructional. Clinical. Trustworthy. ESL-friendly (short sentences, common vocabulary, no idioms).
VISUAL STYLE from Storyboard Pack: Clean light backgrounds, dark text, one muted accent color, minimal clutter.
Motion: subtle fade/slide/zoom. Never trend-heavy. Mobile readability always first.

MASTER IDEA:
  Hook: ${masterJson.hook}
  CTA: ${masterJson.cta}
  Clinical Grounding: ${masterJson.clinicalGrounding}
  Teaching Points:
${teachingList}

TARGET PLATFORM: ${platform}
POST TYPE: ${postType}

YOUR TASK: Return a single JSON object with this EXACT schema:

{
  "scenes": [
    {
      "type": "COVER",
      "durationSecs": 5,
      "voiceoverText": "Hook sentence. [pause] Short follow-on. [emphasize:keyword]",
      "visualDirection": "Clean title card. Bold hook text top-third. Subtle notebook background.",
      "textOverlay": "Hook text — max 10 words",
      "emojiAccent": "📋"
    },
    {
      "type": "TEACHING",
      "durationSecs": 6,
      "voiceoverText": "Clinical teaching point. [pause] Key concept. [emphasize:term] [breath]",
      "visualDirection": "Single text card or checklist. One concept only.",
      "textOverlay": "Teaching point — max 10 words",
      "emojiAccent": "✓"
    },
    {
      "type": "CTA",
      "durationSecs": 5,
      "voiceoverText": "Save this for your next clinical. [pause] Follow for more structured assessment training.",
      "visualDirection": "Clean CTA badge or footer. Brand navy background. White text.",
      "textOverlay": "Save this for clinical.",
      "emojiAccent": "📌"
    }
  ],
  "voiceoverFull": "Complete script: all scene voiceoverText joined with scene transitions. Must include [pause], [breath], [emphasize:word] cues throughout.",
  "platformPromptBank": {
    "IG_CAROUSEL": {
      "canvaSlidePrompts": ["Slide 1 Canva design prompt (what to build visually)", "Slide 2...", "...up to 10 slides"],
      "captionHook": "First 2 lines of the IG caption",
      "hashtagSet": ["#PMHNP", "#PsychNP", "#PsychiatricAssessment", "#NursePractitioner", "#MentalHealthNP", "#PAMastery"]
    },
    "TIKTOK_VIDEO": {
      "spokenScript": "Complete TikTok spoken script. Hook in first 3 words. Conversational. Max 60s.",
      "textOverlays": ["Scene 1 overlay", "Scene 2 overlay", "..."],
      "soundSuggestion": "Ambient piano or calm lo-fi — no trending audio that dates the video"
    },
    "LINKEDIN": {
      "professionalPost": "150-300 word professional authority post. Lead with clinical insight. Close with a question.",
      "postHook": "First sentence of the LinkedIn post",
      "cta": "Follow for structured PMHNP assessment content."
    },
    "EMAIL": {
      "subjectLine": "Curiosity-gap subject line, max 50 chars",
      "preheaderText": "preview text max 90 chars",
      "bodyThreeParagraphs": ["Hook/problem paragraph", "Teaching paragraph", "CTA to PAM bundle paragraph"]
    },
    "VIDEO": {
      "sceneDirectorNotes": ["One note per scene — visual/pacing direction for Remotion build"],
      "thumbnailConceptPrompt": "Text-first thumbnail. Clinical concept. Dark navy top bar + white text hook.",
      "descriptionSEO": "SEO-optimized description 150-200 words. Key terms: PMHNP, psychiatric assessment, MSE."
    }
  },
  "totalDurationSecs": 35
}

SCENE CONSTRUCTION RULES:
1. Always start with COVER (5 s) and end with CTA (5–6 s).
2. One TEACHING scene per teaching point. durationSecs = Math.min(8, Math.ceil(wordCount/2.5)), minimum 4 s.
3. totalDurationSecs = sum of all durationSecs. MUST be 30–60. Adjust TEACHING durations to fit.
4. Every voiceoverText MUST contain:
   - At least one [pause] after a clinical term
   - At least one [breath] (usually end of scene)
   - Exactly one [emphasize:word] on the most critical term in that scene
5. voiceoverFull = all scene voiceoverText joined in sequence. Include [breath] between scenes.
6. ESL-friendly language: short sentences, no idioms, common medical vocabulary only.
7. On-screen text must be readable on a 9:16 mobile screen in 2 seconds. Max 10 words per overlay.
8. IG_CAROUSEL canvaSlidePrompts: one per slide, up to 10. Each is a specific Canva design instruction.
9. LINKEDIN professionalPost: exactly 150–300 words. Include specific clinical statistic or framework.

STRICT FORMAT: Return ONLY the JSON object. No markdown fences. No explanation.
`.trim()
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function expandToSceneDirectorScript(
    masterJson: ContentIdeaMasterJson,
    platform: string,
    postType: string
): Promise<SceneDirectorResult> {
    const rawPrompt = buildScenePrompt(masterJson, platform, postType)
    const ai = getAI()

    let result: SceneDirectorResult | null = null
    let lastError = ""
    let currentModel = PRODUCTION_MODEL

    // Core attempt loop: tries normally, retries up to 3 times for 503s.
    // Separately tracks "missing ESL markers" retry logic.
    let markersAttempt = 1

    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const prompt = markersAttempt === 1
                ? rawPrompt
                : rawPrompt + "\n\nPREVIOUS OUTPUT REJECTED: Missing required [pause], [breath], or [emphasize:word] cues in voiceoverText. You MUST include all three types of ESL markers. Retry with corrected output."
            
            const response = await ai.models.generateContent({
                model: currentModel,
                config: { responseMimeType: "application/json" },
                contents: prompt,
            })
            const text = response.text ?? "{}"
            const parsed = JSON.parse(text) as SceneDirectorResult

            // Enforce duration bounds server-side
            parsed.scenes = enforceDurationBounds(parsed.scenes)
            parsed.totalDurationSecs = parsed.scenes.reduce(
                (s, sc) => s + sc.durationSecs,
                0
            )

            // Validate ESL markers
            if (!hasRequiredESLMarkers(parsed.scenes)) {
                if (markersAttempt === 1) {
                    lastError = "Missing ESL markers — retrying"
                    markersAttempt++
                    continue // Try again within the same retry loop budget
                }
                // On second marker attempt, accept anyway but log warning
                console.warn(
                    `[sceneDirector] ESL markers still missing after retry on ${currentModel} — accepting output`
                )
            }

            result = parsed
            break
        } catch (err: any) {
            lastError = String(err)
            const errorMsg = err?.message?.toLowerCase() || ""
            const is503 = err?.status === 503 || errorMsg.includes("high demand") || errorMsg.includes("overloaded")
            
            if (is503 && attempt < 3) {
                const delay = Math.pow(2, attempt) * 1500
                console.warn(`[sceneDirector] 503 High Demand for ${currentModel}. Retrying in ${delay}ms...`)
                await sleep(delay)
                if (attempt === 2) {
                    currentModel = FALLBACK_MODEL
                }
            } else if (attempt >= 3) {
                throw new Error(`sceneDirector failed after ${attempt} attempts: ${lastError}`)
            } else {
                // If it's a parsing error or something else, throw if we exhausted attempts
                 throw new Error(`sceneDirector non-retryable error: ${lastError}`)
            }
        }
    }

    if (!result) {
        throw new Error(`sceneDirector: no result after attempts. Last error: ${lastError}`)
    }

    return result
}
