import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureStudioBucket, ensureStudioSettings, getStudioHandledError, parseStudioSettingsRow, requireStudioAdmin } from "@/lib/studio/server"

type AssetKind = "logo" | "book" | "alt"

function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase()
}

function getBrandField(kind: AssetKind) {
    if (kind === "logo") return "logo_path"
    if (kind === "book") return "book_path"
    return "alt_path"
}

export async function POST(req: Request) {
    try {
        const ownerId = await requireStudioAdmin()
        const formData = await req.formData()
        const assetKind = String(formData.get("assetKind") ?? "") as AssetKind
        const file = formData.get("file") instanceof File ? formData.get("file") as File : null

        if (!assetKind || !["logo", "book", "alt"].includes(assetKind)) {
            return NextResponse.json({ error: "assetKind must be one of logo, book, or alt" }, { status: 400 })
        }

        if (!file) {
            return NextResponse.json({ error: "A file upload is required" }, { status: 400 })
        }

        await ensureStudioBucket()
        const settings = await ensureStudioSettings(ownerId)
        const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ""
        const storagePath = `settings/${ownerId}/${assetKind}-${Date.now()}${extension || ""}-${sanitizeFileName(file.name)}`
        const upload = await supabaseAdmin.storage.from("studio").upload(storagePath, file, {
            contentType: file.type || undefined,
            upsert: true,
        })

        if (upload.error) {
            throw upload.error
        }

        const nextBrandJson = {
            ...settings.brandJson,
            [getBrandField(assetKind)]: storagePath,
        }

        const { data, error } = await supabaseAdmin
            .from("studio_settings")
            .update({ brand_json: nextBrandJson })
            .eq("owner_id", ownerId)
            .select("*")
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ item: parseStudioSettingsRow(data), assetKind, storagePath })
    } catch (error) {
        console.error("[studio/settings/assets] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to upload studio brand asset")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}