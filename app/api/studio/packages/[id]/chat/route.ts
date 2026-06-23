import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import {
    getSlideCountMismatchMessage,
    getStudioGenerationModels,
    getTargetSlideCount,
    isStudioModelUnavailable,
    isStudioSlideCountMismatchError,
    streamStudioGeneration,
} from "@/lib/studio/ai"
import { ensureStudioSettings, parseStudioPackageRow, requireStudioAdmin } from "@/lib/studio/server"
import {
    applyStudioCarouselVariety,
    normalizeCaption,
    type StudioCaption,
    type StudioCaptionsJson,
    type StudioPackage,
    type StudioQualityJson,
    type StudioSlide,
} from "@/lib/studio/types"

type StudioTarget = "CAROUSEL" | `SLIDE:${string}` | `CAPTION:${keyof StudioCaptionsJson}`

type StudioGeneratedObject = {
    title?: string
    carouselJson?: StudioPackage["carouselJson"]
    captionsJson?: StudioCaptionsJson
    qualityJson?: StudioQualityJson
    slide?: StudioSlide
    caption?: StudioCaption
}

const HASHTAG_FLOORS: Record<keyof StudioCaptionsJson, number> = {
    instagram: 20,
    facebook: 20,
    linkedin: 8,
    tiktok: 10,
}

const FALLBACK_HASHTAGS = [
    "#PsychiatricAssessment",
    "#PsychNursing",
    "#NursingStudent",
    "#NCLEXPrep",
    "#PMHNPStudent",
    "#MentalHealthNursing",
    "#ClinicalJudgment",
    "#MentalStatusExam",
    "#HPI",
    "#PatientInterview",
    "#ClinicalDocumentation",
    "#DifferentialDiagnosis",
    "#SafetyAssessment",
    "#PsychRotation",
    "#NurseEducation",
    "#AssessmentSkills",
    "#TherapeuticCommunication",
    "#NursingSchool",
    "#ClinicalReasoning",
    "#PsychAssessmentGuide",
    "#DSM5TR",
    "#RiskAssessment",
    "#PsychiatryEducation",
    "#MedSurgToPsych",
]

function normalizeTarget(target?: string | null): StudioTarget {
    if (target?.startsWith("SLIDE:")) {
        return target as `SLIDE:${string}`
    }

    if (target?.startsWith("CAPTION:")) {
        const platform = target.replace("CAPTION:", "")
        if (["instagram", "facebook", "linkedin", "tiktok"].includes(platform)) {
            return target as `CAPTION:${keyof StudioCaptionsJson}`
        }
    }

    return "CAROUSEL"
}

function normalizePlatformCaption(platform: keyof StudioCaptionsJson, caption?: StudioCaption) {
    const normalized = normalizeCaption(caption?.body ?? "", caption?.hashtags ?? [])
    const floor = HASHTAG_FLOORS[platform]
    const hashtags = Array.from(new Set([...normalized.hashtags, ...FALLBACK_HASHTAGS])).slice(0, Math.max(floor, normalized.hashtags.length))
    return {
        ...normalized,
        hashtags,
    }
}

function normalizeAllCaptions(captions: StudioCaptionsJson): StudioCaptionsJson {
    return {
        instagram: normalizePlatformCaption("instagram", captions?.instagram),
        facebook: normalizePlatformCaption("facebook", captions?.facebook),
        linkedin: normalizePlatformCaption("linkedin", captions?.linkedin),
        tiktok: normalizePlatformCaption("tiktok", captions?.tiktok),
    }
}

function mergeFinalObject(pkg: StudioPackage, target: StudioTarget, value: StudioGeneratedObject): Partial<StudioPackage> {
    if (target.startsWith("CAPTION:")) {
        const platform = target.replace("CAPTION:", "") as keyof StudioCaptionsJson
        const caption = value.caption
        return {
            captionsJson: {
                ...pkg.captionsJson,
                [platform]: normalizePlatformCaption(platform, caption),
            },
        }
    }

    if (target.startsWith("SLIDE:")) {
        const slide = value.slide
        if (!slide) {
            return {}
        }

        return {
            carouselJson: {
                ...pkg.carouselJson,
                slides: pkg.carouselJson.slides.map((item) => (item.id === slide.id ? slide : item)),
            },
        }
    }

    return {
        title: value.title || pkg.title,
        carouselJson: value.carouselJson ? {
            ...value.carouselJson,
            slides: applyStudioCarouselVariety(value.carouselJson.slides),
        } : pkg.carouselJson,
        captionsJson: value.captionsJson ? normalizeAllCaptions(value.captionsJson) : pkg.captionsJson,
        qualityJson: value.qualityJson ?? pkg.qualityJson,
    }
}

function getGeneratedSlideCount(value: StudioGeneratedObject) {
    return Array.isArray(value.carouselJson?.slides) ? value.carouselJson.slides.length : 0
}

function isStructuredGenerationRetryable(error: unknown) {
    if (!(error instanceof Error)) {
        return false
    }

    return isStudioSlideCountMismatchError(error)
        || /No object generated/i.test(error.message)
        || /could not parse/i.test(error.message)
        || /invalid json/i.test(error.message)
        || /schema/i.test(error.message)
}

function buildStructuredRetryMessage(message: string, expectedSlideCount: number | null, error: unknown) {
    const countMatch = error instanceof Error
        ? error.message.match(/returned\s+(\d+)\s+slides/i)
        : null
    const actual = countMatch?.[1] ? Number(countMatch[1]) : 0

    if (expectedSlideCount) {
        return getSlideCountMismatchMessage(message, expectedSlideCount, actual)
            + "\nReturn only the structured object that matches the schema. No markdown. No prose before or after the object."
    }

    return `${message}\n\nReturn only the structured object that matches the schema. No markdown. No prose before or after the object.`
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params
        const body = await req.json().catch(() => ({})) as { message?: string; target?: string | null }
        const message = body.message?.trim()

        if (!message) {
            return NextResponse.json({ error: "message is required" }, { status: 400 })
        }

        const target = normalizeTarget(body.target)
        const { data, error } = await supabaseAdmin
            .from("studio_packages")
            .select("*")
            .eq("id", id)
            .eq("owner_id", ownerId)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!data) {
            return NextResponse.json({ error: "Studio package not found" }, { status: 404 })
        }

        const pkg = parseStudioPackageRow(data)
        const settings = await ensureStudioSettings(ownerId)
        const modelIds = getStudioGenerationModels(settings)
        const encoder = new TextEncoder()

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const send = (payload: unknown) => {
                    controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`))
                }

                let lastError: unknown
                const targetSlideCount = target === "CAROUSEL" ? getTargetSlideCount(pkg, settings, message) : null

                for (const [index, modelId] of modelIds.entries()) {
                    const maxAttempts = target === "CAROUSEL" ? 3 : 1
                    let attemptMessage = message

                    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
                        try {
                            if (index > 0 || attempt > 0) {
                                send({
                                    type: "status",
                                    target,
                                    message: attempt > 0
                                        ? "Rebuilding with the exact requested slide count…"
                                        : "Trying a stronger generation pass to improve the result…",
                                })
                            }

                            const result = streamStudioGeneration(pkg, settings, attemptMessage, target, modelId)

                            for await (const part of result.fullStream) {
                                if (part.type === "object") {
                                    send({ type: "partial", target, object: part.object })
                                } else if (part.type === "error") {
                                    throw part.error
                                }
                            }

                            const finalObject = await result.object as StudioGeneratedObject
                            if (target === "CAROUSEL" && targetSlideCount) {
                                const generatedSlideCount = getGeneratedSlideCount(finalObject)
                                if (generatedSlideCount !== targetSlideCount) {
                                    throw new Error(`The studio generator returned ${generatedSlideCount} slides, but this prompt requires ${targetSlideCount}. Regenerate with the exact requested count.`)
                                }
                            }

                            const merged = mergeFinalObject(pkg, target, finalObject)
                            const nextSourcePrompt = pkg.sourcePrompt && pkg.sourcePrompt.trim().length > 0
                                ? pkg.sourcePrompt
                                : target === "CAROUSEL" ? message : pkg.sourcePrompt

                            const patch: Record<string, unknown> = {}
                            if (merged.title) patch.title = merged.title
                            if (merged.carouselJson) patch.carousel_json = merged.carouselJson
                            if (merged.captionsJson) patch.captions_json = merged.captionsJson
                            if (merged.qualityJson) patch.quality_json = merged.qualityJson
                            if (nextSourcePrompt !== pkg.sourcePrompt) patch.source_prompt = nextSourcePrompt

                            const { data: updated, error: updateError } = await supabaseAdmin
                                .from("studio_packages")
                                .update(patch)
                                .eq("id", pkg.id)
                                .eq("owner_id", ownerId)
                                .select("*")
                                .single()

                            if (updateError) {
                                throw updateError
                            }

                            await supabaseAdmin.from("studio_messages").insert([
                                { package_id: pkg.id, role: "user", content: message, target },
                                {
                                    package_id: pkg.id,
                                    role: "assistant",
                                    content: "Review complete.",
                                    target,
                                },
                            ])

                            send({ type: "finish", target, item: parseStudioPackageRow(updated) })
                            controller.close()
                            return
                        } catch (streamError) {
                            lastError = streamError

                            if (target === "CAROUSEL" && attempt < maxAttempts - 1 && isStructuredGenerationRetryable(streamError)) {
                                attemptMessage = buildStructuredRetryMessage(message, targetSlideCount, streamError)
                                continue
                            }

                            if (!isStudioModelUnavailable(streamError) && !isStructuredGenerationRetryable(streamError)) {
                                break
                            }

                            if (index === modelIds.length - 1) {
                                break
                            }

                            break
                        }
                    }
                }

                {
                    send({
                        type: "error",
                        error: lastError instanceof Error ? lastError.message : "Failed to generate studio content",
                    })
                }

                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "application/x-ndjson; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
            },
        })
    } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.error("[studio/packages/:id/chat] POST failed", error)
        return NextResponse.json({ error: "Failed to generate studio content" }, { status: 500 })
    }
}
