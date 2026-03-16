import { getAI } from "@/lib/ai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Simple in-memory cache to prevent identical prompts from consuming the API key
const responseCache = new Map<string, string>();

// Simple in-memory rate limiter per IP address
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_MAX = 5; // max 5 requests per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // per 1 minute

export async function POST(req: Request) {
    try {
        // 1. Basic Rate Limiting
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const now = Date.now();
        const userRate = rateLimitCache.get(ip);

        if (userRate) {
            if (now > userRate.resetTime) {
                // reset if time window passed
                rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
            } else if (userRate.count >= RATE_LIMIT_MAX) {
                return NextResponse.json(
                    { error: "Too many AI requests. Please wait a moment before trying again." },
                    { status: 429 }
                );
            } else {
                userRate.count += 1;
            }
        } else {
            rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }

        // Check if API key is configured
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is not configured");
            return NextResponse.json(
                { error: "API key not configured. Please add GEMINI_API_KEY to your environment variables." },
                { status: 500 }
            );
        }

        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // 2. Check Cache
        const cacheKey = prompt.trim().toLowerCase();
        if (responseCache.has(cacheKey)) {
            console.log("Serving AI response from cache");
            return NextResponse.json({ text: responseCache.get(cacheKey) });
        }

        const result = await getAI().models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        const text = result.text ?? "";

        // Save to cache (limit cache size to prevent memory leaks)
        if (responseCache.size > 1000) {
            const firstKey = responseCache.keys().next().value;
            if (firstKey) responseCache.delete(firstKey);
        }
        responseCache.set(cacheKey, text);

        // Track usage event
        try {
            await supabaseAdmin
                .from("usage_events")
                .insert({
                    action: "soap_generate",
                    metadata: { promptLength: prompt.length, responseLength: text.length, ip },
                })
        } catch (trackError) {
            console.error("[Usage Tracking] Error:", trackError);
        }

        return NextResponse.json({ text });
    } catch (error) {
        console.error("Error generating content:", error);

        // Provide more specific error messages
        const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
        const statusCode = 500;

        return NextResponse.json(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
            },
            { status: statusCode }
        );
    }
}