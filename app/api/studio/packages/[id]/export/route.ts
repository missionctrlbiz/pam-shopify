import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { supabaseAdmin } from "@/lib/supabase"
import { runStudioExportPackage } from "@/lib/studio/exportPackage"
import { getStudioHandledError, requireStudioAdmin } from "@/lib/studio/server"
import { STUDIO_RATIOS } from "@/lib/studio/shared"
import type { StudioAsset, StudioRatio } from "@/lib/studio/types"
import type { studioExportPackageTask } from "@/trigger/studio"
import type { StudioExportCanvasSnapshot } from "@/lib/studio/exportPackage"

export const maxDuration = 300

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

function exportFilename(title: string, id: string) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64)

    return `${slug || `carousel-${id.slice(0, 8)}`}-assets.zip`
}

function exportRequestIdFromPath(path: string) {
    const match = path.match(/\/bundle\/([^/]+)\.zip$/i)
    return match?.[1] ?? undefined
}

async function getOwnedPackage(id: string, ownerId: string) {
    const { data, error } = await supabaseAdmin
        .from("studio_packages")
        .select("id,title,updated_at")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .maybeSingle()

    if (error) {
        throw error
    }

    return data as { id: string; title: string; updated_at: string } | null
}

async function getBundleDownload(packageId: string, title: string) {
    const { data, error } = await supabaseAdmin
        .from("studio_assets")
        .select("id,package_id,kind,ratio,slide_id,storage_path,bytes,created_at")
        .eq("package_id", packageId)
        .eq("kind", "BUNDLE_ZIP")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (!data) {
        return null
    }

    const asset = parseAssetRow(data as Record<string, unknown>)
    const filename = exportFilename(title, packageId)
    const signed = await supabaseAdmin.storage.from("studio").createSignedUrl(asset.storagePath, 60 * 60, {
        download: filename,
    })

    if (signed.error) {
        throw signed.error
    }

    return {
        status: "complete" as const,
        asset,
        downloadUrl: signed.data.signedUrl,
        filename,
        exportRequestId: exportRequestIdFromPath(asset.storagePath),
    }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params
        const pkg = await getOwnedPackage(id, ownerId)

        if (!pkg) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        const bundle = await getBundleDownload(id, pkg.title)
        if (!bundle) {
            return NextResponse.json({ status: "pending" })
        }

        return NextResponse.json(bundle)
    } catch (error) {
        console.error("[studio/packages/:id/export] GET failed", error)
        const handled = getStudioHandledError(error, "Failed to check studio export")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params
        const body = await req.json().catch(() => ({})) as {
            ratios?: StudioRatio[]
            mode?: "SLIDES" | "BUNDLE" | "ALL"
            exportRequestId?: string
            requestedAt?: string
            canvasSnapshot?: StudioExportCanvasSnapshot
        }

        const ratios = Array.isArray(body.ratios) && body.ratios.length > 0 ? body.ratios : STUDIO_RATIOS
        const mode = body.mode ?? "ALL"
        const exportRequestId = typeof body.exportRequestId === "string" && body.exportRequestId.trim().length > 0
            ? body.exportRequestId.trim()
            : crypto.randomUUID()
        const requestedAt = typeof body.requestedAt === "string" && body.requestedAt.trim().length > 0
            ? body.requestedAt.trim()
            : new Date().toISOString()
        const triggerConfigured = Boolean(process.env.TRIGGER_SECRET_KEY && process.env.TRIGGER_PROJECT_REF)
        const pkg = await getOwnedPackage(id, ownerId)

        if (!pkg) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        const clearAssets = await supabaseAdmin.from("studio_assets").delete().eq("package_id", id)
        if (clearAssets.error) {
            throw clearAssets.error
        }

        if (!triggerConfigured) {
            const assets = await runStudioExportPackage({
                packageId: id,
                ownerId,
                ratios,
                mode,
                exportRequestId,
                requestedAt,
                canvasSnapshot: body.canvasSnapshot ?? null,
                exportJobId: "inline-complete",
            })

            const bundle = await getBundleDownload(id, pkg.title)

            return NextResponse.json({
                dispatched: false,
                taskId: "inline-complete",
                inline: true,
                exportRequestId,
                requestedAt,
                packageUpdatedAt: pkg.updated_at,
                assets,
                ...(bundle ?? {}),
            })
        }

        const handle = await tasks.trigger<typeof studioExportPackageTask>("studio-export-package", {
            packageId: id,
            ownerId,
            ratios,
            mode,
            exportRequestId,
            requestedAt,
            canvasSnapshot: body.canvasSnapshot ?? null,
        })

        return NextResponse.json({
            dispatched: true,
            taskId: handle.id,
            inline: false,
            exportRequestId,
            requestedAt,
            packageUpdatedAt: pkg.updated_at,
        })
    } catch (error) {
        console.error("[studio/packages/:id/export] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to export studio assets")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}
