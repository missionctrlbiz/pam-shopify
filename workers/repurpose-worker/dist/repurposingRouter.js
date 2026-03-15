"use strict";
/**
 * Repurposing Router — self-contained copy for the Cloud Run worker.
 * (Cannot import from the Next.js app — workers are separate Node.js projects.)
 *
 * SDK: @google/genai (new, GA March 2025)
 * — response.text is a PROPERTY not a method
 * — responseMimeType: "application/json" eliminates markdown-fenced responses
 * — GoogleGenAI({ apiKey }) replaces GoogleGenerativeAI + getGenerativeModel() chain
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRepurposedContent = generateRepurposedContent;
const genai_1 = require("@google/genai");
const PRODUCTION_MODEL = "gemini-2.5-flash";
function buildPrompt(input) {
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
`.trim();
}
async function generateRepurposedContent(input) {
    var _a, _b, _c;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error("GEMINI_API_KEY not set");
    const ai = new genai_1.GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: PRODUCTION_MODEL,
        config: { responseMimeType: "application/json" },
        contents: buildPrompt(input),
    });
    // response.text is a property (not a method) in @google/genai
    const text = response.text ?? "{}";
    let captions;
    try {
        captions = JSON.parse(text);
    }
    catch {
        throw new Error(`Repurposing router returned non-parseable JSON: ${text.slice(0, 200)}`);
    }
    // Fill in missing char estimates
    captions.ig = captions.ig ?? { caption: "", hashtagBlock: "", charEstimate: 0 };
    (_a = captions.ig).charEstimate || (_a.charEstimate = (captions.ig.caption?.length ?? 0) + (captions.ig.hashtagBlock?.length ?? 0));
    captions.fb = captions.fb ?? { caption: "", hashtagBlock: "", charEstimate: 0 };
    (_b = captions.fb).charEstimate || (_b.charEstimate = captions.fb.caption?.length ?? 0);
    captions.linkedin = captions.linkedin ?? { post: "", charEstimate: 0 };
    (_c = captions.linkedin).charEstimate || (_c.charEstimate = captions.linkedin.post?.length ?? 0);
    return captions;
}
