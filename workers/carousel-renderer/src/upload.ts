import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

interface UploadResult {
    url: string
    pathname: string
    filename: string
    slideIndex: number
}

export async function uploadSlides(
    slides: Array<{ buffer: Buffer; slideIndex: number }>,
    blobFolder: string,
    filePrefix: string,
    _contentIdeaId: string
): Promise<UploadResult[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase URL and Key must be set in environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const results: UploadResult[] = []
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "assets"

    for (const { buffer, slideIndex } of slides) {
        const suffix = randomBytes(4).toString("hex")
        const filename = `${filePrefix}_slide${slideIndex + 1}-${suffix}.png`
        const pathname = `${blobFolder}/${filename}`

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(pathname, buffer, {
                contentType: "image/png",
                upsert: true
            })

        if (error) {
            throw new Error(`Failed to upload ${filename}: ${error.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(pathname)

        results.push({
            url: publicUrl,
            pathname,
            filename,
            slideIndex,
        })

        console.log(`[upload] Uploaded ${filename} → ${publicUrl}`)
    }

    return results
}
