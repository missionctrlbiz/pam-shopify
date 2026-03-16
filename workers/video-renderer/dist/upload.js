"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAsset = uploadAsset;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
async function uploadAsset(buffer, pathname, contentType) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Key must be set in environment variables");
    }
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "assets";
    const suffix = (0, crypto_1.randomBytes)(4).toString("hex");
    const ext = pathname.split('.').pop();
    const nameWithoutExt = pathname.replace(`.${ext}`, '');
    const suffixedPathname = `${nameWithoutExt}-${suffix}.${ext}`;
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(suffixedPathname, buffer, {
        contentType,
        upsert: true
    });
    if (error) {
        throw new Error(`Failed to upload ${suffixedPathname}: ${error.message}`);
    }
    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(suffixedPathname);
    console.log(`[upload] ${suffixedPathname} → ${publicUrl}`);
    return { url: publicUrl, pathname: suffixedPathname };
}
