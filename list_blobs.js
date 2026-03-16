const { list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function listFiles() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        // Extract Vercel Blob Token
        const tokenMatch = envContent.match(/BLOB_READ_WRITE_TOKEN=["'](.+?)["']/);
        if (!tokenMatch) throw new Error("Missing BLOB_READ_WRITE_TOKEN in .env");

        const token = tokenMatch[1];
        process.env.BLOB_READ_WRITE_TOKEN = token; // required by @vercel/blob

        console.log("Listing Vercel Blob contents...");
        const { blobs } = await list();

        console.log(`Found ${blobs.length} blobs in Vercel.`);
        if (blobs.length > 0) {
            console.log("First 5 blobs:");
            blobs.slice(0, 5).forEach(b => console.log(`- ${b.pathname} (${b.url})`));
        }

    } catch (err) {
        console.error("Failed to list blobs:", err.message);
    }
}

listFiles();
