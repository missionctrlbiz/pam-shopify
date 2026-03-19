"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
    RefreshCw, AlertCircle, CheckCircle2, Clock, Zap,
    Download, Image, Video, Music, FileText, Film,
    RotateCcw, ChevronDown, ChevronUp,
    Trash2, Square, CheckSquare, X, Loader2, ChevronLeft, ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PROD_BRAND, PLATFORM_META, POST_TYPE_META } from "./CalendarTable"
import type { Platform, PostType } from "./types"

// ── Local types ───────────────────────────────────────────────────────────────

type RenderJobStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "FAILED"
type JobType = "CAROUSEL" | "VIDEO" | "AUDIO" | "REPURPOSE"

interface JobAsset {
    id: string
    assetType: string
    platform: string
    status: string
    storageUrl: string | null
    fileName: string | null
}

// ── Carousel Slider Subcomponent ──────────────────────────────────────────────────
function CarouselPreview({ slideUrls }: { slideUrls: string[] }) {
    const [currentSlide, setCurrentSlide] = React.useState(0);
    const PURPLE_CONST = "rgba(139, 92, 246, 1)";

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", aspectRatio: "1", position: "relative", background: "#f8f9fa", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
                <img
                    src={`/api/production/assets/proxy?url=${encodeURIComponent(slideUrls[currentSlide])}`}
                    alt={`Slide ${currentSlide + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />

                {slideUrls.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev > 0 ? prev - 1 : slideUrls.length - 1)) }}
                            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}
                        >
                            <ChevronLeft size={18} color={PROD_BRAND.navy} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev < slideUrls.length - 1 ? prev + 1 : 0)) }}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}
                        >
                            <ChevronRight size={18} color={PROD_BRAND.navy} />
                        </button>
                    </>
                )}
            </div>

            {slideUrls.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                    {slideUrls.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(i) }}
                            style={{
                                width: 8, height: 8, borderRadius: "50%", padding: 0, border: "none", cursor: "pointer",
                                background: i === currentSlide ? "rgba(139, 92, 246, 1)" : "#d1d5db",
                                opacity: i === currentSlide ? 1 : 0.4,
                                transition: "all 0.2s ease"
                            }}
                        />
                    ))}
                </div>
            )}

            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: PROD_BRAND.gray }}>
                Slide {currentSlide + 1} of {slideUrls.length}
            </div>
        </div>
    );
}




interface JobRow {
    id: string
    jobType: JobType
    status: RenderJobStatus
    retryCount: number
    queuedAt: string
    startedAt: string | null
    completedAt: string | null
    errorMessage: string | null
    contentIdea: {
        id: string
        calendarEntry: {
            id: string
            dayNumber: number
            platform: string
            postType: string
            topic: string
            entryDate: string
        }
    }
    assets: JobAsset[]
}

interface JobsApiResponse {
    jobs: JobRow[]
    total: number
    hasActive: boolean
    pagination: { page: number; limit: number; totalPages: number }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PURPLE = "#af5ce9"
const PURPLE_FAINT = "rgba(175,92,233,0.08)"

const STATUS_CFG: Record<RenderJobStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    QUEUED: { label: "Queued", color: PROD_BRAND.amber, bg: PROD_BRAND.amberFaint, icon: <Clock size={12} /> },
    RUNNING: { label: "Running", color: PROD_BRAND.blue, bg: PROD_BRAND.blueFaint, icon: <Zap size={12} /> },
    COMPLETE: { label: "Complete", color: PROD_BRAND.green, bg: PROD_BRAND.greenFaint, icon: <CheckCircle2 size={12} /> },
    FAILED: { label: "Failed", color: PROD_BRAND.red, bg: PROD_BRAND.redFaint, icon: <AlertCircle size={12} /> },
}

const JOB_TYPE_ICON: Record<JobType, React.ReactNode> = {
    CAROUSEL: <Image size={14} />,
    VIDEO: <Video size={14} />,
    AUDIO: <Music size={14} />,
    REPURPOSE: <FileText size={14} />,
}

const ASSET_TYPE_ICON: Record<string, React.ReactNode> = {
    CAROUSEL_PNG: <Image size={12} />,
    VIDEO_MP4: <Film size={12} />,
    AUDIO_MP3: <Music size={12} />,
    TEXT_POST: <FileText size={12} />,
    EMAIL_HTML: <FileText size={12} />,
    VIDEO_SCRIPT_JSON: <FileText size={12} />,
}

type FilterTab = "all" | "active" | "failed" | "complete"
const FILTER_TABS: { id: FilterTab; label: string; status?: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active", status: "QUEUED,RUNNING" },
    { id: "failed", label: "Failed", status: "FAILED" },
    { id: "complete", label: "Complete", status: "COMPLETE" },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function elapsed(start: string | null, end: string | null): string {
    if (!start) return "—"
    const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime()
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function relTime(iso: string | null): string {
    if (!iso) return "—"
    const diffMs = Date.now() - new Date(iso).getTime()
    const s = Math.round(diffMs / 1000)
    if (s < 60) return `${s}s ago`
    const m = Math.round(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.round(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Component ─────────────────────────────────────────────────────────────────

export const RenderJobsTab: React.FC = () => {
    const [filter, setFilter] = useState<FilterTab>("all")
    const [data, setData] = useState<JobsApiResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [retrying, setRetrying] = useState<Set<string>>(new Set())
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [bulkActing, setBulkActing] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)
    const [previewAsset, setPreviewAsset] = useState<JobAsset | null>(null)
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        desc: string;
        actionLabel: string;
        onConfirm: () => void;
    } | null>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const showToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchJobs = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true)
        const statusParam = FILTER_TABS.find(t => t.id === filter)?.status ?? ""
        const url = `/api/production/render-jobs?limit=60${statusParam ? `&status=${statusParam}` : ""}`
        try {
            const res = await fetch(url)
            if (res.ok) {
                const json = await res.json() as JobsApiResponse
                setData(json)
            }
        } catch { /* silent */ }
        if (!quiet) setLoading(false)
    }, [filter])

    // Re-fetch when filter changes; also clear selection
    useEffect(() => {
        fetchJobs()
        setSelected(new Set())

    }, [fetchJobs])

    // Auto-poll every 8 s when active jobs exist — pause while tab is hidden (frugal)
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current)
        if (!data?.hasActive) return
        pollRef.current = setInterval(() => {
            if (!document.hidden) fetchJobs(true)
        }, 8000)
        // Resume immediately when user switches back to this tab
        const onVisible = () => { if (!document.hidden && data?.hasActive) fetchJobs(true) }
        document.addEventListener("visibilitychange", onVisible)
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [data?.hasActive, fetchJobs])

    // ── Retry ─────────────────────────────────────────────────────────────
    const handleRetry = async (jobId: string) => {
        setRetrying(prev => new Set(prev).add(jobId))
        try {
            const res = await fetch(`/api/production/render-jobs/${jobId}/retry`, { method: "POST" })
            let errorMsg = "Retry failed"
            try {
                const json = await res.json() as { newJobId?: string; error?: string }
                if (res.ok) {
                    showToast(`Job retried → ${json.newJobId?.slice(0, 8)}…`)
                    await fetchJobs()
                    setRetrying(prev => { const s = new Set(prev); s.delete(jobId); return s })
                    return
                }
                errorMsg = json.error ?? errorMsg
            } catch {
                errorMsg = `Server error (${res.status})`
            }
            console.error(`[Retry] Job ${jobId} failed:`, errorMsg)
            showToast("Retry failed — check console", "err")
        } catch (e) {
            console.error("[Retry] Network error:", e)
            showToast("Network error during retry", "err")
        }
        setRetrying(prev => { const s = new Set(prev); s.delete(jobId); return s })
    }

    const toggleExpand = (id: string) =>
        setExpanded(prev => {
            const s = new Set(prev)
            s.has(id) ? s.delete(id) : s.add(id)
            return s
        })

    // ── Bulk select ────────────────────────────────────────────────────────
    const toggleSelect = (id: string) =>
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

    const selectAll = () => setSelected(new Set(jobs.map(j => j.id)))
    const clearSelect = () => setSelected(new Set())

    const handleBulkRetry = async () => {
        const ids = [...selected].filter(id => jobs.find(j => j.id === id)?.status === "FAILED")
        if (!ids.length) { showToast("No failed jobs in selection", "err"); return }
        setBulkActing(true)
        try {
            const results = await Promise.all(ids.map(id =>
                fetch(`/api/production/render-jobs/${id}/retry`, { method: "POST" })
            ))
            const failed = results.filter(r => !r.ok)
            if (failed.length > 0) {
                console.error(`[BulkRetry] ${failed.length} jobs failed to retry. Check network logs.`)
                showToast(`${failed.length} retries failed — check console`, "err")
            } else {
                showToast(`Retried ${ids.length} job${ids.length !== 1 ? "s" : ""}`)
            }
            clearSelect()
            await fetchJobs()
        } catch (e) {
            console.error("[BulkRetry] Error:", e)
            showToast("Bulk retry had errors — check console", "err")
        }
        setBulkActing(false)
    }

    const handleBulkDelete = async () => {
        setConfirmModal({
            title: "Delete Jobs",
            desc: `Permanently delete these ${selected.size} job${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`,
            actionLabel: bulkActing ? "Deleting…" : "Delete",
            onConfirm: async () => {
                setConfirmModal(null)
                setBulkActing(true)
                try {
                    const res = await fetch("/api/production/render-jobs/bulk", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: [...selected] }),
                    })
                    if (!res.ok) throw new Error("Delete failed")
                    showToast(`Deleted ${selected.size} job${selected.size !== 1 ? "s" : ""}`)
                    clearSelect()
                    await fetchJobs()
                } catch (e) { showToast(String(e), "err") }
                setBulkActing(false)
            }
        })
    }

    // ── Render ────────────────────────────────────────────────────────────
    const jobs = data?.jobs ?? []
    const allSelected = jobs.length > 0 && selected.size === jobs.length
    const someSelected = selected.size > 0 && selected.size < jobs.length

    return (
        <div style={{ position: "relative" }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
                    background: toast.type === "ok" ? PROD_BRAND.green : PROD_BRAND.red,
                    color: PROD_BRAND.white, borderRadius: 8,
                    padding: "9px 22px", fontSize: 13, fontWeight: 600,
                    zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                    whiteSpace: "nowrap",
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: PROD_BRAND.navy, margin: 0 }}>
                        Render Queue
                    </h2>
                    {data && (
                        <div style={{ fontSize: 12, color: PROD_BRAND.gray, marginTop: 4 }}>
                            {data.total} job{data.total !== 1 ? "s" : ""}
                            {data.hasActive && (
                                <span style={{ color: PROD_BRAND.blue, marginLeft: 10, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <Zap size={10} /> renders in progress — polling every 5s
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => fetchJobs()}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 6,
                        background: PURPLE_FAINT,
                        border: `1px solid ${PURPLE}44`,
                        color: PURPLE, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${PROD_BRAND.border}`, paddingBottom: 0 }}>
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            padding: "7px 16px",
                            background: "none", border: "none",
                            borderBottom: filter === tab.id ? `2px solid ${PURPLE}` : "2px solid transparent",
                            color: filter === tab.id ? PURPLE : PROD_BRAND.gray,
                            fontSize: 13, fontWeight: filter === tab.id ? 700 : 400,
                            cursor: "pointer", transition: "all 0.15s",
                            marginBottom: -1,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Job list */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 60, color: PROD_BRAND.gray, fontSize: 14 }}>
                    Loading jobs…
                </div>
            ) : jobs.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 12, color: PROD_BRAND.gray }}>
                    <CheckCircle2 size={36} style={{ opacity: 0.25 }} />
                    <span style={{ fontSize: 14 }}>No render jobs{filter !== "all" ? ` with status "${filter}"` : ""} found.</span>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Select-all row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 6px", borderBottom: `1px solid ${PROD_BRAND.border}`, marginBottom: 4 }}>
                        <button
                            onClick={allSelected ? clearSelect : selectAll}
                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, color: allSelected || someSelected ? PURPLE : PROD_BRAND.gray }}
                        >
                            {allSelected
                                ? <CheckSquare size={15} />
                                : someSelected
                                    ? <CheckSquare size={15} style={{ opacity: 0.5 }} />
                                    : <Square size={15} />
                            }
                            <span style={{ fontSize: 12, fontWeight: 600 }}>
                                {allSelected ? "Deselect all" : "Select all"}
                            </span>
                        </button>
                        {selected.size > 0 && (
                            <span style={{ fontSize: 12, color: PURPLE, fontWeight: 700 }}>
                                {selected.size} selected
                            </span>
                        )}
                    </div>

                    {/* Bulk action bar */}
                    {selected.size > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 14px", borderRadius: 8,
                            background: PURPLE_FAINT, border: `1px solid ${PURPLE}33`,
                            marginBottom: 4,
                        }}>
                            <span style={{ fontSize: 12, color: PROD_BRAND.gray, marginRight: 4 }}>
                                Bulk actions:
                            </span>
                            <button
                                onClick={handleBulkRetry}
                                disabled={bulkActing}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "5px 12px", borderRadius: 6, border: "none",
                                    background: PURPLE, color: "#fff",
                                    fontSize: 11, fontWeight: 700,
                                    cursor: bulkActing ? "not-allowed" : "pointer", opacity: bulkActing ? 0.6 : 1,
                                }}
                            >
                                <RotateCcw size={10} /> Retry Failed
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkActing}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "5px 12px", borderRadius: 6, border: "none",
                                    background: PROD_BRAND.red, color: "#fff",
                                    fontSize: 11, fontWeight: 700,
                                    cursor: bulkActing ? "not-allowed" : "pointer", opacity: bulkActing ? 0.6 : 1,
                                }}
                            >
                                <Trash2 size={10} /> Delete
                            </button>
                            <button
                                onClick={clearSelect}
                                style={{
                                    marginLeft: "auto", background: "none", border: "none",
                                    color: PROD_BRAND.gray, fontSize: 11, cursor: "pointer", fontWeight: 600,
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {jobs.map(job => <JobCard
                        key={job.id}
                        job={job}
                        isExpanded={expanded.has(job.id)}
                        onToggle={() => toggleExpand(job.id)}
                        onRetry={() => handleRetry(job.id)}
                        isRetrying={retrying.has(job.id)}
                        isSelected={selected.has(job.id)}
                        onSelect={() => toggleSelect(job.id)}
                        onPreviewAsset={setPreviewAsset}
                    />)}
                </div>
            )}

            {/* Asset Preview Modal Pop-up */}
            {previewAsset && (
                <div
                    onClick={() => setPreviewAsset(null)}
                    style={{
                        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 9999, padding: 20,
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: "#fff", borderRadius: 12, padding: 24,
                            width: "100%", maxWidth: 640, maxHeight: "85vh",
                            overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                            position: "relative", display: "flex", flexDirection: "column", gap: 16
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${PROD_BRAND.border}`, paddingBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ color: PURPLE }}>{ASSET_TYPE_ICON[previewAsset.assetType] ?? <FileText size={16} />}</span>
                                <span style={{ fontWeight: 700, color: PROD_BRAND.navy, fontSize: 14 }}>{previewAsset.assetType.replace(/_/g, " ")}</span>
                            </div>
                            <button
                                onClick={() => setPreviewAsset(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: PROD_BRAND.gray }}
                            >✕</button>
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
                            {previewAsset.assetType === "AUDIO_MP3" && previewAsset.storageUrl && (
                                <audio controls autoPlay style={{ width: "100%" }} src={`/api/production/assets/proxy?url=${encodeURIComponent(previewAsset.storageUrl)}`} />
                            )}

                            {previewAsset.assetType === "CAROUSEL_PNG" && (() => {
                                const meta = (previewAsset as unknown as Record<string, unknown>).metadata as Record<string, unknown> | null
                                const slideUrls = (meta?.slideUrls as string[]) ?? []
                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
                                        {slideUrls.length > 0 ? (
                                            <CarouselPreview slideUrls={slideUrls} />
                                        ) : previewAsset.storageUrl ? (
                                            <img src={`/api/production/assets/proxy?url=${encodeURIComponent(previewAsset.storageUrl)}`} alt="Slide" style={{ width: "100%", height: "auto", borderRadius: 8 }} />
                                        ) : null}
                                    </div>
                                )
                            })()}

                            {(previewAsset.assetType === "TEXT_POST" || previewAsset.assetType === "EMAIL_HTML" || previewAsset.assetType === "VIDEO_SCRIPT_JSON") && (() => {
                                const meta = (previewAsset as unknown as Record<string, unknown>).metadata as Record<string, unknown> | null
                                const content = (meta?.content as string) ?? ""
                                return (
                                    <div style={{ width: "100%" }}>
                                        <div style={{
                                            whiteSpace: "pre-wrap", background: PROD_BRAND.grayFaint,
                                            padding: 16, borderRadius: 8, fontSize: 12, lineHeight: 1.6,
                                            color: PROD_BRAND.navy, maxHeight: 400, overflowY: "auto",
                                            border: `1px solid ${PROD_BRAND.border}`
                                        }}>{content}</div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(content); alert("Copied full text!"); }}
                                            style={{
                                                marginTop: 12, width: "100%", padding: "10px",
                                                background: PURPLE, color: "#fff", border: "none",
                                                borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer"
                                            }}
                                        >
                                            Copy Full Content
                                        </button>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal */}
            <ConfirmModal
                open={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                title={confirmModal?.title ?? ""}
                desc={confirmModal?.desc ?? ""}
                actionLabel={confirmModal?.actionLabel ?? ""}
                onConfirm={confirmModal?.onConfirm ?? (() => { })}
                loading={bulkActing}
            />
        </div>
    )
}

// ─── Reusable Confirm Modal ───────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, desc, actionLabel, loading }: {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    desc: string
    actionLabel: string
    loading?: boolean
}) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", zIndex: 10000 }} onClick={onClose} />
                    <motion.div key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        style={{
                            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: 420, maxWidth: "90vw", background: "#ffffff", borderRadius: 24, padding: 28,
                            boxShadow: "0 20px 50px rgba(0,0,0,0.15)", zIndex: 10001
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, color: PROD_BRAND.navy, margin: 0 }}>
                                    {title}
                                </h3>
                                <p style={{ fontSize: 13, color: PROD_BRAND.gray, lineHeight: 1.6, margin: "4px 0 0" }}>
                                    {desc}
                                </p>
                            </div>
                            <button onClick={onClose} aria-label="Close" style={{ padding: 6, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: PROD_BRAND.gray, marginLeft: 16 }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                            <button onClick={onClose} disabled={loading}
                                style={{ padding: "10px 18px", borderRadius: 12, border: `1px solid ${PROD_BRAND.border}`, background: "#fff", fontSize: 12, fontWeight: 700, color: PROD_BRAND.gray, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={onConfirm} disabled={loading}
                                style={{
                                    padding: "10px 22px", borderRadius: 12, border: "none",
                                    background: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
                                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading && <Loader2 size={12} className="animate-spin" />}
                                {actionLabel}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ── JobCard ───────────────────────────────────────────────────────────────────

const PURPLE_CONST = "#af5ce9"

interface JobCardProps {
    job: JobRow
    isExpanded: boolean
    onToggle: () => void
    onRetry: () => void
    isRetrying: boolean
    isSelected: boolean
    onSelect: () => void
    onPreviewAsset: (asset: JobAsset) => void
}

const JobCard: React.FC<JobCardProps> = ({ job, isExpanded, onToggle, onRetry, isRetrying, isSelected, onSelect, onPreviewAsset }) => {
    const entry = job.contentIdea.calendarEntry
    const cfg = STATUS_CFG[job.status]
    const isActive = job.status === "QUEUED" || job.status === "RUNNING"
    const isFailed = job.status === "FAILED"
    const completedAssets = job.assets.filter(a => a.status === "COMPLETE" && a.storageUrl)

    return (
        <div style={{
            border: `1px solid ${isFailed ? PROD_BRAND.red + "44" : isActive ? PROD_BRAND.blue + "44" : PROD_BRAND.border}`,
            borderRadius: 10,
            background: PROD_BRAND.white,
            overflow: "hidden",
            transition: "box-shadow 0.15s",
        }}>
            {/* Job row */}
            <div
                onClick={onToggle}
                style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    cursor: "pointer",
                    background: isSelected ? `${PURPLE_CONST}11` : isActive ? PROD_BRAND.blueFaint : "transparent",
                }}
            >
                {/* Checkbox */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect() }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", flexShrink: 0, color: isSelected ? PURPLE_CONST : PROD_BRAND.gray }}
                    title={isSelected ? "Deselect" : "Select"}
                >
                    {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                </button>

                {/* Job type icon */}
                <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isFailed ? PROD_BRAND.redFaint : isActive ? PROD_BRAND.blueFaint : PROD_BRAND.grayFaint,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isFailed ? PROD_BRAND.red : isActive ? PROD_BRAND.blue : PROD_BRAND.gray,
                }}>
                    {JOB_TYPE_ICON[job.jobType]}
                </div>

                {/* Entry info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, background: PROD_BRAND.blueFaint, color: PROD_BRAND.blue, padding: "1px 6px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                            D{String(entry.dayNumber).padStart(2, "0")}
                        </span>
                        <span style={{ fontSize: 12, color: PLATFORM_META[entry.platform as Platform]?.color ?? PROD_BRAND.gray, fontWeight: 600, fontFamily: "var(--font-montserrat)", flexShrink: 0 }}>
                            {PLATFORM_META[entry.platform as Platform]?.label ?? entry.platform}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: PROD_BRAND.gray, flexShrink: 0 }}>
                            {POST_TYPE_META[entry.postType as PostType]?.icon}
                            {POST_TYPE_META[entry.postType as PostType]?.label ?? entry.postType}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--font-montserrat)", color: PROD_BRAND.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.topic ?? "(no topic)"}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: PROD_BRAND.gray, letterSpacing: "0.06em" }}>
                            {job.jobType}
                        </span>
                        <span style={{ fontSize: 10, color: PROD_BRAND.gray }}>
                            queued {relTime(job.queuedAt)}
                        </span>
                        {(job.startedAt || job.completedAt) && (
                            <span style={{ fontSize: 10, color: PROD_BRAND.gray }}>
                                duration: {elapsed(job.startedAt, job.completedAt)}
                            </span>
                        )}
                        {job.retryCount > 0 && (
                            <span style={{ fontSize: 10, color: PROD_BRAND.amber }}>
                                retry #{job.retryCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {/* Status badge */}
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 20,
                        background: cfg.bg, color: cfg.color,
                        fontSize: 11, fontWeight: 700,
                    }}>
                        {isActive ? <RefreshCw size={10} className="animate-spin" /> : cfg.icon}
                        {cfg.label}
                    </span>

                    {/* Asset count badge */}
                    {completedAssets.length > 0 && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            padding: "3px 8px", borderRadius: 20,
                            background: PROD_BRAND.greenFaint, color: PROD_BRAND.green,
                            fontSize: 11, fontWeight: 600,
                        }}>
                            <Download size={10} />
                            {completedAssets.length}
                        </span>
                    )}

                    {/* Retry button */}
                    {isFailed && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRetry() }}
                            disabled={isRetrying}
                            title="Retry this job"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "5px 12px", borderRadius: 6, border: "none",
                                background: isRetrying ? PROD_BRAND.border : PURPLE_CONST,
                                color: isRetrying ? PROD_BRAND.gray : PROD_BRAND.white,
                                fontSize: 11, fontWeight: 700,
                                cursor: isRetrying ? "not-allowed" : "pointer",
                                transition: "opacity 0.15s",
                            }}
                        >
                            {isRetrying
                                ? <><RefreshCw size={10} className="animate-spin" /> Retrying…</>
                                : <><RotateCcw size={10} /> Retry</>
                            }
                        </button>
                    )}

                    {/* Expand chevron */}
                    <span style={{ color: PROD_BRAND.gray }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
                <div style={{
                    borderTop: `1px solid ${PROD_BRAND.border}`,
                    padding: "14px 16px",
                    background: PROD_BRAND.grayFaint,
                }}>
                    {/* Error message */}
                    {job.errorMessage && (
                        <div style={{
                            marginBottom: 14, padding: "10px 12px", borderRadius: 6,
                            background: PROD_BRAND.redFaint, border: `1px solid ${PROD_BRAND.red}33`,
                            color: PROD_BRAND.red, fontSize: 12,
                        }}>
                            <strong>Error:</strong> {job.errorMessage}
                        </div>
                    )}

                    {/* Timestamps */}
                    <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
                        {[
                            { label: "Queued", val: job.queuedAt },
                            { label: "Started", val: job.startedAt },
                            { label: "Completed", val: job.completedAt },
                        ].map(({ label, val }) => (
                            <div key={label}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: PROD_BRAND.gray, marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 12, color: PROD_BRAND.navy }}>
                                    {val ? new Date(val).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Assets */}
                    {job.assets.length > 0 && (
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: PROD_BRAND.gray, marginBottom: 8 }}>Assets</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {job.assets.map(asset => {
                                    const isDone = asset.status === "COMPLETE" && asset.storageUrl
                                    return (
                                        <div
                                            key={asset.id}
                                            style={{
                                                display: "flex", flexDirection: "column", gap: 5,
                                                padding: "8px 12px", borderRadius: 8,
                                                background: isDone ? PROD_BRAND.greenFaint : PROD_BRAND.white,
                                                border: `1px solid ${isDone ? PROD_BRAND.green + "44" : PROD_BRAND.border}`,
                                                fontSize: 11, width: "240px",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                <span style={{ color: isDone ? PROD_BRAND.green : PROD_BRAND.gray }}>
                                                    {ASSET_TYPE_ICON[asset.assetType] ?? <FileText size={12} />}
                                                </span>
                                                <span style={{ color: PROD_BRAND.navy, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {asset.assetType.replace(/_/g, " ")}
                                                </span>
                                                {isDone && asset.storageUrl && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <a
                                                            href={`/api/production/assets/proxy?url=${encodeURIComponent(asset.storageUrl)}&filename=${encodeURIComponent(asset.fileName || "asset")}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                                color: PROD_BRAND.green, textDecoration: "none",
                                                                fontWeight: 700, fontSize: 10,
                                                            }}
                                                        >
                                                            <Download size={10} /> DL
                                                        </a>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onPreviewAsset(asset); }}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                                color: PURPLE_CONST, background: "none", border: "none",
                                                                fontWeight: 700, fontSize: 10, cursor: "pointer", padding: 0
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Previews for completed media */}
                                            {isDone && asset.storageUrl && (
                                                <div style={{ marginTop: 2 }}>
                                                    {asset.assetType === "AUDIO_MP3" && (
                                                        <audio controls style={{ width: "100%", height: 26 }} src={`/api/production/assets/proxy?url=${encodeURIComponent(asset.storageUrl)}`} />
                                                    )}
                                                    {asset.assetType === "CAROUSEL_PNG" && (() => {
                                                        const meta = (asset as unknown as Record<string, unknown>).metadata as Record<string, unknown> | null
                                                        const slideUrls = (meta?.slideUrls as string[]) ?? []
                                                        return slideUrls.length > 0 ? (
                                                            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, width: "100%" }}>
                                                                {slideUrls.map((u, i) => (
                                                                    <img
                                                                        key={i}
                                                                        src={`/api/production/assets/proxy?url=${encodeURIComponent(u)}`}
                                                                        alt={`Slide ${i + 1}`}
                                                                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={`/api/production/assets/proxy?url=${encodeURIComponent(asset.storageUrl!)}`}
                                                                alt={asset.assetType}
                                                                style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 4, display: "block" }}
                                                            />
                                                        )
                                                    })()}
                                                    {(asset.assetType === "TEXT_POST" || asset.assetType === "EMAIL_HTML" || asset.assetType === "VIDEO_SCRIPT_JSON") && (() => {
                                                        // asset.metadata now exists on JobAsset with the updated API
                                                        const meta = (asset as unknown as Record<string, unknown>).metadata as Record<string, unknown> | null
                                                        const content = (meta?.content as string) ?? ""
                                                        const preview = content.slice(0, 90) + (content.length > 90 ? "…" : "")
                                                        return content ? (
                                                            <div style={{ marginTop: 4 }}>
                                                                <div style={{
                                                                    fontSize: 10, color: PROD_BRAND.gray,
                                                                    background: PROD_BRAND.grayFaint,
                                                                    padding: "4px 6px", borderRadius: 4,
                                                                    marginBottom: 4, lineHeight: 1.4,
                                                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                                                }}>{preview}</div>
                                                                {/* Simple Copy button just inline or using navigator */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(content); alert("Copied!") }}
                                                                    style={{ background: "none", border: "none", fontSize: 10, cursor: "pointer", color: PROD_BRAND.blue, padding: 0 }}
                                                                >Copy</button>
                                                            </div>
                                                        ) : null
                                                    })()}
                                                </div>
                                            )}

                                            {!isDone && (
                                                <div style={{ fontSize: 10, color: PROD_BRAND.gray, fontStyle: "italic" }}>
                                                    {asset.status.toLowerCase()}…
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Job Diagnostics Panel */}
                    <div style={{ marginTop: 16, borderTop: `1px solid ${PROD_BRAND.border}`, paddingTop: 16 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: PROD_BRAND.navy, marginBottom: 12, fontFamily: "var(--font-montserrat)" }}>Job Diagnostics</h4>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, color: PROD_BRAND.gray, width: 80, flexShrink: 0 }}>Job ID:</span>
                                <span style={{ fontFamily: "monospace", fontSize: 10, color: PROD_BRAND.navy, background: PROD_BRAND.grayFaint, padding: "2px 6px", borderRadius: 4 }}>{job.id}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(job.id); }}
                                    style={{ background: "none", border: "none", fontSize: 10, cursor: "pointer", color: PROD_BRAND.blue, padding: 0 }}
                                    title="Copy Job ID"
                                >Copy</button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, color: PROD_BRAND.gray, width: 80, flexShrink: 0 }}>Entry ID:</span>
                                <span style={{ fontFamily: "monospace", fontSize: 10, color: PROD_BRAND.navy, background: PROD_BRAND.grayFaint, padding: "2px 6px", borderRadius: 4 }}>{entry.id}</span>
                                <a
                                    href={`/admin?panel=production&entryId=${entry.id}`}
                                    style={{ fontSize: 10, color: PURPLE_CONST, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center" }}
                                >
                                    Open Entry
                                </a>
                            </div>

                            {/* Show callback payload indicator if we have completed assets */}
                            {completedAssets.length > 0 && (
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: PROD_BRAND.gray, width: 80, flexShrink: 0, marginTop: 2 }}>Storage:</span>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {completedAssets.map(a => (
                                            <div key={a.id} style={{ fontSize: 10, fontFamily: "monospace", color: PROD_BRAND.gray, wordBreak: "break-all" }}>
                                                {a.storageUrl ? new URL(a.storageUrl).pathname.split('/').pop() || 'Unknown path' : 'No URL'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {job.errorMessage && (
                                <div style={{ marginTop: 8, background: PROD_BRAND.redFaint, padding: 12, borderRadius: 8, border: `1px solid ${PROD_BRAND.red}44` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: PROD_BRAND.red }}>Error Log</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(job.errorMessage || ""); }}
                                            style={{ background: "none", border: "none", fontSize: 10, cursor: "pointer", color: PROD_BRAND.red, padding: 0, fontWeight: 600 }}
                                        >Copy Error</button>
                                    </div>
                                    <pre style={{ fontSize: 10, color: PROD_BRAND.red, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", maxHeight: 150, overflowY: "auto" }}>
                                        {job.errorMessage}
                                    </pre>
                                </div>
                            )}

                            {/*
                              GCP Cloud Run diagnostics are parked during the Trigger.dev migration.
                              Restore the external log link if we bring Cloud Run back later.
                            */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: PROD_BRAND.gray, width: 80, flexShrink: 0 }}>Worker Log:</span>
                                <span style={{ fontSize: 10, color: PROD_BRAND.gray }}>External worker logs temporarily disabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
