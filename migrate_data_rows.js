const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateRows() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');

        // Extract old Postgres URL
        const oldDbMatch = envContent.match(/#?\s*POSTGRES_URL=["'](.+?)["']/);
        const newDbMatch = envContent.match(/DATABASE_URL=["'](.+?)["']/);

        if (!oldDbMatch || !newDbMatch) {
            throw new Error("Missing POSTGRES_URL (Prisma) or DATABASE_URL (Supabase) in .env.local");
        }

        const oldDbConnectionString = oldDbMatch[1];
        const newDbConnectionString = newDbMatch[1];

        console.log("Connecting to Old Prisma Database...");
        const oldClient = new Client({ connectionString: oldDbConnectionString });
        await oldClient.connect();

        console.log("Connecting to New Supabase Database...");
        const newClient = new Client({ connectionString: newDbConnectionString });
        await newClient.connect();

        // ordered by dependency (Primary Keys first, Foreign Keys last)
        const tables = [
            { old: 'Buyer', new: 'buyers' },
            { old: 'Lead', new: 'leads' },
            { old: 'SoapHistory', new: 'soap_histories' },
            { old: 'UsageEvent', new: 'usage_events' },
            { old: 'ClinicalField', new: 'clinical_fields' },
            { old: 'ProductionCalendarEntry', new: 'production_calendar_entries' },
            { old: 'ContentIdea', new: 'content_ideas' },
            { old: 'QualityGateResult', new: 'quality_gate_results' },
            { old: 'VideoScript', new: 'video_scripts' },
            { old: 'RenderJob', new: 'render_jobs' },
            { old: 'ContentAsset', new: 'content_assets' }
        ];

        for (const table of tables) {
            console.log(`\n--- Migrating ${table.old} -> ${table.new} ---`);

            try {
                // Read from old
                const res = await oldClient.query(`SELECT * FROM "public"."${table.old}"`);
                console.log(`- Found ${res.rows.length} rows to migrate.`);

                if (res.rows.length === 0) continue;

                // Insert to new
                for (const row of res.rows) {
                    const columns = Object.keys(row);
                    const snakeColumns = columns.map(c => c.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
                    const values = Object.values(row);

                    const placeholders = snakeColumns.map((_, i) => `$${i + 1}`).join(', ');

                    const query = `
                        INSERT INTO public.${table.new} (${snakeColumns.join(', ')}) 
                        VALUES (${placeholders})
                        ON CONFLICT DO NOTHING
                    `;

                    await newClient.query(query, values);
                }
                console.log(`✅ Finished ${table.new}`);

            } catch (err) {
                console.error(`❌ Failed to migrate ${table.old}: ${err.message}`);
            }
        }

        await oldClient.end();
        await newClient.end();
        console.log("\nComplete!");

    } catch (err) {
        console.error("\nMigration Runner failed:", err);
    }
}

migrateRows();
