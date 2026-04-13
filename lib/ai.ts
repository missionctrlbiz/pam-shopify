/**
 * Shared Google Gen AI client singleton.
 * Import getAI() instead of instantiating GoogleGenAI in every file.
 */
import { GoogleGenAI } from "@google/genai"

/** Single source of truth for all Gemini callers in the Next.js app. */
export const PRODUCTION_MODEL = "gemini-2.5-pro"

let _ai: GoogleGenAI | null = null

export function getAI(): GoogleGenAI {
    if (!_ai) {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("GEMINI_API_KEY not set")
        _ai = new GoogleGenAI({ apiKey })
    }
    return _ai
}
