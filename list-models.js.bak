const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// Read API key from .env
const envContent = fs.readFileSync(".env", "utf8");
const apiKey = envContent.split("\n").find(line => line.startsWith("GEMINI_API_KEY="))?.split("=")[1]?.trim().replace(/['"]/g, '');

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        console.log("\n=== Available Gemini Models ===\n");

        data.models?.forEach(model => {
            const supportsGeneration = model.supportedGenerationMethods?.includes('generateContent');
            if (supportsGeneration) {
                console.log(`✓ ${model.name}`);
                console.log(`  Display Name: ${model.displayName}`);
                console.log(`  Methods: ${model.supportedGenerationMethods?.join(', ')}`);
                console.log();
            }
        });
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
