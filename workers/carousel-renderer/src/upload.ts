import { createClient } from "@supabase/supabase-js"

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials are not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE)")
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const results: UploadResult[] = []

    for (const { buffer, slideIndex } of slides) {
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const filename = `${filePrefix}_slide${slideIndex + 1}_${randomSuffix}.png`
        const pathname = `${blobFolder}/${filename}`

        const { data, error } = await supabase.storage
            .from("production")
            .upload(pathname, buffer, {
                contentType: "image/png",
                upsert: true
            })

        if (error) {
            throw new Error(`Failed to upload slide ${slideIndex}: ${error.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
            .from("production")
            .getPublicUrl(pathname)

        results.push({
            url: publicUrl,
            pathname: pathname,
            filename,
            slideIndex,
        })

        console.log(`[upload] Uploaded ${filename} → ${publicUrl}`)
    }

    return results
}
