"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, RefreshCw, CheckCircle2, ChevronRight,
    FileText, Info,
} from "lucide-react"
import type { CalendarEntryDetail, ApproveResponse, GenerateAssetsResponse } from "./types"
import { PROD_BRAND, StatusBadge, PLATFORM_META, POST_TYPE_META } from "./CalendarTable"
import { QualityGatePanel } from "./QualityGatePanel"
import { AssetGrid } from "./AssetGrid"
import { Button } from "../ui"

type PanelTab = "content" | "quality" | "assets"

const TABS: { id: PanelTab; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "quality", label: "Quality Gate" },
    { id: "assets", label: "Assets" },
]

interface DayPanelProps {
    entryId: string | null
    onClose: () => void
    /** Called after approve / generate so the table row can refresh */
    onEntryUpdated: (id: string, newStatus: string) => void
}

export const DayPanel: React.FC<DayPanelProps> = ({ entryId, onClose, onEntryUpdated }) => {
    const [entry, setEntry] = useState<CalendarEntryDetail | null>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<PanelTab>("content")
    const [approving, setApproving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

    const showToast = (msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    // ── Fetch entry detail ────────────────────────────────────────────────────
    const fetchEntry = useCallback(async (id: string, quiet = false) => {
        if (!quiet) {
            setEntry(null)
            setActiveTab("content")
            setLoading(true)
        }
        try {
            const res = await fetch(`/api/production/calendar/${id}`)
            if (res.ok) {
                const data = await res.json() as { entry: CalendarEntryDetail }
                setEntry(data.entry)
            }
        } catch { /* silent */ }
        if (!quiet) setLoading(false)
    }, [])

    useEffect(() => {
        if (entryId) {
            fetchEntry(entryId)
        }
    }, [entryId, fetchEntry])

    // ── Polling: re-fetch while generating ──────────────────────────────────
    useEffect(() => {
        if (!entry) return
        const hasActive = entry.contentIdea?.renderJobs?.some(
            j => j.status === "QUEUED" || j.status === "RUNNING"
        ) ?? false
        if (!hasActive) return
        const t = setInterval(() => fetchEntry(entry.id, true), 5000)
        return () => clearInterval(t)
    }, [entry, fetchEntry])

    // ── Approve (run quality gate or bypass) ─────────────────────────────────
    const handleApprove = async (bypass = false, bypassReason?: string) => {
        if (!entry) return
        setApproving(true)
        try {
            const res = await fetch(`/api/production/calendar/${entry.id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bypass ? { bypass: true, bypassReason } : {}),
            })
            let errorMsg = "Approve failed"
            try {
                const data = await res.json() as ApproveResponse & { error?: string }
                if (res.ok) {
                    showToast(
                        data.approved
                            ? `Approved — QG score ${data.qualityGate.overallScore.toFixed(1)}`
                            : `Quality gate failed (score ${data.qualityGate.overallScore.toFixed(1)}) — check console`,
                        data.approved ? "ok" : "err"
                    )
                    if (!data.approved) console.warn("[Approve] QG results:", data.qualityGate)
                    onEntryUpdated(entry.id, data.newStatus)
                    await fetchEntry(entry.id)
                    setApproving(false)
                    return
                }
                errorMsg = data.error ?? errorMsg
            } catch {
                errorMsg = `Server error (${res.status})`
            }
            console.error("[Approve] failed:", errorMsg)
            showToast("Approve failed — check console", "err")
        } catch (e) {
            console.error("[Approve] network error:", e)
            showToast("Network error during approve", "err")
        }
        setApproving(false)
    }

    // ── Generate assets ───────────────────────────────────────────────────────
    const handleGenerateAssets = async () => {
        if (!entry) return
        setGenerating(true)
        try {
            const res = await fetch("/api/production/assets/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentIdeaId: entry.contentIdea?.id }),
            })
            let errorMsg = "Generate failed"
            try {
                const data = await res.json() as GenerateAssetsResponse & { error?: string }
                if (res.ok) {
                    if (data.message) {
                        showToast(data.message, "ok")
                    } else {
                        const allInline = data.jobs?.every((j: { taskId: string }) => j.taskId === "inline-complete")
                        showToast(
                            allInline
                                ? `✓ Generated ${data.queued ?? 0} asset set(s) — ready to copy`
                                : `${data.queued ?? 0} job(s) queued for rendering`,
                            "ok"
                        )
                        onEntryUpdated(entry.id, "GENERATING")
                    }
                    await fetchEntry(entry.id)
                    setActiveTab("assets")
                    setGenerating(false)
                    return
                }
                errorMsg = data.error ?? errorMsg
            } catch {
                errorMsg = `Server error (${res.status})`
            }
            console.error("[Generate] failed:", errorMsg)
            showToast("Generation failed — check console", "err")
        } catch (e) {
            console.error("[Generate] network error:", e)
            showToast("Network error during generation", "err")
        }
        setGenerating(false)
    }

    const masterJson = entry?.contentIdea?.masterJson as Record<string, unknown> | null | undefined
    const isApproved = ["APPROVED", "GENERATING"].includes(entry?.publishStatus ?? "")
    const canApprove = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "GENERATING", "FAILED"].includes(entry?.publishStatus ?? "")
    const canGenerate = isApproved

    return (
        <AnimatePresence>
            {entryId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: "fixed", inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            zIndex: 40,
                        }}
                    />

                    {/* Modal Shell */}
                    <motion.div
                        key="panel"
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                            position: "fixed", top: "5%", left: "5%", right: "5%", bottom: "5%",
                            maxWidth: 1000, margin: "0 auto",
                            background: "var(--color-surface)",
                            borderRadius: "24px",
                            zIndex: 50,
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                            overflow: "hidden",
                        }}
                    >
                        {/* Toast */}
                        <AnimatePresence>
                            {toast && (
                                <motion.div
                                    initial={{ opacity: 0, y: -12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    style={{
                                        position: "absolute", top: 16, left: "50%",
                                        transform: "translateX(-50%)",
                                        background: toast.type === "ok" ? PROD_BRAND.green : PROD_BRAND.red,
                                        color: PROD_BRAND.white, borderRadius: 8,
                                        padding: "8px 20px", fontSize: 13, fontWeight: 600,
                                        zIndex: 60, whiteSpace: "nowrap",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                                    }}
                                >
                                    {toast.msg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Panel header */}
                        <div
                            style={{
                                padding: "20px 24px 0",
                                borderBottom: `1px solid ${PROD_BRAND.border}`,
                                flexShrink: 0,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                                {/* Close */}
                                <button
                                    onClick={onClose}
                                    aria-label="Close"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: PROD_BRAND.gray, flexShrink: 0, marginTop: 2 }}
                                >
                                    <X size={18} />
                                </button>

                                {loading ? (
                                    <div style={{ flex: 1, color: PROD_BRAND.gray, fontSize: 14, paddingTop: 4 }}>Loading…</div>
                                ) : entry ? (
                                    <>
                                        {/* Title block */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                                                <span style={{ fontFamily: "monospace", fontSize: 11, background: PROD_BRAND.blueFaint, color: PROD_BRAND.blue, padding: "2px 8px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                                                    Day {String(entry.dayNumber).padStart(2, "0")}
                                                </span>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: PLATFORM_META[entry.platform]?.color, flexShrink: 0 }}>
                                                    {PLATFORM_META[entry.platform]?.icon}
                                                    {PLATFORM_META[entry.platform]?.label}
                                                </span>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: PROD_BRAND.gray, flexShrink: 0 }}>
                                                    {POST_TYPE_META[entry.postType]?.icon}
                                                    {POST_TYPE_META[entry.postType]?.label}
                                                </span>
                                                <StatusBadge status={entry.publishStatus} />
                                            </div>
                                            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-montserrat)", color: PROD_BRAND.navy, lineHeight: 1.3, marginBottom: 4 }}>
                                                {entry.topic ?? "(no topic)"}
                                            </div>
                                            <div style={{ fontSize: 12, fontFamily: "var(--font-montserrat)", color: PROD_BRAND.gray }}>
                                                {new Date(entry.entryDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                                                {entry.contentIdea?.clinicalField && (
                                                    <span style={{ marginLeft: 12 }}>
                                                        Field: <strong>{entry.contentIdea.clinicalField.displayName}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
                                            {canApprove && (
                                                <Button
                                                    onClick={() => handleApprove(false)}
                                                    disabled={approving}
                                                    variant="success"
                                                    size="sm"
                                                >
                                                    {approving ? <><RefreshCw size={12} className="animate-spin mr-2" /> Running…</> : <><CheckCircle2 size={12} className="mr-2" /> Approve</>}
                                                </Button>
                                            )}
                                            {canGenerate && (
                                                <Button
                                                    onClick={handleGenerateAssets}
                                                    disabled={generating}
                                                    variant="primary"
                                                    size="sm"
                                                >
                                                    {generating
                                                        ? <><RefreshCw size={12} className="animate-spin mr-2" /> Queueing…</>
                                                        : <><ChevronRight size={12} className="mr-2" /> Generate Assets</>
                                                    }
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            {/* Tabs */}
                            <div style={{ display: "flex", gap: 0 }}>
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            padding: "8px 18px",
                                            background: "none", border: "none",
                                            borderBottom: activeTab === tab.id
                                                ? `2px solid ${PROD_BRAND.blue}`
                                                : "2px solid transparent",
                                            color: activeTab === tab.id ? PROD_BRAND.blue : PROD_BRAND.gray,
                                            fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 600, fontFamily: "var(--font-montserrat)",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Panel body — scrollable */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                            {loading || !entry ? (
                                <div style={{ display: "flex", justifyContent: "center", paddingTop: 60, color: PROD_BRAND.gray, fontSize: 14 }}>
                                    Loading detail…
                                </div>
                            ) : (
                                <>
                                    {activeTab === "content" && (
                                        <ContentTab entry={entry} masterJson={masterJson ?? null} />
                                    )}
                                    {activeTab === "quality" && (
                                        <QualityGatePanel
                                            result={entry.contentIdea?.qualityGateResult ?? null}
                                            status={entry.contentIdea?.qualityGateStatus ?? "PENDING"}
                                            onRunGate={() => handleApprove(false)}
                                            onBypass={(reason) => handleApprove(true, reason)}
                                            running={approving}
                                        />
                                    )}
                                    {activeTab === "assets" && (
                                        <AssetGrid
                                            assets={entry.contentIdea?.assets ?? []}
                                            renderJobs={entry.contentIdea?.renderJobs ?? []}
                                            entryId={entry.id}
                                            onGenerateAssets={handleGenerateAssets}
                                            generating={generating}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ── ContentTab ─────────────────────────────────────────────────────────────────

const ContentTab: React.FC<{
    entry: CalendarEntryDetail
    masterJson: Record<string, unknown> | null
}> = ({ entry, masterJson }) => {

    const hook = masterJson?.hook as string | undefined
    const cta = masterJson?.cta as string | undefined
    const teachingPoints = masterJson?.teachingPoints as string[] | undefined
    const slideTextBlocks = masterJson?.slideTextBlocks as string[] | undefined
    const clinicalGrounding = masterJson?.clinicalGrounding as string | undefined

    const field = (label: string, value: string | null | undefined) =>
        value ? (
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: PROD_BRAND.blue, marginBottom: 4 }}>
                    {label}
                </div>
                <div style={{ fontSize: 14, color: PROD_BRAND.navy, lineHeight: 1.55 }}>{value}</div>
            </div>
        ) : null

    const listField = (label: string, items: string[] | undefined) =>
        items?.length ? (
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: PROD_BRAND.blue, marginBottom: 8 }}>
                    {label}
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((item, i) => (
                        <li key={i} style={{ fontSize: 13, color: PROD_BRAND.navy, lineHeight: 1.5 }}>{item}</li>
                    ))}
                </ol>
            </div>
        ) : null

    return (
        <div>
            {/* Clinical field info */}
            {entry.contentIdea?.clinicalField && (
                <div style={{ marginBottom: 20, padding: 14, borderRadius: 8, background: PROD_BRAND.blueFaint, border: `1px solid ${PROD_BRAND.blue}22`, display: "flex", gap: 10 }}>
                    <Info size={15} style={{ color: PROD_BRAND.blue, flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: PROD_BRAND.blue }}>
                            {entry.contentIdea.clinicalField.displayName}
                            <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 8, color: PROD_BRAND.gray }}>
                                {entry.contentIdea.clinicalField.fieldCategory.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                            </span>
                        </div>
                        {entry.contentIdea.clinicalField.description && (
                            <div style={{ fontSize: 11, color: PROD_BRAND.gray, marginTop: 3 }}>
                                {entry.contentIdea.clinicalField.description}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ borderBottom: `1px solid ${PROD_BRAND.border}`, paddingBottom: 16, marginBottom: 16 }}>
                {field("Hook", hook ?? entry.contentIdea?.hook)}
            </div>

            <div style={{ borderBottom: `1px solid ${PROD_BRAND.border}`, paddingBottom: 16, marginBottom: 16 }}>
                {listField("Teaching Points", teachingPoints)}
            </div>

            <div style={{ borderBottom: `1px solid ${PROD_BRAND.border}`, paddingBottom: 16, marginBottom: 16 }}>
                {field("Call to Action", cta ?? entry.contentIdea?.cta)}
            </div>

            {clinicalGrounding && (
                <div style={{ borderBottom: `1px solid ${PROD_BRAND.border}`, paddingBottom: 16, marginBottom: 16 }}>
                    {field("Clinical Grounding", clinicalGrounding)}
                </div>
            )}

            {slideTextBlocks?.length ? (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: PROD_BRAND.blue, marginBottom: 8 }}>
                        Carousel Slides ({slideTextBlocks.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {slideTextBlocks.map((text, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: "10px 14px", borderRadius: 8,
                                    background: i === 0 || i === slideTextBlocks.length - 1
                                        ? PROD_BRAND.navy : PROD_BRAND.grayFaint,
                                    border: `1px solid ${PROD_BRAND.border}`,
                                }}
                            >
                                <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 || i === slideTextBlocks.length - 1 ? PROD_BRAND.blueLight : PROD_BRAND.blue, marginBottom: 4, letterSpacing: "0.08em" }}>
                                    SLIDE {i + 1}{i === 0 ? " — COVER" : i === slideTextBlocks.length - 1 ? " — CTA" : ""}
                                </div>
                                <div style={{ fontSize: 13, color: i === 0 || i === slideTextBlocks.length - 1 ? PROD_BRAND.white : PROD_BRAND.navy, lineHeight: 1.45 }}>
                                    {text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {!masterJson && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px", borderRadius: 8, background: PROD_BRAND.amberFaint, color: PROD_BRAND.amber, fontSize: 13 }}>
                    <FileText size={15} />
                    Content idea has not been generated yet. Go back and run a calendar generation.
                </div>
            )}
        </div>
    )
}
