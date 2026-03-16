const fs = require('fs');
const path = require('path');

const prismaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(prismaPath, 'utf8');

function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

console.log("Adding @map annotations to fields in prisma/schema.prisma...");

const lines = content.split('\n');
let insideModel = false;
const updatedLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('model ')) {
        insideModel = true;
        updatedLines.push(line);
        continue;
    }

    if (insideModel && line.trim().startsWith('}')) {
        insideModel = false;
        updatedLines.push(line);
        continue;
    }

    if (insideModel) {
        const trimmed = line.trim();
        // Skip empty lines, comments, and @@ rules
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
            updatedLines.push(line);
            continue;
        }

        const parts = trimmed.split(/\s+/);
        const fieldName = parts[0];
        const fieldType = parts[1] ? parts[1].replace('?', '').replace('[]', '') : '';

        const scalars = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'UserRole', 'Platform', 'FunnelStage', 'PostType', 'PublishStatus', 'AssetType', 'AssetStatus', 'RenderJobType', 'RenderJobStatus', 'QualityGateStatus', 'FieldCategory'];

        if (!scalars.includes(fieldType)) {
            // console.log(`- Skipping relation or non-column field: ${fieldName}`);
            updatedLines.push(line);
            continue;
        }

        // If it starts with a lowercase letter and contains an uppercase letter (camelCase)
        if (fieldName && /^[a-z][a-zA-Z0-9]*$/.test(fieldName) && /[A-Z]/.test(fieldName)) {

            // Avoid double mapping
            if (!trimmed.includes('@map(')) {
                const snakeName = toSnakeCase(fieldName);
                console.log(`+ Mapping Field: ${fieldName} -> ${snakeName}`);

                // Always append @map at the END of the line to ensure it is appended safe
                // (Prisma sometimes cares about position relative to scalars)
                let updatedLine = line + ` @map("${snakeName}")`;

                updatedLines.push(updatedLine);
                continue;
            }
        }
    }

    updatedLines.push(line);
}

fs.writeFileSync(prismaPath, updatedLines.join('\n'));
console.log("\n✅ Field mapping completed successfully!");
