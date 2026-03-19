"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    RefreshCw, Zap, Filter, ChevronLeft, ChevronRight,
    BarChart2, AlertCircle, X, Loader2,
} from "lucide-react"
import type {
    CalendarEntryRow, CalendarListResponse, PublishStatus, Platform,
    GenerateCycleResponse,
} from "./types"
import { CalendarTable, PROD_BRAND, STATUS_META, PLATFORM_META } from "./CalendarTable"
import { DayPanel } from "./DayPanel"
import Link from "next/link"

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number | string; color: string; sublabel?: string }> = ({ label, value, color, sublabel }) => (
    <div
        style={{
            flex: "1 1 140px",
            border: `1px solid ${PROD_BRAND.border}`,
            borderRadius: 10,
            padding: "16px 18px",
            background: PROD_BRAND.white,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
    >
        <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: PROD_BRAND.gray, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10, color: PROD_BRAND.gray, marginTop: 3 }}>{sublabel}</div>}
    </div>
)

// ── Filter bar ────────────────────────────────────────────────────────────────
const FilterBar: React.FC<{
    statusFilter: PublishStatus | ""
    platformFilter: Platform | ""
    onStatusChange: (v: PublishStatus | "") => void
    onPlatformChange: (v: Platform | "") => void
    onRefresh: () => void
    refreshing: boolean
}> = ({ statusFilter, platformFilter, onStatusChange, onPlatformChange, onRefresh, refreshing }) => {
    const selectStyle: React.CSSProperties = {
        padding: "6px 10px", borderRadius: 6, border: `1px solid ${PROD_BRAND.border}`,
        fontSize: 12, color: PROD_BRAND.navy, background: PROD_BRAND.white, cursor: "pointer",
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Filter size={14} style={{ color: PROD_BRAND.gray, flexShrink: 0 }} />

            {/* Status filter */}
            <select aria-label="Filter by status" value={statusFilter} onChange={e => onStatusChange(e.target.value as PublishStatus | "")} style={selectStyle}>
                <option value="">All Statuses</option>
                {(Object.keys(STATUS_META) as PublishStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
            </select>

            {/* Platform filter */}
            <select aria-label="Filter by platform" value={platformFilter} onChange={e => onPlatformChange(e.target.value as Platform | "")} style={selectStyle}>
                <option value="">All Platforms</option>
                {(Object.keys(PLATFORM_META) as Platform[]).map(p => (
                    <option key={p} value={p}>{PLATFORM_META[p].label}</option>
                ))}
            </select>

            {/* Refresh */}
            <button
                onClick={onRefresh}
                disabled={refreshing}
                style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 6, border: `1px solid ${PROD_BRAND.border}`,
                    background: PROD_BRAND.white, color: PROD_BRAND.gray,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
            >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing…" : "Refresh"}
            </button>
        </div>
    )
}

// ── Generate Cycle Modal ───────────────────────────────────────────────────────
const GenerateCycleModal: React.FC<{
    open: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    running: boolean
    result: GenerateCycleResponse | null
}> = ({ open, onClose, onConfirm, running, result }) => (
    <AnimatePresence>
        {open && (
            <>
                <motion.div
                    key="modal-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60 }}
                />
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    style={{
                        position: "fixed", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 480, background: PROD_BRAND.white,
                        borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                        padding: 32, zIndex: 70,
                    }}
                >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: PROD_BRAND.navy, marginBottom: 4 }}>
                                Generate 30-Day Cycle
                            </div>
                            <div style={{ fontSize: 13, color: PROD_BRAND.gray, lineHeight: 1.5 }}>
                                This calls Gemini for each day and creates 30 calendar entries with draft content.
                                Existing entries in <strong>DRAFT</strong> will be overwritten. Takes 2–5 minutes.
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: PROD_BRAND.gray, flexShrink: 0 }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Warning */}
                    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 8, background: "#FFF7ED", border: "1px solid #FED7AA", marginBottom: 20 }}>
                        <AlertCircle size={15} style={{ color: "#EA580C", flexShrink: 0, marginTop: 1 }} />
                        <div style={{ fontSize: 12, color: "#9A3412", lineHeight: 1.5 }}>
                            Approved, Scheduled, or Published entries will <strong>not</strong> be overwritten.
                            Only DRAFT and empty slots are regenerated.
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                            <div style={{ flex: 1, padding: "12px 14px", borderRadius: 8, background: PROD_BRAND.greenFaint, textAlign: "center" }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: PROD_BRAND.green }}>{result.generated}</div>
                                <div style={{ fontSize: 11, color: PROD_BRAND.gray, marginTop: 2 }}>Generated</div>
                            </div>
                            {result.failed > 0 && (
                                <div style={{ flex: 1, padding: "12px 14px", borderRadius: 8, background: PROD_BRAND.redFaint, textAlign: "center" }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: PROD_BRAND.red }}>{result.failed}</div>
                                    <div style={{ fontSize: 11, color: PROD_BRAND.gray, marginTop: 2 }}>Failed</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button
                            onClick={onClose}
                            style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${PROD_BRAND.border}`, background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                            {result ? "Close" : "Cancel"}
                        </button>
                        {!result && (
                            <button
                                onClick={onConfirm}
                                disabled={running}
                                style={{
                                    padding: "9px 20px", borderRadius: 8, border: "none",
                                    background: running ? PROD_BRAND.border : PROD_BRAND.navy,
                                    color: running ? PROD_BRAND.gray : PROD_BRAND.white,
                                    fontSize: 13, fontWeight: 700,
                                    cursor: running ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", gap: 8,
                                }}
                            >
                                {running
                                    ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                                    : <><Zap size={14} /> Start Generation</>
                                }
                            </button>
                        )}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
)

// ── Main dashboard ─────────────────────────────────────────────────────────────
export function ProductionDashboardClient() {
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

    // ── Derived stats ─────────────────────────────────────────────────────────
    const stats = React.useMemo(() => ({
        total: pagination.total,
        approved: entries.filter(e => e.publishStatus === "APPROVED").length,
        pending: entries.filter(e => e.publishStatus === "PENDING_APPROVAL" || e.publishStatus === "DRAFT").length,
        generating: entries.filter(e => e.publishStatus === "GENERATING").length,
        published: entries.filter(e => e.publishStatus === "PUBLISHED").length,
    }), [entries, pagination.total])

    // ── Fetch calendar list ───────────────────────────────────────────────────
    const fetchCalendar = useCallback(async (page = 1, showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const params = new URLSearchParams()
            if (statusFilter) params.set("status", statusFilter)
            if (platformFilter) params.set("platform", platformFilter)
            params.set("page", String(page))
            params.set("limit", "30")

            const res = await fetch(`/api/production/calendar?${params.toString()}`)
            if (res.ok) {
                const data = await res.json() as CalendarListResponse
                setEntries(data.entries)
                setPagination({ total: data.pagination.total, page: data.pagination.page, totalPages: data.pagination.totalPages })
            }
        } catch { /* silent */ }

        setLoading(false)
        setRefreshing(false)
    }, [statusFilter, platformFilter])

    useEffect(() => {
        // Delay fetch slightly to avoid setting state during the render cycle
        const t = setTimeout(() => fetchCalendar(1), 0)
        return () => clearTimeout(t)
    }, [fetchCalendar])

    // NO auto-polling — user clicks Sync manually to refresh

    // ── Handle row update from DayPanel ──────────────────────────────────────
    const handleEntryUpdated = useCallback((id: string, newStatus: string) => {
        setEntries(prev => prev.map(e =>
            e.id === id ? { ...e, publishStatus: newStatus as PublishStatus } : e
        ))
    }, [])

    // ── Generate 30-day cycle — 1 entry per request to avoid Vercel timeouts ──
    const handleGenerateCycle = async () => {
        const TOTAL = 30
        setGenerating(true)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() + 1)
        startDate.setHours(9, 0, 0, 0)
        const startDateStr = startDate.toISOString()

        let totalGenerated = 0
        let totalFailed = 0

        for (let offset = 0; offset < TOTAL; offset++) {
            try {
                const res = await fetch("/api/production/calendar/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        days: 1,
                        offset,
                        startDate: startDateStr,
                        overwrite: offset === 0,
                    }),
                })
                const ct = res.headers.get("content-type") ?? ""
                if (!ct.includes("application/json")) {
                    // Vercel returned an HTML error page (timeout / crash)
                    console.error(`[generate] offset ${offset} returned non-JSON (${res.status})`)
                    totalFailed++
                    continue
                }
                const data = await res.json() as GenerateCycleResponse
                totalGenerated += data.generated ?? 0
                totalFailed += data.failed ?? 0
            } catch {
                totalFailed++
            }
        }

        setGenerateResult({ generated: totalGenerated, failed: totalFailed, entries: [] })
        await fetchCalendar(1)
        setGenerating(false)
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#F8FAFC",
                fontFamily: "'Inter', system-ui, sans-serif",
            }}
        >
            {/* Top nav strip */}
            <div
                style={{
                    background: PROD_BRAND.white,
                    borderBottom: `1px solid ${PROD_BRAND.border}`,
                    padding: "0 32px",
                    display: "flex",
                    alignItems: "center",
                    height: 56,
                    gap: 16,
                    position: "sticky",
                    top: 0,
                    zIndex: 30,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
            >
                {/* Breadcrumb */}
                <Link href="/admin" style={{ fontSize: 13, color: PROD_BRAND.gray, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    Admin
                </Link>
                <ChevronRight size={14} style={{ color: PROD_BRAND.border }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: PROD_BRAND.navy, display: "flex", alignItems: "center", gap: 6 }}>
                    <BarChart2 size={15} style={{ color: PROD_BRAND.blue }} />
                    Production Calendar
                </span>

                <div style={{ flex: 1 }} />

                {/* Generate button */}
                <button
                    onClick={() => { setGenerateResult(null); setGenerateModalOpen(true) }}
                    style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "7px 18px", borderRadius: 8, border: "none",
                        background: PROD_BRAND.navy, color: PROD_BRAND.white,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                >
                    <Zap size={14} /> Generate 30-Day Cycle
                </button>
            </div>

            {/* Page content */}
            <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

                {/* Stats row */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                    <StatCard label="Total Entries" value={stats.total} color={PROD_BRAND.navy} />
                    <StatCard label="Approved" value={stats.approved} color={PROD_BRAND.green} sublabel="Ready to render" />
                    <StatCard label="Pending" value={stats.pending} color={PROD_BRAND.amber} sublabel="Needs review" />
                    <StatCard label="Generating" value={stats.generating} color={PROD_BRAND.blue} sublabel="Background jobs active" />
                    <StatCard label="Published" value={stats.published} color={PROD_BRAND.green} sublabel="Live content" />
                </div>

                {/* Filter bar */}
                <div
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 16, flexWrap: "wrap", gap: 12,
                    }}
                >
                    <FilterBar
                        statusFilter={statusFilter}
                        platformFilter={platformFilter}
                        onStatusChange={(v) => { setStatusFilter(v); fetchCalendar(1) }}
                        onPlatformChange={(v) => { setPlatformFilter(v); fetchCalendar(1) }}
                        onRefresh={() => fetchCalendar(pagination.page, true)}
                        refreshing={refreshing}
                    />

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => fetchCalendar(pagination.page - 1)}
                                aria-label="Previous page"
                                style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${PROD_BRAND.border}`, background: "transparent", cursor: "pointer" }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: 12, color: PROD_BRAND.gray }}>
                                Page {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchCalendar(pagination.page + 1)}
                                aria-label="Next page"
                                style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${PROD_BRAND.border}`, background: "transparent", cursor: "pointer" }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Calendar table card */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: PROD_BRAND.white,
                        border: `1px solid ${PROD_BRAND.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <CalendarTable
                        entries={entries}
                        selectedId={selectedId}
                        onSelect={(entry) => setSelectedId(entry.id)}
                        loading={loading}
                    />
                </motion.div>
            </div>

            {/* Day panel slide-out */}
            <DayPanel
                entryId={selectedId}
                onClose={() => setSelectedId(null)}
                onEntryUpdated={handleEntryUpdated}
            />

            {/* Generate cycle modal */}
            <GenerateCycleModal
                open={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onConfirm={handleGenerateCycle}
                running={generating}
                result={generateResult}
            />
        </div>
    )
}
