"use client"

import React, { useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BookOpen, LayoutGrid, LayoutList, Search, Filter, RefreshCw,
    Wand2, Loader2, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react"
import type { CalendarEntryRow, Platform, PostType, PublishStatus } from "./types"
import { IdeaCard } from "./IdeaCard"

// ─── Brand constants ─────────────────────────────────────────────────────────
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

// ─── Filter options ──────────────────────────────────────────────────────────
const ALL_PLATFORMS: Platform[] = ["IG", "FB", "TIKTOK", "LINKEDIN", "EMAIL"]
const ALL_POST_TYPES: PostType[] = ["CAROUSEL", "TEXT_POST", "EMAIL_LESSON"]
const ALL_STATUSES: PublishStatus[] = [
    "DRAFT", "PENDING_APPROVAL", "APPROVED", "GENERATING", "SCHEDULED", "PUBLISHED", "ARCHIVED",
]

// ─── FilterPill ───────────────────────────────────────────────────────────────
function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
            style={
                active
                    ? { background: BRAND.gradient, color: "#fff", boxShadow: BRAND.glow }
                    : { background: "#f1f5f9", color: "#64748b" }
            }
        >
            {label}
        </button>
    )
}

// ─── StatsBar ────────────────────────────────────────────────────────────────
function StatsBar({
    total,
    withScenes,
    withVoiceover,
}: {
    total: number
    withScenes: number
    withVoiceover: number
}) {
    return (
        <div className="flex gap-4 flex-wrap">
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: `${BRAND.navy}11` }}
            >
                <span className="text-[11px] font-black" style={{ color: BRAND.navy }}>
                    {total}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Ideas total</span>
            </div>
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: `${BRAND.purple}11` }}
            >
                <span className="text-[11px] font-black" style={{ color: BRAND.purple }}>
                    {withScenes}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Have scenes</span>
            </div>
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: "#10B98111" }}
            >
                <span className="text-[11px] font-black text-emerald-600">{withVoiceover}</span>
                <span className="text-[10px] text-slate-500 font-semibold">Have voiceover</span>
            </div>
        </div>
    )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface StoryBankTabProps {
    entries: CalendarEntryRow[]
    onRefresh: () => void
}

// ─── StoryBankTab ─────────────────────────────────────────────────────────────
export function StoryBankTab({ entries, onRefresh }: StoryBankTabProps) {
    // ── Layout: grid vs list ─────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("storybank-view") as "grid" | "list") ?? "grid"
        }
        return "grid"
    })

    const setView = useCallback((v: "grid" | "list") => {
        setViewMode(v)
        localStorage.setItem("storybank-view", v)
    }, [])

    // ── Filters ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("")
    const [platformFilter, setPlatformFilter] = useState<Platform | "ALL">("ALL")
    const [postTypeFilter, setPostTypeFilter] = useState<PostType | "ALL">("ALL")
    const [statusFilter, setStatusFilter] = useState<PublishStatus | "ALL">("ALL")
    const [funnelFilter, setFunnelFilter] = useState<string>("ALL")
    const [showFilters, setShowFilters] = useState(false)

    // ── Bulk generate ────────────────────────────────────────────────────────
    const [bulkGenerating, setBulkGenerating] = useState(false)

    // ── Computed stats ───────────────────────────────────────────────────────
    // We track which entries have scenes via a local state map that gets updated
    // after cards call their expand endpoint
    const [scenesMap, setScenesMap] = useState<Record<string, boolean>>({})
    const [voiceoverMap] = useState<Record<string, boolean>>({})

    const withScenes = useMemo(
        () => Object.values(scenesMap).filter(Boolean).length,
        [scenesMap]
    )
    const withVoiceover = useMemo(
        () => Object.values(voiceoverMap).filter(Boolean).length,
        [voiceoverMap]
    )

    // ── Filter logic ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        const validEntries = Array.isArray(entries) ? entries : [];
        return validEntries.filter((e) => {
            if (platformFilter !== "ALL" && e.platform !== platformFilter) return false
            if (postTypeFilter !== "ALL" && e.postType !== postTypeFilter) return false
            if (statusFilter !== "ALL" && e.publishStatus !== statusFilter) return false
            if (q) {
                const hay = [
                    e.topic,
                    e.contentGoal,
                    e.contentIdea?.hook,
                    e.platform,
                    e.postType,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                if (!hay.includes(q)) return false
            }
            return true
        })
    }, [entries, platformFilter, postTypeFilter, statusFilter, search])

    // ── Pagination ────────────────────────────────────────────────────────
    const PAGE_SIZE = 12
    const [storyPage, setStoryPage] = useState(1)

    // Reset page when filters change without creating an effect
    // We achieve this by deriving the current valid page in render based on total pages
    const totalStoryPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    // Auto-correct page if it is out of bounds due to filter change
    if (storyPage > totalStoryPages && storyPage !== 1) {
        setStoryPage(1)
    }
    const paginatedFiltered = filtered.slice((storyPage - 1) * PAGE_SIZE, storyPage * PAGE_SIZE)

    // ── Bulk generate all without scenes ────────────────────────────────────
    const handleBulkGenerate = useCallback(async () => {
        setBulkGenerating(true)
        const without = entries.filter((e) => !scenesMap[e.id])
        for (const e of without) {
            try {
                await fetch(`/api/production/calendar/${e.id}/scenes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ platform: e.platform, postType: e.postType }),
                })
                setScenesMap((m) => ({ ...m, [e.id]: true }))
                // small delay to avoid rate limits
                await new Promise((r) => setTimeout(r, 800))
            } catch {
                // continue
            }
        }
        setBulkGenerating(false)
        onRefresh()
    }, [entries, onRefresh, scenesMap])

    // ── Clear filters ────────────────────────────────────────────────────────
    const clearFilters = useCallback(() => {
        setSearch("")
        setPlatformFilter("ALL")
        setPostTypeFilter("ALL")
        setStatusFilter("ALL")
        setFunnelFilter("ALL")
    }, [])

    const filtersActive =
        platformFilter !== "ALL" ||
        postTypeFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        funnelFilter !== "ALL" ||
        search !== ""

    return (
        <div className="space-y-5">
            {/* ── Header row ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: BRAND.gradientSoft }}
                    >
                        <BookOpen size={18} style={{ color: BRAND.purple }} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-800">Story Bank</h2>
                        <p className="text-xs text-slate-400 font-medium">
                            {filtered.length} of {entries.length} ideas
                        </p>
                    </div>
                </div>

                {/* Right-side controls */}
                <div className="flex items-center gap-2">
                    {/* Refresh */}
                    <button
                        onClick={onRefresh}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className="text-slate-500" />
                    </button>

                    {/* Bulk generate */}
                    <button
                        onClick={handleBulkGenerate}
                        disabled={bulkGenerating || entries.length === withScenes}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                        title={`Generate scenes for ${entries.length - withScenes} entries without scenes`}
                    >
                        {bulkGenerating ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <Wand2 size={13} />
                        )}
                        {bulkGenerating
                            ? "Generating…"
                            : `Bulk Expand (${entries.length - withScenes} left)`}
                    </button>

                    {/* Grid / List toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-100">
                        <button
                            onClick={() => setView("grid")}
                            aria-label="Grid view"
                            className="p-2 transition-colors"
                            style={viewMode === "grid" ? { background: BRAND.gradientSoft } : { background: "#f8fafc" }}
                        >
                            <LayoutGrid size={14} style={{ color: viewMode === "grid" ? BRAND.purple : "#94a3b8" }} />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            aria-label="List view"
                            className="p-2 transition-colors"
                            style={viewMode === "list" ? { background: BRAND.gradientSoft } : { background: "#f8fafc" }}
                        >
                            <LayoutList size={14} style={{ color: viewMode === "list" ? BRAND.purple : "#94a3b8" }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats bar ──────────────────────────────────────────────── */}
            <StatsBar
                total={entries.length}
                withScenes={withScenes}
                withVoiceover={withVoiceover}
            />

            {/* ── Search + Filter row ─────────────────────────────────────── */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search topics, hooks, goals…"
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-100 transition-all"
                        />
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters((f) => !f)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={
                            filtersActive
                                ? { background: BRAND.gradientSoft, color: BRAND.purple }
                                : { background: "#f1f5f9", color: "#6B7280" }
                        }
                    >
                        <Filter size={12} />
                        Filters
                        {filtersActive && (
                            <span
                                className="w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                                style={{ background: BRAND.purple }}
                            >
                                •
                            </span>
                        )}
                        <ChevronDown
                            size={11}
                            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                        />
                    </button>

                    {filtersActive && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Filter panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div
                                className="rounded-2xl p-4 space-y-3"
                                style={{ background: BRAND.gradientSoft }}
                            >
                                {/* Platform filter */}
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Platform
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <FilterPill
                                            label="All"
                                            active={platformFilter === "ALL"}
                                            onClick={() => setPlatformFilter("ALL")}
                                        />
                                        {ALL_PLATFORMS.map((p) => (
                                            <FilterPill
                                                key={p}
                                                label={p}
                                                active={platformFilter === p}
                                                onClick={() =>
                                                    setPlatformFilter((cur) =>
                                                        cur === p ? "ALL" : p
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Post type filter */}
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Post Type
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <FilterPill
                                            label="All"
                                            active={postTypeFilter === "ALL"}
                                            onClick={() => setPostTypeFilter("ALL")}
                                        />
                                        {ALL_POST_TYPES.map((pt) => (
                                            <FilterPill
                                                key={pt}
                                                label={pt.replace("_", " ")}
                                                active={postTypeFilter === pt}
                                                onClick={() =>
                                                    setPostTypeFilter((cur) =>
                                                        cur === pt ? "ALL" : pt
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Status filter */}
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Status
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <FilterPill
                                            label="All"
                                            active={statusFilter === "ALL"}
                                            onClick={() => setStatusFilter("ALL")}
                                        />
                                        {ALL_STATUSES.map((s) => (
                                            <FilterPill
                                                key={s}
                                                label={s.replace("_", " ")}
                                                active={statusFilter === s}
                                                onClick={() =>
                                                    setStatusFilter((cur) =>
                                                        cur === s ? "ALL" : s
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Card grid / list ─────────────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <BookOpen size={32} className="text-slate-200" />
                    <p className="text-sm font-bold text-slate-400">No ideas match your filters</p>
                    <button
                        onClick={clearFilters}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                        style={{ background: BRAND.gradientSoft, color: BRAND.purple }}
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <motion.div
                    layout
                    className={
                        viewMode === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            : "flex flex-col gap-3"
                    }
                >
                    <AnimatePresence mode="popLayout">
                        {paginatedFiltered.map((entry) => (
                            <IdeaCard
                                key={entry.id}
                                entry={entry}
                                onRefresh={onRefresh}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Pagination controls ───────────────────────────────────── */}
            {totalStoryPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        disabled={storyPage === 1}
                        onClick={() => setStoryPage(p => Math.max(1, p - 1))}
                        className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-bold text-slate-500">
                        Page {storyPage} of {totalStoryPages}
                    </span>
                    <button
                        disabled={storyPage >= totalStoryPages}
                        onClick={() => setStoryPage(p => Math.min(totalStoryPages, p + 1))}
                        className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Pool progress bar */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Scene coverage
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: BRAND.purple }}>
                        {withScenes} / {entries.length}
                    </p>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: BRAND.gradient }}
                        initial={{ width: 0 }}
                        animate={{
                            width: entries.length
                                ? `${(withScenes / entries.length) * 100}%`
                                : "0%",
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                </div>
            </div>
        </div>
    )
}
