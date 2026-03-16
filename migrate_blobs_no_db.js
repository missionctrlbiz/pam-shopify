const { list } = require('@vercel/blob');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function migrateBlobs() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        // Extract credentials
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["'](.+?)["']/);
        const roleMatch = envContent.match(/SUPABASE_SERVICE_ROLE=["'](.+?)["']/);
        const tokenMatch = envContent.match(/BLOB_READ_WRITE_TOKEN=["'](.+?)["']/);

        if (!urlMatch || !roleMatch || !tokenMatch) {
            throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE, or BLOB_READ_WRITE_TOKEN in .env");
        }

        const supabaseUrl = urlMatch[1];
        const serviceRoleKey = roleMatch[1];
        process.env.BLOB_READ_WRITE_TOKEN = tokenMatch[1];

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        console.log("--- 🔄 Vercel Blob Direct Migration to Supabase ---");

        console.log("Listing Vercel Blob assets...");
        const { blobs } = await list();
        console.log(`Found ${blobs.length} blobs total.`);

        if (blobs.length === 0) {
            console.log("No assets to migrate.");
            return;
        }

        for (const blob of blobs) {
            console.log(`\nProcessing: ${blob.pathname}`);

            const pathParts = blob.pathname.split('/');

            // Expected format: production / [contentIdeaId] / [assetType] / [fileName]
            if (pathParts.length < 4 || pathParts[0] !== 'production') {
                console.log(`⚠️ Skipping non-standard path: ${blob.pathname}`);
                continue;
            }

            const contentIdeaId = pathParts[1];
            const assetType = pathParts[2];
            const fileName = pathParts[pathParts.length - 1];

            console.log(`- Detected Idea ID: ${contentIdeaId}`);
            console.log(`- Asset Type: ${assetType}`);
            console.log(`- File: ${fileName}`);

            try {
                // 1. Download from Vercel
                const response = await fetch(blob.url);
                if (!response.ok) {
                    console.error(`❌ Failed to download blob: ${blob.url}`);
                    continue;
                }

                const buf = Buffer.from(await response.arrayBuffer());

                // 2. Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('production')
                    .upload(blob.pathname, buf, {
                        upsert: true,
                        contentType: response.headers.get('content-type') || 'application/octet-stream'
                    });

                if (uploadError) {
                    console.error(`❌ Upload skipped/error: ${uploadError.message}`);
                    continue;
                }

                // 3. Create Placeholder row in standard structure
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/production/${blob.pathname}`;

                // Check if idea exists, if not we create idea placeholder or create directly
                const { error: insertError } = await supabase
                    .from('content_assets')
                    .insert({
                        content_idea_id: contentIdeaId,
                        asset_type: assetType,
                        file_name: fileName,
                        storage_url: publicUrl,
                        storage_path: blob.pathname,
                        status: 'COMPLETE'
                    });

                if (insertError) {
                    if (insertError.message.includes('foreign key constraint')) {
                        console.log(`⚠️ ContentIdea ${contentIdeaId} missing from DB (Prisma lock), creating Idea stub to satisfy foreign key...`);

                        // Insert idea stub
                        await supabase.from('content_ideas').insert({
                            id: contentIdeaId,
                            calendar_entry_id: `stub-${contentIdeaId}`, // mock
                            master_json: {},
                            raw_gemini_prompt: 'Placeholder from Vercel migration',
                            generated_by_id: 'e3832c32-7317-44f1-895a-ad97b219ef71' // your admin ID!
                        }).select();

                        // Retry asset insert
                        await supabase.from('content_assets').insert({
                            content_idea_id: contentIdeaId,
                            asset_type: assetType,
                            file_name: fileName,
                            storage_url: publicUrl,
                            storage_path: blob.pathname,
                            status: 'COMPLETE'
                        });
                        console.log(`✅ Asset restored with Idea stub!`);
                    } else {
                        console.error(`❌ DB insert failed: ${insertError.message}`);
                    }
                } else {
                    console.log(`✅ Asset inserted directly into ContentAsset table!`);
                }

            } catch (err) {
                console.error(`❌ Error operations failed for ${blob.pathname}:`, err.message);
            }
        }

        console.log("\n--- 🎉 Vercel Blob Direct Migration Complete ---");

    } catch (err) {
        console.error("\nMigration failed:", err);
    }
}

migrateBlobs();
