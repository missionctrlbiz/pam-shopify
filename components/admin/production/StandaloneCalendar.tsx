"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Clock, Loader2 } from "lucide-react"
import { PROD_BRAND } from "./CalendarTable"
import { SchedulingGrid } from "./PublishTab"
import type { PublishState } from "./types"

export function StandaloneCalendar() {
    const [state, setState] = useState<PublishState | null>(null)
    const [stateLoading, setStateLoading] = useState(true)

    const loadState = useCallback(async () => {
        setStateLoading(true)
        try {
            const res = await fetch("/api/production/publish")
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json() as PublishState
            setState(data)
        } catch (err) {
            // silent fail
        } finally {
            setStateLoading(false)
        }
    }, [])

    useEffect(() => {
        loadState()
        const int = setInterval(loadState, 30000)
        return () => clearInterval(int)
    }, [loadState])

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-violet-50">
                            <Clock size={28} style={{ color: PROD_BRAND.purple }} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-extrabold text-[#041f50] tracking-tight">Production Calendar</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                Master view of all finalized pipeline distributions and synced release dates.
                            </p>
                        </div>
                    </div>
                    {stateLoading ? (
                        <div className="flex gap-2 items-center text-slate-400 text-sm font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shrink-0">
                             <Loader2 size={16} className="animate-spin" /> Syncing...
                        </div>
                    ) : (
                        <span className="text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shrink-0 shadow-sm">
                            {state?.scheduledPosts?.length ?? 0} active schedules
                        </span>
                    )}
                </div>

                <SchedulingGrid
                    posts={state?.scheduledPosts ?? []}
                    loading={stateLoading}
                />
            </div>
        </div>
    )
}
