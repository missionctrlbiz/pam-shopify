import { createClient } from "@supabase/supabase-js"

interface TextFile {
    text: string
    platform: string
    ext: string
}

interface StoredAsset {
    url: string
    pathname: string
    filename: string
    platform: string
}

export async function storeTextAssets(
    files: TextFile[],
    blobFolder: string,
    prefix: string,
    date: string,
    topicSlug: string
): Promise<StoredAsset[]> {
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

    const results: StoredAsset[] = []

    for (const file of files) {
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const filename = `${prefix}_${file.platform}_${date}_${topicSlug}_v1_${randomSuffix}.${file.ext}`
        const pathname = `${blobFolder}/${filename}`
        const contentType = file.ext === "html" ? "text/html" : "text/plain"

        const { data, error } = await supabase.storage
            .from("production")
            .upload(pathname, file.text, {
                contentType,
                upsert: true
            })

        if (error) {
            throw new Error(`Failed to store asset ${filename}: ${error.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
            .from("production")
            .getPublicUrl(pathname)

        results.push({ url: publicUrl, pathname: pathname, filename, platform: file.platform })
        console.log(`[upload] Stored ${filename} → ${publicUrl}`)
    }

    return results
}
