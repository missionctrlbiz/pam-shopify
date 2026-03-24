"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarDays, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { PROD_BRAND, STATUS_META } from "./CalendarTable"
import type { CalendarEntryRow, CalendarListResponse, PublishStatus } from "./types"

const BRAND = {
    red: "#ed415b", pink: "#ec5185", purple: "#af5ce9", navy: "#041f50",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
}

// ─── Status badge (Tailwind version) ─────────────────────────────────────────
const STATUS_CLASSES: Record<PublishStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-500",
    PENDING_APPROVAL: "bg-amber-50 text-amber-600",
    APPROVED: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] shadow-sm", // DISTINCT SKY BLUE
    GENERATING: "bg-blue-50 text-blue-600",
    SCHEDULED: "bg-[#fef3c7] text-[#b45309] border-[#fde68a] shadow-sm", // DISTINCT AMBER/YELLOW
    PUBLISHED: "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] shadow-sm", // DISTINCT EMERALD GREEN
    ARCHIVED: "bg-slate-100 text-slate-400",
}

export function StandaloneCalendar() {
    const [allEntries, setAllEntries] = useState<CalendarEntryRow[]>([])
    const [gridLoading, setGridLoading] = useState(true)
    const [viewDate, setViewDate] = useState<Date>(new Date())

    // Pop-up state
    const [selectedDate, setSelectedDate] = useState<number | null>(null)

    // Fetch ALL entries for grid display (no filters, high limit)
    useEffect(() => {
        let isMounted = true
        const load = async () => {
            setGridLoading(true)
            try {
                const res = await fetch("/api/production/calendar?limit=500")
                if (!res.ok) throw new Error(`Status ${res.status}`)
                const data = await res.json() as CalendarListResponse
                if (!isMounted) return
                const safeEntries = Array.isArray(data.entries) ? data.entries : []
                setAllEntries(safeEntries)
                if (safeEntries.length > 0) {
                    setViewDate(new Date(safeEntries[0].entryDate))
                }
            } catch (err) {
                if (isMounted) console.warn("[CalendarGrid] fetch failed", err)
            } finally {
                if (isMounted) setGridLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [])

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay() // 0=Sun

    const monthEntries = allEntries.filter(e => {
        // ENFORCE FILTER: Only show Approved, Scheduled, or Published.
        if (e.publishStatus !== "APPROVED" && e.publishStatus !== "SCHEDULED" && e.publishStatus !== "PUBLISHED") {
            return false
        }
        
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
    while (cells.length < 42) cells.push(null)

    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const selectedEntries = selectedDate ? (byDay[selectedDate] ?? []) : []

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden relative">
                
                {/* Header */}
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50">
                            <CalendarDays size={24} style={{ color: BRAND.purple }} />
                        </div>
                        <div>
                            <h3 className="text-xl font-extrabold text-[#041f50] tracking-tight">Production Master Calendar</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Master visual tracking of all distributed content dates.</p>
                        </div>
                    </div>
                </div>

                {/* Calendar Core */}
                <div className="p-4 md:p-8">
                    {gridLoading ? (
                        <div className="py-24 text-center">
                            <Loader2 size={32} className="mx-auto animate-spin" style={{ color: BRAND.purple }} />
                            <p className="text-slate-500 font-medium mt-4">Loading calendar data…</p>
                        </div>
                    ) : allEntries.length === 0 ? (
                        <div className="py-24 text-center">
                            <CalendarDays size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">No calendar entries yet. Generate entries or import a CSV.</p>
                        </div>
                    ) : (
                        <div className="bg-white border text-sm border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            {/* Nav */}
                            <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-slate-50/50">
                                <button aria-label="Previous month" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition"><ChevronLeft size={16} /></button>
                                <h3 className="text-lg font-extrabold tracking-tight" style={{ color: BRAND.navy }}>
                                    {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
                                </h3>
                                <button aria-label="Next month" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition"><ChevronRight size={16} /></button>
                            </div>

                            {/* DOW */}
                            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 relative">
                                {DOW.map(d => (
                                    <div key={d} className="py-3 text-center text-xs font-extrabold text-[#041f50] uppercase tracking-wider">{d}</div>
                                ))}
                            </div>

                            {/* Days */}
                            <div className="grid grid-cols-7">
                                {cells.map((day, idx) => {
                                    const dayEntries = day ? (byDay[day] ?? []) : []
                                    const isToday = day !== null && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => { if (day && dayEntries.length > 0) setSelectedDate(day) }}
                                            className={`min-h-[100px] border-b border-r border-slate-100 p-2 transition-colors ${day ? "hover:bg-slate-50/70" : "bg-slate-50/30"} ${day && dayEntries.length > 0 ? "cursor-pointer" : ""}`}
                                        >
                                            {day && (
                                                <>
                                                    <div className={`text-xs font-bold mb-1.5 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday ? "text-white shadow-md shadow-pink-500/20" : "text-slate-600"}`}
                                                        style={isToday ? { background: BRAND.gradient } : {}}>
                                                        {day}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        {dayEntries.slice(0, 3).map(e => (
                                                            <div key={e.id} className={`text-[10px] font-bold truncate px-2 py-1 rounded-md border border-slate-200/50 ${STATUS_CLASSES[e.publishStatus]}`}>
                                                                {e.platform}
                                                            </div>
                                                        ))}
                                                        {dayEntries.length > 3 && (
                                                            <div className="text-[10px] text-slate-400 font-bold px-1 text-center">+{dayEntries.length - 3} more</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Legend */}
                            <div className="p-4 bg-slate-50/50 flex flex-wrap gap-3">
                                {([ "APPROVED", "SCHEDULED", "PUBLISHED" ] as PublishStatus[]).map(s => (
                                    <div key={s} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_CLASSES[s]}`}>
                                        {STATUS_META[s].icon}
                                        {STATUS_META[s].label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pop Up For Day view */}
                <AnimatePresence>
                    {selectedDate && (
                        <>
                            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
                            
                            <motion.div key="modal"
                                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] bg-white rounded-3xl shadow-2xl p-7 z-[110]"
                            >
                                <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-xl font-extrabold tracking-tight text-[#041f50]">
                                            Scheduled for {new Date(year, month, selectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">All posts pinned to this exact date.</p>
                                    </div>
                                    <button onClick={() => setSelectedDate(null)} aria-label="Close" className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedEntries.map(e => (
                                        <div key={e.id} className="p-4 border border-slate-100 hover:border-[#af5ce9]/30 rounded-2xl bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border border-slate-200/50 tracking-wider ${STATUS_CLASSES[e.publishStatus]}`}>
                                                    {e.publishStatus.replace("_", " ")}
                                                </span>
                                                <span className="text-xs font-extrabold text-slate-700">{e.platform}</span>
                                            </div>
                                            <p className="text-sm font-bold text-[#041f50] mb-1">{e.topic}</p>
                                            <p className="text-xs font-medium text-slate-500">{e.postType}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}
