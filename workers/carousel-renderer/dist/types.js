"use strict";
/**
 * Shared types for all PAM render workers.
 * Copied into each worker to keep them self-contained.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCallback = postCallback;
async function postCallback(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Callback to ${url} failed [${res.status}]: ${text}`);
    }
}
