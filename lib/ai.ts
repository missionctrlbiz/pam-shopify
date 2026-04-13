/**
 * Shared Google Gen AI client singleton.
 * Import getAI() instead of instantiating GoogleGenAI in every file.
 */
import { GoogleGenAI } from "@google/genai"

/** Single source of truth for all Gemini callers in the Next.js app. */
/** Using gemini-2.5-pro as requested for high-fidelity clinical content generation. */
export const PRODUCTION_MODEL = "gemini-2.5-pro"
/** Optimized fallback model for handling high-demand periods or high-volume background tasks. */
export const FALLBACK_MODEL = "gemini-2.5-flash"

let _ai: GoogleGenAI | null = null

export function getAI(): GoogleGenAI {
    if (!_ai) {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("GEMINI_API_KEY not set")
        _ai = new GoogleGenAI({ apiKey })
    }
    return _ai
}
