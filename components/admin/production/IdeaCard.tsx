"use client"

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronDown, ChevronUp, Copy, Check, Loader2,
    Mic, Music, Wand2, Eye, EyeOff,
} from "lucide-react"
import type { CalendarEntryRow, CalendarEntryDetail, Platform } from "./types"
import type {
    ContentIdeaMasterJson,
    PAMScene,
    PlatformPromptBank,
} from "@/lib/production/contentStrategist"

// ─── Brand constants — kept in sync with ProductionPanel.tsx ─────────────────
const BRAND = {
    red: "#ed415b",
    pink: "#ec5185",
    purple: "#af5ce9",
    navy: "#041f50",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
    gradientSoft:
        "linear-gradient(135deg, rgba(237,65,91,0.1), rgba(236,81,133,0.1), rgba(175,92,233,0.1))",
    glow: "0 8px 24px rgba(175, 92, 233, 0.25)",
}

// Scene timing strip colors
const SCENE_COLOR: Record<string, string> = {
    COVER: BRAND.navy,
    TEACHING: "#3B82F6", // clinical blue
    CTA: BRAND.purple,   // brand purple — not red
}

const PLATFORM_LABEL: Record<string, string> = {
    IG: "IG",
    FB: "FB",
    TIKTOK: "TikTok",
    LINKEDIN: "LinkedIn",
    EMAIL: "Email",
    VIDEO: "Video",
}

const POST_TYPE_LABEL: Record<string, string> = {
    CAROUSEL: "Carousel",
    TEXT_POST: "Text Post",
    EMAIL_LESSON: "Email",
}

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending",
    APPROVED: "Approved",
    GENERATING: "Rendering",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
}

// ElevenLabs voice options
const VOICES = [
    { id: "vCJ255LXSScOjTI93arO", label: "Female (Pro)", desc: "Female · Default" },
    { id: "GOTYSPXtooRVmkiNYcw0", label: "Male (Pro)", desc: "Male · Custom Voice" },
]

// Background music options
const MUSIC_OPTIONS = [
    { id: "off", label: "Off" },
    { id: "ambient", label: "Soft Ambient", path: "/audio/ambient-clinical.mp3" },
    { id: "pulse", label: "Clinical Pulse", path: "/audio/clinical-pulse.mp3" },
]

// Generate scope options
const SCOPES = ["Primary", "Carousel", "Repurpose", "All"]

// ─── Gesture cue highlighter ──────────────────────────────────────────────────
function HighlightedVoiceover({ text }: { text: string }) {
    const parts = text.split(/(\[pause\]|\[breath\]|\[emphasize:[^\]]+\])/g)
    return (
        <p className="text-xs text-slate-600 leading-relaxed font-mono">
            {parts.map((part, i) => {
                if (part === "[pause]")
                    return (
                        <span key={i} className="mx-0.5 px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: "#fef9c3", color: "#854d0e" }}>
                            ⏸ pause
                        </span>
                    )
                if (part === "[breath]")
                    return (
                        <span key={i} className="mx-0.5 px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: "#dcfce7", color: "#166534" }}>
                            🌬 breath
                        </span>
                    )
                if (part.startsWith("[emphasize:"))
                    return (
                        <span key={i} className="mx-0.5 px-1 py-0.5 rounded text-[10px] font-bold" style={{ background: "#ede9fe", color: "#4c1d95" }}>
                            ★ {part.slice(11, -1)}
                        </span>
                    )
                return <span key={i}>{part}</span>
            })}
        </p>
    )
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = useCallback(() => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [text])
    return (
        <button
            onClick={copy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: copied ? "#dcfce7" : `${BRAND.purple}22`, color: copied ? "#166534" : BRAND.purple }}
        >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
        </button>
    )
}

// ─── Scene timing strip ───────────────────────────────────────────────────────
function TimingStrip({ scenes }: { scenes: PAMScene[] }) {
    const total = scenes.reduce((s, sc) => s + sc.durationSecs, 0)
    return (
        <div className="flex gap-0.5 rounded-lg overflow-hidden h-4" style={{ minWidth: 0 }}>
            {scenes.map((sc, i) => (
                <div
                    key={i}
                    title={`${sc.type} · ${sc.durationSecs}s`}
                    style={{
                        flexBasis: `${(sc.durationSecs / total) * 100}%`,
                        background: SCENE_COLOR[sc.type] ?? BRAND.purple,
                    }}
                    className="flex items-center justify-center text-[9px] text-white font-bold"
                >
                    {sc.durationSecs}s
                </div>
            ))}
        </div>
    )
}

// ─── Platform prompt accordion section ───────────────────────────────────────
function PlatformAccordion({ platform, bank }: { platform: string; bank: PlatformPromptBank }) {
    const [open, setOpen] = useState(false)

    let content: React.ReactNode = null
    if (platform === "IG_CAROUSEL" && bank.IG_CAROUSEL) {
        const p = bank.IG_CAROUSEL
        content = (
            <div className="space-y-2">
                <div className="flex items-start gap-2 justify-between">
                    <p className="text-xs font-semibold text-slate-700">Caption Hook</p>
                    <CopyButton text={p.captionHook} />
                </div>
                <p className="text-xs text-slate-600">{p.captionHook}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">Canva Slide Prompts</p>
                <div className="space-y-1">
                    {p.canvaSlidePrompts.map((sp, i) => (
                        <div key={i} className="flex items-start gap-2 justify-between p-2 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600 flex-1">
                                <span className="font-bold text-slate-400 mr-1">S{i + 1}</span>
                                {sp}
                            </p>
                            <CopyButton text={sp} />
                        </div>
                    ))}
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-2">Hashtags</p>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500 flex-1">{p.hashtagSet.join(" ")}</p>
                    <CopyButton text={p.hashtagSet.join(" ")} />
                </div>
            </div>
        )
    } else if (platform === "TIKTOK_VIDEO" && bank.TIKTOK_VIDEO) {
        const p = bank.TIKTOK_VIDEO
        content = (
            <div className="space-y-2">
                <div className="flex items-start gap-2 justify-between">
                    <p className="text-xs font-semibold text-slate-700">Spoken Script</p>
                    <CopyButton text={p.spokenScript} />
                </div>
                <p className="text-xs text-slate-600">{p.spokenScript}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">Sound Suggestion</p>
                <p className="text-xs text-slate-500 italic">{p.soundSuggestion}</p>
            </div>
        )
    } else if (platform === "LINKEDIN" && bank.LINKEDIN) {
        const p = bank.LINKEDIN
        content = (
            <div className="space-y-2">
                <div className="flex items-start gap-2 justify-between">
                    <p className="text-xs font-semibold text-slate-700">Full Post</p>
                    <CopyButton text={p.professionalPost} />
                </div>
                <p className="text-xs text-slate-600">{p.professionalPost}</p>
            </div>
        )
    } else if (platform === "EMAIL" && bank.EMAIL) {
        const p = bank.EMAIL
        content = (
            <div className="space-y-2">
                <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs font-semibold text-slate-700">Subject Line</p>
                    <CopyButton text={p.subjectLine} />
                </div>
                <p className="text-xs text-slate-600">{p.subjectLine}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">Body Outline</p>
                {p.bodyThreeParagraphs.map((para, i) => (
                    <div key={i} className="flex items-start gap-2 justify-between p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-600 flex-1">{para}</p>
                        <CopyButton text={para} />
                    </div>
                ))}
            </div>
        )
    } else if (platform === "VIDEO" && bank.VIDEO) {
        const p = bank.VIDEO
        content = (
            <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Thumbnail Concept</p>
                <div className="flex items-start gap-2 justify-between">
                    <p className="text-xs text-slate-600 flex-1">{p.thumbnailConceptPrompt}</p>
                    <CopyButton text={p.thumbnailConceptPrompt} />
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-2">SEO Description</p>
                <div className="flex items-start gap-2 justify-between">
                    <p className="text-xs text-slate-600 flex-1">{p.descriptionSEO}</p>
                    <CopyButton text={p.descriptionSEO} />
                </div>
            </div>
        )
    }

    return (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <span className="text-xs font-bold text-slate-700">{platform.replace("_", " ")}</span>
                {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 py-3 overflow-hidden"
                    >
                        {content ?? <p className="text-xs text-slate-400 italic">No data for this platform yet.</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Main IdeaCard ────────────────────────────────────────────────────────────

interface IdeaCardProps {
    entry: CalendarEntryRow
    onRefresh?: () => void
}

export function IdeaCard({ entry, onRefresh }: IdeaCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [detail, setDetail] = useState<CalendarEntryDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [expandingScenes, setExpandingScenes] = useState(false)
    const [showVoiceover, setShowVoiceover] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

    // Controls
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id)
    const [selectedMusic, setSelectedMusic] = useState(MUSIC_OPTIONS[0].id)
    const [selectedScope, setSelectedScope] = useState(SCOPES[0])
    const [generating, setGenerating] = useState(false)

    const masterJson = detail?.contentIdea?.masterJson as ContentIdeaMasterJson | null | undefined
    const scenes = masterJson?.scenes
    const voiceoverFull = masterJson?.voiceoverFull
    const platformPromptBank = masterJson?.platformPromptBank
    const totalDuration = masterJson?.totalDurationSecs

    // ── Fetch detail on expand ───────────────────────────────────────────────
    const handleExpand = useCallback(async () => {
        setExpanded((e) => !e)
        if (detail || loadingDetail) return
        setLoadingDetail(true)
        try {
            const res = await fetch(`/api/production/calendar/${entry.id}`)
            const data = await res.json()
            setDetail(data.entry ?? null)
        } catch {
            // silent
        } finally {
            setLoadingDetail(false)
        }
    }, [detail, entry.id, loadingDetail])

    // ── Expand scenes ────────────────────────────────────────────────────────
    const handleExpandScenes = useCallback(async () => {
        setExpandingScenes(true)
        try {
            const res = await fetch(`/api/production/calendar/${entry.id}/scenes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: entry.platform,
                    postType: entry.postType,
                }),
            })
            const data = await res.json()
            // Refresh detail to get updated masterJson
            const detailRes = await fetch(`/api/production/calendar/${entry.id}`)
            const detailData = await detailRes.json()
            setDetail(detailData.entry ?? null)
            if (data.cached) {
                // already had scenes
            }
        } catch {
            // silent
        } finally {
            setExpandingScenes(false)
        }
    }, [entry.id, entry.platform, entry.postType])

    // ── Generate assets ───────────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        if (!entry.contentIdea?.id) return
        setGenerating(true)
        try {
            const res = await fetch("/api/production/assets/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentIdeaId: entry.contentIdea.id,
                    scope: selectedScope.toUpperCase(),
                    voiceId: selectedVoice,
                    backgroundMusic: selectedMusic !== "off" ? selectedMusic : null,
                }),
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                const detail = errData.error || errData.detail || res.statusText
                setToast({ msg: `Generate failed: ${detail}`, type: "err" })
            } else {
                setToast({ msg: `Successfully queued ${selectedScope} generation!`, type: "ok" })
                onRefresh?.()
            }
            setTimeout(() => setToast(null), 4000)
        } catch (err) {
            setToast({ msg: "Failed to queue generation. Network error.", type: "err" })
            setTimeout(() => setToast(null), 4000)
        } finally {
            setGenerating(false)
        }
    }, [entry.id, onRefresh, selectedMusic, selectedScope, selectedVoice])

    // ── Status pill color ────────────────────────────────────────────────────
    const statusColor: Record<string, string> = {
        DRAFT: "#6B7280",
        PENDING_APPROVAL: "#F59E0B",
        APPROVED: "#10B981",
        GENERATING: "#3B82F6",
        SCHEDULED: "#8B5CF6",
        PUBLISHED: "#059669",
        ARCHIVED: "#9CA3AF",
    }

    return (
        <React.Fragment>
            {/* ── Floating Toast (Top Center) ──────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full shadow-2xl z-[100] flex items-center gap-2"
                        style={{
                            background: toast.type === "ok" ? "#10B981" : "#EF4444",
                            color: "white"
                        }}
                    >
                        {toast.type === "ok" ? <Check size={16} /> : <Loader2 size={16} />}
                        <span className="text-sm font-bold tracking-wide">{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative"
            >
                {/* ── Header bar with gradient accent ────────────────────────── */}
                <div className="h-1.5 w-full" style={{ background: BRAND.gradient }} />

                {/* ── Card header ─────────────────────────────────────────────── */}
                <div className="p-4">
                    {/* Badge row */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {/* Day number */}
                        <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ background: BRAND.navy }}
                        >
                            Day {entry.dayNumber}
                        </span>
                        {/* Platform */}
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${BRAND.purple}22`, color: BRAND.purple }}
                        >
                            {PLATFORM_LABEL[entry.platform] ?? entry.platform}
                        </span>
                        {/* Post type */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {POST_TYPE_LABEL[entry.postType] ?? entry.postType.replace(/_/g, " ")}
                        </span>
                        {/* Status */}
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: statusColor[entry.publishStatus] ?? "#6B7280" }}
                        >
                            {STATUS_LABEL[entry.publishStatus] ?? entry.publishStatus.replace(/_/g, " ")}
                        </span>
                    </div>

                    {/* Hook / topic */}
                    <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-1">
                        {entry.contentIdea?.hook ?? entry.topic ?? "—"}
                    </p>
                    {entry.contentGoal && (
                        <p className="text-xs text-slate-400 line-clamp-1">{entry.contentGoal}</p>
                    )}

                    {/* Scene count pill + timing strip (if scenes available) */}
                    {scenes && scenes.length > 0 && (
                        <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: BRAND.gradientSoft, color: BRAND.purple }}
                                >
                                    {scenes.length} scenes · {totalDuration}s
                                </span>
                            </div>
                            <TimingStrip scenes={scenes} />
                        </div>
                    )}

                    {/* Expand / collapse button */}
                    <button
                        onClick={handleExpand}
                        className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: BRAND.gradientSoft, color: BRAND.navy }}
                    >
                        <span>{expanded ? "Collapse" : "View full idea"}</span>
                        {loadingDetail ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : expanded ? (
                            <ChevronUp size={13} />
                        ) : (
                            <ChevronDown size={13} />
                        )}
                    </button>
                </div>

                {/* ── Expanded detail ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">

                                {/* Teaching points */}
                                {detail?.contentIdea && masterJson?.teachingPoints && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teaching Points</p>
                                        <ol className="space-y-1">
                                            {masterJson.teachingPoints.map((tp, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                                    <span className="font-black text-slate-300 mt-0.5">{i + 1}.</span>
                                                    <span>{tp}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {/* Voiceover preview */}
                                {voiceoverFull && (
                                    <div>
                                        <button
                                            onClick={() => setShowVoiceover((v) => !v)}
                                            className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:opacity-70 transition-opacity"
                                        >
                                            {showVoiceover ? <EyeOff size={12} /> : <Eye size={12} />}
                                            Voiceover Script
                                        </button>
                                        {showVoiceover && (
                                            <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                                                <HighlightedVoiceover text={voiceoverFull} />
                                                <div className="flex justify-end mt-2">
                                                    <CopyButton text={voiceoverFull} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Platform prompt bank accordion */}
                                {platformPromptBank && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platform Prompts</p>
                                        <div className="space-y-1.5">
                                            {(Object.keys(platformPromptBank) as (keyof PlatformPromptBank)[]).map((key) => (
                                                <PlatformAccordion key={key} platform={key} bank={platformPromptBank} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Scene expansion */}
                                {(!scenes || scenes.length === 0) && (
                                    <button
                                        onClick={handleExpandScenes}
                                        disabled={expandingScenes}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                                        style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                                    >
                                        {expandingScenes ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" />
                                                Generating scenes…
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={13} />
                                                Expand Scenes via AI
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Voice + Music + Generate controls */}
                                <div className="border-t border-slate-100 pt-3 space-y-3">
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Voice selector */}
                                        <div className="flex-1 min-w-[120px]">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Mic size={10} /> Voice
                                            </p>
                                            <div className="flex gap-1">
                                                {VOICES.map((v) => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setSelectedVoice(v.id)}
                                                        className="flex-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                                        style={
                                                            selectedVoice === v.id
                                                                ? { background: BRAND.gradient, color: "#fff" }
                                                                : { background: "#f1f5f9", color: "#6B7280" }
                                                        }
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Music selector */}
                                        <div className="flex-1 min-w-[140px]">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Music size={10} /> Music
                                            </p>
                                            <div className="flex gap-1 flex-wrap">
                                                {MUSIC_OPTIONS.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => setSelectedMusic(m.id)}
                                                        className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                                        style={
                                                            selectedMusic === m.id
                                                                ? { background: `${BRAND.purple}22`, color: BRAND.purple, border: `1px solid ${BRAND.purple}44` }
                                                                : { background: "#f1f5f9", color: "#6B7280" }
                                                        }
                                                    >
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Generate scope + button */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedScope}
                                            onChange={(e) => setSelectedScope(e.target.value)}
                                            aria-label="Generate scope"
                                            className="flex-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl px-2 py-1.5 border-none outline-none cursor-pointer"
                                        >
                                            {SCOPES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating || !["APPROVED", "GENERATING"].includes(entry.publishStatus) || !entry.contentIdea?.id}
                                            title={!["APPROVED", "GENERATING"].includes(entry.publishStatus) ? "Entry must be APPROVED or RENDERING before generating assets" : "Generate assets"}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                                        >
                                            {generating ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Wand2 size={12} />
                                            )}
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </React.Fragment>
    )
}
