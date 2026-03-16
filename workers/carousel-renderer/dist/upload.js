"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSlides = uploadSlides;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
async function uploadSlides(slides, blobFolder, filePrefix, _contentIdeaId) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Key must be set in environment variables");
    }
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    const results = [];
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "assets";
    for (const { buffer, slideIndex } of slides) {
        const suffix = (0, crypto_1.randomBytes)(4).toString("hex");
        const filename = `${filePrefix}_slide${slideIndex + 1}-${suffix}.png`;
        const pathname = `${blobFolder}/${filename}`;
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(pathname, buffer, {
            contentType: "image/png",
            upsert: true
        });
        if (error) {
            throw new Error(`Failed to upload ${filename}: ${error.message}`);
        }
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(pathname);
        results.push({
            url: publicUrl,
            pathname,
            filename,
            slideIndex,
        });
        console.log(`[upload] Uploaded ${filename} → ${publicUrl}`);
    }
    return results;
}
