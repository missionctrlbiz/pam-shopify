import { put } from "@vercel/blob"

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
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set")

    const results: StoredAsset[] = []

    for (const file of files) {
        const filename = `${prefix}_${file.platform}_${date}_${topicSlug}_v1.${file.ext}`
        const pathname = `${blobFolder}/${filename}`
        const contentType = file.ext === "html" ? "text/html" : "text/plain"

        const blob = await put(pathname, file.text, {
            access: "private",
            token,
            contentType,
            addRandomSuffix: true,
        })

        results.push({ url: blob.url, pathname: blob.pathname, filename, platform: file.platform })
        console.log(`[upload] Stored ${filename} → ${blob.url}`)
    }

    return results
}
