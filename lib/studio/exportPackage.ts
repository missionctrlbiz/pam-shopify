import "server-only"

import JSZip from "jszip"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureStudioBucket, ensureStudioSettings, parseStudioPackageRow } from "@/lib/studio/server"
import { getStudioPublicAssets, renderStudioSlideToPng, type StudioRenderableSlide } from "@/lib/studio/render/carousel"
import { STUDIO_RATIOS } from "@/lib/studio/shared"
import type { StudioAsset, StudioRatio } from "@/lib/studio/types"

type StudioExportMode = "SLIDES" | "BUNDLE" | "ALL"

export interface StudioExportPackageInput {
    packageId: string
    ownerId?: string
    ratios?: StudioRatio[]
    mode?: StudioExportMode
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

function captionText(label: string, caption: { body: string; hashtags: string[] }) {
    return `${label}\n\n${caption.body}\n\n${caption.hashtags.join(" ")}\n`
}

export async function runStudioExportPackage(input: StudioExportPackageInput) {
    const ratios = input.ratios && input.ratios.length > 0 ? input.ratios : STUDIO_RATIOS
    const mode = input.mode ?? "ALL"

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

    if (mode === "SLIDES" || mode === "ALL" || mode === "BUNDLE") {
        for (const ratio of ratios) {
            const folder = zip.folder(`slides/${ratio}`)
            for (const [index, slide] of item.carouselJson.slides.entries()) {
                const png = await renderStudioSlideToPng(slide as StudioRenderableSlide, brand, ratio, index, item.carouselJson.slides.length)
                const storagePath = `${item.id}/slides/${ratio}/${slide.id}.png`

                const upload = await supabaseAdmin.storage.from("studio").upload(storagePath, png, {
                    contentType: "image/png",
                    upsert: true,
                })

                if (upload.error) throw upload.error

                folder?.file(`${String(index + 1).padStart(2, "0")}-${slide.id}.png`, png)
                rows.push({
                    package_id: item.id,
                    kind: "SLIDE_PNG",
                    ratio,
                    slide_id: slide.id,
                    storage_path: storagePath,
                    bytes: png.byteLength,
                })
            }
        }
    }

    if (mode === "BUNDLE" || mode === "ALL") {
        zip.file("captions/instagram.txt", captionText("Instagram", item.captionsJson.instagram))
        zip.file("captions/facebook.txt", captionText("Facebook", item.captionsJson.facebook))
        zip.file("captions/linkedin.txt", captionText("LinkedIn", item.captionsJson.linkedin))
        zip.file("captions/tiktok.txt", captionText("TikTok", item.captionsJson.tiktok))
        zip.file("package.json", JSON.stringify({
            id: item.id,
            title: item.title,
            status: item.status,
            exportedAt: new Date().toISOString(),
            carouselJson: item.carouselJson,
            captionsJson: item.captionsJson,
        }, null, 2))

        const bundle = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
        const bundlePath = `${item.id}/bundle/carousel-package.zip`
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
