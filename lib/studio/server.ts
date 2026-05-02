import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import {
    createDefaultStudioPackage,
    createDefaultStudioSettings,
    normalizeStudioCaptionsJson,
    normalizeStudioCarouselJson,
    normalizeStudioQualityJson,
    type StudioPackage,
    type StudioPackageListItem,
    type StudioSettings,
} from "@/lib/studio/types"

type StudioHandledError = {
    status: number
    message: string
}

function isStudioSchemaMissingError(error: unknown) {
    if (!error || typeof error !== "object") {
        return false
    }

    const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
    return candidate.code === "42P01"
        || candidate.code === "PGRST205"
        || candidate.message?.includes("relation")
        || candidate.message?.includes("schema cache")
        || candidate.message?.includes("Could not find the table")
        || candidate.details?.includes("relation")
        || candidate.details?.includes("schema cache")
        || candidate.hint?.includes("schema cache")
}

export function assertStudioBackendConfigured() {
    const missingVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE",
    ].filter((key) => !process.env[key])

    if (missingVars.length > 0) {
        throw new Error(`STUDIO_BACKEND_CONFIG_MISSING:${missingVars.join(",")}`)
    }
}

export function getStudioHandledError(error: unknown, fallbackMessage: string): StudioHandledError {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return { status: 401, message: "Unauthorized" }
    }

    if (error instanceof Error && error.message.startsWith("STUDIO_BACKEND_CONFIG_MISSING:")) {
        const missingVars = error.message.split(":")[1]
        return {
            status: 503,
            message: `Studio backend is not configured. Missing environment variables: ${missingVars}`,
        }
    }

    if (isStudioSchemaMissingError(error)) {
        return {
            status: 503,
            message: "Studio backend schema is not available yet. Run the studio Supabase migration before using Carousel Studio.",
        }
    }

    if (process.env.NODE_ENV !== "production" && error && typeof error === "object") {
        const candidate = error as { code?: string; message?: string; details?: string }
        const detail = [candidate.code, candidate.message, candidate.details].filter(Boolean).join(" | ")
        if (detail) {
            return { status: 500, message: `${fallbackMessage}: ${detail}` }
        }
    }

    return { status: 500, message: fallbackMessage }
}

export async function requireStudioAdmin() {
    assertStudioBackendConfigured()
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
        throw new Error("UNAUTHORIZED")
    }

    return session.user.id
}

export function parseStudioPackageRow(row: Record<string, unknown>): StudioPackage {
    const carouselJson = normalizeStudioCarouselJson(row.carousel_json)
    const captionsJson = normalizeStudioCaptionsJson(row.captions_json)
    const qualityJson = normalizeStudioQualityJson(row.quality_json)

    return {
        id: String(row.id),
        ownerId: String(row.owner_id),
        title: typeof row.title === "string" ? row.title : "Untitled Carousel",
        status: row.status as StudioPackage["status"],
        sourceType: row.source_type as StudioPackage["sourceType"],
        sourcePrompt: typeof row.source_prompt === "string" ? row.source_prompt : null,
        sourceBlobPath: typeof row.source_blob_path === "string" ? row.source_blob_path : null,
        sourceText: typeof row.source_text === "string" ? row.source_text : null,
        carouselJson,
        captionsJson,
        qualityJson,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
    }
}

export function parseStudioSettingsRow(row: Record<string, unknown>): StudioSettings {
    const ownerId = String(row.owner_id)
    const defaults = createDefaultStudioSettings(ownerId)
    const brandJson = row.brand_json && typeof row.brand_json === "object" ? row.brand_json as Record<string, unknown> : {}
    return {
        ownerId,
        brandJson: {
            brand_name: typeof brandJson.brand_name === "string" ? brandJson.brand_name : defaults.brandJson.brand_name,
            site_url: typeof brandJson.site_url === "string" ? brandJson.site_url : defaults.brandJson.site_url,
            product_url: typeof brandJson.product_url === "string" ? brandJson.product_url : defaults.brandJson.product_url,
            audience: typeof brandJson.audience === "string" ? brandJson.audience : defaults.brandJson.audience,
            logo_path: typeof brandJson.logo_path === "string" ? brandJson.logo_path : defaults.brandJson.logo_path,
            book_path: typeof brandJson.book_path === "string" ? brandJson.book_path : defaults.brandJson.book_path,
            alt_path: typeof brandJson.alt_path === "string" ? brandJson.alt_path : undefined,
            palette: Array.isArray(brandJson.palette) ? brandJson.palette.filter((item): item is string => typeof item === "string") : defaults.brandJson.palette,
            logo_url: getStudioAssetUrl(typeof brandJson.logo_path === "string" ? brandJson.logo_path : null),
            book_url: getStudioAssetUrl(typeof brandJson.book_path === "string" ? brandJson.book_path : null),
            alt_url: getStudioAssetUrl(typeof brandJson.alt_path === "string" ? brandJson.alt_path : null),
        },
        ctaPresets: Array.isArray(row.cta_presets) ? row.cta_presets.filter((item): item is string => typeof item === "string") : [],
        tone: typeof row.tone === "string" ? row.tone : "AUTHORITATIVE",
        hookStyle: typeof row.hook_style === "string" ? row.hook_style : "STAT_LED",
        hashtagCluster: typeof row.hashtag_cluster === "string" ? row.hashtag_cluster : "",
        modelStrategist: typeof row.model_strategist === "string" ? row.model_strategist : "gemini-2.5-pro",
        modelGate: typeof row.model_gate === "string" ? row.model_gate : "gemini-2.5-flash",
        gateThreshold: Number(row.gate_threshold),
        defaultSlides: Number(row.default_slides) || 8,
        alwaysSay: typeof row.always_say === "string" ? row.always_say : null,
        neverSay: typeof row.never_say === "string" ? row.never_say : null,
        updatedAt: String(row.updated_at),
    }
}

export function parseStudioPackageListRow(row: Record<string, unknown>): StudioPackageListItem {
    const carouselJson = normalizeStudioCarouselJson(row.carousel_json)
    const qualityJson = normalizeStudioQualityJson(row.quality_json)
    const coverSlide = carouselJson.slides[0] ?? null

    return {
        id: String(row.id),
        title: typeof row.title === "string" ? row.title : "Untitled Carousel",
        status: row.status as StudioPackageListItem["status"],
        sourceType: row.source_type as StudioPackageListItem["sourceType"],
        updatedAt: String(row.updated_at),
        createdAt: String(row.created_at),
        slideCount: carouselJson.slides.length,
        qualityScore: typeof qualityJson.score === "number" ? qualityJson.score : null,
        coverHeadline: typeof coverSlide?.headline === "string" ? coverSlide.headline : null,
        coverKind: typeof coverSlide?.kind === "string" ? coverSlide.kind : null,
    }
}

export async function ensureStudioSettings(ownerId: string) {
    const { data, error } = await supabaseAdmin
        .from("studio_settings")
        .select("*")
        .eq("owner_id", ownerId)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (data) {
        return parseStudioSettingsRow(data)
    }

    const defaults = createDefaultStudioSettings(ownerId)
    const payload = {
        owner_id: defaults.ownerId,
        brand_json: defaults.brandJson,
        cta_presets: defaults.ctaPresets,
        tone: defaults.tone,
        hook_style: defaults.hookStyle,
        hashtag_cluster: defaults.hashtagCluster,
        model_strategist: defaults.modelStrategist,
        model_gate: defaults.modelGate,
        gate_threshold: defaults.gateThreshold,
        default_slides: defaults.defaultSlides,
        always_say: defaults.alwaysSay,
        never_say: defaults.neverSay,
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
        .from("studio_settings")
        .insert(payload)
        .select("*")
        .single()

    if (insertError) {
        throw insertError
    }

    return parseStudioSettingsRow(inserted)
}

export async function ensureStudioPackage(ownerId: string) {
    const { data, error } = await supabaseAdmin
        .from("studio_packages")
        .select("*")
        .eq("owner_id", ownerId)
        .neq("status", "ARCHIVED")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (data) {
        return parseStudioPackageRow(data)
    }

    const defaults = createDefaultStudioPackage(ownerId)
    const payload = {
        owner_id: defaults.ownerId,
        title: defaults.title,
        status: defaults.status,
        source_type: defaults.sourceType,
        source_prompt: defaults.sourcePrompt,
        source_blob_path: defaults.sourceBlobPath,
        source_text: defaults.sourceText,
        carousel_json: defaults.carouselJson,
        captions_json: defaults.captionsJson,
        quality_json: defaults.qualityJson,
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
        .from("studio_packages")
        .insert(payload)
        .select("*")
        .single()

    if (insertError) {
        throw insertError
    }

    return parseStudioPackageRow(inserted)
}

export async function ensureStudioBucket() {
    assertStudioBackendConfigured()
    const existing = await supabaseAdmin.storage.getBucket("studio")
    if (!existing.error) {
        return
    }

    await supabaseAdmin.storage.createBucket("studio", {
        public: true,
        fileSizeLimit: "10MB",
    })
}

export function getStudioAssetUrl(path?: string | null) {
    if (!path) {
        return null
    }

    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
        return path
    }

    return supabaseAdmin.storage.from("studio").getPublicUrl(path).data.publicUrl
}
