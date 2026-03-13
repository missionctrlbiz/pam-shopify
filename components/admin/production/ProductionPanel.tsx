/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MotionIcon } from "motion-icons-react"
import {
    CalendarDays, LayoutList, Upload, Zap, RefreshCw, Loader2,
    Filter, ChevronLeft, ChevronRight, AlertCircle, X,
    BarChart3, FileUp, Download,
} from "lucide-react"
import type {
    CalendarEntryRow, CalendarListResponse,
    PublishStatus, Platform, GenerateCycleResponse,
} from "./types"
import { CalendarTable, STATUS_META, PLATFORM_META } from "./CalendarTable"
import { DayPanel } from "./DayPanel"

// ─── Same BRAND as AdminDashboardClient ───────────────────────────────────────
const BRAND = {
    red: "#ed415b",
    pink: "#ec5185",
    purple: "#af5ce9",
    navy: "#041f50",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
    gradientSoft: "linear-gradient(135deg, rgba(237,65,91,0.1), rgba(236,81,133,0.1), rgba(175,92,233,0.1))",
    glow: "0 8px 24px rgba(175, 92, 233, 0.25)",
}

type ProdView = "overview" | "table" | "grid" | "import"

const VIEWS: { key: ProdView; label: string; iconName: string; Icon: React.ElementType }[] = [
    { key: "overview", label: "Overview",       iconName: "LayoutDashboard", Icon: BarChart3 },
    { key: "table",    label: "Data Table",      iconName: "Table",           Icon: LayoutList },
    { key: "grid",     label: "Calendar Grid",   iconName: "CalendarDays",    Icon: CalendarDays },
    { key: "import",   label: "Import & Generate", iconName: "Upload",        Icon: Upload },
]

// ─── Stat Card (exact same pattern as admin overview) ─────────────────────────
function StatCard({ label, value, color, sublabel, iconName }: {
    label: string; value: number | string; color: string; sublabel?: string; iconName: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden flex-1 min-w-[140px]"
        >
            <div className="absolute top-0 right-0 w-28 h-28 rounded-bl-full opacity-10" style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }} />
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-inner" style={{ background: `${color}22`, color }}>
                    <MotionIcon name={iconName as any} size={20} animation="pulse" />
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <motion.p key={String(value)} initial={{ scale: 1.1, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-extrabold tracking-tight" style={{ color: BRAND.navy }}>
                        {value}
                    </motion.p>
                    {sublabel && <p className="text-slate-400 text-xs mt-1 font-medium">{sublabel}</p>}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Sub-tab pill bar ─────────────────────────────────────────────────────────
function ViewTabs({ active, onChange }: { active: ProdView; onChange: (v: ProdView) => void }) {
    return (
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 flex-wrap">
            {VIEWS.map(v => {
                const isActive = v.key === active
                return (
                    <button
                        key={v.key}
                        onClick={() => onChange(v.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${isActive ? "text-white shadow-md" : "text-slate-500 hover:text-slate-700 hover:bg-white/60"}`}
                        style={isActive ? { background: BRAND.gradient } : {}}
                    >
                        <v.Icon size={15} />
                        {v.label}
                    </button>
                )
            })}
        </div>
    )
}

// ─── Status badge (Tailwind version) ─────────────────────────────────────────
const STATUS_CLASSES: Record<PublishStatus, string> = {
    DRAFT:            "bg-slate-100 text-slate-500",
    PENDING_APPROVAL: "bg-amber-50 text-amber-600",
    APPROVED:         "bg-emerald-50 text-emerald-600",
    GENERATING:       "bg-blue-50 text-blue-600",
    SCHEDULED:        "bg-violet-50 text-violet-600",
    PUBLISHED:        "bg-emerald-50 text-emerald-700",
    ARCHIVED:         "bg-slate-100 text-slate-400",
}

// ─── Monthly Grid View ────────────────────────────────────────────────────────
function CalendarGridView({ entries }: { entries: CalendarEntryRow[] }) {
    const [viewDate, setViewDate] = useState<Date>(() => {
        if (entries.length > 0) return new Date(entries[0].entryDate)
        return new Date()
    })

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay  = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay() // 0=Sun

    const monthEntries = entries.filter(e => {
        const d = new Date(e.entryDate)
        return d.getFullYear() === year && d.getMonth() === month
    })

    const byDay: Record<number, CalendarEntryRow[]> = {}
    monthEntries.forEach(e => {
        const d = new Date(e.entryDate).getDate()
        if (!byDay[d]) byDay[d] = []
        byDay[d].push(e)
    })

    const cells: (number | null)[] = [
        ...Array(startPad).fill(null),
        ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
    ]
    // Pad to a 6-row grid (42 cells)
    while (cells.length < 42) cells.push(null)

    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            {/* Month nav */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <button
                    aria-label="Previous month"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition"
                >
                    <ChevronLeft size={16} />
                </button>
                <h3 className="text-xl font-extrabold tracking-tight" style={{ color: BRAND.navy }}>
                    {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
                </h3>
                <button
                    aria-label="Next month"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-slate-100">
                {DOW.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                    const dayEntries = day ? (byDay[day] ?? []) : []
                    const isToday = day !== null &&
                        new Date().getDate() === day &&
                        new Date().getMonth() === month &&
                        new Date().getFullYear() === year

                    return (
                        <div
                            key={idx}
                            className={`min-h-[80px] border-b border-r border-slate-100 p-1.5 transition-colors ${day ? "hover:bg-slate-50/70" : "bg-slate-50/30"}`}
                        >
                            {day && (
                                <>
                                    <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday ? "text-white" : "text-slate-500"}`}
                                        style={isToday ? { background: BRAND.gradient } : {}}>
                                        {day}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {dayEntries.slice(0, 3).map(e => (
                                            <div key={e.id} className={`text-[10px] font-semibold truncate px-1.5 py-0.5 rounded-md ${STATUS_CLASSES[e.publishStatus]}`}>
                                                {e.platform} · {e.postType.replace("_", " ")}
                                            </div>
                                        ))}
                                        {dayEntries.length > 3 && (
                                            <div className="text-[10px] text-slate-400 font-bold px-1">+{dayEntries.length - 3} more</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-slate-100 flex flex-wrap gap-3">
                {(Object.keys(STATUS_META) as PublishStatus[]).map(s => (
                    <div key={s} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLASSES[s]}`}>
                        {STATUS_META[s].icon}
                        {STATUS_META[s].label}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Generate Cycle Modal ─────────────────────────────────────────────────────
function GenerateModal({ open, onClose, onConfirm, running, result }: {
    open: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    running: boolean
    result: GenerateCycleResponse | null
}) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
                    <motion.div key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] bg-white rounded-3xl shadow-2xl p-8 z-60"
                    >
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h3 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: BRAND.navy }}>
                                    Generate 30-Day Cycle
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Calls Gemini for each platform &amp; day — creates 30 draft calendar entries.
                                    Takes 2–5 minutes. Existing <strong>DRAFT</strong> entries are overwritten.
                                </p>
                            </div>
                            <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition ml-4">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-5">
                            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                Approved, Scheduled, and Published entries will <strong>not</strong> be overwritten.
                                Only DRAFT and empty slots are regenerated.
                            </p>
                        </div>

                        {result && (
                            <div className="flex gap-3 mb-5">
                                <div className="flex-1 bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                                    <p className="text-3xl font-extrabold text-emerald-600">{result.generated}</p>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Generated</p>
                                </div>
                                {result.failed > 0 && (
                                    <div className="flex-1 bg-red-50 rounded-2xl p-4 text-center border border-red-100">
                                        <p className="text-3xl font-extrabold text-red-500">{result.failed}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Failed</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                                {result ? "Close" : "Cancel"}
                            </button>
                            {!result && (
                                <button onClick={onConfirm} disabled={running}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 shadow-lg"
                                    style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}>
                                    {running
                                        ? <><Loader2 size={14} className="animate-spin" />Generating…</>
                                        : <><Zap size={14} />Start Generation</>
                                    }
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ─── Import & Generate Tab ────────────────────────────────────────────────────
function ImportTab({ onGenerate, generating, onDone }: {
    onGenerate: () => void
    generating: boolean
    onDone: () => void
}) {
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFile = async (file: File) => {
        if (!file.name.endsWith(".csv")) {
            setUploadMsg({ ok: false, text: "File must be a .csv" })
            return
        }
        setUploading(true)
        setUploadMsg(null)
        const text = await file.text()
        try {
            const res = await fetch("/api/production/calendar/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv: text }),
            })
            const data = await res.json()
            if (res.ok) {
                setUploadMsg({ ok: true, text: `✅ Imported ${data.imported} entries${data.skipped ? ` (${data.skipped} skipped)` : ""}` })
                onDone()
            } else {
                setUploadMsg({ ok: false, text: `❌ ${data.error || "Import failed"}` })
            }
        } catch {
            setUploadMsg({ ok: false, text: "❌ Network error" })
        }
        setUploading(false)
    }

    return (
        <div className="space-y-6">
            {/* Generate with AI card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-bl-full opacity-10" style={{ background: `radial-gradient(circle at top right, ${BRAND.purple}, transparent)` }} />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0" style={{ background: `${BRAND.purple}20`, color: BRAND.purple }}>
                        <Zap size={28} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: BRAND.navy }}>
                            AI Generate 30-Day Content Cycle
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Use Google Gemini to automatically draft a full 30-day production calendar — one entry per platform, per day.
                            Approved and published entries will not be overwritten.
                        </p>
                    </div>
                    <button
                        onClick={onGenerate}
                        disabled={generating}
                        className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 shadow-xl shrink-0"
                        style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                    >
                        {generating
                            ? <><Loader2 size={16} className="animate-spin" />Generating…</>
                            : <><Zap size={16} />Start Generation</>
                        }
                    </button>
                </div>
            </div>

            {/* CSV Import card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                <h3 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: BRAND.navy }}>
                    Import from CSV
                </h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Upload a CSV file to bulk-add entries to the calendar. Required columns:
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono ml-1">day_number, entry_date, platform, post_type, topic, content_goal</code>
                </p>

                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-[#af5ce9] bg-purple-50" : "border-slate-200 hover:border-slate-400 bg-slate-50/50"}`}
                >
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" aria-label="Upload CSV calendar file" title="Upload CSV" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                    {uploading
                        ? <div className="flex flex-col items-center gap-3"><Loader2 size={32} className="animate-spin" style={{ color: BRAND.purple }} /><p className="text-slate-500 font-medium">Importing…</p></div>
                        : <>
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <FileUp size={24} className="text-slate-400" />
                            </div>
                            <p className="text-slate-700 font-bold mb-1">Drop CSV here or click to browse</p>
                            <p className="text-slate-400 text-sm">Supports .csv files with the required columns</p>
                        </>
                    }
                </div>

                <AnimatePresence>
                    {uploadMsg && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`mt-4 p-4 rounded-2xl text-sm font-medium ${uploadMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                            {uploadMsg.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CSV template download */}
                <a
                    href="data:text/csv;charset=utf-8,day_number,entry_date,platform,post_type,topic,content_goal%0A1,2026-04-01,IG,CAROUSEL,Topic here,Goal here"
                    download="pam-calendar-template.csv"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
                >
                    <Download size={14} /> Download CSV template
                </a>
            </div>

            {/* Formats reference */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
                <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wide">Valid CSV values</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="font-bold text-slate-500 mb-1">Platform</p>
                        <p className="text-slate-400 font-mono">IG · FB · TIKTOK · LINKEDIN · EMAIL · VIDEO</p>
                    </div>
                    <div>
                        <p className="font-bold text-slate-500 mb-1">Post Type</p>
                        <p className="text-slate-400 font-mono">CAROUSEL · VIDEO · TEXT_POST · REEL · STORY · EMAIL_LESSON</p>
                    </div>
                    <div>
                        <p className="font-bold text-slate-500 mb-1">entry_date</p>
                        <p className="text-slate-400 font-mono">YYYY-MM-DD</p>
                    </div>
                    <div>
                        <p className="font-bold text-slate-500 mb-1">day_number</p>
                        <p className="text-slate-400 font-mono">1–30 (integer)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main ProductionPanel ─────────────────────────────────────────────────────
export function ProductionPanel() {
    const [view, setView] = useState<ProdView>("overview")
    const [entries, setEntries] = useState<CalendarEntryRow[]>([])
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [statusFilter, setStatusFilter] = useState<PublishStatus | "">("")
    const [platformFilter, setPlatformFilter] = useState<Platform | "">("")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [generateModalOpen, setGenerateModalOpen] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [generateResult, setGenerateResult] = useState<GenerateCycleResponse | null>(null)

    // ── Stats ───────────────────────────────────────────────────────────────
    const stats = React.useMemo(() => ({
        total:      pagination.total,
        draft:      entries.filter(e => e.publishStatus === "DRAFT").length,
        pending:    entries.filter(e => e.publishStatus === "PENDING_APPROVAL").length,
        approved:   entries.filter(e => e.publishStatus === "APPROVED").length,
        generating: entries.filter(e => e.publishStatus === "GENERATING").length,
        published:  entries.filter(e => e.publishStatus === "PUBLISHED").length,
    }), [entries, pagination.total])

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchCalendar = useCallback(async (page = 1, isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const p = new URLSearchParams()
            if (statusFilter) p.set("status", statusFilter)
            if (platformFilter) p.set("platform", platformFilter)
            p.set("page", String(page))
            p.set("limit", "50")
            const res = await fetch(`/api/production/calendar?${p}`)
            if (res.ok) {
                const data = await res.json() as CalendarListResponse
                setEntries(data.entries)
                setPagination({ total: data.pagination.total, page: data.pagination.page, totalPages: data.pagination.totalPages })
            }
        } catch { /* silent */ }

        setLoading(false)
        setRefreshing(false)
    }, [statusFilter, platformFilter])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void fetchCalendar(1) }, [statusFilter, platformFilter])

    // Poll while any row is GENERATING
    useEffect(() => {
        if (!entries.some(e => e.publishStatus === "GENERATING")) return
        const t = setInterval(() => fetchCalendar(pagination.page, true), 8000)
        return () => clearInterval(t)
    }, [entries, pagination.page, fetchCalendar])

    const handleEntryUpdated = useCallback((id: string, newStatus: string) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, publishStatus: newStatus as PublishStatus } : e))
    }, [])

    const handleGenerateCycle = async () => {
        setGenerating(true)
        try {
            const res = await fetch("/api/production/calendar/generate", { method: "POST" })
            const data = await res.json() as GenerateCycleResponse
            setGenerateResult(data)
            await fetchCalendar(1)
        } catch { setGenerateResult({ generated: 0, failed: 0, entries: [] }) }
        setGenerating(false)
    }

    const statCards = [
        { label: "Total Entries",  value: stats.total,      color: BRAND.navy,     iconName: "CalendarDays",    sublabel: "All records" },
        { label: "Draft",          value: stats.draft,      color: "#6B7280",      iconName: "FileText",        sublabel: "Awaiting review" },
        { label: "Pending",        value: stats.pending,    color: "#F59E0B",      iconName: "Clock",           sublabel: "Needs approval" },
        { label: "Approved",       value: stats.approved,   color: "#10B981",      iconName: "CheckCircle",     sublabel: "Ready to render" },
        { label: "Published",      value: stats.published,  color: BRAND.purple,   iconName: "Send",            sublabel: "Live content" },
    ]

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 size={32} style={{ color: BRAND.purple }} />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Sub-tab bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <ViewTabs active={view} onChange={setView} />

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchCalendar(pagination.page, true)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm text-sm font-bold"
                    >
                        <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.6 }}>
                            <RefreshCw size={14} />
                        </motion.div>
                        {refreshing ? "Refreshing…" : "Sync"}
                    </button>
                    <button
                        onClick={() => { setGenerateResult(null); setGenerateModalOpen(true) }}
                        className="flex items-center gap-2 px-5 py-2 text-white rounded-xl text-sm font-bold shadow-lg"
                        style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                    >
                        <Zap size={14} /> Generate Cycle
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ── OVERVIEW ── */}
                {view === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                        {/* Stat cards */}
                        <div className="flex flex-wrap gap-4">
                            {statCards.map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} className="flex-1 min-w-[140px]">
                                    <StatCard {...s} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Status breakdown */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
                            <h3 className="text-lg font-extrabold tracking-tight mb-5" style={{ color: BRAND.navy }}>Status Breakdown</h3>
                            <div className="flex flex-col gap-3">
                                {(Object.keys(STATUS_META) as PublishStatus[]).map(s => {
                                    const count = entries.filter(e => e.publishStatus === s).length
                                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                                    return (
                                        <div key={s} className="flex items-center gap-3">
                                            <div className="w-24 text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">{STATUS_META[s].label}</div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                                    className="h-full rounded-full"
                                                    style={{ background: count > 0 ? BRAND.gradient : "#E5E7EB" }}
                                                />
                                            </div>
                                            <div className="w-8 text-xs font-extrabold text-slate-600 text-right shrink-0">{count}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
                            <h3 className="text-lg font-extrabold tracking-tight mb-5" style={{ color: BRAND.navy }}>Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { view: "table" as ProdView, iconName: "Table", Icon: LayoutList, label: "View Table", desc: "Browse all entries", color: BRAND.red },
                                    { view: "grid" as ProdView, iconName: "CalendarDays", Icon: CalendarDays, label: "Calendar Grid", desc: "Monthly visual view", color: BRAND.pink },
                                    { view: "import" as ProdView, iconName: "Upload", Icon: Upload, label: "Import / Generate", desc: "Add new entries", color: BRAND.purple },
                                ].map(action => (
                                    <button key={action.view} onClick={() => setView(action.view)}
                                        className="p-5 border border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl text-left transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 transition-colors group-hover:text-[#af5ce9]">
                                            <action.Icon size={20} className="text-slate-600 group-hover:text-[#af5ce9]" />
                                        </div>
                                        <p className="text-sm font-bold" style={{ color: BRAND.navy }}>{action.label}</p>
                                        <p className="text-slate-500 text-xs mt-1 font-medium">{action.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── TABLE ── */}
                {view === "table" && (
                    <motion.div key="table" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                        {/* Filters row */}
                        <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100 flex flex-wrap items-center gap-3">
                            <Filter size={14} className="text-slate-400 shrink-0" />
                            <select
                                aria-label="Filter by status"
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value as PublishStatus | ""); fetchCalendar(1) }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#af5ce9]/40"
                            >
                                <option value="">All Statuses</option>
                                {(Object.keys(STATUS_META) as PublishStatus[]).map(s => (
                                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                                ))}
                            </select>
                            <select
                                aria-label="Filter by platform"
                                value={platformFilter}
                                onChange={e => { setPlatformFilter(e.target.value as Platform | ""); fetchCalendar(1) }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#af5ce9]/40"
                            >
                                <option value="">All Platforms</option>
                                {(Object.keys(PLATFORM_META) as Platform[]).map(p => (
                                    <option key={p} value={p}>{PLATFORM_META[p].label}</option>
                                ))}
                            </select>

                            <div className="flex-1" />

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button disabled={pagination.page === 1} aria-label="Previous page"
                                        onClick={() => fetchCalendar(pagination.page - 1)}
                                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-xs font-bold text-slate-500">
                                        {pagination.page} / {pagination.totalPages}
                                    </span>
                                    <button disabled={pagination.page >= pagination.totalPages} aria-label="Next page"
                                        onClick={() => fetchCalendar(pagination.page + 1)}
                                        className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Table card */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                            <CalendarTable
                                entries={entries}
                                selectedId={selectedId}
                                onSelect={entry => setSelectedId(entry.id)}
                                loading={refreshing}
                            />
                        </div>
                    </motion.div>
                )}

                {/* ── CALENDAR GRID ── */}
                {view === "grid" && (
                    <motion.div key="grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        {entries.length === 0
                            ? <div className="bg-white rounded-3xl p-16 text-center shadow-xl shadow-slate-200/40 border border-slate-100">
                                <CalendarDays size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-medium">No calendar entries yet. Generate a 30-day cycle or import a CSV.</p>
                              </div>
                            : <CalendarGridView entries={entries} />
                        }
                    </motion.div>
                )}

                {/* ── IMPORT / GENERATE ── */}
                {view === "import" && (
                    <motion.div key="import" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <ImportTab
                            onGenerate={() => { setGenerateResult(null); setGenerateModalOpen(true) }}
                            generating={generating}
                            onDone={() => fetchCalendar(1)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Day detail slide-out */}
            <DayPanel entryId={selectedId} onClose={() => setSelectedId(null)} onEntryUpdated={handleEntryUpdated} />

            {/* Generate cycle modal */}
            <GenerateModal
                open={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onConfirm={handleGenerateCycle}
                running={generating}
                result={generateResult}
            />
        </div>
    )
}
