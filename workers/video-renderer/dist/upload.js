"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAsset = uploadAsset;
const blob_1 = require("@vercel/blob");
async function uploadAsset(buffer, pathname, contentType) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token)
        throw new Error("BLOB_READ_WRITE_TOKEN is not set");
    const blob = await (0, blob_1.put)(pathname, buffer, {
        access: "private",
        token,
        contentType,
    });
    console.log(`[upload] ${pathname} → ${blob.url}`);
    return { url: blob.url, pathname: blob.pathname };
}
