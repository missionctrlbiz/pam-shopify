"use client"

import Image from "next/image"
import { useRef, useEffect, useState, Component, type ComponentProps, type ReactNode } from "react"
import {
    ArrowRight,
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
    HeartPulse,
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
    RefreshCw,
    Search,
    Settings2,
    ShieldCheck,
    Sparkles,
    Star,
    TableProperties,
    WandSparkles,
    X,
    Zap,
    Bookmark,
    CircleHelp,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    ZoomIn,
    ZoomOut,
    type LucideIcon,
} from "lucide-react"
import type { StudioSlideRenderSpec } from "@/lib/studio/shared"
import type { StudioToast } from "@/lib/studio/feedback"
import type { StudioRatio, StudioSlideKind, StudioSlideLayout, StudioSlideBackground } from "@/lib/studio/types"

export { Instagram, Facebook, Linkedin } from "lucide-react"

export type PlatformKey = "instagram" | "facebook" | "linkedin" | "tiktok"
export type SettingsTab = "brand" | "voice" | "cta" | "platform" | "quality"
export type ContextTab = "always" | "never"
export type DraftStatus = "ready" | "progress" | "draft"

export type PlatformMeta = {
    name: string
    spec: string
    swatchClass: string
    icon: React.ComponentType<{ size?: number; className?: string }>
}

export type StudioConfirmDialogState = {
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    tone?: "default" | "danger"
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
}

export type StudioExportState = {
    title: string
    detail: string
}

export type StudioExportCanvasSnapshot = {
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

export type DraftCardItem = {
    id: string
    title: string
    status: DraftStatus
    slides: string
    score: string
    platforms: Array<React.ComponentType<{ size?: number; className?: string }>>
    cover: "book" | "progress" | "empty" | "text"
    stat?: string
    note: string
    button: string
}

export type LibraryCardItem = {
    title: string
    meta: string
    score: string
    platforms: Array<React.ComponentType<{ size?: number; className?: string }>>
    variant: "book" | "text" | "stat"
}

export const GRADIENT_BG_CLASS = "bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]"
export const GRADIENT_SHADOW_CLASS = "shadow-[0_12px_32px_-8px_rgba(175,92,233,.45),0_2px_8px_rgba(237,65,91,.18)]"
export const SLIDE_BORDER_CLASS = "bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)]"

export function Music2Icon(props: ComponentProps<typeof Zap>) {
    return <Zap {...props} />
}

export function PillBadge({ status }: { status: DraftStatus }) {
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

export function SurfaceCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-[20px] border border-slate-200 bg-white ${className}`}>{children}</div>
}

export function EditableText({
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
                const next = (event.currentTarget.textContent ?? "").replace(/\u200B/g, "")
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

export function IconChip({
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

export function SlideOverlay({ top, bottom, dark = false, label, children }: { top?: boolean; bottom?: boolean; dark?: boolean; label: string; children: React.ReactNode }) {
    return (
        <div className={`absolute left-0 right-0 z-20 flex items-center justify-between px-[18px] ${top ? "top-0 pt-[14px]" : ""} ${bottom ? "bottom-0 pb-[14px]" : ""}`}>
            <span className={`rounded-md px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.22em] ${dark ? "border border-white/10 bg-white/10 text-white/80" : "text-purple-500"}`}>
                {label}
            </span>
            {children}
        </div>
    )
}

export function StudioToastStack({ toasts, onDismiss }: { toasts: StudioToast[]; onDismiss: (id: string) => void }) {
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

export function StudioConfirmModal({ dialog, onClose }: { dialog: StudioConfirmDialogState | null; onClose: () => void }) {
    if (!dialog) return null
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#041f50]/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[24px] border border-white/70 bg-white p-6 text-center shadow-[0_24px_80px_-24px_rgba(15,23,42,.55)]">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${dialog.tone === "danger" ? "bg-rose-500" : GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                    {dialog.tone === "danger" ? <X size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <h2 className="text-[16px] font-black tracking-tight text-[#041f50]">{dialog.title}</h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{dialog.message}</p>
                <div className="mt-5 flex gap-3">
                    {dialog.cancelLabel ? (
                        <button onClick={() => { dialog.onCancel?.(); onClose() }} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            {dialog.cancelLabel}
                        </button>
                    ) : null}
                    <button onClick={() => { void dialog.onConfirm(); onClose() }} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95 ${dialog.tone === "danger" ? "bg-rose-500" : GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        {dialog.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function StudioExportOverlay({ state }: { state: StudioExportState | null }) {
    if (!state) return null

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

export function DockButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; onClick?: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11.5px] font-semibold text-slate-700 transition hover:bg-slate-100">
            <Icon size={11} />
            {label}
        </button>
    )
}

export function Segment({ active = false, label, count, icon: Icon }: { active?: boolean; label: string; count: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
    return (
        <button className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition ${active ? "bg-[#0a0e1f] text-white" : "text-slate-500 hover:text-slate-900"}`}>
            <Icon size={10} className={active ? "text-white" : ""} />
            {label}
            <span className="opacity-60">{count}</span>
        </button>
    )
}

export function Field({ label, value, asSelect = false, options, onChange }: { label: string; value: string; asSelect?: boolean; options?: string[]; onChange?: (value: string) => void }) {
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

export function AssetTile({ label, path, previewSrc, onUpload }: { label: string; path: string; previewSrc?: string; onUpload: (file: File) => void }) {
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

export function DistributionCard({ name, detail, icon: Icon, bgClass }: { name: string; detail: string; icon: React.ComponentType<{ size?: number; className?: string }>; bgClass: string }) {
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

export function ChatBubble({ user = false, assistant = false, text, highlight }: { user?: boolean; assistant?: boolean; text: string; highlight?: string }) {
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

export function ComposerChip({ icon: Icon, tone, title, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; tone: "red" | "emerald" | "blue"; title: string; onClick?: () => void }) {
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

export function ErrorBoundaryFallback({ message }: { message?: string }) {
    return (
        <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-rose-100 bg-rose-50 px-6 text-sm font-semibold text-rose-600 shadow-xl shadow-slate-200/40">
            <div className="text-center">
                <p>Something went wrong rendering this view.</p>
                {message ? <p className="mt-2 text-xs text-rose-400">{message}</p> : null}
                <button onClick={() => window.location.reload()} className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100">Reload</button>
            </div>
        </div>
    )
}

export class StudioErrorBoundary extends Component<{ children: ReactNode; viewName: string }, { hasError: boolean; errorMessage: string }> {
    constructor(props: { children: ReactNode; viewName: string }) {
        super(props)
        this.state = { hasError: false, errorMessage: "" }
    }

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, errorMessage: error instanceof Error ? error.message : "Unknown render error" }
    }

    componentDidCatch(error: unknown, info: unknown) {
        console.error(`[StudioErrorBoundary] ${this.props.viewName} crashed:`, error, info)
    }

    render() {
        if (this.state.hasError) {
            return <ErrorBoundaryFallback message={`${this.props.viewName}: ${this.state.errorMessage}`} />
        }
        return this.props.children
    }
}

export { type Component, type ReactNode }
export { type LucideIcon }
