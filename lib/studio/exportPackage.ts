import "server-only"

import { createHash } from "node:crypto"
import JSZip from "jszip"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureStudioBucket, ensureStudioSettings, parseStudioPackageRow } from "@/lib/studio/server"
import { STUDIO_RENDERER_VERSION, STUDIO_RATIOS, STUDIO_TYPOGRAPHY } from "@/lib/studio/shared"
import { getStudioPublicAssets, renderStudioSlideToPng, type StudioRenderableSlide } from "@/lib/studio/render/carousel"
import type { StudioAsset, StudioCaption, StudioRatio, StudioSlide } from "@/lib/studio/types"

type StudioExportMode = "SLIDES" | "BUNDLE" | "ALL"

interface StudioExportCanvasSnapshotSlide {
    id: string
    kind?: string
    layout?: string
    bg?: string
    variant?: string
}

export interface StudioExportCanvasSnapshot {
    capturedAt: string
    ratio: StudioRatio
    slideCount: number
    typography?: {
        headingFamily?: string
        bodyFamily?: string
        metaFont?: string
    }
    slides: StudioExportCanvasSnapshotSlide[]
}

export interface StudioExportPackageInput {
    packageId: string
    ownerId?: string
    ratios?: StudioRatio[]
    mode?: StudioExportMode
    exportRequestId?: string
    exportJobId?: string
    requestedAt?: string
    canvasSnapshot?: StudioExportCanvasSnapshot | null
}

function parseAssetRow(row: Record<string, unknown>): StudioAsset {
    return {
        id: String(row.id),
        packageId: String(row.package_id),
        kind: row.kind as StudioAsset["kind"],
        ratio: row.ratio as StudioAsset["ratio"],
        slideId: row.slide_id as string | null,
        storagePath: String(row.storage_path),
        bytes: typeof row.bytes === "number" ? row.bytes : null,
        createdAt: String(row.created_at),
    }
}

function safeString(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback
}

function normalizeExportCaption(caption?: Partial<StudioCaption> | null) {
    return {
        body: safeString(caption?.body),
        hashtags: Array.isArray(caption?.hashtags) ? caption.hashtags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0) : [],
    }
}

function normalizeExportSlide(slide: Partial<StudioSlide>, index: number, totalSlides: number): StudioRenderableSlide {
    const isFirst = index === 0
    const isLast = index === totalSlides - 1

    return {
        id: safeString(slide.id, `slide-${index + 1}`),
        kind: slide.kind ?? (isLast ? "CTA" : isFirst ? "COVER" : "INSIGHT"),
        layout: slide.layout,
        headline: safeString(slide.headline, isFirst ? "Psychiatric Assessment Mastery" : "Clinical Assessment Point"),
        body: safeString(slide.body),
        stat: slide.stat ? {
            value: safeString(slide.stat.value),
            label: safeString(slide.stat.label),
        } : undefined,
        bg: slide.bg ?? (isFirst || isLast ? "SLATE" : "WHITE"),
        assets: slide.assets,
    }
}

function stableObject(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(stableObject)
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
        return Object.fromEntries(entries.map(([key, entryValue]) => [key, stableObject(entryValue)]))
    }
    return value
}

function snapshotFingerprint(snapshot: unknown) {
    return createHash("sha256").update(JSON.stringify(stableObject(snapshot))).digest("hex")
}

function toIsoDate(value: unknown, fallback: string) {
    if (typeof value !== "string") {
        return fallback
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function normalizeCanvasSnapshot(snapshot: StudioExportPackageInput["canvasSnapshot"]): StudioExportCanvasSnapshot | null {
    if (!snapshot || typeof snapshot !== "object") {
        return null
    }

    const ratio = snapshot.ratio === "1:1" || snapshot.ratio === "4:5" || snapshot.ratio === "9:16"
        ? snapshot.ratio
        : "1:1"
    const capturedAt = toIsoDate(snapshot.capturedAt, new Date().toISOString())
    const slides = Array.isArray(snapshot.slides)
        ? snapshot.slides.map((slide, index) => ({
            id: safeString(slide?.id, `slide-${index + 1}`),
            kind: typeof slide?.kind === "string" ? slide.kind : undefined,
            layout: typeof slide?.layout === "string" ? slide.layout : undefined,
            bg: typeof slide?.bg === "string" ? slide.bg : undefined,
            variant: typeof slide?.variant === "string" ? slide.variant : undefined,
        }))
        : []

    return {
        capturedAt,
        ratio,
        slideCount: typeof snapshot.slideCount === "number" ? snapshot.slideCount : slides.length,
        typography: snapshot.typography ? {
            headingFamily: safeString(snapshot.typography.headingFamily),
            bodyFamily: safeString(snapshot.typography.bodyFamily),
            metaFont: safeString(snapshot.typography.metaFont),
        } : undefined,
        slides,
    }
}

function summarizeSlides(slides: StudioSlide[]) {
    return slides.map((slide) => ({
        id: slide.id,
        kind: slide.kind,
        layout: slide.layout ?? "AUTO",
        bg: slide.bg,
        stat: slide.stat ? { value: slide.stat.value, label: slide.stat.label } : undefined,
        headlineLength: slide.headline.length,
        bodyLength: slide.body.length,
        bodyLineCount: slide.body.split(/\n+/).map((line) => line.trim()).filter(Boolean).length,
    }))
}

function captionText(label: string, caption: Partial<StudioCaption> | null | undefined) {
    const normalized = normalizeExportCaption(caption)
    return `${label}\n\n${normalized.body}\n\n${normalized.hashtags.join(" ")}\n`
}

export async function runStudioExportPackage(input: StudioExportPackageInput) {
    const ratios = input.ratios && input.ratios.length > 0 ? input.ratios : STUDIO_RATIOS
    const mode = input.mode ?? "ALL"
    const exportStartedAt = new Date().toISOString()
    const requestedAt = toIsoDate(input.requestedAt, exportStartedAt)
    const exportRequestId = safeString(input.exportRequestId, `export-${Date.now()}`)
    const canvasSnapshot = normalizeCanvasSnapshot(input.canvasSnapshot)

    const query = supabaseAdmin
        .from("studio_packages")
        .select("*")
        .eq("id", input.packageId)

    if (input.ownerId) {
        query.eq("owner_id", input.ownerId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) {
        throw new Error("Studio package not found")
    }

    const item = parseStudioPackageRow(data)
    if (item.carouselJson.slides.length === 0) {
        throw new Error("Add at least one slide before exporting assets")
    }
    const packageSnapshot = {
        packageId: item.id,
        ownerId: item.ownerId,
        title: item.title,
        status: item.status,
        packageUpdatedAt: item.updatedAt,
        carouselRatio: item.carouselJson.ratio,
        slideCount: item.carouselJson.slides.length,
        slideIds: item.carouselJson.slides.map((slide) => slide.id),
        slideKinds: item.carouselJson.slides.map((slide) => slide.kind),
        layouts: item.carouselJson.slides.map((slide) => slide.layout ?? "AUTO"),
        backgrounds: item.carouselJson.slides.map((slide) => slide.bg),
        typography: {
            headingFamily: STUDIO_TYPOGRAPHY.headingFamily,
            bodyFamily: STUDIO_TYPOGRAPHY.bodyFamily,
            metaFont: item.carouselJson.meta.font,
        },
        slides: summarizeSlides(item.carouselJson.slides),
    }
    const packageSnapshotHash = snapshotFingerprint(packageSnapshot)
    const canvasSnapshotHash = canvasSnapshot ? snapshotFingerprint(canvasSnapshot) : null

    await ensureStudioBucket()
    const settings = await ensureStudioSettings(item.ownerId)
    const publicAssets = await getStudioPublicAssets()
    const brand = {
        brandName: settings.brandJson.brand_name,
        siteUrl: settings.brandJson.site_url,
        logoColorDataUrl: publicAssets.logoColor,
        logoWhiteDataUrl: publicAssets.logoWhite,
        bookDataUrl: publicAssets.book,
        palette: settings.brandJson.palette,
    }

    const rows: Array<Record<string, unknown>> = []
    const zip = new JSZip()
    const renderPathBySlide: Record<StudioRatio, Array<{ slideId: string; renderer: "satori" }>> = {
        "1:1": [],
        "4:5": [],
        "9:16": [],
    }
    const slideIdsByRatio: Record<StudioRatio, string[]> = {
        "1:1": [],
        "4:5": [],
        "9:16": [],
    }

    const slideErrors: Array<{ slideId: string; ratio: StudioRatio; index: number; message: string }> = []

    if (mode === "SLIDES" || mode === "ALL" || mode === "BUNDLE") {
        for (const ratio of ratios) {
            const folder = zip.folder(`slides/${ratio}`)
            for (const [index, slide] of item.carouselJson.slides.entries()) {
                const normalizedSlide = normalizeExportSlide(slide, index, item.carouselJson.slides.length)
                try {
                    const png = await renderStudioSlideToPng(normalizedSlide, brand, ratio, index, item.carouselJson.slides.length)
                    const storagePath = `${item.id}/slides/${ratio}/${normalizedSlide.id}.png`

                    const upload = await supabaseAdmin.storage.from("studio").upload(storagePath, png, {
                        contentType: "image/png",
                        upsert: true,
                    })

                    if (upload.error) throw upload.error

                    folder?.file(`${String(index + 1).padStart(2, "0")}-${normalizedSlide.id}.png`, png)
                    slideIdsByRatio[ratio].push(normalizedSlide.id)
                    renderPathBySlide[ratio].push({ slideId: normalizedSlide.id, renderer: "satori" })
                    rows.push({
                        package_id: item.id,
                        kind: "SLIDE_PNG",
                        ratio,
                        slide_id: normalizedSlide.id,
                        storage_path: storagePath,
                        bytes: png.byteLength,
                    })
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown render error"
                    console.error(`[studio export] Slide ${index + 1} (${normalizedSlide.id}) @ ${ratio} failed:`, message)
                    slideErrors.push({
                        slideId: normalizedSlide.id,
                        ratio,
                        index,
                        message,
                    })
                }
            }
        }
    }

    if (mode === "BUNDLE" || mode === "ALL") {
        const exportCompletedAt = new Date().toISOString()
        const manifest = {
            packageId: item.id,
            exportRequestId,
            exportJobId: input.exportJobId ?? null,
            requestedAt,
            exportStartedAt,
            exportCompletedAt,
            renderer: {
                name: "satori-server-export",
                version: STUDIO_RENDERER_VERSION,
                typography: STUDIO_TYPOGRAPHY,
            },
            mode,
            ratios,
            slideIdsByRatio,
            renderPathBySlide,
            ...(slideErrors.length > 0 ? { slideErrors } : {}),
            snapshot: {
                package: packageSnapshot,
                packageSnapshotHash,
                canvasAtClick: canvasSnapshot,
                canvasSnapshotHash,
            },
            parity: {
                slideCountMatches: canvasSnapshot ? canvasSnapshot.slideCount === packageSnapshot.slideCount : null,
                ratioMatches: canvasSnapshot ? canvasSnapshot.ratio === packageSnapshot.carouselRatio : null,
                slideIdMatches: canvasSnapshot ? canvasSnapshot.slides.map((slide) => slide.id).join("|") === packageSnapshot.slideIds.join("|") : null,
            },
        }

        zip.file("captions/instagram.txt", captionText("Instagram", item.captionsJson.instagram))
        zip.file("captions/facebook.txt", captionText("Facebook", item.captionsJson.facebook))
        zip.file("captions/linkedin.txt", captionText("LinkedIn", item.captionsJson.linkedin))
        zip.file("captions/tiktok.txt", captionText("TikTok", item.captionsJson.tiktok))
        zip.file("manifest.json", JSON.stringify(manifest, null, 2))
        zip.file("package.json", JSON.stringify({
            id: item.id,
            title: item.title,
            status: item.status,
            exportedAt: exportCompletedAt,
            exportRequestId,
            exportJobId: input.exportJobId ?? null,
            rendererVersion: STUDIO_RENDERER_VERSION,
            ratios,
            slideIdsByRatio,
            packageSnapshotHash,
            canvasSnapshotHash,
            carouselJson: item.carouselJson,
            captionsJson: item.captionsJson,
            manifest,
        }, null, 2))

        const bundle = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
        const bundlePath = `${item.id}/bundle/${exportRequestId}.zip`
        const upload = await supabaseAdmin.storage.from("studio").upload(bundlePath, bundle, {
            contentType: "application/zip",
            upsert: true,
        })

        if (upload.error) throw upload.error

        rows.push({
            package_id: item.id,
            kind: "BUNDLE_ZIP",
            ratio: null,
            slide_id: null,
            storage_path: bundlePath,
            bytes: bundle.byteLength,
        })
    }

    await supabaseAdmin.from("studio_assets").delete().eq("package_id", item.id)

    const insert = await supabaseAdmin
        .from("studio_assets")
        .insert(rows)
        .select("id,package_id,kind,ratio,slide_id,storage_path,bytes,created_at")

    if (insert.error) throw insert.error

    return (insert.data ?? []).map(parseAssetRow)
}
