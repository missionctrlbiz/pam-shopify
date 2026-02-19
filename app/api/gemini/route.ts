
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
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

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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