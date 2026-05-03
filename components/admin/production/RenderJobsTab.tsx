"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    Zap,
    Download,
    Image,
    Music,
    FileText,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Trash2,
    Square,
    CheckSquare,
    X,
    Loader2,
    Copy,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CarouselPreview } from "./CarouselPreview"
import { CarouselViewInline } from "./CarouselViewInline"
import { PROD_BRAND, PLATFORM_META, POST_TYPE_META } from "./CalendarTable"
import type { Platform, PostType } from "./types"

type RenderJobStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "FAILED" | "PARTIAL"
type JobType = "CAROUSEL" | "VIDEO" | "AUDIO" | "REPURPOSE"

interface JobAsset {
    id: string
    assetType: string
    platform: string
    status: string
    storageUrl: string | null
    fileName: string | null
    metadata?: Record<string, unknown> | null
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

const PURPLE = "#af5ce9"
const PURPLE_FAINT = "rgba(175,92,233,0.08)"

const STATUS_CFG: Record<RenderJobStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    QUEUED: { label: "Up next", color: PROD_BRAND.amber, bg: PROD_BRAND.amberFaint, icon: <Clock size={12} /> },
    RUNNING: { label: "Creating", color: PROD_BRAND.blue, bg: PROD_BRAND.blueFaint, icon: <Zap size={12} /> },
    COMPLETE: { label: "Ready", color: PROD_BRAND.green, bg: PROD_BRAND.greenFaint, icon: <CheckCircle2 size={12} /> },
    FAILED: {
        label: "Needs attention",
        color: PROD_BRAND.red,
        bg: PROD_BRAND.redFaint,
        icon: <AlertCircle size={12} />,
    },
    PARTIAL: {
        label: "Partially ready",
        color: PROD_BRAND.amber,
        bg: PROD_BRAND.amberFaint,
        icon: <Clock size={12} />,
    },
}

const JOB_TYPE_ICON: Record<JobType, React.ReactNode> = {
    CAROUSEL: <Image size={14} />,
    AUDIO: <Music size={14} />,
    VIDEO: <Image size={14} />,
    REPURPOSE: <Image size={14} />,
}

const ASSET_TYPE_ICON: Record<string, React.ReactNode> = {
    CAROUSEL_PNG: <Image size={12} />,
    AUDIO_MP3: <Music size={12} />,
    TEXT_POST: <FileText size={12} />,
    EMAIL_HTML: <FileText size={12} />,
    VIDEO_SCRIPT_JSON: <FileText size={12} />,
}

const ASSET_TYPE_LABEL: Record<string, string> = {
    CAROUSEL_PNG: "Carousel",
    AUDIO_MP3: "Audio",
    TEXT_POST: "Caption",
    EMAIL_HTML: "Email",
    VIDEO_SCRIPT_JSON: "Script",
}

function cloneAssetTypeIcon(icon: React.ReactNode, size: number) {
    return React.isValidElement<{ size?: number }>(icon)
        ? React.cloneElement(icon, { size })
        : <FileText size={size} />
}

type FilterTab = "all" | "active" | "failed" | "complete" | "incomplete"

const FILTER_TABS: { id: FilterTab; label: string; status?: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "In progress", status: "QUEUED,RUNNING" },
    { id: "failed", label: "Needs attention", status: "FAILED" },
    { id: "incomplete", label: "Partially ready", status: "PARTIAL" },
    { id: "complete", label: "Ready", status: "COMPLETE" },
]

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

function buildAssetProxyUrl(storageUrl: string, fileName?: string | null): string {
    const params = new URLSearchParams({ url: storageUrl })
    if (fileName) params.set("filename", fileName)
    return `/api/production/assets/proxy?${params.toString()}`
}

function isVisibleJob(job: JobRow): boolean {
    return job.jobType !== "VIDEO" && job.jobType !== "REPURPOSE"
}

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
    const [carouselViewAssetId, setCarouselViewAssetId] = useState<string | null>(null)
    const [confirmModal, setConfirmModal] = useState<{
        title: string
        desc: string
        actionLabel: string
        onConfirm: () => void
    } | null>(null)

    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const showToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

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
        } catch {
            // silent
        }

        if (!quiet) setLoading(false)
    }, [filter])

    useEffect(() => {
        fetchJobs()
        setSelected(new Set())
    }, [fetchJobs])

    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current)
        if (!data?.hasActive) return

        pollRef.current = setInterval(() => {
            if (!document.hidden) fetchJobs(true)
        }, 8000)

        const onVisible = () => {
            if (!document.hidden && data?.hasActive) fetchJobs(true)
        }

        document.addEventListener("visibilitychange", onVisible)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [data?.hasActive, fetchJobs])

    const handleRetry = async (jobId: string) => {
        setRetrying(prev => new Set(prev).add(jobId))

        try {
            const res = await fetch(`/api/production/render-jobs/${jobId}/retry`, { method: "POST" })
            let errorMsg = "Retry failed"

            try {
                const json = await res.json() as { newJobId?: string; error?: string }
                if (res.ok) {
                    showToast("Queued again")
                    await fetchJobs()
                    setRetrying(prev => {
                        const s = new Set(prev)
                        s.delete(jobId)
                        return s
                    })
                    return
                }
                errorMsg = json.error ?? errorMsg
            } catch {
                errorMsg = `Server error (${res.status})`
            }

            console.error(`[Retry] Job ${jobId} failed:`, errorMsg)
            showToast("Could not retry right now", "err")
        } catch (e) {
            console.error("[Retry] Network error:", e)
            showToast("Network error while retrying", "err")
        }

        setRetrying(prev => {
            const s = new Set(prev)
            s.delete(jobId)
            return s
        })
    }

    const toggleExpand = (id: string) =>
        setExpanded(prev => {
            const s = new Set(prev)
            s.has(id) ? s.delete(id) : s.add(id)
            return s
        })

    const toggleSelect = (id: string) =>
        setSelected(prev => {
            const s = new Set(prev)
            s.has(id) ? s.delete(id) : s.add(id)
            return s
        })

    const jobs = (data?.jobs ?? []).filter(isVisibleJob)
    const allSelected = jobs.length > 0 && selected.size === jobs.length
    const someSelected = selected.size > 0 && selected.size < jobs.length

    const selectAll = () => setSelected(new Set(jobs.map(j => j.id)))
    const clearSelect = () => setSelected(new Set())

    const handleBulkRetry = async () => {
        const ids = [...selected].filter(id => jobs.find(j => j.id === id)?.status === "FAILED")
        if (!ids.length) {
            showToast("Select at least one item that needs attention", "err")
            return
        }

        setBulkActing(true)

        try {
            const results = await Promise.all(
                ids.map(id => fetch(`/api/production/render-jobs/${id}/retry`, { method: "POST" }))
            )
            const failed = results.filter(r => !r.ok)

            if (failed.length > 0) {
                console.error(`[BulkRetry] ${failed.length} jobs failed to retry. Check network logs.`)
                showToast(`Could not retry ${failed.length} item${failed.length !== 1 ? "s" : ""}`, "err")
            } else {
                showToast(`Queued ${ids.length} item${ids.length !== 1 ? "s" : ""} again`)
            }

            clearSelect()
            await fetchJobs()
        } catch (e) {
            console.error("[BulkRetry] Error:", e)
            showToast("Bulk retry hit an error", "err")
        }

        setBulkActing(false)
    }

    const handleBulkDelete = async () => {
        setConfirmModal({
            title: "Remove selected items?",
            desc: `This will permanently delete ${selected.size} item${selected.size !== 1 ? "s" : ""} from the queue.`,
            actionLabel: bulkActing ? "Removing…" : "Remove",
            onConfirm: async () => {
                setConfirmModal(null)
                setBulkActing(true)

                try {
                    const res = await fetch("/api/production/render-jobs/bulk", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: [...selected] }),
                    })

                    if (!res.ok) throw new Error("Could not remove selected items")

                    showToast(`Removed ${selected.size} item${selected.size !== 1 ? "s" : ""}`)
                    clearSelect()
                    await fetchJobs()
                } catch (e) {
                    showToast(String(e), "err")
                }

                setBulkActing(false)
            },
        })
    }

    const visibleTotal = jobs.length
    const hasVisibleActive = jobs.some(job => job.status === "QUEUED" || job.status === "RUNNING")

    return (
        <div style={{ position: "relative" }}>
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: toast.type === "ok" ? PROD_BRAND.green : PROD_BRAND.red,
                        color: PROD_BRAND.white,
                        borderRadius: 999,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        zIndex: 999,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {toast.msg}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    gap: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: PROD_BRAND.navy,
                            margin: 0,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Content Queue
                    </h2>

                    <div style={{ fontSize: 12, color: PROD_BRAND.gray, marginTop: 6 }}>
                        {visibleTotal} item{visibleTotal !== 1 ? "s" : ""}
                        {hasVisibleActive && (
                            <span
                                style={{
                                    color: PROD_BRAND.blue,
                                    marginLeft: 10,
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <Zap size={10} />
                                updates automatically while work is in progress
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => fetchJobs()}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "9px 14px",
                        borderRadius: 999,
                        background: "linear-gradient(135deg, rgba(175,92,233,0.08), rgba(236,81,133,0.08))",
                        border: `1px solid ${PURPLE}33`,
                        color: PURPLE,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 6px 18px rgba(175,92,233,0.08)",
                    }}
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 20,
                    padding: 4,
                    background: "#fff",
                    border: `1px solid ${PROD_BRAND.border}`,
                    borderRadius: 16,
                    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)",
                    overflowX: "auto",
                }}
            >
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            padding: "9px 14px",
                            background: filter === tab.id ? PURPLE_FAINT : "transparent",
                            border: "none",
                            borderRadius: 12,
                            color: filter === tab.id ? PURPLE : PROD_BRAND.gray,
                            fontSize: 12,
                            fontWeight: filter === tab.id ? 800 : 600,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: 64,
                        color: PROD_BRAND.gray,
                        fontSize: 14,
                    }}
                >
                    Loading queue…
                </div>
            ) : jobs.length === 0 ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingTop: 72,
                        gap: 12,
                        color: PROD_BRAND.gray,
                        background: "#fff",
                        border: `1px solid ${PROD_BRAND.border}`,
                        borderRadius: 24,
                        paddingBottom: 72,
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
                    }}
                >
                    <CheckCircle2 size={40} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                        Nothing to show here right now.
                    </span>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "4px 6px 8px",
                            borderBottom: `1px solid ${PROD_BRAND.border}`,
                            marginBottom: 2,
                        }}
                    >
                        <button
                            onClick={allSelected ? clearSelect : selectAll}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: 0,
                                color: allSelected || someSelected ? PURPLE : PROD_BRAND.gray,
                            }}
                        >
                            {allSelected ? (
                                <CheckSquare size={15} />
                            ) : someSelected ? (
                                <CheckSquare size={15} style={{ opacity: 0.5 }} />
                            ) : (
                                <Square size={15} />
                            )}
                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                                {allSelected ? "Clear selection" : "Select all"}
                            </span>
                        </button>

                        {selected.size > 0 && (
                            <span style={{ fontSize: 12, color: PURPLE, fontWeight: 800 }}>
                                {selected.size} selected
                            </span>
                        )}
                    </div>

                    {selected.size > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "12px 14px",
                                borderRadius: 18,
                                background: "linear-gradient(135deg, rgba(175,92,233,0.08), rgba(236,81,133,0.06))",
                                border: `1px solid ${PURPLE}22`,
                                marginBottom: 4,
                            }}
                        >
                            <span style={{ fontSize: 12, color: PROD_BRAND.gray, marginRight: 4, fontWeight: 700 }}>
                                Quick actions
                            </span>

                            <button
                                onClick={handleBulkRetry}
                                disabled={bulkActing}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: PURPLE,
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    cursor: bulkActing ? "not-allowed" : "pointer",
                                    opacity: bulkActing ? 0.6 : 1,
                                }}
                            >
                                <RotateCcw size={10} />
                                Retry
                            </button>

                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkActing}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "7px 12px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: PROD_BRAND.red,
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    cursor: bulkActing ? "not-allowed" : "pointer",
                                    opacity: bulkActing ? 0.6 : 1,
                                }}
                            >
                                <Trash2 size={10} />
                                Remove
                            </button>

                            <button
                                onClick={clearSelect}
                                style={{
                                    marginLeft: "auto",
                                    background: "none",
                                    border: "none",
                                    color: PROD_BRAND.gray,
                                    fontSize: 11,
                                    cursor: "pointer",
                                    fontWeight: 700,
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {jobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            isExpanded={expanded.has(job.id)}
                            onToggle={() => toggleExpand(job.id)}
                            onRetry={() => handleRetry(job.id)}
                            isRetrying={retrying.has(job.id)}
                            isSelected={selected.has(job.id)}
                            onSelect={() => toggleSelect(job.id)}
                            onOpenCarousel={(assetId) => setCarouselViewAssetId(assetId)}
                            onPreviewAsset={setPreviewAsset}
                        />
                    ))}
                </div>
            )}

            {previewAsset && previewAsset.assetType !== "CAROUSEL_PNG" && (
                <div
                    onClick={() => setPreviewAsset(null)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(4, 31, 80, 0.4)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "stretch",
                        zIndex: 9999,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: 0,
                            padding: 40,
                            width: "100%",
                            height: "100%",
                            overflowY: "auto",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            gap: 24,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "start",
                                justifyContent: "space-between",
                                borderBottom: `1px solid ${PROD_BRAND.border}`,
                                paddingBottom: 24,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 16,
                                        background: `linear-gradient(135deg, ${PROD_BRAND.blueLight}, ${PROD_BRAND.blue})`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)",
                                    }}
                                >
                                    {React.isValidElement(ASSET_TYPE_ICON[previewAsset.assetType])
                                        ? cloneAssetTypeIcon(ASSET_TYPE_ICON[previewAsset.assetType], 28)
                                        : <FileText size={28} />}
                                </div>

                                <div>
                                    <h4
                                        style={{
                                            fontWeight: 800,
                                            color: PROD_BRAND.navy,
                                            fontSize: 24,
                                            margin: 0,
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {ASSET_TYPE_LABEL[previewAsset.assetType] ?? previewAsset.assetType.replace(/_/g, " ")}
                                    </h4>
                                    <p style={{ fontSize: 13, color: PROD_BRAND.gray, margin: "4px 0 0", fontWeight: 500 }}>
                                        Preview
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setPreviewAsset(null)}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "#f8fafc",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: PROD_BRAND.gray,
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, minHeight: 200 }}>
                            {previewAsset.assetType === "AUDIO_MP3" && previewAsset.storageUrl && (
                                <div style={{ padding: "40px 0" }}>
                                    <audio
                                        controls
                                        autoPlay
                                        style={{ width: "100%", height: 54 }}
                                        src={buildAssetProxyUrl(previewAsset.storageUrl, previewAsset.fileName)}
                                    />
                                </div>
                            )}

                            {(previewAsset.assetType === "TEXT_POST" ||
                                previewAsset.assetType === "EMAIL_HTML" ||
                                previewAsset.assetType === "VIDEO_SCRIPT_JSON") && (() => {
                                const content = (previewAsset.metadata?.content as string) ?? ""

                                return (
                                    <div style={{ width: "100%" }}>
                                        <div
                                            style={{
                                                whiteSpace: "pre-wrap",
                                                background: "#f8fafc",
                                                padding: 32,
                                                borderRadius: 24,
                                                fontSize: 15,
                                                lineHeight: 1.8,
                                                color: PROD_BRAND.navy,
                                                maxHeight: 450,
                                                overflowY: "auto",
                                                border: `1px solid ${PROD_BRAND.border}`,
                                                fontFamily: "var(--font-montserrat)",
                                            }}
                                        >
                                            {content}
                                        </div>

                                        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(content)
                                                    showToast("Copied")
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: "16px",
                                                    background: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: 16,
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    cursor: "pointer",
                                                    boxShadow: "0 10px 25px rgba(175, 92, 233, 0.3)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <Copy size={18} />
                                                Copy text
                                            </button>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </motion.div>
                </div>
            )}

            {carouselViewAssetId && (
                <CarouselViewInline
                    assetId={carouselViewAssetId}
                    onClose={() => setCarouselViewAssetId(null)}
                />
            )}

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

function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    desc,
    actionLabel,
    loading,
}: {
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
                <motion.div
                    key="bd"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(2px)",
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "stretch",
                        zIndex: 10000,
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: "100%",
                            height: "100%",
                            background: "#ffffff",
                            borderRadius: 0,
                            padding: 28,
                            boxShadow: "none",
                            zIndex: 10001,
                            overflow: "auto",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                marginBottom: 16,
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        letterSpacing: "-0.02em",
                                        marginBottom: 4,
                                        color: PROD_BRAND.navy,
                                        margin: 0,
                                    }}
                                >
                                    {title}
                                </h3>
                                <p style={{ fontSize: 13, color: PROD_BRAND.gray, lineHeight: 1.6, margin: "4px 0 0" }}>
                                    {desc}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                aria-label="Close"
                                style={{
                                    padding: 6,
                                    borderRadius: 10,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: PROD_BRAND.gray,
                                    marginLeft: 16,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                style={{
                                    padding: "10px 18px",
                                    borderRadius: 12,
                                    border: `1px solid ${PROD_BRAND.border}`,
                                    background: "#fff",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: PROD_BRAND.gray,
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                style={{
                                    padding: "10px 22px",
                                    borderRadius: 12,
                                    border: "none",
                                    background: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
                                    color: "#fff",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading && <Loader2 size={12} className="animate-spin" />}
                                {actionLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

const PURPLE_CONST = "#af5ce9"

interface JobCardProps {
    job: JobRow
    isExpanded: boolean
    onToggle: () => void
    onRetry: () => void
    isRetrying: boolean
    isSelected: boolean
    onSelect: () => void
    onOpenCarousel: (assetId: string) => void
    onPreviewAsset: (asset: JobAsset) => void
}

const JobCard: React.FC<JobCardProps> = ({ job, isExpanded, onToggle, onRetry, isRetrying, isSelected, onSelect, onOpenCarousel, onPreviewAsset }) => {
    const entry = job.contentIdea.calendarEntry
    const cfg = STATUS_CFG[job.status]
    const isActive = job.status === "QUEUED" || job.status === "RUNNING"
    const isFailed = job.status === "FAILED"
    const completedAssets = job.assets.filter(a => a.status === "COMPLETE" && a.storageUrl)

    return (
        <div style={{
            border: `1px solid ${isFailed ? PROD_BRAND.red + "44" : job.status === "PARTIAL" ? PROD_BRAND.amber + "44" : isActive ? PROD_BRAND.blue + "44" : PROD_BRAND.border}`,
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
                            {relTime(job.queuedAt)}
                        </span>
                        {(job.startedAt || job.completedAt) && (
                            <span style={{ fontSize: 10, color: PROD_BRAND.gray }}>
                                {elapsed(job.startedAt, job.completedAt)}
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
                        padding: "4px 8px", borderRadius: 20,
                        background: cfg.bg, color: cfg.color,
                        fontSize: 11, fontWeight: 700,
                    }}>
                        {isActive ? <RefreshCw size={10} className="animate-spin" /> : cfg.icon}
                    </span>

                    {/* Asset count badge */}
                    {completedAssets.length > 0 && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            padding: "4px 8px", borderRadius: 20,
                            background: PROD_BRAND.greenFaint, color: PROD_BRAND.green,
                            fontSize: 11, fontWeight: 600,
                        }}>
                            <Download size={12} />
                        </span>
                    )}

                    {/* Retry button */}
                    {(isFailed || job.status === "PARTIAL") && (
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
                                ? <><RefreshCw size={10} className="animate-spin" /> Retrying...</>
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


                    {/* Assets */}
                    {job.assets.length > 0 && (
                        <div>
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
                                                    {ASSET_TYPE_LABEL[asset.assetType] ?? asset.assetType.replace(/_/g, " ") ?? "Unknown Asset"}
                                                </span>
                                                {isDone && asset.storageUrl && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <a
                                                            href={asset.assetType === "CAROUSEL_PNG" && asset.metadata?.zipUrl 
                                                                ? buildAssetProxyUrl(asset.metadata.zipUrl as string, (asset.fileName || "carousel").replace(".png", ".zip"))
                                                                : buildAssetProxyUrl(asset.storageUrl, asset.fileName)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                                color: PROD_BRAND.green, textDecoration: "none",
                                                                fontWeight: 800, fontSize: 13,
                                                                padding: "4px 8px", borderRadius: 6,
                                                                background: PROD_BRAND.white, border: `1px solid ${PROD_BRAND.green}44`
                                                            }}
                                                        >
                                                            <Download size={14} /> DL
                                                        </a>
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (asset.assetType === "CAROUSEL_PNG") {
                                                                    onOpenCarousel(asset.id);
                                                                } else {
                                                                    onPreviewAsset(asset); 
                                                                }
                                                            }}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                                color: PURPLE_CONST, background: PROD_BRAND.white,
                                                                border: `1px solid ${PURPLE_CONST}44`,
                                                                fontWeight: 800, fontSize: 13, cursor: "pointer", 
                                                                padding: "4px 8px", borderRadius: 6
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
                                                        <audio controls style={{ width: "100%", height: 26 }} src={buildAssetProxyUrl(asset.storageUrl, asset.fileName)} />
                                                    )}
                                                    {asset.assetType === "VIDEO_MP4" && (
                                                        <video
                                                            controls
                                                            preload="metadata"
                                                            style={{ width: "100%", height: 140, borderRadius: 4, background: "#000", display: "block" }}
                                                            src={buildAssetProxyUrl(asset.storageUrl, asset.fileName)}
                                                        />
                                                    )}
                                                    {asset.assetType === "CAROUSEL_PNG" && (
                                                        <CarouselPreview slideUrls={(asset.metadata?.slideUrls as string[]) ?? []} />
                                                    )}
                                                    {(asset.assetType === "TEXT_POST" || asset.assetType === "EMAIL_HTML" || asset.assetType === "VIDEO_SCRIPT_JSON") && (() => {
                                                        const content = (asset.metadata?.content as string) ?? ""
                                                        const preview = content.slice(0, 90) + (content.length > 90 ? "..." : "")
                                                        return content ? (
                                                            <div style={{ marginTop: 4 }}>
                                                                 <div style={{
                                                                     fontSize: 10, color: PROD_BRAND.gray,
                                                                     background: PROD_BRAND.grayFaint,
                                                                     padding: "4px 6px", borderRadius: 4,
                                                                     marginBottom: 4, lineHeight: 1.4,
                                                                     whiteSpace: "pre-wrap", wordBreak: "break-word",
                                                                 }}>{preview}</div>
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
                                                    {asset.status.toLowerCase()}...
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
