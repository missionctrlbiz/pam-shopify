"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    Instagram, Facebook, Linkedin, Mail, Video,
    FileText, Film, Presentation, Layers, BookOpen,
    CheckCircle2, XCircle, Clock, Zap, Archive,
    Calendar, Send,
} from "lucide-react"
import type { CalendarEntryRow, PublishStatus, Platform, PostType, QualityGateStatus } from "./types"

// ── Brand ─────────────────────────────────────────────────────────────────────
export const PROD_BRAND = {
    navy: "#1F2A44",
    blue: "#3B82F6",
    blueLight: "#60A5FA",
    blueFaint: "#EFF6FF",
    green: "#10B981",
    greenFaint: "#ECFDF5",
    red: "#EF4444",
    redFaint: "#FEF2F2",
    amber: "#F59E0B",
    amberFaint: "#FFFBEB",
    gray: "#6B7280",
    grayFaint: "#F9FAFB",
    white: "#FFFFFF",
    border: "#E5E7EB",
}

// ── Status badge ──────────────────────────────────────────────────────────────
export const STATUS_META: Record<PublishStatus, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    DRAFT:            { label: "Draft",     bg: PROD_BRAND.grayFaint, color: PROD_BRAND.gray,  icon: <Clock size={12} /> },
    PENDING_APPROVAL: { label: "Pending",   bg: PROD_BRAND.amberFaint,color: PROD_BRAND.amber, icon: <Clock size={12} /> },
    APPROVED:         { label: "Approved",  bg: PROD_BRAND.greenFaint, color: PROD_BRAND.green, icon: <CheckCircle2 size={12} /> },
    GENERATING:       { label: "Rendering", bg: PROD_BRAND.blueFaint,  color: PROD_BRAND.blue,  icon: <Zap size={12} /> },
    SCHEDULED:        { label: "Scheduled", bg: PROD_BRAND.blueFaint,  color: PROD_BRAND.blue,  icon: <Calendar size={12} /> },
    PUBLISHED:        { label: "Published", bg: PROD_BRAND.greenFaint, color: PROD_BRAND.green, icon: <Send size={12} /> },
    ARCHIVED:         { label: "Archived",  bg: PROD_BRAND.grayFaint,  color: PROD_BRAND.gray,  icon: <Archive size={12} /> },
}

export const QG_META: Record<QualityGateStatus, { label: string; color: string }> = {
    PENDING:  { label: "—",        color: PROD_BRAND.gray  },
    PASSED:   { label: "✓ Pass",   color: PROD_BRAND.green },
    FAILED:   { label: "✗ Fail",   color: PROD_BRAND.red   },
    BYPASSED: { label: "↩ Bypass", color: PROD_BRAND.amber },
}

export const PLATFORM_META: Record<Platform, { label: string; icon: React.ReactNode; color: string }> = {
    IG:       { label: "Instagram", icon: <Instagram size={14} />, color: "#E1306C" },
    FB:       { label: "Facebook",  icon: <Facebook  size={14} />, color: "#1877F2" },
    TIKTOK:   { label: "TikTok",    icon: <Film      size={14} />, color: "#010101" },
    LINKEDIN: { label: "LinkedIn",  icon: <Linkedin  size={14} />, color: "#0A66C2" },
    EMAIL:    { label: "Email",     icon: <Mail      size={14} />, color: "#EA4335" },
    VIDEO:    { label: "Video",     icon: <Video     size={14} />, color: "#7C3AED" },
}

export const POST_TYPE_META: Record<PostType, { label: string; icon: React.ReactNode }> = {
    CAROUSEL:     { label: "Carousel",   icon: <Layers       size={13} /> },
    VIDEO:        { label: "Video",      icon: <Video        size={13} /> },
    TEXT_POST:    { label: "Text Post",  icon: <FileText     size={13} /> },
    REEL:         { label: "Reel",       icon: <Film         size={13} /> },
    STORY:        { label: "Story",      icon: <Presentation size={13} /> },
    EMAIL_LESSON: { label: "Email",      icon: <BookOpen     size={13} /> },
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: PublishStatus }> = ({ status }) => {
    const meta = STATUS_META[status] ?? STATUS_META.DRAFT
    return (
        <span
            style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 20,
                background: meta.bg, color: meta.color,
                fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                whiteSpace: "nowrap",
            }}
        >
            {meta.icon}{meta.label}
        </span>
    )
}

// ── QGBadge ───────────────────────────────────────────────────────────────────
export const QGBadge: React.FC<{ status: QualityGateStatus; score?: number | null }> = ({ status, score }) => {
    const meta = QG_META[status] ?? QG_META.PENDING
    return (
        <span style={{ fontSize: 12, fontWeight: 600, color: meta.color, whiteSpace: "nowrap" }}>
            {meta.label}{status === "PASSED" && score != null ? ` ${Number(score).toFixed(1)}` : ""}
        </span>
    )
}

// ── CalendarTable ─────────────────────────────────────────────────────────────
interface CalendarTableProps {
    entries: CalendarEntryRow[]
    selectedId: string | null
    onSelect: (entry: CalendarEntryRow) => void
    loading: boolean
}

export const CalendarTable: React.FC<CalendarTableProps> = ({
    entries, selectedId, onSelect, loading,
}) => {
    const headCell: React.CSSProperties = {
        padding: "10px 14px", textAlign: "left",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: PROD_BRAND.gray,
        borderBottom: `2px solid ${PROD_BRAND.border}`,
        whiteSpace: "nowrap", background: PROD_BRAND.white,
        position: "sticky", top: 0, zIndex: 2,
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", color: PROD_BRAND.gray, fontSize: 14 }}>
                    <span className="animate-spin" style={{ display: "inline-block" }}>⟳</span>
                    Loading calendar…
                </div>
            </div>
        )
    }

    if (entries.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "80px 40px", color: PROD_BRAND.gray }}>
                <Calendar size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No entries yet</div>
                <div style={{ fontSize: 14 }}>Click "Generate 30-Day Cycle" to create the calendar.</div>
            </div>
        )
    }

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={headCell}>Day</th>
                        <th style={headCell}>Date</th>
                        <th style={headCell}>Platform</th>
                        <th style={headCell}>Type</th>
                        <th style={headCell}>Topic / Hook</th>
                        <th style={headCell}>Field</th>
                        <th style={headCell}>QG</th>
                        <th style={headCell}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, idx) => {
                        const isSelected = entry.id === selectedId
                        const plat = PLATFORM_META[entry.platform]
                        const postType = POST_TYPE_META[entry.postType]
                        const qgStatus = entry.contentIdea?.qualityGateStatus ?? "PENDING"
                        const qgScore = entry.contentIdea?.qualityGateResult?.overallScore ?? null

                        return (
                            <motion.tr
                                key={entry.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.012, duration: 0.2 }}
                                onClick={() => onSelect(entry)}
                                style={{
                                    cursor: "pointer",
                                    background: isSelected
                                        ? PROD_BRAND.blueFaint
                                        : idx % 2 === 0 ? PROD_BRAND.white : PROD_BRAND.grayFaint,
                                    borderLeft: isSelected
                                        ? `3px solid ${PROD_BRAND.blue}`
                                        : "3px solid transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                {/* Day */}
                                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: PROD_BRAND.navy, borderBottom: `1px solid ${PROD_BRAND.border}` }}>
                                    {String(entry.dayNumber).padStart(2, "0")}
                                </td>
                                {/* Date */}
                                <td style={{ padding: "10px 14px", fontSize: 12, color: PROD_BRAND.gray, borderBottom: `1px solid ${PROD_BRAND.border}`, whiteSpace: "nowrap" }}>
                                    {new Date(entry.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </td>
                                {/* Platform */}
                                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${PROD_BRAND.border}` }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: plat.color }}>
                                        {plat.icon}{plat.label}
                                    </span>
                                </td>
                                {/* Post type */}
                                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${PROD_BRAND.border}` }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: PROD_BRAND.gray }}>
                                        {postType.icon}{postType.label}
                                    </span>
                                </td>
                                {/* Topic / Hook */}
                                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${PROD_BRAND.border}`, maxWidth: 300 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: PROD_BRAND.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {entry.topic ?? "—"}
                                    </div>
                                    {entry.contentIdea?.hook && (
                                        <div style={{ fontSize: 11, color: PROD_BRAND.gray, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {entry.contentIdea.hook}
                                        </div>
                                    )}
                                </td>
                                {/* Clinical field */}
                                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${PROD_BRAND.border}`, whiteSpace: "nowrap" }}>
                                    <span style={{ fontSize: 11, color: PROD_BRAND.gray }}>
                                        {entry.contentIdea?.clinicalField?.displayName ?? "—"}
                                    </span>
                                </td>
                                {/* Quality gate */}
                                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${PROD_BRAND.border}` }}>
                                    <QGBadge status={qgStatus} score={qgScore} />
                                </td>
                                {/* Status */}
                                <td style={{ padding: "10px 14px", borderBottom: `1px solid ${PROD_BRAND.border}` }}>
                                    <StatusBadge status={entry.publishStatus} />
                                </td>
                            </motion.tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
