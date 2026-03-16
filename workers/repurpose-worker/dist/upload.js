"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeTextAssets = storeTextAssets;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
async function storeTextAssets(files, blobFolder, prefix, date, topicSlug) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Key must be set in environment variables");
    }
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    const results = [];
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "assets";
    for (const file of files) {
        const suffix = (0, crypto_1.randomBytes)(4).toString("hex");
        const filename = `${prefix}_${file.platform}_${date}_${topicSlug}_v1-${suffix}.${file.ext}`;
        const pathname = `${blobFolder}/${filename}`;
        const contentType = file.ext === "html" ? "text/html" : "text/plain";
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(pathname, file.text, {
            contentType,
            upsert: true
        });
        if (error) {
            throw new Error(`Failed to upload ${filename}: ${error.message}`);
        }
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(pathname);
        results.push({ url: publicUrl, pathname, filename, platform: file.platform });
        console.log(`[upload] Stored ${filename} → ${publicUrl}`);
    }
    return results;
}
