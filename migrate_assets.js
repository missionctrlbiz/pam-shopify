const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Dynamically requiring node-fetch is not needed in Node 18+ (fetch is global)
async function migrateAssets() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        // Extract variables
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["'](.+?)["']/);
        const roleMatch = envContent.match(/SUPABASE_SERVICE_ROLE=["'](.+?)["']/);

        if (!urlMatch || !roleMatch) {
            throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env");
        }

        const supabaseUrl = urlMatch[1];
        const serviceRoleKey = roleMatch[1];

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        console.log("--- 🔄 Vercel Blob to Supabase Migration ---");

        // 1. Fetch all assets pointing to Vercel Blob
        const { data: assets, error: selectError } = await supabase
            .from('content_assets')
            .select('*')
            .like('storage_url', '%vercel-storage.com%');

        if (selectError) throw selectError;

        if (!assets || assets.length === 0) {
            console.log("✅ No old Vercel Blob assets found in ContentAsset table. Everything is up to date!");
            return;
        }

        console.log(`Found ${assets.length} items to migrate.`);

        for (const asset of assets) {
            console.log(`\nProcessing Asset ID: ${asset.id} (${asset.file_name})`);

            const oldUrl = asset.storage_url;
            const contentIdeaId = asset.content_idea_id;
            const assetType = asset.asset_type || 'general';
            const fileName = asset.file_name;

            // Build destination bucket path
            const newPath = `production/${contentIdeaId}/${assetType}/${fileName}`;
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/production/${newPath}`;

            console.log(`- Downloading from: ${oldUrl}`);

            try {
                // 2. Download from Vercel Blob
                const response = await fetch(oldUrl);
                if (!response.ok) {
                    console.error(`❌ Failed to download from Vercel (Status ${response.status})`);
                    continue;
                }

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                console.log(`- Uploading to Supabase: production/${newPath}`);

                // 3. Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('production')
                    .upload(newPath, buffer, {
                        upsert: true,
                        contentType: response.headers.get('content-type') || 'application/octet-stream'
                    });

                if (uploadError) {
                    console.error(`❌ Upload failed: ${uploadError.message}`);
                    continue;
                }

                // 4. Update Database
                const { error: updateError } = await supabase
                    .from('content_assets')
                    .update({
                        storage_url: publicUrl,
                        storage_path: newPath
                    })
                    .eq('id', asset.id);

                if (updateError) {
                    console.error(`❌ Failed to update Database row: ${updateError.message}`);
                    continue;
                }

                console.log(`✅ Successfully migrated!`);

            } catch (dlErr) {
                console.error(`❌ Operation crash on asset ${asset.id}:`, dlErr.message);
            }
        }

        console.log("\n--- 🎉 Migration Finished ---");

    } catch (err) {
        console.error("\nMigration Runner failed:", err);
    }
}

migrateAssets();
