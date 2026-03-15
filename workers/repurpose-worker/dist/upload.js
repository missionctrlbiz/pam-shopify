"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeTextAssets = storeTextAssets;
const blob_1 = require("@vercel/blob");
async function storeTextAssets(files, blobFolder, prefix, date, topicSlug) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token)
        throw new Error("BLOB_READ_WRITE_TOKEN is not set");
    const results = [];
    for (const file of files) {
        const filename = `${prefix}_${file.platform}_${date}_${topicSlug}_v1.${file.ext}`;
        const pathname = `${blobFolder}/${filename}`;
        const contentType = file.ext === "html" ? "text/html" : "text/plain";
        const blob = await (0, blob_1.put)(pathname, file.text, {
            access: "private",
            token,
            contentType,
        });
        results.push({ url: blob.url, pathname: blob.pathname, filename, platform: file.platform });
        console.log(`[upload] Stored ${filename} → ${blob.url}`);
    }
    return results;
}
