const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function listColumns() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        // Extract Database URL
        const dbUrlMatch = envContent.match(/DATABASE_URL=["'](.+?)["']/);
        if (!dbUrlMatch) throw new Error("Missing DATABASE_URL in .env");

        const dbConnectionString = dbUrlMatch[1];

        const pgClient = new Client({ connectionString: dbConnectionString });
        await pgClient.connect();

        const res = await pgClient.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'content_assets'
        `);

        console.log("Columns inside public.content_assets:");
        res.rows.forEach(r => console.log(`- ${r.column_name}`));

        await pgClient.end();

    } catch (err) {
        console.error("Failed to list columns:", err);
    }
}

listColumns();
