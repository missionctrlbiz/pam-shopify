import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

interface UploadResult {
    url: string
    pathname: string
}

export async function uploadAsset(
    buffer: Buffer,
    pathname: string,
    contentType: string
): Promise<UploadResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Key must be set in environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "assets"

    const suffix = randomBytes(4).toString("hex")
    const ext = pathname.split('.').pop()
    const nameWithoutExt = pathname.replace(`.${ext}`, '')
    const suffixedPathname = `${nameWithoutExt}-${suffix}.${ext}`

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(suffixedPathname, buffer, {
            contentType,
            upsert: true
        })

    if (error) {
        throw new Error(`Failed to upload ${suffixedPathname}: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(suffixedPathname)

    console.log(`[upload] ${suffixedPathname} → ${publicUrl}`)
    return { url: publicUrl, pathname: suffixedPathname }
}
