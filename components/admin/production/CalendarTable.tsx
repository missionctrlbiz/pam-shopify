"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    Instagram, Facebook, Linkedin, Mail, Video,
    FileText, Film, Presentation, Layers, BookOpen,
    CheckCircle2, XCircle, Clock, Zap, Archive,
    Calendar, Send, ChevronRight,
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
    purple: "#7C3AED",
    purpleFaint: "#F5F3FF",
    gray: "#6B7280",
    grayFaint: "#F9FAFB",
    white: "#FFFFFF",
    border: "#E5E7EB",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
}

// ── Status badge ──────────────────────────────────────────────────────────────
export const STATUS_META: Record<PublishStatus, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    DRAFT: { label: "Draft", bg: PROD_BRAND.grayFaint, color: PROD_BRAND.gray, icon: <Clock size={12} /> },
    PENDING_APPROVAL: { label: "Pending", bg: PROD_BRAND.amberFaint, color: PROD_BRAND.amber, icon: <Clock size={12} /> },
    APPROVED: { label: "Approved", bg: PROD_BRAND.greenFaint, color: PROD_BRAND.green, icon: <CheckCircle2 size={12} /> },
    GENERATING: { label: "Rendering", bg: PROD_BRAND.blueFaint, color: PROD_BRAND.blue, icon: <Zap size={12} /> },
    SCHEDULED: { label: "Scheduled", bg: PROD_BRAND.purpleFaint, color: PROD_BRAND.purple, icon: <Calendar size={12} /> },
    PUBLISHED: { label: "Published", bg: PROD_BRAND.greenFaint, color: PROD_BRAND.green, icon: <Send size={12} /> },
    ARCHIVED: { label: "Archived", bg: PROD_BRAND.grayFaint, color: PROD_BRAND.gray, icon: <Archive size={12} /> },
}

export const QG_META: Record<QualityGateStatus, { label: string; color: string }> = {
    PENDING: { label: "—", color: PROD_BRAND.gray },
    PASSED: { label: "✓ Pass", color: PROD_BRAND.green },
    FAILED: { label: "✗ Fail", color: PROD_BRAND.red },
    BYPASSED: { label: "↩ Bypass", color: PROD_BRAND.amber },
}

export const PLATFORM_META: Record<Platform, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    IG: { label: "IG", icon: <Instagram size={14} />, color: "#E1306C", bg: "#FDF2F8" },
    FB: { label: "FB", icon: <Facebook size={14} />, color: "#1877F2", bg: "#EFF6FF" },
    LINKEDIN: { label: "LI", icon: <Linkedin size={14} />, color: "#0A66C2", bg: "#EFF6FF" },
    EMAIL: { label: "EM", icon: <Mail size={14} />, color: "#EA4335", bg: "#FEF2F2" },
    TIKTOK: { label: "TT", icon: <Video size={14} />, color: "#000000", bg: "#F3F4F6" },
}

export const POST_TYPE_META: Record<PostType, { label: string; icon: React.ReactNode }> = {
    CAROUSEL: { label: "Carousel", icon: <Layers size={13} /> },
    TEXT_POST: { label: "Text Post", icon: <FileText size={13} /> },
    EMAIL_LESSON: { label: "Email", icon: <BookOpen size={13} /> },
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: PublishStatus }> = ({ status }) => {
    const meta = STATUS_META[status] ?? STATUS_META.DRAFT
    return (
        <span
            style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 20,
                background: meta.bg, color: meta.color,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
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

// ── PlatformIcon ──────────────────────────────────────────────────────────────
const PlatformChip: React.FC<{ platform: string }> = ({ platform }) => {
    const meta = (PLATFORM_META as any)[platform] || { label: platform, icon: <FileText size={14} />, color: PROD_BRAND.gray, bg: PROD_BRAND.grayFaint }
    return (
        <span
            style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 8,
                background: meta.bg, color: meta.color,
                fontSize: 11, fontWeight: 700,
            }}
            title={platform}
        >
            {meta.icon}
            {meta.label}
        </span>
    )
}

// ── PostTypeChip ──────────────────────────────────────────────────────────────
const PostTypeChip: React.FC<{ postType: string }> = ({ postType }) => {
    const meta = (POST_TYPE_META as any)[postType] || { icon: <FileText size={12} />, label: postType.replace(/_/g, " ") }
    return (
        <span
            style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 11, fontWeight: 600, color: PROD_BRAND.gray,
            }}
        >
            {meta.icon}
            {meta.label}
        </span>
    )
}

// ── CalendarTable (Modern Card-Row Design) ────────────────────────────────────
interface CalendarTableProps {
    entries: CalendarEntryRow[]
    selectedId: string | null
    onSelect: (entry: CalendarEntryRow) => void
    loading: boolean
    bulkSelectedIds?: Set<string>
    onToggleSelect?: (id: string) => void
    onToggleSelectAll?: (allIds: string[]) => void
}

export const CalendarTable: React.FC<CalendarTableProps> = ({
    entries, selectedId, onSelect, loading, bulkSelectedIds, onToggleSelect, onToggleSelectAll
}) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading content…</p>
            </div>
        )
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Calendar size={28} className="text-slate-300" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-slate-600 mb-1">No entries yet</p>
                    <p className="text-sm text-slate-400">Click &quot;Generate 5&quot; to create your first batch of content.</p>
                </div>
            </div>
        )
    }

    const allSelected = entries.length > 0 && bulkSelectedIds?.size === entries.length

    return (
        <div className="space-y-2 p-1">
            {/* Header / Select All row (optional, simplified) */}
            {onToggleSelectAll && entries.length > 0 && (
                <div className="px-5 py-2 flex items-center gap-4 border-b border-slate-100">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => onToggleSelectAll(entries.map(e => e.id))}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-500 uppercase">Select All</span>
                </div>
            )}
            {entries.map((entry, idx) => {
                const isSelected = entry.id === selectedId
                const qgStatus = entry.contentIdea?.qualityGateStatus ?? "PENDING"
                const qgScore = entry.contentIdea?.qualityGateResult?.overallScore ?? null
                const dateStr = new Date(entry.entryDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                })

                return (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.015, duration: 0.2 }}
                        onClick={() => onSelect(entry)}
                        className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                            ? "bg-blue-50 ring-2 ring-blue-200 shadow-sm"
                            : "hover:bg-slate-50 hover:shadow-sm"
                            }`}
                        style={{
                            borderLeft: isSelected ? `3px solid ${PROD_BRAND.blue}` : "3px solid transparent",
                        }}
                    >
                        {/* Checkbox */}
                        {onToggleSelect && (
                            <div className="flex-shrink-0 flex items-center justify-center mr-1" onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={bulkSelectedIds?.has(entry.id) || false}
                                    onChange={() => onToggleSelect(entry.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                        )}

                        {/* Day number badge */}
                        <div
                            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                            style={{
                                background: isSelected ? PROD_BRAND.blue : "#F1F5F9",
                                color: isSelected ? "#FFF" : PROD_BRAND.navy,
                            }}
                        >
                            {String(entry.dayNumber).padStart(2, "0")}
                        </div>

                        {/* Platform + type chips */}
                        <div className="flex flex-col gap-1 flex-shrink-0 w-[72px]">
                            <PlatformChip platform={entry.platform} />
                            <PostTypeChip postType={entry.postType} />
                        </div>

                        {/* Topic / Hook — the main content column */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-slate-800 truncate leading-tight mb-0.5">
                                {entry.topic ?? "Untitled"}
                            </p>
                            {entry.contentIdea?.hook && entry.contentIdea.hook !== entry.topic && (
                                <p className="text-[11px] text-slate-400 truncate leading-snug">
                                    {entry.contentIdea.hook}
                                </p>
                            )}
                        </div>

                        {/* Date */}
                        <div className="hidden lg:block flex-shrink-0 text-[11px] text-slate-400 font-medium w-[80px] text-right">
                            {dateStr}
                        </div>

                        {/* Quality Gate */}
                        <div className="hidden md:block flex-shrink-0 w-[60px] text-center">
                            <QGBadge status={qgStatus} score={qgScore} />
                        </div>

                        {/* Status badge */}
                        <div className="flex-shrink-0">
                            <StatusBadge status={entry.publishStatus} />
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight
                            size={14}
                            className={`flex-shrink-0 transition-all ${isSelected ? "text-blue-400" : "text-slate-200 group-hover:text-slate-400"
                                }`}
                        />
                    </motion.div>
                )
            })}
        </div>
    )
}
