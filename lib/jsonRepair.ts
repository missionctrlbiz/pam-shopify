/**
 * JSON repair utilities for AI model responses.
 *
 * Google Gemini with responseMimeType: "application/json" usually returns
 * clean JSON, but occasionally includes markdown fences, trailing commas,
 * or other minor formatting issues. This module provides a safe parse
 * that handles those cases.
 */

/**
 * Attempt to parse JSON with progressive repair.
 * Returns parsed object or throws with the original text for debugging.
 */
export function repairJSON(raw: string): unknown {
    let text = raw.trim()

    // 1. Strip markdown code fences: ```json ... ``` or ``` ... ```
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
        text = fenceMatch[1].trim()
    }

    // 2. Remove trailing commas before closing brackets/braces
    text = text.replace(/,(\s*[}\]])/g, "$1")

    // 3. Try to parse
    try {
        return JSON.parse(text)
    } catch {
        // 4. Try extracting the first complete JSON object/array
        const objectMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
        if (objectMatch) {
            const candidate = objectMatch[1].trim()
            try {
                return JSON.parse(candidate)
            } catch {
                // fall through to final error
            }
        }

        throw new Error(
            `Failed to parse JSON response. Raw text (first 500 chars): ${raw.slice(0, 500)}`,
        )
    }
}

/**
 * Call Gemini and parse the response as JSON with repair.
 * Provides try/catch safety and a fallback value on failure.
 */
export function parseGeminiJSON<T>(raw: string, fallback: T): T
export function parseGeminiJSON<T>(raw: string): T
export function parseGeminiJSON<T>(raw: string, fallback?: T): T {
    try {
        return repairJSON(raw) as T
    } catch (error) {
        if (arguments.length >= 2) {
            console.warn("Gemini JSON parse failed, using fallback:", error instanceof Error ? error.message : error)
            return fallback as T
        }
        throw error
    }
}
