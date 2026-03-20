import test from "node:test"
import assert from "node:assert"
import { validateContentIdeaOutput, buildContextBlock } from "../ai/prompts.ts"

// ---------------------------------------------------------------------------
// validateContentIdeaOutput
// ---------------------------------------------------------------------------

test("validateContentIdeaOutput — happy path with core fields (body/slideText)", () => {
    const raw = {
        title: "Why PMHNPs Miss Critical Mood Risks",
        body: "Most PMHNPs overlook three hidden risks behind every depressed mood presentation.",
        slideText: [
            "Three risks hiding in every depressed presentation",
            "Risk 1: Missed bipolar spectrum features",
            "Risk 2: Overlooked medical contributors",
            "Risk 3: Unscreened trauma history",
            "Document all three to defend your assessment",
            "Save this to review before your next intake",
        ],
        teachingPoints: ["Check for hypomania history", "Order TSH, B12, CBC"],
        cta: "Grab the PAM Mastery Bundle to master every assessment.",
        clinicalGrounding: "DSM-5-TR specifies that bipolar II is frequently misdiagnosed.",
        platformAdaptations: {
            IG: { caption: "IG caption", charEstimate: 120 },
            FB: { caption: "FB caption", charEstimate: 80 },
            TIKTOK: { caption: "TikTok script", charEstimate: 300 },
            LINKEDIN: { caption: "LinkedIn post", charEstimate: 900 },
            EMAIL: { subjectLine: "Missed risks", previewText: "What you might overlook", bodyOutline: "Para 1, 2, 3" },
        },
        estimatedReadTimeSecs: 45,
    }

    const result = validateContentIdeaOutput(raw, "si_risk")

    assert.strictEqual(result.title, "Why PMHNPs Miss Critical Mood Risks")
    assert.strictEqual(result.body, raw.body)
    // hook is back-filled from body
    assert.strictEqual(result.hook, raw.body)
    assert.deepStrictEqual(result.slideText, raw.slideText)
    // slideTextBlocks is back-filled from slideText
    assert.deepStrictEqual(result.slideTextBlocks, raw.slideText)
    assert.strictEqual(result.estimatedReadTimeSecs, 45)
})

test("validateContentIdeaOutput — happy path with legacy keys (hook/slideTextBlocks)", () => {
    const raw = {
        title: "Bipolar vs MDD: The Assessment Trap",
        hook: "Your MSE thought process documentation probably confuses content with process.",
        slideTextBlocks: [
            "MSE content vs process — do you know the difference?",
            "Content: what the patient says",
            "Process: how they say it",
            "Documenting both changes your diagnosis",
            "Avoid this common charting mistake",
            "PAM teaches you the exact framework",
        ],
        teachingPoints: ["Always document both content and process"],
        cta: "Download PAM workbook now.",
        clinicalGrounding: "Accurate MSE documentation improves diagnostic reliability.",
        platformAdaptations: {
            IG: { caption: "IG", charEstimate: 100 },
            FB: { caption: "FB", charEstimate: 90 },
            TIKTOK: { caption: "TikTok", charEstimate: 200 },
            LINKEDIN: { caption: "LinkedIn", charEstimate: 800 },
            EMAIL: { subjectLine: "MSE trap", previewText: "Are you confusing these?", bodyOutline: "Para 1, 2, 3" },
        },
        estimatedReadTimeSecs: 45,
    }

    const result = validateContentIdeaOutput(raw, "mse_process")

    assert.strictEqual(result.hook, raw.hook)
    // body is forward-filled from hook
    assert.strictEqual(result.body, raw.hook)
    assert.deepStrictEqual(result.slideTextBlocks, raw.slideTextBlocks)
    // slideText is forward-filled from slideTextBlocks
    assert.deepStrictEqual(result.slideText, raw.slideTextBlocks)
})

test("validateContentIdeaOutput — safe fallbacks for optional fields", () => {
    const raw = {
        title: "Clinical Risk Assessment Essentials",
        body: "Every assessment needs these three risk anchors to be defensible.",
        slideText: [
            "Risk anchor 1: Suicidal ideation screen",
            "Risk anchor 2: Safety plan discussion",
            "Risk anchor 3: Social support check",
            "Document all three every visit",
            "This protects the patient and your license",
            "PAM walks you through each step",
        ],
        // teachingPoints, cta, clinicalGrounding, platformAdaptations,
        // estimatedReadTimeSecs — all intentionally missing
    }

    const result = validateContentIdeaOutput(raw, "si_risk")

    // Core fields present
    assert.strictEqual(result.title, "Clinical Risk Assessment Essentials")
    // Fallbacks applied
    assert.deepStrictEqual(result.teachingPoints, [])
    assert.strictEqual(result.cta, "")
    assert.strictEqual(result.clinicalGrounding, "")
    assert.strictEqual(result.estimatedReadTimeSecs, 60)
    assert.strictEqual(result.platformAdaptations.IG.caption, "")
    assert.strictEqual(result.platformAdaptations.EMAIL.subjectLine, "")
})

test("validateContentIdeaOutput — throws when title is missing", () => {
    const raw = {
        body: "Some hook sentence.",
        slideText: ["Slide 1", "Slide 2", "Slide 3", "Slide 4", "Slide 5", "Slide 6"],
    }

    assert.throws(() => {
        validateContentIdeaOutput(raw, "test_field")
    }, /schema validation/)
})

test("validateContentIdeaOutput — throws on non-object input", () => {
    assert.throws(() => {
        validateContentIdeaOutput("not an object", "test_field")
    }, /non-object output/)

    assert.throws(() => {
        validateContentIdeaOutput(null, "test_field")
    }, /non-object output/)
})

// ---------------------------------------------------------------------------
// buildContextBlock
// ---------------------------------------------------------------------------

test("buildContextBlock — renders all three schema nodes", () => {
    const block = buildContextBlock({
        day_number: 7,
        clinical_field: "Suicidal Ideation",
        platform: "IG",
    })

    assert.ok(block.includes("Day Number:      7 of 30"), "day_number node missing")
    assert.ok(block.includes("Clinical Field:  Suicidal Ideation"), "clinical_field node missing")
    assert.ok(block.includes("Platform:        IG"), "platform node missing")
})

test("buildContextBlock — uses typed StructuredPromptContext (no raw string interpolation)", () => {
    const block = buildContextBlock({
        day_number: 1,
        clinical_field: "Mental Status Exam",
        platform: "LINKEDIN",
    })

    // Ensure every key is present — guards against accidental renaming
    assert.ok(block.includes("Day Number:"))
    assert.ok(block.includes("Clinical Field:"))
    assert.ok(block.includes("Platform:"))
})
