import { NextResponse } from "next/server"
import Papa from "papaparse"
import { PDFParse } from "pdf-parse"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureStudioBucket, getStudioHandledError, parseStudioPackageRow, requireStudioAdmin } from "@/lib/studio/server"
import type { StudioSourceType } from "@/lib/studio/types"

function sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase()
}

function normalizeCsvText(text: string) {
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true })
    if (parsed.errors.length > 0) {
        throw new Error(parsed.errors[0]?.message ?? "CSV parsing failed")
    }

    const rows = parsed.data.filter((row: string[]) => row.some((cell: string) => String(cell ?? "").trim().length > 0))
    if (rows.length === 0) {
        throw new Error("CSV file is empty")
    }

    const [headerRow, ...bodyRows] = rows
    if (bodyRows.length === 0) {
        return headerRow.join(", ")
    }

    return bodyRows
        .map((row: string[], index: number) => {
            const cells = headerRow.map((header: string, cellIndex: number) => {
                const value = String(row[cellIndex] ?? "").trim()
                return value ? `${header}: ${value}` : null
            }).filter(Boolean)

            return `Row ${index + 1} | ${cells.join(" | ")}`
        })
        .join("\n")
}

async function parseSourceContent(sourceType: StudioSourceType, file: File | null, pastedText: string | null) {
    if (sourceType === "PASTE") {
        const sourceText = pastedText?.trim() ?? ""
        if (!sourceText) {
            throw new Error("Paste source text is required")
        }

        return { sourceText, fileName: null }
    }

    if (!file) {
        throw new Error("A file upload is required")
    }

    if (sourceType === "CSV") {
        const text = await file.text()
        return { sourceText: normalizeCsvText(text), fileName: file.name }
    }

    if (sourceType === "PDF") {
        const buffer = Buffer.from(await file.arrayBuffer())
        const parser = new PDFParse({ data: buffer })
        const parsed = await parser.getText()
        await parser.destroy()
        const sourceText = parsed.text?.replace(/\s+\n/g, "\n").trim() ?? ""
        if (!sourceText) {
            throw new Error("The PDF did not contain extractable text")
        }

        return { sourceText, fileName: file.name }
    }

    throw new Error("Unsupported source type")
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params
        const formData = await req.formData()
        const sourceType = String(formData.get("sourceType") ?? "PASTE") as StudioSourceType
        const pastedText = typeof formData.get("text") === "string" ? String(formData.get("text")) : null
        const file = formData.get("file") instanceof File ? formData.get("file") as File : null

        const { data: existing, error: loadError } = await supabaseAdmin
            .from("studio_packages")
            .select("*")
            .eq("id", id)
            .eq("owner_id", ownerId)
            .maybeSingle()

        if (loadError) {
            throw loadError
        }

        if (!existing) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        const { sourceText, fileName } = await parseSourceContent(sourceType, file, pastedText)
        let sourceBlobPath = existing.source_blob_path as string | null

        if (file) {
            await ensureStudioBucket()
            const storagePath = `${id}/source/${Date.now()}-${sanitizeFileName(file.name)}`
            const upload = await supabaseAdmin.storage.from("studio").upload(storagePath, file, {
                contentType: file.type || undefined,
                upsert: true,
            })

            if (upload.error) {
                throw upload.error
            }

            sourceBlobPath = storagePath
        }

        const nextSourcePrompt = existing.source_prompt || `Create a carousel from the attached ${sourceType.toLowerCase()} source.`
        const { data: updated, error: updateError } = await supabaseAdmin
            .from("studio_packages")
            .update({
                source_type: sourceType,
                source_text: sourceText,
                source_blob_path: sourceBlobPath,
                source_prompt: nextSourcePrompt,
            })
            .eq("id", id)
            .eq("owner_id", ownerId)
            .select("*")
            .single()

        if (updateError) {
            throw updateError
        }

        await supabaseAdmin.from("studio_messages").insert({
            package_id: id,
            role: "system",
            content: fileName ? `${sourceType} source uploaded: ${fileName}` : `${sourceType} source pasted into the package.`,
            target: "CAROUSEL",
        })

        return NextResponse.json({
            item: parseStudioPackageRow(updated),
            sourceType,
            sourceTextLength: sourceText.length,
            fileName,
        })
    } catch (error) {
        console.error("[studio/packages/:id/source] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to ingest studio source")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}