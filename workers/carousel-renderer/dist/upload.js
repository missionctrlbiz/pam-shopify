"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSlides = uploadSlides;
const blob_1 = require("@vercel/blob");
async function uploadSlides(slides, blobFolder, filePrefix, _contentIdeaId) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not set");
    }
    const results = [];
    for (const { buffer, slideIndex } of slides) {
        const filename = `${filePrefix}_slide${slideIndex + 1}.png`;
        const pathname = `${blobFolder}/${filename}`;
        const blob = await (0, blob_1.put)(pathname, buffer, {
            access: "private",
            token,
            contentType: "image/png",
        });
        results.push({
            url: blob.url,
            pathname: blob.pathname,
            filename,
            slideIndex,
        });
        console.log(`[upload] Uploaded ${filename} → ${blob.url}`);
    }
    return results;
}
