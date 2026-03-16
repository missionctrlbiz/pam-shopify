import { createClient } from "@supabase/supabase-js"

interface UploadResult {
    url: string
    pathname: string
}

export async function uploadAsset(
    buffer: Buffer | string,
    pathname: string,
    contentType: string
): Promise<UploadResult> {
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

    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extIndex = pathname.lastIndexOf(".")
    let finalPathname = pathname
    if (extIndex !== -1) {
        finalPathname = `${pathname.substring(0, extIndex)}_${randomSuffix}${pathname.substring(extIndex)}`
    } else {
        finalPathname = `${pathname}_${randomSuffix}`
    }

    const { data, error } = await supabase.storage
        .from("production")
        .upload(finalPathname, buffer, {
            contentType,
            upsert: true
        })

    if (error) {
        throw new Error(`Failed to upload asset ${finalPathname}: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
        .from("production")
        .getPublicUrl(finalPathname)

    console.log(`[upload] ${finalPathname} → ${publicUrl}`)
    return { url: publicUrl, pathname: finalPathname }
}
