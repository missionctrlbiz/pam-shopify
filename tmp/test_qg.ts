import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function testQualityGate() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        console.log("Testing with gemini-2.5-pro...");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: { responseMimeType: "application/json" },
            contents: "return {\"status\": \"ok\"}",
        });
        console.log("Success");
    } catch (e: any) {
        console.error("KEYS:", Object.keys(e));
        console.error("e.status:", e.status);
        console.error("e.code:", e.code);
        console.error("e.message:", e.message);
    }
}

testQualityGate();
