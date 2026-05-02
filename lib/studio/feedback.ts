export type StudioToastType = "success" | "error" | "info"

export type StudioToast = {
    id: string
    type: StudioToastType
    title: string
    message?: string
}

export const STUDIO_FEEDBACK = {
    saved: { type: "success", title: "Draft saved", message: "Carousel draft saved successfully." },
    exported: { type: "success", title: "Export started", message: "Carousel assets are being prepared." },
    copied: { type: "success", title: "Copied", message: "Caption copied to clipboard." },
    regenerated: { type: "success", title: "Regenerated", message: "The selected item has been updated." },
    deleted: { type: "success", title: "Slide deleted", message: "The slide was removed from this draft." },
    duplicated: { type: "success", title: "Slide copied", message: "A duplicate slide was added." },
    approved: { type: "success", title: "Approved", message: "Carousel approved for manual publishing." },
    sourceLoaded: { type: "success", title: "Source loaded", message: "Source material is attached to this draft." },
    qualityGate: { type: "success", title: "Quality gate complete", message: "Anti-generic scoring has been refreshed." },
    blankDiscarded: { type: "info", title: "Blank draft discarded", message: "No draft was saved because nothing was added." },
    needsPrompt: { type: "info", title: "Prompt required", message: "Use the prompt panel to generate carousel content." },
} satisfies Record<string, { type: StudioToastType; title: string; message: string }>

export function formatStudioError(error: unknown, fallback: string) {
    const raw = error instanceof Error ? error.message : fallback
    const cleaned = raw
        .replace(/^GET\s+\/api\/studio\/packages\/[^ ]+\s+failed:\s*/i, "")
        .replace(/^POST\s+\/api\/studio\/packages\/[^ ]+\/export\s+failed:\s*/i, "")
        .replace(/^POST\s+\/api\/studio\/packages\/[^ ]+\/chat\s+failed:\s*/i, "")
        .replace(/^POST\s+\/api\/studio\/packages\/[^ ]+\/approve\s+failed:\s*/i, "")
        .replace(/^POST\s+\/api\/studio\/packages\/[^ ]+\/quality-gate\s+failed:\s*/i, "")
        .replace(/^POST\s+\/api\/studio\/packages\/[^ ]+\/source\s+failed:\s*/i, "")
        .replace(/^PATCH\s+\/api\/studio\/packages\/[^ ]+\s+failed:\s*/i, "")
        .replace(/^Request failed$/i, fallback)

    if (/high demand|503|unavailable|maxRetriesExceeded/i.test(cleaned)) {
        return "The studio generator is temporarily busy. Try again in a moment."
    }

    return cleaned || fallback
}
