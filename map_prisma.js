const fs = require('fs');
const path = require('path');

const prismaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(prismaPath, 'utf8');

const map = {
    'Buyer': 'buyers',
    'Lead': 'leads',
    'SoapHistory': 'soap_histories',
    'UsageEvent': 'usage_events',
    'ClinicalField': 'clinical_fields',
    'ProductionCalendarEntry': 'production_calendar_entries',
    'ContentIdea': 'content_ideas',
    'QualityGateResult': 'quality_gate_results',
    'VideoScript': 'video_scripts',
    'ContentAsset': 'content_assets',
    'RenderJob': 'render_jobs'
};

console.log("Adding @@map annotations to prisma/schema.prisma...");

for (const [model, plural] of Object.entries(map)) {
    const regex = new RegExp(`model ${model} \\{([\\s\\S]*?)(\\r?\\n)\\}`, 'g');

    if (content.match(regex)) {
        content = content.replace(regex, (match, inner, newline) => {
            if (inner.includes('@@map')) {
                console.log(`- ${model} already mapped.`);
                return match;
            }
            console.log(`+ Mapping ${model} -> ${plural}`);
            return `model ${model} {${inner}\n  @@map("${plural}")${newline}}`;
        });
    } else {
        console.log(`⚠️ Model ${model} not found in schema.prisma.`);
    }
}

fs.writeFileSync(prismaPath, content);
console.log("\n✅ prisma/schema.prisma updated successfully!");
