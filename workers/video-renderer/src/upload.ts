import { put } from "@vercel/blob"

interface UploadResult {
    url: string
    pathname: string
}

export async function uploadAsset(
    buffer: Buffer,
    pathname: string,
    contentType: string
): Promise<UploadResult> {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set")

    const blob = await put(pathname, buffer, {
        access: "private",
        token,
        contentType,
    })

    console.log(`[upload] ${pathname} → ${blob.url}`)
    return { url: blob.url, pathname: blob.pathname }
}
