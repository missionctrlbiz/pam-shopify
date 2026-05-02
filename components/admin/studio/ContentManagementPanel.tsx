"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ComponentType } from "react"
import { motion } from "framer-motion"
import {
    ArrowRight,
    BookImage,
    Brain,
    Check,
    CheckCircle2,
    Circle,
    Copy,
    Download,
    Eye,
    Facebook,
    Grip,
    GripVertical,
    ImagePlus,
    Images,
    Instagram,
    Library,
    Link as LinkIcon,
    Linkedin,
    List,
    MessageCircleMore,
    MicVocal,
    Moon,
    Palette,
    PencilRuler,
    Plus,
    Search,
    Settings2,
    ShieldCheck,
    Sparkles,
    Star,
    TableProperties,
    Trash2,
    Upload,
    WandSparkles,
    X,
    RefreshCw,
    HeartPulse,
    Zap,
    Bookmark,
    CircleHelp,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    ZoomIn,
    ZoomOut,
} from "lucide-react"
import {
    STUDIO_RATIOS,
    type StudioSlideRenderSpec,
} from "@/lib/studio/shared"
import { STUDIO_FEEDBACK, formatStudioError, type StudioToast } from "@/lib/studio/feedback"
import {
    applyStudioCarouselVariety,
    createDefaultCaptions,
    createDefaultCarouselJson,
    normalizeCaption,
    type StudioAsset,
    type StudioCaption,
    type StudioCaptionsJson,
    type StudioMessage,
    type StudioPackage,
    type StudioPackageListItem,
    type StudioPackageStatus,
    type StudioRatio,
    type StudioSourceIngestResult,
    type StudioSettings,
    type StudioSlide,
    type StudioSlideBackground,
    type StudioSlideKind,
    type StudioSlideLayout,
} from "@/lib/studio/types"

type WorkspaceView = "create" | "drafts" | "library" | "settings"
type PlatformKey = "instagram" | "facebook" | "linkedin" | "tiktok"
type SettingsTab = "brand" | "voice" | "cta" | "platform" | "quality"
type ContextTab = "always" | "never"

type DraftStatus = "ready" | "progress" | "draft"

type PlatformMeta = {
    name: string
    spec: string
    swatchClass: string
    icon: ComponentType<{ size?: number; className?: string }>
}

type StudioConfirmDialogState = {
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    tone?: "default" | "danger"
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
}

type StudioExportState = {
    title: string
    detail: string
}

type StudioExportCanvasSnapshot = {
    capturedAt: string
    ratio: StudioRatio
    slideCount: number
    typography: {
        headingFamily: string
        bodyFamily: string
        metaFont: string
    }
    slides: Array<{
        id: string
        kind: StudioSlideKind
        layout: StudioSlideLayout
        bg: StudioSlideBackground
        variant: StudioSlideRenderSpec["variant"]
    }>
}

type StudioExportResult = {
    dispatched: boolean
    taskId: string
    inline: boolean
    status?: "pending" | "complete"
    asset?: StudioAsset
    assets?: StudioAsset[]
    downloadUrl?: string
    filename?: string
    exportRequestId?: string
    requestedAt?: string
    packageUpdatedAt?: string
}

type StudioExportStatus = {
    status: "pending" | "complete"
    asset?: StudioAsset
    downloadUrl?: string
    filename?: string
    exportRequestId?: string
}

const GRADIENT_BG_CLASS = "bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]"
const GRADIENT_SHADOW_CLASS = "shadow-[0_12px_32px_-8px_rgba(175,92,233,.45),0_2px_8px_rgba(237,65,91,.18)]"
const SLIDE_BORDER_CLASS = "bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]"
const UNSAVED_PACKAGE_PREFIX = "unsaved-studio-package"
const PLATFORM_HASHTAG_FLOORS: Record<PlatformKey, number> = {
    instagram: 20,
    facebook: 20,
    linkedin: 8,
    tiktok: 10,
}
const CLIENT_FALLBACK_HASHTAGS = [
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
]
const FRAME_CLASS_BY_RATIO: Record<StudioRatio, string> = {
    "1:1": "h-[380px] w-[380px]",
    "4:5": "h-[450px] w-[360px]",
    "9:16": "h-[516px] w-[290px]",
}

const HOOK_STYLE_OPTIONS = ["STAT_LED", "QUESTION_LED", "MYTH_BUST", "CHECKLIST"]

const PLATFORM_META: Record<PlatformKey, PlatformMeta> = {
    instagram: {
        name: "Instagram",
        spec: "2,200 char · 30 hashtags",
        swatchClass: "bg-[linear-gradient(135deg,#ec5185,#ed415b)]",
        icon: Instagram,
    },
    facebook: {
        name: "Facebook",
        spec: "63K char · 30 hashtags",
        swatchClass: "bg-[#1877f2]",
        icon: Facebook,
    },
    linkedin: {
        name: "LinkedIn",
        spec: "3,000 char · 5 hashtags",
        swatchClass: "bg-[#0a66c2]",
        icon: Linkedin,
    },
    tiktok: {
        name: "TikTok",
        spec: "2,200 char · 100 hashtags",
        swatchClass: "bg-[#0f172a]",
        icon: Music2Icon,
    },
}

function Music2Icon(props: ComponentProps<typeof Zap>) {
    return <Zap {...props} />
}

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { key: "brand", label: "Brand Brief", icon: Bookmark },
    { key: "voice", label: "Voice & Tone", icon: MicVocal },
    { key: "cta", label: "CTA Presets", icon: ArrowRight },
    { key: "platform", label: "Distribution", icon: LinkIcon },
    { key: "quality", label: "Quality & Defaults", icon: ShieldCheck },
]

const TONE_CARDS = [
    { title: "Authoritative", note: "Clinical · evidence-led · precise." },
    { title: "Empathetic", note: "Warm · accessible · student-first." },
    { title: "Direct", note: "Academic · concise · bullet-driven." },
    { title: "Practitioner", note: "Conversational · POV · field notes." },
]

const EMPTY_MESSAGES: StudioMessage[] = []

function statusToDraftStatus(status: StudioPackageStatus): DraftStatus {
    if (status === "READY" || status === "APPROVED" || status === "PUBLISHED") {
        return "ready"
    }

    return status === "DRAFT" ? "draft" : "progress"
}

function formatPackageMeta(item: StudioPackageListItem) {
    return `${item.slideCount} slides · ${new Date(item.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })}`
}

function toSafeCaption(caption: Partial<StudioCaption> | null | undefined, platform?: PlatformKey) {
    const normalized = normalizeCaption(caption?.body, caption?.hashtags)
    if (!platform || normalized.body.trim().length === 0) {
        return normalized
    }

    const floor = PLATFORM_HASHTAG_FLOORS[platform]
    const hashtags = Array.from(new Set([...normalized.hashtags, ...CLIENT_FALLBACK_HASHTAGS])).slice(0, Math.max(floor, normalized.hashtags.length))
    return { ...normalized, hashtags }
}

function normalizeClientCaptions(captions: Partial<Record<PlatformKey, Partial<StudioCaption>>> | null | undefined, fallback?: StudioCaptionsJson): StudioCaptionsJson {
    return {
        instagram: toSafeCaption(captions?.instagram ?? fallback?.instagram, "instagram"),
        facebook: toSafeCaption(captions?.facebook ?? fallback?.facebook, "facebook"),
        linkedin: toSafeCaption(captions?.linkedin ?? fallback?.linkedin, "linkedin"),
        tiktok: toSafeCaption(captions?.tiktok ?? fallback?.tiktok, "tiktok"),
    }
}

function sanitizeStudioMessage(text: string) {
    return text
        .replace(/Studio package generated with[\s\S]*$/gi, "Studio Package Generator: successfully reviewed.")
        .replace(/Studio fragment updated with[\s\S]*$/gi, "Studio Package Generator: successfully reviewed.")
        .replace(/\b(?:gemini|claude|gpt)[\w.-]*/gi, "studio generator")
        .replace(/\bAI\s+model\b/gi, "studio generator")
        .replace(/\bmodel\b/gi, "generator")
}

function captionToText(caption: Partial<StudioCaption> | null | undefined, platform?: PlatformKey) {
    const safeCaption = toSafeCaption(caption, platform)
    return safeCaption.hashtags.length > 0 ? `${safeCaption.body}\n\n${safeCaption.hashtags.join(" ")}` : safeCaption.body
}

function textToCaption(text: string, existing: Partial<StudioCaption> | null | undefined, platform?: PlatformKey) {
    const safeExisting = toSafeCaption(existing, platform)
    const hashtags = Array.from(new Set(text.match(/#[A-Za-z0-9_-]+/g) ?? safeExisting.hashtags))
    const body = text
        .replace(/#[A-Za-z0-9_-]+/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

    return toSafeCaption(normalizeCaption(body || safeExisting.body, hashtags), platform)
}

function getPreviewBodyLines(value: unknown) {
    if (Array.isArray(value)) {
        return value
            .filter((line): line is string => typeof line === "string")
            .map((line) => line.trim())
            .filter(Boolean)
    }

    if (typeof value !== "string") {
        return []
    }

    return value
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
}

function getPlatformCharCount(caption: Partial<StudioCaption> | null | undefined, platform: PlatformKey) {
    const safeCaption = toSafeCaption(caption)
    const maxChars = {
        instagram: 2200,
        facebook: 63000,
        linkedin: 3000,
        tiktok: 2200,
    }[platform]

    return `${safeCaption.chars} / ${maxChars.toLocaleString()}`
}

function isChecklistBody(lines: string[]) {
    return lines.length >= 3 && lines.every((line) => /^(?:[-*•✓✔]|\d+[.)])\s+/.test(line) || !line.includes(" — "))
}

function getRows(lines: string[]) {
    return lines.map((line) => {
        const clean = line.replace(/^(?:[-*•✓✔]|\d+[.)])\s+/, "")
        const [term, ...rest] = clean.split(/\s[—-]\s|:\s/)
        return {
            term: term.trim(),
            description: rest.join(" — ").trim(),
        }
    }).filter((row) => row.term)
}

function labelForSlideVariant(variant: StudioSlideRenderSpec["variant"]) {
    if (variant === "cta") return "CTA"
    if (variant === "cover") return "Cover"
    if (variant === "heroIcon") return "Icon Hero"
    if (variant === "featureCards") return "Cards"
    if (variant === "titleCard") return "Title Card"
    if (variant === "taxonomyList") return "List"
    if (variant === "scienceSplit") return "Diagram"
    if (variant === "stat") return "Stat"
    if (variant === "quote") return "Quote"
    if (variant === "checklist") return "Checklist"
    if (variant === "darkInsight") return "Deep Dive"
    return "Insight"
}

function eyebrowForPreview(variant: StudioSlideRenderSpec["variant"]) {
    if (variant === "cta") return "Final Slide"
    if (variant === "cover" || variant === "heroIcon") return "Psych Mastery"
    if (variant === "featureCards") return "Clinical Tools"
    if (variant === "titleCard") return "Clinical Focus"
    if (variant === "taxonomyList") return "Types"
    if (variant === "scienceSplit") return "Mechanism"
    if (variant === "stat") return "Clinical Signal"
    if (variant === "quote") return "Field Note"
    if (variant === "checklist") return "Checklist"
    if (variant === "darkInsight") return "Deep Dive"
    return "Clinical Lens"
}

function previewFooterCue(index: number) {
    const cues = ["Save for review", "Clinical cue", "Charting lens", "Assessment check", "Keep this step", "Field note"]
    return cues[index % cues.length]
}

function getPreviewVariant(layout: StudioSlideLayout | undefined, kind: StudioSlideKind | undefined, bg: StudioSlideBackground, bodyLines: string[], index: number, totalSlides: number): StudioSlideRenderSpec["variant"] {
    if (index === totalSlides - 1 || kind === "CTA") return "cta"
    if (layout === "HERO_ICON") return index === 0 ? "heroIcon" : "heroIcon"
    if (layout === "FEATURE_CARDS") return "featureCards"
    if (layout === "TITLE_CARD") return "titleCard"
    if (layout === "TAXONOMY_LIST") return "taxonomyList"
    if (layout === "SCIENCE_SPLIT") return "scienceSplit"
    if (layout === "CHECKLIST") return "checklist"
    if (layout === "QUOTE_CARD") return "quote"
    if (layout === "STAT_CARD") return "stat"
    if (layout === "DARK_NOTE") return "darkInsight"
    if (index === 0 || kind === "COVER") return "cover"
    if (kind === "STAT") return "stat"
    if (kind === "QUOTE") return "quote"
    if (isChecklistBody(bodyLines)) return "checklist"
    if (bg === "NAVY" || bg === "INK") return "darkInsight"
    return "insight"
}

function toPreviewSlide(slide: StudioSlide, index: number, totalSlides: number): StudioSlideRenderSpec {
    const partialSlide = slide as Partial<StudioSlide>
    const kind = partialSlide.kind
    const layout = partialSlide.layout ?? "AUTO"
    const bg = partialSlide.bg ?? "WHITE"
    const headline = typeof partialSlide.headline === "string" ? partialSlide.headline : ""
    const bodyLines = getPreviewBodyLines(partialSlide.body)
    const variant = getPreviewVariant(layout, kind, bg, bodyLines, index, totalSlides)

    return {
        id: partialSlide.id ?? `streaming-slide-${index}`,
        label: `Slide ${index + 1} · ${labelForSlideVariant(variant)}`,
        variant,
        kind: kind ?? "INSIGHT",
        layout,
        bg,
        eyebrow: eyebrowForPreview(variant),
        headline,
        body: bodyLines.length > 0 ? bodyLines : undefined,
        stat: partialSlide.stat?.value,
        statNote: partialSlide.stat?.label,
        cta: variant === "cta" ? "psychassessmentguide.com" : undefined,
        footer: previewFooterCue(index),
    }
}

function createCanvasExportSnapshot(item: StudioPackage, ratio: StudioRatio): StudioExportCanvasSnapshot {
    const slides = item.carouselJson.slides.map((slide, index) => {
        const preview = toPreviewSlide(slide, index, item.carouselJson.slides.length)
        return {
            id: slide.id,
            kind: preview.kind,
            layout: preview.layout,
            bg: preview.bg,
            variant: preview.variant,
        }
    })

    return {
        capturedAt: new Date().toISOString(),
        ratio,
        slideCount: slides.length,
        typography: {
            headingFamily: "Montserrat",
            bodyFamily: "Open Sans",
            metaFont: item.carouselJson.meta.font,
        },
        slides,
    }
}

type DraftCardItem = {
    id: string
    title: string
    status: DraftStatus
    slides: string
    score: string
    platforms: Array<ComponentType<{ size?: number; className?: string }>>
    cover: "book" | "progress" | "empty" | "text"
    stat?: string
    note: string
    button: string
}

type LibraryCardItem = {
    title: string
    meta: string
    score: string
    platforms: Array<ComponentType<{ size?: number; className?: string }>>
    variant: "book" | "text" | "stat"
}

function getPackagePlatformIcons() {
    return [Instagram, Facebook, Linkedin, Music2Icon]
}

function formatQualityScore(score?: number | null) {
    return typeof score === "number" ? score.toFixed(1) : null
}

function toDraftCard(item: StudioPackageListItem): DraftCardItem {
    const status = statusToDraftStatus(item.status)
    return {
        id: item.id,
        title: item.title,
        status,
        slides: `${item.slideCount} slides`,
        score: status === "progress" ? "Updating…" : formatQualityScore(item.qualityScore) ?? "--",
        platforms: getPackagePlatformIcons(),
        cover: status === "progress" ? "progress" : item.slideCount === 0 ? "empty" : item.coverKind === "STAT" ? "book" : item.coverKind === "QUOTE" ? "text" : "book",
        stat: item.coverHeadline ?? undefined,
        note: item.coverHeadline ?? formatPackageMeta(item),
        button: status === "progress" ? "Watch progress" : status === "draft" ? "Start in Studio" : "Open in Studio",
    }
}

function toLibraryCard(item: StudioPackageListItem): LibraryCardItem {
    return {
        title: item.title,
        meta: formatPackageMeta(item),
        score: formatQualityScore(item.qualityScore) ?? "--",
        platforms: getPackagePlatformIcons(),
        variant: item.coverKind === "STAT" ? "stat" : item.slideCount > 4 ? "text" : "book",
    }
}

function createBlankSlide(index: number): StudioSlide {
    return {
        id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `slide-${Date.now()}-${index}`,
        kind: index === 0 ? "COVER" : "INSIGHT",
        layout: index === 0 ? "HERO_ICON" : "TITLE_CARD",
        headline: index === 0 ? "New carousel headline" : `Slide ${index + 1}`,
        body: index === 0 ? "Add the prompt or edit this slide directly." : "Add the key teaching point for this slide.",
        bg: "WHITE",
        assets: { logo: "COLOR", book: index === 0 },
    }
}

function createUnsavedStudioPackage(): StudioPackage {
    const now = new Date().toISOString()
    return {
        id: `${UNSAVED_PACKAGE_PREFIX}-${Date.now()}`,
        ownerId: "local",
        title: "Untitled Carousel",
        status: "DRAFT",
        sourceType: "PROMPT",
        sourcePrompt: null,
        sourceBlobPath: null,
        sourceText: null,
        carouselJson: createDefaultCarouselJson(),
        captionsJson: createDefaultCaptions(),
        qualityJson: {},
        createdAt: now,
        updatedAt: now,
    }
}

function isUnsavedStudioPackage(pkg: StudioPackage | null) {
    return Boolean(pkg?.id.startsWith(UNSAVED_PACKAGE_PREFIX))
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        const method = init?.method ?? "GET"
        const message = typeof data.error === "string" ? data.error : "Request failed"
        throw new Error(`${method} ${url} failed: ${message}`)
    }

    return data as T
}

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function downloadStudioExport(url: string, filename = "carousel-assets.zip") {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    link.remove()
}

type StudioStreamEvent =
    | { type: "partial"; target: string; object: Partial<StudioPackage> | { slide?: Partial<StudioSlide> } | { caption?: Partial<StudioCaption> } }
    | { type: "finish"; target: string; item: StudioPackage }
    | { type: "status"; target: string; message: string }
    | { type: "error"; error: string }

async function readStudioStream(response: Response, onEvent: (event: StudioStreamEvent) => void) {
    if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new Error(typeof data.error === "string" ? data.error : "Studio stream failed")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
            if (!line.trim()) continue
            const event = JSON.parse(line) as StudioStreamEvent
            onEvent(event)
        }
    }

    if (buffer.trim()) {
        onEvent(JSON.parse(buffer) as StudioStreamEvent)
    }
}

function mergeStudioPartial(item: StudioPackage, event: StudioStreamEvent): StudioPackage {
    if (event.type !== "partial") {
        return item
    }

    if (event.target.startsWith("CAPTION:")) {
        const platform = event.target.replace("CAPTION:", "") as PlatformKey
        const caption = (event.object as { caption?: Partial<StudioCaption> }).caption
        if (!caption || !PLATFORM_META[platform]) return item

        return {
            ...item,
            captionsJson: {
                ...item.captionsJson,
                [platform]: normalizeCaption(caption.body ?? item.captionsJson[platform].body, caption.hashtags ?? item.captionsJson[platform].hashtags),
            },
        }
    }

    if (event.target.startsWith("SLIDE:")) {
        const slide = (event.object as { slide?: Partial<StudioSlide> }).slide
        if (!slide?.id) return item

        return {
            ...item,
            carouselJson: {
                ...item.carouselJson,
                slides: applyStudioCarouselVariety(item.carouselJson.slides.map((existing) => existing.id === slide.id ? { ...existing, ...slide } : existing)),
            },
        }
    }

    const object = event.object as Partial<StudioPackage>
    const nextCarousel = object.carouselJson ? {
        ...item.carouselJson,
        ...object.carouselJson,
        slides: Array.isArray(object.carouselJson.slides)
            ? applyStudioCarouselVariety(object.carouselJson.slides.map((slide, index) => {
                const existing = item.carouselJson.slides[index]
                return {
                    id: slide.id ?? existing?.id ?? `streaming-slide-${index}`,
                    kind: slide.kind ?? existing?.kind ?? "INSIGHT",
                    layout: slide.layout ?? existing?.layout ?? "AUTO",
                    headline: slide.headline ?? existing?.headline ?? "",
                    body: slide.body ?? existing?.body ?? "",
                    stat: slide.stat ?? existing?.stat,
                    bg: slide.bg ?? existing?.bg ?? "WHITE",
                    assets: slide.assets ?? existing?.assets,
                } satisfies StudioSlide
            }))
            : item.carouselJson.slides,
        meta: {
            ...item.carouselJson.meta,
            ...object.carouselJson.meta,
        },
    } : item.carouselJson

    return {
        ...item,
        title: typeof object.title === "string" ? object.title : item.title,
        carouselJson: nextCarousel,
        captionsJson: object.captionsJson ? normalizeClientCaptions(object.captionsJson, item.captionsJson) : item.captionsJson,
        qualityJson: object.qualityJson ?? item.qualityJson,
    }
}

function PillBadge({ status }: { status: DraftStatus }) {
    if (status === "ready") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Ready
            </span>
        )
    }

    if (status === "progress") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-purple-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
                In progress
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Draft
        </span>
    )
}

function SurfaceCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-[20px] border border-slate-200 bg-white ${className}`}>{children}</div>
}

/**
 * Inline-editable text that commits on blur or Enter, cancels on Escape.
 * Uses contentEditable so the styled span retains its full appearance (gradient text, etc.).
 */
function EditableText({
    value,
    onCommit,
    multiline = false,
    placeholder,
    className = "",
    ariaLabel,
}: {
    value: string
    onCommit: (next: string) => void
    multiline?: boolean
    placeholder?: string
    className?: string
    ariaLabel?: string
}) {
    const ref = useRef<HTMLSpanElement>(null)
    const lastCommittedRef = useRef(value)

    useEffect(() => {
        if (ref.current && document.activeElement !== ref.current && ref.current.textContent !== value) {
            ref.current.textContent = value
        }
        lastCommittedRef.current = value
    }, [value])

    return (
        <span
            ref={ref}
            role="textbox"
            aria-label={ariaLabel}
            data-placeholder={placeholder}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onKeyDown={(event) => {
                if (!multiline && event.key === "Enter") {
                    event.preventDefault()
                    ;(event.currentTarget as HTMLSpanElement).blur()
                }
                if (event.key === "Escape") {
                    event.preventDefault()
                    ;(event.currentTarget as HTMLSpanElement).textContent = lastCommittedRef.current
                    ;(event.currentTarget as HTMLSpanElement).blur()
                }
            }}
            onBlur={(event) => {
                const next = (event.currentTarget.textContent ?? "").replace(/​/g, "")
                if (next !== lastCommittedRef.current) {
                    lastCommittedRef.current = next
                    onCommit(next)
                }
            }}
            className={`outline-none transition focus:ring-2 focus:ring-purple-300/60 focus:bg-white/10 rounded-sm ${value ? "" : "before:content-[attr(data-placeholder)] before:text-current/40"} ${className}`}
            suppressHydrationWarning
        >
            {value}
        </span>
    )
}

function SlideFrame({
    ratio,
    slide,
    siteUrl,
    isBusy,
    onRegenerate,
    onDuplicate,
    onDelete,
    onEditField,
}: {
    ratio: StudioRatio
    slide: StudioSlideRenderSpec
    siteUrl: string
    isBusy: boolean
    onRegenerate: () => void
    onDuplicate: () => void
    onDelete: () => void
    onEditField: (field: "headline" | "body" | "stat" | "statNote", next: string) => void
}) {
    const frameClass = FRAME_CLASS_BY_RATIO[ratio]
    const insightLines = (slide.body ?? []).map((line) => {
        const [term, description] = line.split(" — ")
        return { term, description }
    })
    const rows = getRows(slide.body ?? [])
    const cardIcons = [Brain, Search, ShieldCheck, TableProperties, HeartPulse]
    const footerCue = ratio === "1:1" ? null : <span className="text-[7.5px] font-bold tracking-wider">{slide.footer}</span>

    return (
        <div className="relative flex flex-col items-center gap-3">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-400">{slide.label}</span>
            <div className={`relative rounded-[18px] p-1 shadow-[0_24px_60px_-12px_rgba(175,92,233,0.35),0_4px_16px_rgba(0,0,0,0.12)] ${SLIDE_BORDER_CLASS}`}>
                <div className="absolute -top-4 right-3 z-30 flex gap-1">
                    <IconChip icon={RefreshCw} title="Regenerate slide" label="Regen" disabled={isBusy} onClick={onRegenerate} />
                    <IconChip icon={Copy} title="Duplicate slide" label="Copy" disabled={isBusy} onClick={onDuplicate} />
                    <IconChip icon={X} title="Delete slide" label="Delete" tone="danger" disabled={isBusy} onClick={onDelete} />
                </div>
                <div className="absolute -bottom-3 left-1/2 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-300" />
                <div className={`relative overflow-hidden rounded-[14px] ${frameClass}`}>
                    {slide.variant === "heroIcon" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#232536]">
                            <div className="absolute left-6 top-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Psych Mastery</div>
                            <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
                                <h2 className="mb-4 text-[22px] font-black leading-[1.05] text-[#232536]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Hero headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(237,65,91,.12)_0%,rgba(236,81,133,.14)_48%,rgba(175,92,233,.18)_100%)] text-[#af5ce9]">
                                    <Brain size={34} strokeWidth={1.8} />
                                </div>
                                <div className="h-px w-full bg-slate-200" />
                                <p className="mt-5 text-[13px] leading-relaxed text-slate-500">
                                    <EditableText value={(slide.body ?? []).join("\n")} onCommit={(next) => onEditField("body", next)} placeholder="Trusted clinical resource" multiline ariaLabel="Hero body" />
                                </p>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()}>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "featureCards" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#232536]">
                            <div className="relative z-10 flex h-full flex-col px-7 pb-10 pt-10">
                                <div className="mb-5 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Psych Mastery</div>
                                <h2 className="mb-4 text-center text-[23px] font-black leading-[1.07]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Feature headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="mb-4 h-0.5 w-full bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]" />
                                <div className="flex flex-1 flex-col justify-center gap-3">
                                    {(rows.length ? rows : [{ term: "Clinical Interviews", description: "Learn structured interview techniques." }]).slice(0, 3).map((row, index) => {
                                        const Icon = cardIcons[index % cardIcons.length]
                                        return (
                                            <div key={`feature-${index}`} className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-[0_14px_34px_-20px_rgba(15,23,42,.35)] ring-1 ring-slate-100">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(237,65,91,.12)_0%,rgba(236,81,133,.14)_48%,rgba(175,92,233,.18)_100%)] text-[#af5ce9]">
                                                    <Icon size={19} strokeWidth={2.2} />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-[14px] font-black leading-tight text-[#232536]">{row.term}</span>
                                                    <span className="mt-1 block text-[11px] font-semibold leading-snug text-slate-500">{row.description}</span>
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {slide.variant === "titleCard" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#232536]">
                            <div className="relative z-10 flex h-full flex-col px-8 py-10">
                                <div className="mb-5 flex h-20 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(237,65,91,.10),rgba(175,92,233,.14))] text-[#af5ce9] shadow-[0_20px_38px_-26px_rgba(15,23,42,.45)]">
                                    <Brain size={36} strokeWidth={1.6} />
                                </div>
                                <div className="h-px w-full bg-slate-300" />
                                <h2 className="my-4 border-l-4 border-transparent bg-[linear-gradient(white,white)_padding-box,linear-gradient(135deg,#ed415b,#ec5185,#af5ce9)_border-box] pl-4 text-[23px] font-black leading-[1.07]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Title card headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="h-px w-full bg-slate-300" />
                                <p className="mt-5 text-[14px] font-semibold leading-relaxed text-slate-500">
                                    <EditableText value={(slide.body ?? []).join("\n")} onCommit={(next) => onEditField("body", next)} placeholder="Short explanation" multiline ariaLabel="Title card body" />
                                </p>
                            </div>
                        </div>
                    )}
                    {slide.variant === "taxonomyList" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#232536]">
                            <div className="relative z-10 flex h-full flex-col px-7 py-10">
                                <h2 className="mb-6 text-center text-[24px] font-black uppercase leading-none tracking-[0.06em]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Types headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="space-y-0 overflow-hidden rounded-sm bg-slate-100">
                                    {(rows.length ? rows : [{ term: "Type one", description: "Short clinical definition." }]).slice(0, 4).map((row, index) => (
                                        <div key={`tax-${index}`} className="flex min-h-[74px] items-center gap-4 border-b border-slate-300/70 px-5 py-3 last:border-b-0">
                                            <span className="h-6 w-6 shrink-0 rounded-full bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]" />
                                            <span>
                                                <span className="block text-[17px] font-black leading-tight text-[#232536]">{row.term}</span>
                                                <span className="mt-1 block text-[13px] font-semibold leading-snug text-slate-500">{row.description}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {slide.variant === "scienceSplit" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#232536]">
                            <div className="absolute left-0 right-0 top-0 h-11 border-b border-slate-200" />
                            <div className="absolute bottom-0 left-0 right-0 h-9 border-t border-slate-200" />
                            <div className="relative z-10 flex h-full flex-col px-7 pb-12 pt-12">
                                <div className="mb-5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                                    <Brain size={18} className="text-[#af5ce9]" />
                                    <span>{slide.eyebrow}</span>
                                    <span>{slide.eyebrow}</span>
                                </div>
                                <div className="grid flex-1 grid-cols-[1fr_1.05fr] gap-5">
                                    <div className="flex flex-col justify-center border-l-4 border-transparent bg-[linear-gradient(white,white)_padding-box,linear-gradient(135deg,#ed415b,#ec5185,#af5ce9)_border-box] pl-4">
                                        <h2 className="mb-3 text-[22px] font-black leading-[1.04]">
                                            <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Mechanism headline" multiline ariaLabel="Slide headline" />
                                        </h2>
                                        <p className="text-[12px] font-semibold leading-relaxed text-slate-600">
                                            <EditableText value={(slide.body ?? []).slice(0, 2).join("\n")} onCommit={(next) => onEditField("body", next)} placeholder="Mechanism explanation" multiline ariaLabel="Science body" />
                                        </p>
                                    </div>
                                    <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-[0_14px_34px_-24px_rgba(15,23,42,.35)]">
                                        <div className="mx-auto mb-3 flex h-16 w-24 items-center justify-center rounded-[48%] border-2 border-slate-300 bg-white text-[#af5ce9]">
                                            <Brain size={38} strokeWidth={1.4} />
                                        </div>
                                        <div className="space-y-1">
                                            {rows.slice(0, 4).map((row, index) => (
                                                <div key={`science-${index}`} className="flex items-center gap-2 text-[9.5px] font-bold leading-tight text-slate-600">
                                                    <span className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]" />
                                                    <span>{row.term}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()}>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "cover" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#232536]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.08),transparent_58%)]" />
                            <div className="absolute left-6 top-6 z-10 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Psych Mastery</div>
                            <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
                                <h2 className="mb-4 text-[22px] font-black leading-[1.05] text-[#232536]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Carousel cover headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(237,65,91,.12)_0%,rgba(236,81,133,.14)_48%,rgba(175,92,233,.18)_100%)] text-[#af5ce9]">
                                    <Brain size={34} strokeWidth={1.8} />
                                </div>
                                <div className="h-px w-full bg-slate-200" />
                                <p className="mt-5 text-[13px] leading-relaxed text-slate-500">
                                    <EditableText value={(slide.body ?? []).join("\n")} onCommit={(next) => onEditField("body", next)} placeholder="Short supporting line" multiline ariaLabel="Cover body" />
                                </p>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()}>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "insight" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#041f50]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.08),transparent_60%)]" />
                            <SlideOverlay top label={slide.eyebrow}>
                                <Image src="/logo.webp" alt="PAM" width={68} height={16} className="h-4 w-auto object-contain opacity-90" />
                            </SlideOverlay>
                            <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-12 pt-12">
                                <div className="mb-5 h-1 w-9 rounded-full bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]" />
                                <h2 className="mb-4 text-[24px] font-black leading-[1.05] text-[#041f50]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Insight headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="text-[12.5px] leading-relaxed text-slate-600">
                                    <EditableText
                                        value={(slide.body ?? []).join("\n")}
                                        onCommit={(next) => onEditField("body", next)}
                                        placeholder="Term — description (one per line)"
                                        multiline
                                        className="block whitespace-pre-wrap"
                                        ariaLabel="Insight body"
                                    />
                                    {(slide.body?.length ?? 0) > 0 ? (
                                        <div className="mt-3 space-y-1 opacity-60">
                                            {insightLines.map((line, i) => (
                                                <div key={`hint-${i}`} className="flex gap-3 text-[10px] text-slate-400">
                                                    <span className="w-1 shrink-0 rounded-full bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]" />
                                                    <span>
                                                        <strong className="text-slate-500">{line.term}</strong>
                                                        {line.description ? ` — ${line.description}` : ""}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()}>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "darkInsight" && (
                        <div className="relative h-full w-full overflow-hidden bg-[#041f50] text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.38),transparent_58%),radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.22),transparent_58%)]" />
                            <SlideOverlay top label={slide.eyebrow} dark>
                                <Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 object-contain opacity-75" />
                            </SlideOverlay>
                            <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-12 pt-12">
                                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[12px] font-black text-white ring-1 ring-white/10">
                                    <Sparkles size={16} />
                                </div>
                                <h2 className="mb-4 text-[23px] font-black leading-[1.05] text-white">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Deep dive headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="space-y-2">
                                    {(slide.body ?? []).slice(0, 4).map((line, index) => (
                                        <div key={`dark-${index}`} className="rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-[11px] font-semibold leading-snug text-white/78">
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()} dark>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "stat" && (
                        <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)] text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,.24),transparent_58%),radial-gradient(ellipse_at_bottom_left,rgba(4,31,80,.32),transparent_55%)]" />
                            <SlideOverlay top label={slide.eyebrow} dark>
                                <Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 object-contain opacity-80" />
                            </SlideOverlay>
                            <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-12 pt-12">
                                <div className="mb-2 text-[48px] font-black leading-none text-white drop-shadow-sm">
                                    <EditableText value={slide.stat ?? ""} onCommit={(next) => onEditField("stat", next)} placeholder="01" ariaLabel="Stat value" />
                                </div>
                                <p className="mb-5 max-w-[80%] text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">
                                    <EditableText value={slide.statNote ?? ""} onCommit={(next) => onEditField("statNote", next)} placeholder="Clinical checkpoint" multiline ariaLabel="Stat label" />
                                </p>
                                <h2 className="max-w-[88%] text-[22px] font-black leading-[1.05] text-white">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Stat headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <p className="mt-4 max-w-[86%] text-[11.5px] font-semibold leading-relaxed text-white/72">
                                    <EditableText value={(slide.body ?? []).join("\n")} onCommit={(next) => onEditField("body", next)} placeholder="Why this matters" multiline ariaLabel="Stat body" />
                                </p>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()} dark>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "quote" && (
                        <div className="relative h-full w-full overflow-hidden bg-[#0a0e1f] text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(175,92,233,.22),transparent_68%)]" />
                            <SlideOverlay top label={slide.eyebrow} dark>
                                <Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 object-contain opacity-70" />
                            </SlideOverlay>
                            <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-12 pt-12 text-center">
                                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-[34px] font-black leading-none text-white/70">“</div>
                                <h2 className="text-[23px] font-black leading-[1.08] text-white">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Field note headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <p className="mx-auto mt-5 max-w-[86%] text-[12px] font-semibold leading-relaxed text-white/62">
                                    <EditableText value={(slide.body ?? []).join("\n")} onCommit={(next) => onEditField("body", next)} placeholder="Short field note" multiline ariaLabel="Quote body" />
                                </p>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()} dark>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "checklist" && (
                        <div className="relative h-full w-full overflow-hidden bg-white text-[#041f50]">
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(175,92,233,.10),transparent_42%)]" />
                            <SlideOverlay top label={slide.eyebrow}>
                                <Image src="/logo.webp" alt="PAM" width={68} height={16} className="h-4 w-auto object-contain opacity-90" />
                            </SlideOverlay>
                            <div className="relative z-10 flex h-full flex-col justify-center px-7 pb-12 pt-12">
                                <h2 className="mb-4 text-[22px] font-black leading-[1.05] text-[#041f50]">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="Checklist headline" multiline ariaLabel="Slide headline" />
                                </h2>
                                <div className="space-y-2">
                                    {(slide.body ?? []).slice(0, 5).map((line, index) => (
                                        <div key={`check-${index}`} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11.5px] font-semibold leading-snug text-slate-600">
                                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${GRADIENT_BG_CLASS}`}>
                                                <Check size={9} />
                                            </span>
                                            <span>{line.replace(/^(?:[-*•✓✔]|\d+[.)])\s+/, "")}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()}>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                    {slide.variant === "cta" && (
                        <div className="relative h-full w-full overflow-hidden bg-[#0a0e1f] text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(175,92,233,.22),transparent_70%)]" />
                            <SlideOverlay top label="Final Slide" dark>
                                <Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 object-contain opacity-60" />
                            </SlideOverlay>
                            <div className="relative z-10 flex h-full flex-col items-center justify-center px-7 text-center">
                                <Image src="/1.png" alt="PAM Book" width={88} height={114} className="mb-4 h-[114px] w-[88px] rounded-md object-cover ring-1 ring-white/15 shadow-[0_22px_50px_-10px_rgba(0,0,0,0.6),0_6px_14px_rgba(175,92,233,0.4)]" />
                                <h2 className="mb-1 text-[18px] font-black leading-tight text-white">
                                    <EditableText value={slide.headline ?? ""} onCommit={(next) => onEditField("headline", next)} placeholder="CTA headline" multiline ariaLabel="CTA headline" />
                                </h2>
                                <p className="mb-5 text-[10.5px] text-white/45">
                                    <EditableText value={slide.body?.[0] ?? ""} onCommit={(next) => onEditField("body", next)} placeholder="CTA body" ariaLabel="CTA body" />
                                </p>
                                <div className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                                    {slide.cta}
                                    <ArrowRight size={12} />
                                </div>
                            </div>
                            <SlideOverlay bottom label={siteUrl.toUpperCase()} dark>
                                {footerCue}
                            </SlideOverlay>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function IconChip({
    icon: Icon,
    title,
    label,
    tone = "default",
    disabled = false,
    onClick,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>
    title: string
    label: string
    tone?: "default" | "danger"
    disabled?: boolean
    onClick?: () => void
}) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onClick?.()
            }}
            title={title}
            aria-label={title}
            disabled={disabled}
            className={`flex h-8 items-center justify-center gap-1 rounded-[10px] bg-white px-2 text-[10.5px] font-bold shadow-[0_6px_16px_-4px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${tone === "danger" ? "text-rose-500 hover:text-rose-600" : "text-slate-600 hover:text-purple-600"}`}
        >
            <Icon size={13} />
            <span>{label}</span>
        </button>
    )
}

function SlideOverlay({ top, bottom, dark = false, label, children }: { top?: boolean; bottom?: boolean; dark?: boolean; label: string; children: React.ReactNode }) {
    return (
        <div className={`absolute left-0 right-0 z-20 flex items-center justify-between px-[18px] ${top ? "top-0 pt-[14px]" : ""} ${bottom ? "bottom-0 pb-[14px]" : ""}`}>
            <span className={`rounded-md px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.22em] ${dark ? "border border-white/10 bg-white/10 text-white/80" : "text-purple-500"}`}>
                {label}
            </span>
            {children}
        </div>
    )
}

function StudioToastStack({ toasts, onDismiss }: { toasts: StudioToast[]; onDismiss: (id: string) => void }) {
    if (toasts.length === 0) {
        return null
    }

    return (
        <div className="fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
            {toasts.map((toast) => (
                <div key={toast.id} className={`rounded-2xl border bg-white p-4 shadow-[0_18px_50px_-20px_rgba(15,23,42,.45)] ${toast.type === "error" ? "border-rose-200" : toast.type === "success" ? "border-emerald-200" : "border-slate-200"}`}>
                    <div className="flex items-start gap-3">
                        <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${toast.type === "error" ? "bg-rose-500" : toast.type === "success" ? "bg-emerald-500" : "bg-purple-500"}`} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-[#041f50]">{toast.title}</p>
                            {toast.message ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{toast.message}</p> : null}
                        </div>
                        <button type="button" onClick={() => onDismiss(toast.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss notification">
                            <X size={13} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

function StudioConfirmModal({ dialog, onClose }: { dialog: StudioConfirmDialogState | null; onClose: () => void }) {
    if (!dialog) {
        return null
    }

    const confirmClass = dialog.tone === "danger"
        ? "bg-rose-600 text-white shadow-[0_14px_32px_-12px_rgba(225,29,72,.55)] hover:bg-rose-500"
        : `${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS} text-white hover:opacity-95`

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="studio-confirm-title" className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_34px_90px_-32px_rgba(15,23,42,.65)]">
                <div className={`h-1.5 ${dialog.tone === "danger" ? "bg-rose-500" : GRADIENT_BG_CLASS}`} />
                <div className="p-6">
                    <div className="mb-4 flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${dialog.tone === "danger" ? "bg-rose-500" : GRADIENT_BG_CLASS}`}>
                            {dialog.tone === "danger" ? <Trash2 size={17} /> : <Check size={17} />}
                        </div>
                        <div className="min-w-0">
                            <h2 id="studio-confirm-title" className="text-base font-black tracking-tight text-[#041f50]">{dialog.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">{dialog.message}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                dialog.onCancel?.()
                                onClose()
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#041f50]"
                        >
                            {dialog.cancelLabel ?? "Cancel"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const result = dialog.onConfirm()
                                onClose()
                                void result
                            }}
                            className={`rounded-xl px-4 py-2 text-sm font-black transition ${confirmClass}`}
                        >
                            {dialog.confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StudioExportOverlay({ state }: { state: StudioExportState | null }) {
    if (!state) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#041f50]/35 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[24px] border border-white/70 bg-white p-6 text-center shadow-[0_24px_80px_-24px_rgba(15,23,42,.55)]">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                    <RefreshCw size={24} className="animate-spin" />
                </div>
                <h2 className="mt-5 text-[16px] font-black tracking-tight text-[#041f50]">{state.title}</h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{state.detail}</p>
                <div className="mt-5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-1.5 w-2/3 animate-pulse rounded-full ${GRADIENT_BG_CLASS}`} />
                </div>
            </div>
        </div>
    )
}

function ContentStudioCreate({
    packageItem,
    messages,
    isBusy,
    ratio,
    setRatio,
    activePlatform,
    setActivePlatform,
    promptDraft,
    setPromptDraft,
    onPromptSubmit,
    onSelectDrafts,
    onSavePackage,
    onExport,
    onAddSlide,
    onDuplicateSlide,
    onDeleteSlide,
    onRegenerateSlide,
    onSourceFileUpload,
    sourceDraft,
    setSourceDraft,
    showPasteSource,
    setShowPasteSource,
    onIngestPaste,
    onCaptionChange,
    onCaptionSave,
    onRegenerateCaption,
    onCopyCaption,
    onQualityGate,
    onApprove,
    onEditSlideField,
    onTitleChange,
    siteUrl,
}: {
    packageItem: StudioPackage
    messages: StudioMessage[]
    isBusy: boolean
    ratio: StudioRatio
    setRatio: (ratio: StudioRatio) => void
    activePlatform: PlatformKey
    setActivePlatform: (platform: PlatformKey) => void
    promptDraft: string
    setPromptDraft: (value: string) => void
    onPromptSubmit: (message?: string) => void
    onSelectDrafts: () => void
    onSavePackage: () => void
    onExport: () => void
    onAddSlide: () => void
    onDuplicateSlide: (slideId: string) => void
    onDeleteSlide: (slideId: string) => void
    onRegenerateSlide: (slideId: string) => void
    onSourceFileUpload: (sourceType: "PDF" | "CSV", file: File) => void
    sourceDraft: string
    setSourceDraft: (value: string) => void
    showPasteSource: boolean
    setShowPasteSource: (value: boolean) => void
    onIngestPaste: () => void
    onCaptionChange: (platform: PlatformKey, value: string) => void
    onCaptionSave: (platform: PlatformKey) => void
    onRegenerateCaption: (platform: PlatformKey) => void
    onCopyCaption: (platform: PlatformKey) => void
    onQualityGate: () => void
    onApprove: () => void
    onEditSlideField: (slideId: string, field: "headline" | "body" | "stat" | "statNote", next: string) => void
    onTitleChange: (next: string) => void
    siteUrl: string
}) {
    const platform = PLATFORM_META[activePlatform]
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const csvInputRef = useRef<HTMLInputElement>(null)
    const promptInputRef = useRef<HTMLTextAreaElement>(null)
    const packageSlides = Array.isArray(packageItem.carouselJson?.slides) ? packageItem.carouselJson.slides : []
    const packageCaptions = normalizeClientCaptions(packageItem.captionsJson)
    const slides = packageSlides.map((slide, index) => ({
        id: slide.id,
        preview: toPreviewSlide(slide, index, packageSlides.length),
    }),
    )
    const slidesCount = `${slides.length} slides`
    const ratioButtons = STUDIO_RATIOS
    const caption = packageCaptions[activePlatform]
    const captionText = captionToText(caption, activePlatform)
    const [isPromptCollapsed, setIsPromptCollapsed] = useState(false)
    const [isCaptionsCollapsed, setIsCaptionsCollapsed] = useState(false)
    const [canvasZoom, setCanvasZoom] = useState(1)
    const zoomPercent = `${Math.round(canvasZoom * 100)}%`

    return (
        <div className="flex h-full min-h-[900px] flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/80 px-5 backdrop-blur">
                <div className="flex min-w-0 items-center gap-3">
                    <button onClick={onSelectDrafts} title="Back to drafts" aria-label="Back to drafts" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#041f50]">
                        <ArrowRight size={12} className="rotate-180" />
                    </button>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <h1 className="min-w-0 truncate text-[14px] font-extrabold tracking-tight text-[#041f50]">
                        <EditableText value={packageItem.title} onCommit={onTitleChange} placeholder="Untitled Carousel" ariaLabel="Package title" />
                    </h1>
                    <button title="Brand brief active" aria-label="Brand brief active" className="text-purple-500 transition hover:text-pink-500">
                        <Bookmark size={13} />
                    </button>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <DockButton icon={Download} label="Export" onClick={onExport} />
                    <DockButton icon={PencilRuler} label="Save Draft" onClick={onSavePackage} />
                    <button onClick={onApprove} className={`flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[10.5px] font-black text-white transition hover:opacity-95 ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <Check size={10.5} />
                        Approve
                    </button>
                </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
                <aside className={`w-full shrink-0 border-b border-slate-200/70 bg-white transition-[width] duration-200 xl:border-b-0 xl:border-r ${isPromptCollapsed ? "xl:w-14" : "xl:w-72"}`}>
                    <div className={`flex px-4 pb-2 pt-4 ${isPromptCollapsed ? "flex-col items-center gap-2" : "items-start justify-between"}`}>
                        <div className={`flex ${isPromptCollapsed ? "order-2" : "order-1 items-center gap-2"}`}>
                            <MessageCircleMore size={isPromptCollapsed ? 13 : 11} className="text-purple-500" />
                            {!isPromptCollapsed && <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#041f50]">Prompt</span>}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPromptCollapsed((current) => !current)}
                            title={isPromptCollapsed ? "Expand prompt panel" : "Collapse prompt panel"}
                            aria-label={isPromptCollapsed ? "Expand prompt panel" : "Collapse prompt panel"}
                            className={`${isPromptCollapsed ? "order-1" : "order-2"} flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-purple-500`}
                        >
                            {isPromptCollapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
                        </button>
                    </div>
                    {isPromptCollapsed ? (
                        <div className="hidden flex-1 items-center justify-center px-2 py-4 xl:flex">
                            <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Prompt</span>
                        </div>
                    ) : (
                        <>
                    <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-3 text-[12.5px] xl:max-h-none xl:flex-1">
                        {packageItem.sourceText ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Source Attached</p>
                                        <p className="mt-1 text-[12px] font-semibold text-[#041f50]">{packageItem.sourceType} source · {packageItem.sourceText.length.toLocaleString()} chars</p>
                                    </div>
                                    <button onClick={() => setShowPasteSource(!showPasteSource)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50">{showPasteSource ? "Hide paste" : "Replace source"}</button>
                                </div>
                                <p className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-slate-500">{packageItem.sourceText}</p>
                            </div>
                        ) : null}
                        {(messages.length > 0 ? messages : EMPTY_MESSAGES).map((message) => (
                            <ChatBubble
                                key={message.id}
                                user={message.role === "user"}
                                assistant={message.role === "assistant"}
                                text={message.role === "assistant" ? sanitizeStudioMessage(message.content) : message.content}
                            />
                        ))}
                    </div>
                    <div className="border-t border-slate-200/70 p-3">
                        <div className="mb-2 flex items-center gap-1 px-2">
                            <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" className="hidden" title="Upload PDF source" onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) {
                                    onSourceFileUpload("PDF", file)
                                    event.target.value = ""
                                }
                            }} />
                            <input ref={csvInputRef} type="file" accept="text/csv,.csv" className="hidden" title="Upload CSV source" onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) {
                                    onSourceFileUpload("CSV", file)
                                    event.target.value = ""
                                }
                            }} />
                            <ComposerChip icon={BookImage} tone="red" title="Attach PDF" onClick={() => pdfInputRef.current?.click()} />
                            <ComposerChip icon={TableProperties} tone="emerald" title="Attach CSV" onClick={() => csvInputRef.current?.click()} />
                            <ComposerChip icon={Upload} tone="blue" title="Paste source" onClick={() => setShowPasteSource(!showPasteSource)} />
                            <span className="ml-auto rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-500">⌘K</span>
                        </div>
                        {showPasteSource ? (
                            <div className="mb-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5">
                                <textarea
                                    value={sourceDraft}
                                    onChange={(event) => setSourceDraft(event.target.value)}
                                    title="Paste source text"
                                    placeholder="Paste raw source text, notes, or source material here…"
                                    className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-700 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowPasteSource(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
                                    <button onClick={onIngestPaste} disabled={isBusy || !sourceDraft.trim()} className={`rounded-xl px-3 py-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>Load source</button>
                                </div>
                            </div>
                        ) : null}
                        <div className="flex items-end rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 transition focus-within:border-purple-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-purple-100">
                            <textarea
                                ref={promptInputRef}
                                value={promptDraft}
                                onChange={(event) => setPromptDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                                        event.preventDefault()
                                        onPromptSubmit(promptInputRef.current?.value ?? promptDraft)
                                    }
                                }}
                                title="Prompt composer"
                                rows={7}
                                placeholder="Tell PAM what to make…"
                                className="min-h-[154px] max-h-[230px] flex-1 resize-y bg-transparent px-2 py-2 text-[12.5px] leading-relaxed text-slate-700 outline-none placeholder:text-slate-400"
                            />
                            <button onClick={() => onPromptSubmit(promptInputRef.current?.value ?? promptDraft)} disabled={isBusy || !promptDraft.trim()} title="Send prompt" aria-label="Send prompt" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                                <ArrowRight size={11} className="-rotate-45" />
                            </button>
                        </div>
                    </div>
                        </>
                    )}
                </aside>

                <section className="relative flex min-h-[640px] flex-1 overflow-auto bg-[#f6f7fb] [background-image:radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:28px_28px]">
                    <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2 py-1.5 shadow-[0_8px_32px_-4px_rgba(15,23,42,.18),0_2px_6px_rgba(15,23,42,.06)] backdrop-blur">
                        {ratioButtons.map((option) => (
                            <button
                                key={option}
                                onClick={() => setRatio(option)}
                                className={`rounded-[9px] px-[14px] py-[6px] text-[11px] font-bold tracking-[0.06em] transition ${ratio === option ? "bg-[#0a0e1f] text-white shadow-[0_6px_14px_-4px_rgba(15,23,42,.3)]" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                {option}
                            </button>
                        ))}
                        <span className="mx-1 h-4 w-px bg-slate-300" />
                        <span className="flex items-center gap-1.5 px-2 text-[10.5px] font-semibold text-slate-500">
                            <Images size={10} className="text-purple-500" />
                            {slidesCount}
                        </span>
                        <span className="mx-1 h-4 w-px bg-slate-300" />
                        <button
                            type="button"
                            onClick={() => setCanvasZoom((current) => Math.max(0.55, Number((current - 0.1).toFixed(2))))}
                            title="Zoom out"
                            aria-label="Zoom out"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-purple-600"
                        >
                            <ZoomOut size={11} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setCanvasZoom(1)}
                            title="Reset zoom"
                            className="min-w-10 rounded-[9px] px-2 py-[6px] text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                            {zoomPercent}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCanvasZoom((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}
                            title="Zoom in"
                            aria-label="Zoom in"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-purple-600"
                        >
                            <ZoomIn size={11} />
                        </button>
                        <span className="mx-1 h-4 w-px bg-slate-300" />
                        <button onClick={onAddSlide} title="Add slide" aria-label="Add slide" className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:opacity-90 ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                            <Plus size={10} />
                        </button>
                    </div>

                    <div className="min-h-full w-full px-6 pb-32 pt-20 sm:px-12">
                        {slides.length > 0 ? (
                            <div className="grid grid-cols-1 place-items-center gap-x-8 gap-y-12 lg:grid-cols-2 2xl:grid-cols-3 min-[1900px]:grid-cols-4" style={{ zoom: canvasZoom }}>
                                {slides.map((slide) => (
                                    <div key={slide.id} className="group">
                                        <SlideFrame
                                            ratio={ratio}
                                            slide={slide.preview}
                                            siteUrl={siteUrl}
                                            isBusy={isBusy}
                                            onRegenerate={() => onRegenerateSlide(slide.id)}
                                            onDuplicate={() => onDuplicateSlide(slide.id)}
                                            onDelete={() => onDeleteSlide(slide.id)}
                                            onEditField={(field, next) => onEditSlideField(slide.id, field, next)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[520px] items-center justify-center">
                                <div className="max-w-md rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center shadow-[0_24px_48px_-20px_rgba(15,23,42,0.2)] backdrop-blur">
                                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                                        <WandSparkles size={20} />
                                    </div>
                                    <h3 className="text-lg font-extrabold text-[#041f50]">Start with a prompt or add a slide</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-500">Use the prompt panel to generate content, or add the first slide manually.</p>
                                    <div className="mt-5 flex justify-center gap-3">
                                        <button onClick={onAddSlide} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Add first slide</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </section>

                <aside className={`flex w-full shrink-0 border-t border-slate-200/70 bg-white transition-[width] duration-200 xl:border-l xl:border-t-0 ${isCaptionsCollapsed ? "xl:w-14" : "xl:w-[344px]"}`}>
                    <div className="flex w-14 flex-col items-center gap-1.5 border-r border-slate-200/70 bg-slate-50/40 py-4">
                        <button
                            type="button"
                            onClick={() => setIsCaptionsCollapsed((current) => !current)}
                            title={isCaptionsCollapsed ? "Expand captions panel" : "Collapse captions panel"}
                            aria-label={isCaptionsCollapsed ? "Expand captions panel" : "Collapse captions panel"}
                            className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-purple-500"
                        >
                            {isCaptionsCollapsed ? <PanelRightOpen size={13} /> : <PanelRightClose size={13} />}
                        </button>
                        {(Object.keys(PLATFORM_META) as PlatformKey[]).map((key) => {
                            const meta = PLATFORM_META[key]
                            const Icon = meta.icon
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActivePlatform(key)}
                                    className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition ${activePlatform === key ? "bg-purple-50 text-purple-500" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}
                                >
                                    {activePlatform === key && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]" />}
                                    <Icon size={15} />
                                </button>
                            )
                        })}
                        <span className="mt-auto [writing-mode:vertical-rl] rotate-180 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Captions</span>
                    </div>
                    <div className={`${isCaptionsCollapsed ? "hidden" : "flex"} min-w-0 flex-1 flex-col`}>
                        <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${platform.swatchClass}`}>
                                    <platform.icon size={12} />
                                </span>
                                <div className="leading-none">
                                    <p className="text-[12px] font-bold text-[#041f50]">{platform.name}</p>
                                    <p className="mt-0.5 text-[9.5px] text-slate-400">{platform.spec}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => onRegenerateCaption(activePlatform)} title="Regenerate caption" aria-label="Regenerate caption" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-purple-500">
                                    <RefreshCw size={11} />
                                </button>
                                <button onClick={() => onCopyCaption(activePlatform)} title="Copy caption" aria-label="Copy caption" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-purple-500">
                                    <Copy size={11} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto p-4">
                            <textarea value={captionText} onChange={(event) => onCaptionChange(activePlatform, event.target.value)} onBlur={() => onCaptionSave(activePlatform)} title={`${platform.name} caption`} className="h-44 w-full resize-none rounded-xl border border-transparent bg-slate-50/60 p-3 text-[12.5px] leading-relaxed text-slate-700 outline-none transition hover:bg-slate-50 focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100" />
                            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Bookmark size={9} className="text-purple-500" />
                                    Brand brief applied
                                </span>
                                <span className="font-mono">{getPlatformCharCount(caption, activePlatform)}</span>
                            </div>
                            <button type="button" onClick={onQualityGate} disabled={isBusy} className="w-full cursor-pointer rounded-xl bg-[linear-gradient(135deg,#041f50_0%,#0a0e1f_100%)] p-3 text-left text-white transition hover:ring-2 hover:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-70">
                                <div className="mb-2 flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/20">
                                        <ShieldCheck size={12} className="text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Anti-Generic Gate</p>
                                    </div>
                                    <span className="text-[16px] font-black text-emerald-400">{packageItem.qualityJson.score?.toFixed(1) ?? "--"}</span>
                                    <span className="text-[10px] font-semibold text-slate-500">/5</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <span
                                            key={level}
                                            className={`h-1 flex-1 rounded-full ${typeof packageItem.qualityJson.score === "number" && packageItem.qualityJson.score >= level ? "bg-emerald-400/80" : "bg-emerald-400/20"}`}
                                        />
                                    ))}
                                </div>
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function StudioWorkspace({
    initialView,
    eyebrow,
    title,
    description,
}: {
    initialView: WorkspaceView
    eyebrow: string
    title: string
    description: string
}) {
    const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(initialView)
    const [ratio, setRatio] = useState<StudioRatio>("1:1")
    const [activePlatform, setActivePlatform] = useState<PlatformKey>("instagram")
    const [settingsTab, setSettingsTab] = useState<SettingsTab>("brand")
    const [contextTab, setContextTab] = useState<ContextTab>("always")
    const [tone, setTone] = useState("Authoritative")
    const [packages, setPackages] = useState<StudioPackageListItem[]>([])
    const [activePackageId, setActivePackageId] = useState<string | null>(null)
    const [activePackage, setActivePackage] = useState<StudioPackage | null>(null)
    const [messages, setMessages] = useState<StudioMessage[]>([])
    const [settings, setSettings] = useState<StudioSettings | null>(null)
    const [promptDraft, setPromptDraft] = useState("")
    const [sourceDraft, setSourceDraft] = useState("")
    const [showPasteSource, setShowPasteSource] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isBusy, setIsBusy] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [toasts, setToasts] = useState<StudioToast[]>([])
    const [confirmDialog, setConfirmDialog] = useState<StudioConfirmDialogState | null>(null)
    const [exportState, setExportState] = useState<StudioExportState | null>(null)
    const manualPackageOpenRef = useRef(false)

    const showToast = useCallback((toast: Omit<StudioToast, "id">) => {
        const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `toast-${Date.now()}`
        setToasts((current) => [...current.slice(-2), { ...toast, id }])
        window.setTimeout(() => {
            setToasts((current) => current.filter((item) => item.id !== id))
        }, 4200)
    }, [])

    const loadPackages = useCallback(async (selectedId?: string | null) => {
        const result = await fetchJson<{ items: StudioPackageListItem[] }>("/api/studio/packages")
        setPackages(result.items)

        const nextId = selectedId ?? result.items[0]?.id ?? null
        if (!nextId) {
            setActivePackageId(null)
            setActivePackage(null)
            setMessages([])
            setPromptDraft("")
            return
        }

        setActivePackageId(nextId)
        let detail: { item: StudioPackage; messages: StudioMessage[] }
        try {
            detail = await fetchJson<{ item: StudioPackage; messages: StudioMessage[] }>(`/api/studio/packages/${nextId}`)
        } catch (error) {
            if (selectedId) {
                throw error
            }

            setActivePackageId(null)
            setActivePackage(null)
            setMessages([])
            setPromptDraft("")
            setSourceDraft("")
            throw error
        }
        setActivePackage(detail.item)
        setMessages(detail.messages)
        setRatio(detail.item.carouselJson.ratio)
        setPromptDraft(detail.item.sourcePrompt ?? "")
        setSourceDraft(detail.item.sourceText ?? "")
    }, [])

    const loadSettings = useCallback(async () => {
        const result = await fetchJson<{ item: StudioSettings }>("/api/studio/settings")
        setSettings(result.item)
        setTone(result.item.tone.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (match) => match.toUpperCase()))
        setContextTab(result.item.neverSay ? "never" : "always")
    }, [])

    const startBlankSession = useCallback(() => {
        manualPackageOpenRef.current = false
        setActivePackageId(null)
        setActivePackage(createUnsavedStudioPackage())
        setMessages([])
        setPromptDraft("")
        setSourceDraft("")
        setShowPasteSource(false)
        setRatio("1:1")
        setWorkspaceView("create")
        setErrorMessage(null)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setIsLoading(true)
            setErrorMessage(null)

            const results = await Promise.allSettled([loadPackages(), loadSettings()])
            if (cancelled) {
                return
            }

            const failures = results
                .filter((result): result is PromiseRejectedResult => result.status === "rejected")
                .map((result) => result.reason instanceof Error ? result.reason.message : "Failed to load studio workspace")

            if (failures.length > 0) {
                setErrorMessage(failures.join(" | "))
            }

            if (!cancelled && !manualPackageOpenRef.current) {
                startBlankSession()
            }

            setIsLoading(false)
        }

        void load()
        return () => {
            cancelled = true
        }
    }, [loadPackages, loadSettings, startBlankSession])

    async function savePackage(nextItem?: StudioPackage) {
        const item = nextItem ?? activePackage
        if (!item) {
            return null
        }

        setIsBusy(true)
        setErrorMessage(null)
        try {
            if (isUnsavedStudioPackage(item)) {
                const created = await fetchJson<{ item: StudioPackage }>("/api/studio/packages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: item.title, sourcePrompt: item.sourcePrompt }),
                })
                const realItem = {
                    ...item,
                    id: created.item.id,
                    ownerId: created.item.ownerId,
                    createdAt: created.item.createdAt,
                    updatedAt: created.item.updatedAt,
                }
                const saved = await fetchJson<{ item: StudioPackage }>(`/api/studio/packages/${created.item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: realItem.title,
                        sourcePrompt: realItem.sourcePrompt,
                        carouselJson: { ...realItem.carouselJson, ratio },
                        captionsJson: realItem.captionsJson,
                        qualityJson: realItem.qualityJson,
                        status: realItem.status,
                    }),
                })
                setActivePackageId(saved.item.id)
                setActivePackage(saved.item)
                await loadPackages(saved.item.id)
                showToast(STUDIO_FEEDBACK.saved)
                return saved.item
            }

            const result = await fetchJson<{ item: StudioPackage }>(`/api/studio/packages/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: item.title,
                    sourcePrompt: item.sourcePrompt,
                    carouselJson: { ...item.carouselJson, ratio },
                    captionsJson: item.captionsJson,
                    qualityJson: item.qualityJson,
                    status: item.status,
                }),
            })

            setActivePackage(result.item)
            await loadPackages(result.item.id)
            showToast(STUDIO_FEEDBACK.saved)
            return result.item
        } catch (error) {
            const message = formatStudioError(error, "Failed to save studio package")
            setErrorMessage(message)
            showToast({ type: "error", title: "Save failed", message })
            return null
        } finally {
            setIsBusy(false)
        }
    }

    async function handlePromptSubmit(target?: string, messageOverride?: string) {
        if (!activePackage) {
            return
        }

        const message = (messageOverride ?? promptDraft).trim()
        if (!message) {
            showToast(STUDIO_FEEDBACK.needsPrompt)
            return
        }

        let workingPackage = activePackage
        if (isUnsavedStudioPackage(workingPackage)) {
            const saved = await savePackage({
                ...workingPackage,
                sourcePrompt: target ? workingPackage.sourcePrompt : message,
            })
            if (!saved) {
                return
            }
            workingPackage = saved
        }

        const optimisticUserId = `optimistic-user-${Date.now()}`
        const optimisticAssistantId = `optimistic-assistant-${Date.now()}`
        const nowIso = new Date().toISOString()
        const targetLabel = target ?? "CAROUSEL"

        setMessages((prior) => [
            ...prior,
            { id: optimisticUserId, packageId: workingPackage.id, role: "user", content: message, target: targetLabel, createdAt: nowIso },
            { id: optimisticAssistantId, packageId: workingPackage.id, role: "assistant", content: "Studio Package Generator: reviewing…", target: targetLabel, createdAt: nowIso },
        ])

        setIsBusy(true)
        setErrorMessage(null)
        try {
            const response = await fetch(`/api/studio/packages/${workingPackage.id}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, target }),
            })

            await readStudioStream(response, (event) => {
                if (event.type === "partial") {
                    setActivePackage((current) => current ? mergeStudioPartial(current, event) : current)
                    setMessages((prior) => prior.map((item) => item.id === optimisticAssistantId ? {
                        ...item,
                        content: target ? "Studio Package Generator: updating selected item…" : "Studio Package Generator: structuring carousel…",
                    } : item))
                }

                if (event.type === "finish") {
                    setActivePackage(event.item)
                    setRatio(event.item.carouselJson.ratio)
                }

                if (event.type === "status") {
                    setMessages((prior) => prior.map((item) => item.id === optimisticAssistantId ? {
                        ...item,
                        content: event.message,
                    } : item))
                }

                if (event.type === "error") {
                    throw new Error(event.error)
                }
            })

            await loadPackages(workingPackage.id)
            if (!target) {
                setPromptDraft("")
            }
            if (target) {
                showToast(STUDIO_FEEDBACK.regenerated)
            }
        } catch (error) {
            setMessages((prior) => prior.filter((item) => item.id !== optimisticUserId && item.id !== optimisticAssistantId))
            const errorText = formatStudioError(error, "Failed to generate studio content")
            setErrorMessage(errorText)
            showToast({ type: "error", title: "Review failed", message: errorText })
        } finally {
            setIsBusy(false)
        }
    }

    async function createPackage() {
        startBlankSession()
    }

    async function waitForExportBundle(packageId: string) {
        const maxAttempts = 240

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            await sleep(attempt < 3 ? 1500 : 2500)
            const status = await fetchJson<StudioExportStatus>(`/api/studio/packages/${packageId}/export`)

            if (status.status === "complete" && status.downloadUrl) {
                return status
            }

            if (attempt === 8) {
                setExportState({
                    title: "Exporting…",
                    detail: "Rendering all carousel ratios and building the ZIP bundle. This can take a few minutes for larger carousels.",
                })
            }
        }

        throw new Error("Export is still running. Please try Export again in a moment to check for the finished ZIP.")
    }

    async function exportPackage() {
        if (!activePackage) {
            return
        }

        if (activePackage.carouselJson.slides.length === 0) {
            const message = "Add at least one slide before exporting assets."
            setErrorMessage(message)
            showToast({ type: "info", title: "Nothing to export", message })
            return
        }

        setIsBusy(true)
        setExportState({
            title: "Exporting…",
            detail: "Rendering all carousel formats, collecting captions, and preparing the ZIP download.",
        })
        setErrorMessage(null)
        try {
            const canvasSnapshot = createCanvasExportSnapshot({
                ...activePackage,
                carouselJson: { ...activePackage.carouselJson, ratio },
            }, ratio)
            const exportRequestId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `export-${Date.now()}`
            const requestedAt = new Date().toISOString()
            const saved = await savePackage({ ...activePackage, carouselJson: { ...activePackage.carouselJson, ratio } })
            if (!saved) {
                return
            }

            setIsBusy(true)
            setExportState({
                title: "Exporting…",
                detail: "Export job started. Waiting for the ZIP bundle to finish.",
            })

            const result = await fetchJson<StudioExportResult>(`/api/studio/packages/${saved.id}/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ratios: STUDIO_RATIOS,
                    mode: "ALL",
                    exportRequestId,
                    requestedAt,
                    canvasSnapshot,
                }),
            })
            if (result.exportRequestId) {
                setExportState({
                    title: "Exporting…",
                    detail: `Export job is running. Trace ID: ${result.exportRequestId}`,
                })
            }

            const finished = result.downloadUrl ? result : await waitForExportBundle(saved.id)
            if (!finished.downloadUrl) {
                throw new Error("Export completed but no ZIP download was returned.")
            }

            downloadStudioExport(finished.downloadUrl, finished.filename)
            showToast({
                type: "success",
                title: "Export done",
                message: finished.exportRequestId
                    ? `ZIP bundle downloaded. Trace ID: ${finished.exportRequestId}`
                    : "ZIP bundle downloaded with all carousel formats and captions.",
            })
        } catch (error) {
            const message = formatStudioError(error, "Failed to export studio assets")
            setErrorMessage(message)
            showToast({ type: "error", title: "Export failed", message })
        } finally {
            setExportState(null)
            setIsBusy(false)
        }
    }

    async function runApprovePackage() {
        if (!activePackage) {
            return
        }

        setIsBusy(true)
        setErrorMessage(null)
        try {
            const saved = await savePackage({ ...activePackage, status: "READY" })
            if (!saved) {
                return
            }
            const result = await fetchJson<{ item: StudioPackage }>(`/api/studio/packages/${saved.id}/approve`, {
                method: "POST",
            })
            setActivePackage(result.item)
            await loadPackages(result.item.id)
            setWorkspaceView("library")
            showToast(STUDIO_FEEDBACK.approved)
        } catch (error) {
            const message = formatStudioError(error, "Failed to approve package")
            setErrorMessage(message)
            showToast({ type: "error", title: "Approve failed", message })
        } finally {
            setIsBusy(false)
        }
    }

    async function persistSlideUpdate(nextSlides: StudioSlide[]) {
        if (!activePackage) {
            return
        }

        const nextItem = {
            ...activePackage,
            carouselJson: {
                ...activePackage.carouselJson,
                ratio,
                slides: nextSlides,
            },
        }

        setActivePackage(nextItem)
        if (!isUnsavedStudioPackage(nextItem)) {
            await savePackage(nextItem)
        }
    }

    async function addSlide() {
        if (!activePackage) {
            return
        }

        const nextSlides = [...activePackage.carouselJson.slides, createBlankSlide(activePackage.carouselJson.slides.length)]
        await persistSlideUpdate(nextSlides)
    }

    async function duplicateSlide(slideId: string) {
        if (!activePackage) {
            return
        }

        const nextSlides = activePackage.carouselJson.slides.flatMap((slide, index) => {
            if (slide.id !== slideId) {
                return [slide]
            }

            return [
                slide,
                {
                    ...slide,
                    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `slide-${Date.now()}-${index}`,
                    headline: `${slide.headline} Copy`,
                },
            ]
        })

        await persistSlideUpdate(nextSlides)
        showToast(STUDIO_FEEDBACK.duplicated)
    }

    async function deleteSlide(slideId: string) {
        if (!activePackage) {
            return
        }

        setConfirmDialog({
            title: "Delete slide?",
            message: "This removes the slide from the current carousel draft.",
            confirmLabel: "Delete slide",
            cancelLabel: "Cancel",
            tone: "danger",
            onConfirm: async () => {
                if (!activePackage) {
                    return
                }
                const nextSlides = activePackage.carouselJson.slides.filter((slide) => slide.id !== slideId)
                await persistSlideUpdate(nextSlides)
                showToast(STUDIO_FEEDBACK.deleted)
            },
        })
    }

    async function regenerateSlide(slideId: string) {
        await handlePromptSubmit(`SLIDE:${slideId}`, "Regenerate this slide so it is more specific, clinically useful, and visually sharper while preserving the carousel flow.")
    }

    async function editSlideField(slideId: string, field: "headline" | "body" | "stat" | "statNote", next: string) {
        if (!activePackage) {
            return
        }

        const trimmed = next.trim()
        const nextSlides = activePackage.carouselJson.slides.map((slide) => {
            if (slide.id !== slideId) return slide
            if (field === "headline") {
                return { ...slide, headline: trimmed }
            }
            if (field === "body") {
                return { ...slide, body: next }
            }
            const existingStat = slide.stat ?? { value: "", label: "" }
            if (field === "stat") {
                return { ...slide, stat: { ...existingStat, value: trimmed } }
            }
            return { ...slide, stat: { ...existingStat, label: next } }
        })

        await persistSlideUpdate(nextSlides)
    }

    async function changeTitle(next: string) {
        if (!activePackage) {
            return
        }
        const trimmed = next.trim() || "Untitled Carousel"
        if (trimmed === activePackage.title) {
            return
        }
        if (isUnsavedStudioPackage(activePackage)) {
            setActivePackage({ ...activePackage, title: trimmed })
            return
        }
        await savePackage({ ...activePackage, title: trimmed })
    }

    async function saveSettings(nextSettings: StudioSettings) {
        setIsBusy(true)
        setErrorMessage(null)
        try {
            const result = await fetchJson<{ item: StudioSettings }>("/api/studio/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nextSettings),
            })
            setSettings(result.item)
            showToast({ type: "success", title: "Settings saved", message: "Studio settings updated." })
        } catch (error) {
            const message = formatStudioError(error, "Failed to save studio settings")
            setErrorMessage(message)
            showToast({ type: "error", title: "Settings failed", message })
        } finally {
            setIsBusy(false)
        }
    }

    async function ingestSource(payload: { sourceType: "PDF" | "CSV" | "PASTE"; file?: File; text?: string }) {
        if (!activePackage) {
            return
        }

        setIsBusy(true)
        setErrorMessage(null)
        try {
            const formData = new FormData()
            formData.set("sourceType", payload.sourceType)
            if (payload.file) {
                formData.set("file", payload.file)
            }
            if (payload.text) {
                formData.set("text", payload.text)
            }

            const result = await fetchJson<StudioSourceIngestResult>(`/api/studio/packages/${activePackage.id}/source`, {
                method: "POST",
                body: formData,
            })

            setActivePackage(result.item)
            setSourceDraft(result.item.sourceText ?? "")
            setPromptDraft(result.item.sourcePrompt ?? promptDraft)
            setShowPasteSource(false)
            await loadPackages(activePackage.id)
            showToast(STUDIO_FEEDBACK.sourceLoaded)
        } catch (error) {
            const message = formatStudioError(error, "Failed to ingest source")
            setErrorMessage(message)
            showToast({ type: "error", title: "Source failed", message })
        } finally {
            setIsBusy(false)
        }
    }

    async function uploadBrandAsset(assetKind: "logo" | "book" | "alt", file: File) {
        setIsBusy(true)
        setErrorMessage(null)
        try {
            const formData = new FormData()
            formData.set("assetKind", assetKind)
            formData.set("file", file)
            const result = await fetchJson<{ item: StudioSettings }>("/api/studio/settings/assets", {
                method: "POST",
                body: formData,
            })
            setSettings(result.item)
        } catch (error) {
            const message = formatStudioError(error, "Failed to upload brand asset")
            setErrorMessage(message)
            showToast({ type: "error", title: "Upload failed", message })
        } finally {
            setIsBusy(false)
        }
    }

    async function runQualityGate() {
        if (!activePackage) {
            return
        }

        setIsBusy(true)
        setErrorMessage(null)
        try {
            const result = await fetchJson<{ item: StudioPackage }>(`/api/studio/packages/${activePackage.id}/quality-gate`, {
                method: "POST",
            })
            setActivePackage(result.item)
            await loadPackages(result.item.id)
            showToast(STUDIO_FEEDBACK.qualityGate)
        } catch (error) {
            const message = formatStudioError(error, "Failed to run quality gate")
            setErrorMessage(message)
            showToast({ type: "error", title: "Quality gate failed", message })
        } finally {
            setIsBusy(false)
        }
    }

    function approvePackage() {
        if (!activePackage) {
            return
        }

        setConfirmDialog({
            title: "Approve carousel?",
            message: "This marks the carousel approved for manual publishing. You can still export assets and copy captions after approval.",
            confirmLabel: "Approve",
            cancelLabel: "Keep editing",
            onConfirm: runApprovePackage,
        })
    }

    function handleCaptionChange(platform: PlatformKey, value: string) {
        if (!activePackage) {
            return
        }

        setActivePackage({
            ...activePackage,
            captionsJson: {
                ...activePackage.captionsJson,
                [platform]: textToCaption(value, activePackage.captionsJson[platform], platform),
            },
        })
    }

    const hasUnsavedSessionWork = Boolean(
        activePackage
        && isUnsavedStudioPackage(activePackage)
        && (
            promptDraft.trim()
            || sourceDraft.trim()
            || activePackage.carouselJson.slides.length > 0
            || activePackage.sourceText
            || messages.length > 0
        ),
    )

    async function changeWorkspaceView(nextView: WorkspaceView) {
        if (nextView === "create") {
            if (workspaceView !== "create" || !activePackage || !isUnsavedStudioPackage(activePackage)) {
                startBlankSession()
            } else {
                setWorkspaceView("create")
            }
            return
        }

        if (workspaceView === "create" && activePackage && isUnsavedStudioPackage(activePackage)) {
            if (hasUnsavedSessionWork) {
                setConfirmDialog({
                    title: "Save this draft?",
                    message: "This new carousel has unsaved prompt or slide work. Save it as a draft before leaving, or discard the temporary session.",
                    confirmLabel: "Save draft",
                    cancelLabel: "Discard",
                    onConfirm: async () => {
                        const saved = await savePackage({
                            ...activePackage,
                            sourcePrompt: activePackage.sourcePrompt ?? (promptDraft.trim() || null),
                        })
                        if (saved) {
                            setWorkspaceView(nextView)
                        }
                    },
                    onCancel: () => {
                        showToast(STUDIO_FEEDBACK.blankDiscarded)
                        setActivePackage(null)
                        setActivePackageId(null)
                        setMessages([])
                        setPromptDraft("")
                        setSourceDraft("")
                        setWorkspaceView(nextView)
                    },
                })
                return
            } else {
                setActivePackage(null)
                setActivePackageId(null)
                showToast(STUDIO_FEEDBACK.blankDiscarded)
            }
        }

        setWorkspaceView(nextView)
    }

    async function openExistingPackage(id: string) {
        manualPackageOpenRef.current = true
        setIsBusy(true)
        setErrorMessage(null)
        try {
            await loadPackages(id)
            setWorkspaceView("create")
        } catch (error) {
            const message = formatStudioError(error, "Studio package failed to open")
            setErrorMessage(message)
            showToast({ type: "error", title: "Package failed to open", message })
        } finally {
            setIsBusy(false)
        }
    }

    async function handleCaptionSave(platform: PlatformKey) {
        if (!activePackage) {
            return
        }

        await savePackage({
            ...activePackage,
            captionsJson: {
                ...activePackage.captionsJson,
                [platform]: normalizeCaption(
                    activePackage.captionsJson[platform].body,
                    activePackage.captionsJson[platform].hashtags,
                ),
            },
        })
    }

    async function copyCaption(platform: PlatformKey) {
        if (!activePackage) {
            return
        }

        await navigator.clipboard.writeText(captionToText(activePackage.captionsJson[platform], platform))
        showToast(STUDIO_FEEDBACK.copied)
    }

    if (isLoading) {
        return <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center rounded-[28px] border border-slate-100 bg-white text-sm font-semibold text-slate-500 shadow-xl shadow-slate-200/40">Loading studio workspace…</div>
    }

    if (!settings) {
        return <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center rounded-[28px] border border-rose-100 bg-rose-50 px-6 text-sm font-semibold text-rose-600 shadow-xl shadow-slate-200/40">{errorMessage ?? "Studio package failed to load."}</div>
    }

    if (!activePackage && workspaceView === "create") {
        const hasPackageRows = packages.length > 0
        const emptyTitle = hasPackageRows ? "Studio package failed to open" : "No studio packages yet"
        const emptyDescription = hasPackageRows
            ? "Supabase returned studio packages, but the selected package detail could not be loaded. Reload the list or create a fresh package."
            : "Supabase is live and the studio is reading from the database. Create the first package to start generating, editing, and exporting carousel assets."
        return (
            <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center rounded-[28px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
                <div className="max-w-lg text-center">
                    <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <Library size={24} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[#041f50]">{emptyTitle}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{emptyDescription}</p>
                    <div className="mt-6 flex justify-center gap-3">
                        {hasPackageRows ? (
                            <button onClick={() => void loadPackages()} className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>Reload packages</button>
                        ) : (
                            <button onClick={() => void createPackage()} className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>Create first package</button>
                        )}
                        <button onClick={() => void changeWorkspaceView("settings")} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Open settings</button>
                    </div>
                    {errorMessage ? <p className="mt-4 text-sm font-semibold text-rose-500">{errorMessage}</p> : null}
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/90 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        <Sparkles size={11} className="text-purple-500" />
                        {eyebrow}
                    </div>
                    <h2 className="text-[24px] font-black tracking-tight text-[#041f50]">{title}</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p>
                    {errorMessage ? <p className="mt-2 text-sm font-semibold text-rose-500">{errorMessage}</p> : null}
                </div>
            </header>

            <div className="border-b border-slate-200/70 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { key: "create", label: "Create", icon: WandSparkles },
                        { key: "drafts", label: "Drafts", icon: PencilRuler },
                        { key: "library", label: "Library", icon: Library },
                        { key: "settings", label: "Settings", icon: Settings2 },
                    ].map((item) => {
                        const Icon = item.icon
                        const active = workspaceView === item.key
                        return (
                            <button
                                key={item.key}
                                onClick={() => void changeWorkspaceView(item.key as WorkspaceView)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? `${GRADIENT_BG_CLASS} text-white shadow-md` : "border border-slate-200 bg-white text-slate-500 hover:text-slate-700"}`}
                            >
                                <Icon size={15} />
                                {item.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-[#f6f7fb] p-4 md:p-6">
                {workspaceView === "create" && activePackage && (
                    <ContentStudioCreate
                        packageItem={activePackage}
                        messages={messages}
                        isBusy={isBusy}
                        ratio={ratio}
                        setRatio={setRatio}
                        activePlatform={activePlatform}
                        setActivePlatform={setActivePlatform}
                        promptDraft={promptDraft}
                        setPromptDraft={setPromptDraft}
                        onPromptSubmit={(message) => void handlePromptSubmit(undefined, message)}
                        onSelectDrafts={() => void changeWorkspaceView("drafts")}
                        onSavePackage={() => void savePackage()}
                        onExport={() => void exportPackage()}
                        onAddSlide={() => void addSlide()}
                        onDuplicateSlide={(slideId) => void duplicateSlide(slideId)}
                        onDeleteSlide={(slideId) => void deleteSlide(slideId)}
                        onRegenerateSlide={(slideId) => void regenerateSlide(slideId)}
                        onSourceFileUpload={(sourceType, file) => void ingestSource({ sourceType, file })}
                        sourceDraft={sourceDraft}
                        setSourceDraft={setSourceDraft}
                        showPasteSource={showPasteSource}
                        setShowPasteSource={setShowPasteSource}
                        onIngestPaste={() => void ingestSource({ sourceType: "PASTE", text: sourceDraft })}
                        onCaptionChange={handleCaptionChange}
                        onCaptionSave={(platform) => void handleCaptionSave(platform)}
                        onRegenerateCaption={(platform) => void handlePromptSubmit(`CAPTION:${platform}`, `Regenerate the ${PLATFORM_META[platform].name} caption so it is sharper, clinically specific, and aligned to the current carousel.`)}
                        onCopyCaption={(platform) => void copyCaption(platform)}
                        onQualityGate={() => void runQualityGate()}
                        onApprove={() => void approvePackage()}
                        onEditSlideField={(slideId, field, next) => void editSlideField(slideId, field, next)}
                        onTitleChange={(next) => void changeTitle(next)}
                        siteUrl={settings.brandJson.site_url}
                    />
                )}
                {workspaceView === "drafts" && <DraftsView packageItems={packages} activePackageId={activePackageId} onOpenDraft={(id) => { void openExistingPackage(id) }} onCreateNew={() => void createPackage()} />}
                {workspaceView === "library" && <LibraryView packageItems={packages} onUseTemplate={(id) => { void openExistingPackage(id) }} />}
                {workspaceView === "settings" && (
                    <SettingsView
                        settings={settings}
                        onAssetUpload={(assetKind, file) => void uploadBrandAsset(assetKind, file)}
                        setSettings={setSettings}
                        settingsTab={settingsTab}
                        setSettingsTab={setSettingsTab}
                        contextTab={contextTab}
                        setContextTab={setContextTab}
                        tone={tone}
                        setTone={setTone}
                        onSave={() => void saveSettings(settings)}
                        isSaving={isBusy}
                    />
                )}
            </div>
        </div>
        <StudioToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
        <StudioConfirmModal dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
        <StudioExportOverlay state={exportState} />
        </>
    )
}

function DraftsView({ packageItems, activePackageId, onOpenDraft, onCreateNew }: { packageItems: StudioPackageListItem[]; activePackageId: string | null; onOpenDraft: (id: string) => void; onCreateNew: () => void }) {
    const [search, setSearch] = useState("")
    const filteredItems = packageItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    const cards = filteredItems.map(toDraftCard)
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-[15px] font-extrabold text-[#041f50]">Drafts</h1>
                    <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">{cards.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-[11.5px] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                    </div>
                    <button onClick={onCreateNew} className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11.5px] font-bold text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <Plus size={10} />
                        New
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="inline-flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1">
                            <Segment active label="All" count={String(cards.length)} icon={GripVertical} />
                            <Segment label="Approve" count={String(cards.filter((card) => card.status === "ready").length)} icon={CheckCircle2} />
                            <Segment label="Generating" count={String(cards.filter((card) => card.status === "progress").length)} icon={RefreshCw} />
                            <Segment label="Draft" count={String(cards.filter((card) => card.status === "draft").length)} icon={Circle} />
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <button title="Grid view" aria-label="Grid view" className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#041f50]"><Grip size={11} /></button>
                            <button title="List view" aria-label="List view" className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100"><List size={11} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {cards.map((card) => (
                            <button key={card.id} onClick={() => onOpenDraft(card.id)} className={`overflow-hidden rounded-[18px] border bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_50px_-16px_rgba(175,92,233,0.22)] ${activePackageId === card.id ? "border-purple-300 shadow-[0_20px_44px_-18px_rgba(175,92,233,0.32)]" : "border-slate-200"}`}>
                                <DraftCardVisual card={card} />
                                <div className="p-4">
                                    <h3 className="mb-2 text-[13.5px] font-bold leading-snug text-[#041f50]">{card.title}</h3>
                                    <div className="mb-3.5 flex items-center justify-between text-[10.5px] text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            {card.status === "progress" ? <Sparkles size={9} className="text-purple-500" /> : <Images size={9} />}
                                            {card.slides}
                                        </span>
                                        {card.score ? <span className={`${card.status === "progress" ? "font-bold text-purple-500" : "flex items-center gap-1 text-emerald-600"}`}>{card.status === "progress" ? card.score : <><span className="text-[10px]">✦</span>{card.score}</>}</span> : null}
                                        {card.platforms.length > 0 ? (
                                            <div className="flex gap-1.5 text-slate-400">
                                                {card.platforms.map((Icon, index) => <Icon key={index} size={14} />)}
                                            </div>
                                        ) : <span />}
                                    </div>
                                    <div className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-[11.5px] font-bold transition ${card.status === "progress" ? "border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100" : card.status === "draft" ? "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-purple-600" : "border-slate-200 bg-slate-50 text-[#041f50] hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"}`}>
                                        {card.status === "progress" ? <Eye size={10} /> : card.status === "draft" ? <WandSparkles size={10} /> : <ArrowRight size={10} />}
                                        {card.button}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

function DraftCardVisual({ card }: { card: DraftCardItem }) {
    if (card.cover === "book") {
        return (
            <div className="relative h-40 overflow-hidden bg-[#041f50]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.5),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.22),transparent_55%)]" />
                <div className="absolute left-3 top-3 z-10"><PillBadge status={card.status} /></div>
                <div className="absolute right-3 top-3 z-10"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end gap-3">
                    <Image src="/1.png" alt="book" width={48} height={64} className="h-16 w-12 rounded object-cover ring-1 ring-white/20 shadow-[0_12px_24px_-6px_rgba(0,0,0,.5)]" />
                    <div className="flex-1 min-w-0">
                        <div className="line-clamp-2 bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)] bg-clip-text text-[20px] font-black leading-tight text-transparent">{card.stat ?? card.title}</div>
                        <p className="mt-1 text-[10px] leading-tight text-white/60">{card.note}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (card.cover === "progress") {
        return (
            <div className="relative h-40 overflow-hidden bg-[linear-gradient(135deg,#1a0f2e_0%,#2d0e3a_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(237,65,91,.2),transparent_65%)]" />
                <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                        <RefreshCw size={20} className="animate-spin text-purple-400" />
                    </div>
                    <div>
                        <p className="text-[12px] font-bold text-white">Generating</p>
                        <p className="mt-0.5 text-[10px] text-white/50">{card.note}</p>
                    </div>
                </div>
                <div className="absolute left-3 top-3 z-10"><PillBadge status={card.status} /></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5"><div className={`h-full w-[60%] ${GRADIENT_BG_CLASS}`} /></div>
            </div>
        )
    }

    if (card.cover === "empty") {
        return (
            <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300">
                        <WandSparkles size={18} className="text-slate-400" />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400">Empty draft</p>
                </div>
                <div className="absolute left-3 top-3"><PillBadge status={card.status} /></div>
            </div>
        )
    }

    return (
        <div className="relative h-40 overflow-hidden bg-[#041f50]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.4),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.3),transparent_55%)]" />
            <div className="absolute left-3 top-3 z-10"><PillBadge status={card.status} /></div>
            <div className="absolute right-3 top-3 z-10"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="text-center">
                    <Brain size={30} className="mx-auto mb-2 text-purple-400" />
                    <p className="line-clamp-2 px-6 text-[18px] font-black leading-tight text-white">{card.stat ?? card.title}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{card.slides}</p>
                </div>
            </div>
        </div>
    )
}

function LibraryView({ packageItems, onUseTemplate }: { packageItems: StudioPackageListItem[]; onUseTemplate: (id: string) => void }) {
    const [search, setSearch] = useState("")
    const approvedItems = packageItems
        .filter((item) => item.status === "APPROVED" || item.status === "READY" || item.status === "PUBLISHED")
        .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
        .sort((left, right) => (right.qualityScore ?? 0) - (left.qualityScore ?? 0))
    const featured = approvedItems.slice(0, 3).map(toLibraryCard)
    const remaining = approvedItems.slice(3)
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-[15px] font-extrabold text-[#041f50]">Library</h1>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{packageItems.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-[11.5px] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-500">Approved in Supabase: {approvedItems.length}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-8">
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Star size={12} className="text-amber-400" />
                                <h2 className="text-[13px] font-bold text-[#041f50]">Top Performers</h2>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">Highest quality scores first</span>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {featured.map((item) => (
                                <div key={item.title} className="overflow-hidden rounded-[18px] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-16px_rgba(175,92,233,0.22)]">
                                    <LibraryTopVisual item={item} />
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            {item.platforms.map((Icon, index) => <Icon key={index} size={14} />)}
                                        </div>
                                        <button onClick={() => onUseTemplate(packageItems.find((entry) => entry.title === item.title)?.id ?? packageItems[0]?.id ?? "")} className="flex items-center gap-1.5 text-[11px] font-bold text-purple-500 transition hover:text-pink-500">
                                            Use template
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center gap-2.5">
                            <Grip size={12} className="text-slate-400" />
                            <h2 className="text-[13px] font-bold text-[#041f50]">All Approved</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {remaining.map((item, index) => (
                                <button key={item.id} onClick={() => onUseTemplate(item.id)} className="overflow-hidden rounded-[14px] border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_24px_-12px_rgba(15,23,42,0.14)]">
                                    <div className={`flex h-24 items-center justify-center ${index % 2 === 0 ? "bg-[linear-gradient(135deg,#ed415b,#ec5185)]" : "bg-[#041f50]"}`}>
                                        {index % 2 === 0 ? <HeartPulse size={24} className="text-white" /> : <Moon size={24} className="text-purple-400" />}
                                    </div>
                                    <div className="p-3">
                                        <p className="truncate text-[11.5px] font-bold text-[#041f50]">{item.title}</p>
                                        <p className="mt-0.5 text-[9.5px] text-slate-400">{formatPackageMeta(item)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {approvedItems.length === 0 ? <p className="text-sm text-slate-500">No approved packages are stored in Supabase yet.</p> : null}
                    </section>
                </div>
            </main>
        </div>
    )
}

function LibraryTopVisual({ item }: { item: LibraryCardItem }) {
    if (item.variant === "book") {
        return (
            <div className="relative h-52 overflow-hidden bg-[#041f50]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.4),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.18),transparent_60%)]" />
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Image src="/1.png" alt="PAM Book" width={176} height={176} className="h-44 w-auto rounded object-contain ring-1 ring-white/15 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.55),0_8px_18px_rgba(175,92,233,0.4)]" />
                </div>
                <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md border border-white/5 bg-[#0a0e1f]/80 px-2 py-1 text-white">
                    <span className="text-[10px] font-bold">{item.score}</span>
                    <span className="text-[10px] text-purple-400">✦</span>
                </div>
                <div className="absolute right-3 top-3 z-20"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[13px] font-bold leading-tight text-white">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-white/55">{item.meta}</p>
                </div>
            </div>
        )
    }

    if (item.variant === "text") {
        return (
            <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#1a0f2e_0%,#0a0e1f_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(237,65,91,.4),transparent_55%)]" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <Brain size={24} />
                    </div>
                    <p className="max-w-[70%] text-center text-[11px] font-semibold leading-snug text-white/70">{item.title}</p>
                </div>
                <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md border border-white/5 bg-[#0a0e1f]/80 px-2 py-1 text-white">
                    <span className="text-[10px] font-bold">{item.score}</span>
                    <span className="text-[10px] text-pink-400">✦</span>
                </div>
                <div className="absolute right-3 top-3 z-20"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[13px] font-bold leading-tight text-white">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-white/55">{item.meta}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-52 overflow-hidden border-b border-slate-100 bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.08),transparent_60%)]" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                <div className="px-6 text-center text-[18px] font-black leading-tight text-[#041f50]">{item.title}</div>
                <p className="mt-2 px-6 text-center text-[11px] font-medium text-slate-500">{item.meta}</p>
            </div>
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md bg-[#041f50] px-2 py-1 text-white">
                <span className="text-[10px] font-bold">{item.score}</span>
                <span className="text-[10px] text-emerald-400">✦</span>
            </div>
            <div className="absolute right-3 top-3 z-20"><Image src="/logo.webp" alt="PAM" width={68} height={16} className="h-4 w-auto opacity-90" /></div>
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white/70 to-transparent p-4">
                <p className="text-[13px] font-bold leading-tight text-[#041f50]">{item.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{item.meta}</p>
            </div>
        </div>
    )
}

function SettingsView({
    settings,
    onAssetUpload,
    setSettings,
    settingsTab,
    setSettingsTab,
    contextTab,
    setContextTab,
    tone,
    setTone,
    onSave,
    isSaving,
}: {
    settings: StudioSettings
    onAssetUpload: (assetKind: "logo" | "book" | "alt", file: File) => void
    setSettings: (settings: StudioSettings) => void
    settingsTab: SettingsTab
    setSettingsTab: (tab: SettingsTab) => void
    contextTab: ContextTab
    setContextTab: (tab: ContextTab) => void
    tone: string
    setTone: (tone: string) => void
    onSave: () => void
    isSaving: boolean
}) {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-3 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <h1 className="text-[15px] font-extrabold text-[#041f50]">Studio Settings</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Updated {new Date(settings.updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <button onClick={onSave} disabled={isSaving} className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <PencilRuler size={10} />
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200/70 bg-slate-50/50 px-3 py-3 lg:w-52 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
                    {SETTINGS_TABS.map((item) => {
                        const Icon = item.icon
                        const active = settingsTab === item.key
                        return (
                            <button key={item.key} onClick={() => setSettingsTab(item.key)} className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[12px] font-semibold transition ${active ? "bg-white text-slate-900 shadow-[0_4px_14px_-4px_rgba(15,23,42,.08)]" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}>
                                <Icon size={13} className={active ? "text-purple-500" : "text-slate-400"} />
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                <div className="flex-1 overflow-y-auto bg-[#f6f7fb] p-5 md:p-8">
                    <div className="mx-auto max-w-3xl space-y-5">
                        {settingsTab === "brand" && (
                            <>
                                <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
                                    <CircleHelp size={12} className="text-purple-500" />
                                    <p className="text-[12.5px] leading-snug text-slate-600">Injected into every generation.</p>
                                </div>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><Bookmark size={11} className="text-purple-500" />Identity</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Field label="Brand" value={settings.brandJson.brand_name} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, brand_name: value } })} />
                                        <Field label="Site URL" value={settings.brandJson.site_url} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, site_url: value } })} />
                                        <Field label="Product URL" value={settings.brandJson.product_url} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, product_url: value } })} />
                                        <Field label="Audience" value={settings.brandJson.audience} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, audience: value } })} />
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><ImagePlus size={11} className="text-purple-500" />Visual Assets</h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <AssetTile label="Logo" path={settings.brandJson.logo_path} previewSrc={settings.brandJson.logo_url || "/logo.webp"} onUpload={(file) => onAssetUpload("logo", file)} />
                                        <AssetTile label="Book cover" path={settings.brandJson.book_path} previewSrc={settings.brandJson.book_url || "/1.png"} onUpload={(file) => onAssetUpload("book", file)} />
                                        <AssetTile label="Alt asset" path={settings.brandJson.alt_path ?? "Not configured"} previewSrc={settings.brandJson.alt_url || undefined} onUpload={(file) => onAssetUpload("alt", file)} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>Logo · Book cover · Optional secondary</span>
                                        <span>PNG · WebP · SVG</span>
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><Palette size={11} className="text-purple-500" />Palette</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {settings.brandJson.palette.map((color) => (
                                            <div key={color} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-3 p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><MessageCircleMore size={11} className="text-purple-500" />Studio Context</h3>
                                        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-[3px]">
                                            <button onClick={() => setContextTab("always")} className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition ${contextTab === "always" ? "bg-[#0a0e1f] text-white" : "text-slate-500"}`}>Always say</button>
                                            <button onClick={() => setContextTab("never")} className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition ${contextTab === "never" ? "bg-[#0a0e1f] text-white" : "text-slate-500"}`}>Never say</button>
                                        </div>
                                    </div>
                                    {contextTab === "always" ? (
                                        <textarea title="Always say" value={settings.alwaysSay ?? ""} onChange={(event) => setSettings({ ...settings, alwaysSay: event.target.value })} className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                                    ) : (
                                        <textarea title="Never say" value={settings.neverSay ?? ""} onChange={(event) => setSettings({ ...settings, neverSay: event.target.value })} className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                                    )}
                                </SurfaceCard>
                            </>
                        )}
                        {settingsTab === "voice" && (
                            <>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="text-[13px] font-bold text-[#041f50]">Tone</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {TONE_CARDS.map((card) => {
                                            const active = tone === card.title
                                            return (
                                                <button key={card.title} onClick={() => { setTone(card.title); setSettings({ ...settings, tone: card.title.toUpperCase().replace(/\s+/g, "_") }) }} className={`rounded-[14px] border px-4 py-4 text-left transition ${active ? "border-purple-300 bg-[linear-gradient(135deg,rgba(175,92,233,.06),rgba(237,65,91,.04))]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                        <span className={`text-[12.5px] font-bold ${active ? "text-purple-700" : "text-[#041f50]"}`}>{card.title}</span>
                                                        {active ? <CheckCircle2 size={12} className="text-purple-500" /> : <Circle size={12} className="text-slate-300" />}
                                                    </div>
                                                    <p className="text-[11px] leading-snug text-slate-500">{card.note}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="text-[13px] font-bold text-[#041f50]">Hook & Hashtags</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Field label="Hook style" value={settings.hookStyle} asSelect options={HOOK_STYLE_OPTIONS} onChange={(value) => setSettings({ ...settings, hookStyle: value })} />
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Hashtag cluster</label>
                                            <input title="Hashtag cluster" value={settings.hashtagCluster} onChange={(event) => setSettings({ ...settings, hashtagCluster: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                                        </div>
                                    </div>
                                </SurfaceCard>
                            </>
                        )}
                        {settingsTab === "cta" && (
                            <SurfaceCard className="space-y-3 p-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-bold text-[#041f50]">CTA Presets</h3>
                                    <span className="text-[10px] font-semibold text-slate-400">Drag to reorder</span>
                                </div>
                                {settings.ctaPresets.map((item, index) => (
                                    <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-purple-300">
                                        <GripVertical size={14} className="cursor-grab text-slate-300" />
                                        <input title="CTA preset" value={item} onChange={(event) => setSettings({ ...settings, ctaPresets: settings.ctaPresets.map((preset, presetIndex) => presetIndex === index ? event.target.value : preset) })} className="flex-1 bg-transparent text-[12.5px] font-semibold text-[#041f50] outline-none" />
                                        <button title="Pin CTA preset" aria-label="Pin CTA preset" className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${index === 0 ? "bg-amber-50 text-amber-600" : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"}`}>
                                            <Bookmark size={10} />
                                        </button>
                                        <button onClick={() => setSettings({ ...settings, ctaPresets: settings.ctaPresets.filter((_, presetIndex) => presetIndex !== index) })} title="Remove CTA preset" aria-label="Remove CTA preset" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500">
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setSettings({ ...settings, ctaPresets: [...settings.ctaPresets, "New CTA preset"] })} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-200 py-2.5 text-[11.5px] font-bold text-purple-600 transition hover:border-purple-400 hover:bg-purple-50">
                                    <Plus size={10} />
                                    Add preset
                                </button>
                            </SurfaceCard>
                        )}
                        {settingsTab === "platform" && (
                            <SurfaceCard className="space-y-4 p-5">
                                <div>
                                    <h3 className="text-[13px] font-bold text-[#041f50]">Manual Distribution</h3>
                                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Carousel Studio does not store social tokens or auto-post. Export the PNG bundle, copy each platform caption, then schedule manually in the platform or scheduler you already trust.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {(Object.keys(PLATFORM_META) as PlatformKey[]).map((platformKey) => {
                                        const meta = PLATFORM_META[platformKey]
                                        return (
                                            <DistributionCard
                                                key={platformKey}
                                                name={meta.name}
                                                detail={meta.spec}
                                                icon={meta.icon}
                                                bgClass={meta.swatchClass}
                                            />
                                        )
                                    })}
                                </div>
                            </SurfaceCard>
                        )}
                        {settingsTab === "quality" && (
                            <SurfaceCard className="space-y-5 p-5">
                                <h3 className="text-[13px] font-bold text-[#041f50]">Quality & Defaults</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Gate Threshold</label>
                                        <span className="text-[12px] font-bold text-purple-600">{settings.gateThreshold.toFixed(1)} / 5</span>
                                    </div>
                                    <input title="Gate threshold" type="range" min="1" max="5" step="0.5" value={settings.gateThreshold} onChange={(event) => setSettings({ ...settings, gateThreshold: Number(event.target.value) })} className="w-full accent-purple-500" />
                                    <p className="text-[10px] text-slate-400">Min 4 of 5 questions must score ≥ this</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Default slides per carousel</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {["3", "4", "5", "6", "7", "8", "10", "12"].map((option) => (
                                            <button key={option} onClick={() => setSettings({ ...settings, defaultSlides: Number(option) })} className={`min-w-12 flex-1 rounded-lg py-2 text-[12px] font-bold ${Number(option) === settings.defaultSlides ? `${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS} text-white` : "border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-purple-300"}`}>{option}</button>
                                        ))}
                                    </div>
                                </div>
                            </SurfaceCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Segment({ active = false, label, count, icon: Icon }: { active?: boolean; label: string; count: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
    return (
        <button className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition ${active ? "bg-[#0a0e1f] text-white" : "text-slate-500 hover:text-slate-900"}`}>
            <Icon size={10} className={active ? "text-white" : ""} />
            {label}
            <span className="opacity-60">{count}</span>
        </button>
    )
}

function Field({ label, value, asSelect = false, options, onChange }: { label: string; value: string; asSelect?: boolean; options?: string[]; onChange?: (value: string) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            {asSelect ? (
                <select title={label} value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] font-semibold text-[#041f50] outline-none focus:border-purple-400">
                    {(options ?? [value]).map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : (
                <input title={label} value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] font-semibold text-[#041f50] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
            )}
        </div>
    )
}

function AssetTile({ label, path, previewSrc, onUpload }: { label: string; path: string; previewSrc?: string; onUpload: (file: File) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    return (
        <div className="group relative flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-center transition hover:border-purple-300">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" title={`${label} upload`} onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                    onUpload(file)
                    event.target.value = ""
                }
            }} />
            <button title={`${label} upload`} onClick={() => inputRef.current?.click()} className="absolute inset-0 rounded-xl" />
            {previewSrc ? <Image src={previewSrc} alt={label} width={112} height={56} className="h-14 w-auto object-contain" /> : <ImagePlus size={20} className="text-slate-300" />}
            <p className="text-[10px] font-semibold text-[#041f50]">{label}</p>
            <p className="line-clamp-2 text-[9px] text-slate-400">{path}</p>
            <span className="absolute right-2 top-2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-purple-600 opacity-0 transition group-hover:opacity-100">Upload</span>
        </div>
    )
}

function DistributionCard({ name, detail, icon: Icon, bgClass }: { name: string; detail: string; icon: React.ComponentType<{ size?: number; className?: string }>; bgClass: string }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-purple-300">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${bgClass}`}>
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-[#041f50]">{name}</p>
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    {detail}
                </p>
            </div>
            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-600">Copy ready</span>
        </div>
    )
}

function ChatBubble({ user = false, assistant = false, text, highlight }: { user?: boolean; assistant?: boolean; text: string; highlight?: string }) {
    return (
        <div className={`flex gap-2 ${assistant ? "flex-row-reverse" : ""}`}>
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${user ? "bg-slate-100 text-slate-500" : `text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}`}>
                {user ? <Circle size={9} /> : <WandSparkles size={9} />}
            </div>
            <div className={`max-w-[88%] rounded-2xl px-3 py-2 leading-snug ${assistant ? "rounded-tr-sm bg-[#041f50] text-white" : "rounded-tl-sm border border-slate-200/70 bg-slate-50 text-slate-700"}`}>
                {highlight ? text.split(highlight).map((part, index, arr) => (
                    <span key={`${part}-${index}`}>
                        {part}
                        {index < arr.length - 1 ? <span className="font-bold text-transparent bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)] bg-clip-text">{highlight}</span> : null}
                    </span>
                )) : text}
            </div>
        </div>
    )
}

function ComposerChip({ icon: Icon, tone, title, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; tone: "red" | "emerald" | "blue"; title: string; onClick?: () => void }) {
    const tones = {
        red: "hover:text-red-500",
        emerald: "hover:text-emerald-600",
        blue: "hover:text-blue-500",
    }
    return (
        <button onClick={onClick} title={title} aria-label={title} className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 ${tones[tone]}`}>
            <Icon size={12} />
        </button>
    )
}

function DockButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; onClick?: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11.5px] font-semibold text-slate-700 transition hover:bg-slate-100">
            <Icon size={11} />
            {label}
        </button>
    )
}

export function CarouselStudioPanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <StudioWorkspace
                initialView="create"
                eyebrow="Carousel Studio"
                title="Carousel Studio"
                description="Build the carousel directly from the prototype: prompt on the left, live canvas in the center, and platform captions on the right, with sharp multi-ratio previews."
            />
        </motion.div>
    )
}

