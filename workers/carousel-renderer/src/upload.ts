import { put } from "@vercel/blob"

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
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not set")
    }

    const results: UploadResult[] = []

    for (const { buffer, slideIndex } of slides) {
        const filename = `${filePrefix}_slide${slideIndex + 1}.png`
        const pathname = `${blobFolder}/${filename}`

        const blob = await put(pathname, buffer, {
            access: "private",
            token,
            contentType: "image/png",
        })

        results.push({
            url: blob.url,
            pathname: blob.pathname,
            filename,
            slideIndex,
        })

        console.log(`[upload] Uploaded ${filename} → ${blob.url}`)
    }

    return results
}
