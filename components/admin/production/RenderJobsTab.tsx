"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
    RefreshCw, AlertCircle, CheckCircle2, Clock, Zap,
    Download, Image, Video, Music, FileText, Film,
    RotateCcw, ChevronDown, ChevronUp,
    Trash2, Square, CheckSquare,
} from "lucide-react"
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
        if (!confirm(`Permanently delete ${selected.size} job${selected.size !== 1 ? "s" : ""}?`)) return
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
                    />)}
                </div>
            )}
        </div>
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
}

const JobCard: React.FC<JobCardProps> = ({ job, isExpanded, onToggle, onRetry, isRetrying, isSelected, onSelect }) => {
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
                        <span style={{ fontSize: 12, color: PLATFORM_META[entry.platform as Platform]?.color ?? PROD_BRAND.gray, fontWeight: 600, flexShrink: 0 }}>
                            {PLATFORM_META[entry.platform as Platform]?.label ?? entry.platform}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: PROD_BRAND.gray, flexShrink: 0 }}>
                            {POST_TYPE_META[entry.postType as PostType]?.icon}
                            {POST_TYPE_META[entry.postType as PostType]?.label ?? entry.postType}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: PROD_BRAND.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                                                display: "flex", alignItems: "center", gap: 7,
                                                padding: "6px 12px", borderRadius: 6,
                                                background: isDone ? PROD_BRAND.greenFaint : PROD_BRAND.white,
                                                border: `1px solid ${isDone ? PROD_BRAND.green + "55" : PROD_BRAND.border}`,
                                                fontSize: 11,
                                            }}
                                        >
                                            <span style={{ color: isDone ? PROD_BRAND.green : PROD_BRAND.gray }}>
                                                {ASSET_TYPE_ICON[asset.assetType] ?? <FileText size={12} />}
                                            </span>
                                            <span style={{ color: PROD_BRAND.navy, fontWeight: 600 }}>
                                                {asset.assetType.replace(/_/g, " ")}
                                            </span>
                                            <span style={{ color: PROD_BRAND.gray, fontSize: 10 }}>
                                                {asset.platform}
                                            </span>
                                            {isDone && asset.storageUrl && (
                                                <a
                                                    href={asset.storageUrl}
                                                    download={asset.fileName ?? undefined}
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
                                            )}
                                            {!isDone && (
                                                <span style={{ fontSize: 10, color: PROD_BRAND.gray }}>
                                                    {asset.status.toLowerCase()}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Job ID */}
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: PROD_BRAND.gray }}>Job ID:</span>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: PROD_BRAND.gray }}>{job.id}</span>
                        <a
                            href={`/admin?panel=production&entryId=${entry.id}`}
                            style={{ fontSize: 10, color: PURPLE_CONST, textDecoration: "none", fontWeight: 600 }}
                        >
                            → Open Entry
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
