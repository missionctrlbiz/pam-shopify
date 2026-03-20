/**
 * lib/ai/prompts.ts
 *
 * Structured prompt engineering for Gemini AI content generation.
 *
 * Provides:
 *  - `StructuredPromptContext` — strongly typed schema node for prompt variables
 *    (day_number, clinical_field, platform) injected into every content prompt.
 *  - `ContentIdeaCoreSchema` / `ContentIdeaOutputSchema` — Zod schemas that
 *    validate the required minimum output shape { title, body, slideText[] }
 *    as well as all extended ContentIdeaMasterJson fields.
 *  - `CONTENT_IDEA_RESPONSE_SCHEMA` — a native Gemini `Schema` object (type:
 *    "object") consumed directly by the SDK's `responseSchema` config key,
 *    guaranteeing structured JSON responses from the model.
 *  - `validateContentIdeaOutput()` — safe Zod-backed parser with fallback
 *    placeholders so upstream loops never crash on malformed AI output.
 */

import { z } from "zod"
import { Type } from "@google/genai"
import type { Schema } from "@google/genai"

// ---------------------------------------------------------------------------
// Structured Prompt Context — schema nodes injected into prompts
// ---------------------------------------------------------------------------

/** Total days in a content calendar cycle — used in context block output. */
export const CALENDAR_DAYS = 30

/**
 * The three contextual variables that must be injected into every content
 * generation prompt as well-defined schema nodes.  Using a typed object
 * (rather than plain string interpolation) makes prompt construction
 * auditable, testable, and safe to re-order or extend.
 */
export interface StructuredPromptContext {
    /** Content calendar position — e.g. 7 means "Day 7 of 30". */
    day_number: number
    /** Normalised clinical field label surfaced to the model (never a raw key). */
    clinical_field: string
    /** Platform token — e.g. "IG", "TIKTOK", "LINKEDIN", "FB", "EMAIL". */
    platform: string
}

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

/**
 * Core required output shape guaranteed by `responseSchema`.
 * Maps to the problem-spec contract: { title, body, slideText[] }
 *   - title        → content headline (≥ 1 char)
 *   - body         → primary hook / body text (≥ 1 char)   (= "hook" in DB)
 *   - slideText    → carousel slide strings (≥ 1 element)  (= "slideTextBlocks" in DB)
 */
export const ContentIdeaCoreSchema = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    slideText: z.array(z.string()).min(1),
})

/** Zod schema for a single platform caption block. */
const PlatformAdaptationSchema = z.object({
    caption: z.string().default(""),
    hashtagBlock: z.string().optional(),
    charEstimate: z.number().default(0),
})

/**
 * Full output schema that covers all ContentIdeaMasterJson fields plus the
 * required core shape from ContentIdeaCoreSchema.  Every optional field has
 * a safe `.default()` so `validateContentIdeaOutput` never returns undefined
 * values for fields the rest of the codebase reads.
 */
export const ContentIdeaOutputSchema = ContentIdeaCoreSchema.extend({
    // Legacy aliases kept for backward-compatibility: the DB and downstream
    // routes read `hook` and `slideTextBlocks`; we populate them from the
    // core fields when Gemini returns `body` / `slideText`.
    hook: z.string().default(""),
    slideTextBlocks: z.array(z.string()).default([]),

    teachingPoints: z.array(z.string()).default([]),
    cta: z.string().default(""),
    clinicalGrounding: z.string().default(""),
    platformAdaptations: z
        .object({
            IG: PlatformAdaptationSchema.default({ caption: "", charEstimate: 0 }),
            FB: PlatformAdaptationSchema.default({ caption: "", charEstimate: 0 }),
            TIKTOK: PlatformAdaptationSchema.default({ caption: "", charEstimate: 0 }),
            LINKEDIN: PlatformAdaptationSchema.default({ caption: "", charEstimate: 0 }),
            EMAIL: z
                .object({
                    subjectLine: z.string().default(""),
                    previewText: z.string().default(""),
                    bodyOutline: z.string().default(""),
                })
                .default({ subjectLine: "", previewText: "", bodyOutline: "" }),
        })
        .default({
            IG: { caption: "", charEstimate: 0 },
            FB: { caption: "", charEstimate: 0 },
            TIKTOK: { caption: "", charEstimate: 0 },
            LINKEDIN: { caption: "", charEstimate: 0 },
            EMAIL: { subjectLine: "", previewText: "", bodyOutline: "" },
        }),
    estimatedReadTimeSecs: z.number().default(60),
})

export type ContentIdeaOutput = z.infer<typeof ContentIdeaOutputSchema>

// ---------------------------------------------------------------------------
// Gemini native responseSchema — enforces type: "object" contract
// ---------------------------------------------------------------------------

/** String array helper reused across multiple properties. */
const stringArraySchema: Schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
}

const platformCaptionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        caption: { type: Type.STRING },
        hashtagBlock: { type: Type.STRING },
        charEstimate: { type: Type.NUMBER },
    },
    required: ["caption", "charEstimate"],
}

/**
 * Native Gemini `responseSchema` object passed directly to the SDK's
 * `config.responseSchema` field.  Using `type: Type.OBJECT` (the native
 * Gemini SDK enum) is required by the Gemini Advanced API contract.
 *
 * Enforced required fields satisfy the minimum contract:
 *   title   (= "title" in spec)
 *   body    (= "body" in spec  →  stored as `hook` in DB)
 *   slideText (= "slideText[]" in spec  →  stored as `slideTextBlocks` in DB)
 */
export const CONTENT_IDEA_RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description:
                "A clear, compelling 5-8 word content title.  Must be readable and professional.",
        },
        body: {
            type: Type.STRING,
            description:
                "One compelling hook sentence (10-20 words) that creates clinical tension.  " +
                "Complete English sentence only — no abbreviations.",
        },
        slideText: {
            ...stringArraySchema,
            description:
                "6-10 carousel slide strings.  Each string must be 8-12 words maximum.",
        },
        teachingPoints: {
            ...stringArraySchema,
            description: "3-5 actionable clinical insights.",
        },
        cta: {
            type: Type.STRING,
            description: "One sentence CTA toward PAM workbook or PAM Mastery Bundle.",
        },
        clinicalGrounding: {
            type: Type.STRING,
            description: "1-2 sentences explaining clinical relevance, citing DSM-5-TR evidence.",
        },
        platformAdaptations: {
            type: Type.OBJECT,
            properties: {
                IG: platformCaptionSchema,
                FB: platformCaptionSchema,
                TIKTOK: platformCaptionSchema,
                LINKEDIN: platformCaptionSchema,
                EMAIL: {
                    type: Type.OBJECT,
                    properties: {
                        subjectLine: { type: Type.STRING },
                        previewText: { type: Type.STRING },
                        bodyOutline: { type: Type.STRING },
                    },
                    required: ["subjectLine", "previewText", "bodyOutline"],
                },
            },
            required: ["IG", "FB", "TIKTOK", "LINKEDIN", "EMAIL"],
        },
        estimatedReadTimeSecs: {
            type: Type.NUMBER,
            description: "Estimated read/view time in seconds based on slide count.",
        },
    },
    required: ["title", "body", "slideText"],
}

// ---------------------------------------------------------------------------
// Safe Zod-backed parser with fallback placeholders
// ---------------------------------------------------------------------------

/**
 * Validates raw AI JSON output against `ContentIdeaOutputSchema`.
 *
 * Guarantees:
 *  - Returns a fully-typed `ContentIdeaOutput` or throws a descriptive error.
 *  - Every optional field defaults to a safe placeholder so downstream DB
 *    inserts never encounter `undefined` in required columns.
 *  - Normalises legacy `hook`/`slideTextBlocks` fields from the new
 *    `body`/`slideText` core fields when the model returns the new schema.
 *
 * @param raw   Parsed JSON from Gemini response (unknown shape).
 * @param fieldKey  Clinical field key — used only in error messages.
 */
export function validateContentIdeaOutput(
    raw: unknown,
    fieldKey: string
): ContentIdeaOutput {
    if (!raw || typeof raw !== "object") {
        throw new Error(
            `Gemini returned non-object output for field "${fieldKey}"`
        )
    }

    const input = raw as Record<string, unknown>

    // Normalise: if the model returned core fields body/slideText but not the
    // legacy hook/slideTextBlocks aliases, back-fill from the core fields so
    // both code paths work regardless of which key set the model used.
    if (typeof input.body === "string" && !input.hook) {
        input.hook = input.body
    }
    if (Array.isArray(input.slideText) && !Array.isArray(input.slideTextBlocks)) {
        input.slideTextBlocks = input.slideText
    }
    // Reverse: if the model returned legacy keys, forward-fill into core fields
    // so ContentIdeaCoreSchema required fields are satisfied.
    if (typeof input.hook === "string" && !input.body) {
        input.body = input.hook
    }
    if (Array.isArray(input.slideTextBlocks) && !Array.isArray(input.slideText)) {
        input.slideText = input.slideTextBlocks
    }

    const result = ContentIdeaOutputSchema.safeParse(input)

    if (!result.success) {
        throw new Error(
            `Gemini output failed schema validation for field "${fieldKey}": ` +
            result.error.issues.map((i) => i.message).join("; ")
        )
    }

    return result.data
}

// ---------------------------------------------------------------------------
// System prompt context builder
// ---------------------------------------------------------------------------

/**
 * Renders the structured context block that is injected into every Gemini
 * prompt.  Variables are isolated in a typed `StructuredPromptContext` node
 * rather than scattered across free-form string interpolation, making it
 * straightforward to audit, extend, or unit-test prompt inputs.
 */
export function buildContextBlock(ctx: StructuredPromptContext): string {
    return [
        "CONTENT SCHEDULING CONTEXT:",
        `  Day Number:      ${ctx.day_number} of ${CALENDAR_DAYS}`,
        `  Clinical Field:  ${ctx.clinical_field}`,
        `  Platform:        ${ctx.platform}`,
    ].join("\n")
}
