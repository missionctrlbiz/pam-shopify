"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripESLMarkers = stripESLMarkers;
exports.generateAudio = generateAudio;
const axios_1 = __importDefault(require("axios"));
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
// Default voice: "Sarah" — calm, ESL-friendly, clinical education
// George (JBFqnCBsd6RMkjVDRZzb) — authoritative male alternative
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL";
/**
 * Settings tuned for clinical educational content:
 *   • Higher stability → consistent pacing, no unexpected intonation jumps
 *   • High similarity_boost → preserves voice character at clinical speech pace
 *   • Low style → neutral, professional; avoids over-expressiveness
 */
const DEFAULT_SETTINGS = {
    stability: 0.72,
    similarity_boost: 0.85,
    style: 0.1,
    use_speaker_boost: true,
};
/**
 * Strip ESL gesture cues that are meaningful for on-screen display
 * but should not be spoken aloud. Replace [pause] and [breath] with
 * natural pause punctuation so ElevenLabs still honours the rhythm.
 */
function stripESLMarkers(text) {
    return text
        .replace(/\[pause\]/g, ". ") // full stop → natural TTS pause
        .replace(/\[breath\]/g, ", ") // comma → brief pause
        .replace(/\[emphasize:([^\]]+)\]/g, "$1") // keep the word, drop the marker
        .replace(/\s{2,}/g, " ") // collapse double spaces
        .trim();
}
async function generateAudio(text, voiceId = DEFAULT_VOICE_ID) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey)
        throw new Error("ELEVENLABS_API_KEY is not set");
    const cleanText = stripESLMarkers(text);
    const response = await axios_1.default.post(`${ELEVENLABS_API_URL}/${voiceId}`, {
        text: cleanText,
        model_id: "eleven_multilingual_v2", // best quality for ESL clinical content
        voice_settings: DEFAULT_SETTINGS,
    }, {
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
        },
        responseType: "arraybuffer",
        timeout: 120000, // 2 min for longer voiceovers
    });
    return Buffer.from(response.data);
}
