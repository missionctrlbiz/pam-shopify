"use client"

/**
 * PublishTab — Publishing Pipeline UI
 *
 * Surfaces the Email Blast and Buffer multi-channel distribution tools,
 * plus a Scheduling Sync dashboard grid showing upcoming/past releases.
 *
 * Key UX guarantees:
 *  • Optimistic disabled loader — buttons lock during in-flight requests so
 *    admins cannot fire duplicate blasts concurrently.
 *  • Email quota indicator — real-time today/limit display warns before cap.
 *  • Buffer queue-depth pills — shows headroom per profile before dispatch.
 *  • Rate-limit feedback — surfaces 429 channels visibly without crashing.
 */

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Mail, Send, RefreshCw, AlertCircle, CheckCircle2,
    Loader2, Clock, Users, Zap, Calendar, ExternalLink,
    Linkedin, Instagram, Video, Globe, Shield, ChevronDown,
} from "lucide-react"
import { PROD_BRAND } from "./CalendarTable"
import type {
    PublishState,
    PublishPayload,
    PublishResponse,
    BufferProfile,
    ScheduledPostRow,
    PublishJob,
    PublishChannel,
    AudienceSource,
    ContentAsset,
} from "./types"

// ── Channel icons ─────────────────────────────────────────────────────────────

const CHANNEL_META: Record<PublishChannel, { label: string; color: string; Icon: React.ElementType }> = {
    EMAIL:     { label: "Email",     color: "#3B82F6", Icon: Mail },
    LINKEDIN:  { label: "LinkedIn",  color: "#0A66C2", Icon: Linkedin },
    TIKTOK:    { label: "TikTok",    color: "#010101", Icon: Video },
    INSTAGRAM: { label: "Instagram", color: "#E1306C", Icon: Instagram },
    FACEBOOK:  { label: "Facebook",  color: "#1877F2", Icon: Globe },
}

// ── Status badge helper ───────────────────────────────────────────────────────

function StatusPill({ status }: { status: PublishJob["status"] | ScheduledPostRow["status"] }) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
        PENDING:      { label: "Pending",      bg: PROD_BRAND.amberFaint,  color: PROD_BRAND.amber },
        RUNNING:      { label: "Running",      bg: PROD_BRAND.blueFaint,   color: PROD_BRAND.blue },
        COMPLETE:     { label: "Complete",     bg: PROD_BRAND.greenFaint,  color: PROD_BRAND.green },
        FAILED:       { label: "Failed",       bg: PROD_BRAND.redFaint,    color: PROD_BRAND.red },
        RATE_LIMITED: { label: "Rate Limited", bg: "#FFF7ED",              color: "#EA580C" },
        scheduled:    { label: "Scheduled",    bg: PROD_BRAND.purpleFaint, color: PROD_BRAND.purple },
        sent:         { label: "Sent",         bg: PROD_BRAND.greenFaint,  color: PROD_BRAND.green },
        failed:       { label: "Failed",       bg: PROD_BRAND.redFaint,    color: PROD_BRAND.red },
    }
    const meta = map[status] ?? { label: status, bg: PROD_BRAND.grayFaint, color: PROD_BRAND.gray }
    return (
        <span style={{ background: meta.bg, color: meta.color }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide">
            {meta.label}
        </span>
    )
}

// ── Buffer profile pill ───────────────────────────────────────────────────────

function BufferProfilePill({
    profile,
    selected,
    onToggle,
}: {
    profile: BufferProfile
    selected: boolean
    onToggle: () => void
}) {
    const meta = CHANNEL_META[profile.service.toUpperCase() as PublishChannel]
        ?? { label: profile.service, color: "#6B7280", Icon: Globe }
    const queuePct = profile.bufferMax > 0 ? profile.bufferCount / profile.bufferMax : 0
    const atCapacity = profile.bufferCount >= profile.bufferMax
    const Icon = meta.Icon

    return (
        <button
            onClick={onToggle}
            disabled={atCapacity}
            title={atCapacity ? "Queue full — wait for posts to be published" : `${profile.bufferCount}/${profile.bufferMax} slots used`}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                ${selected && !atCapacity
                    ? "border-[var(--color-psych-blue)] bg-blue-50 text-blue-700"
                    : atCapacity
                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
        >
            <Icon size={15} style={{ color: meta.color }} />
            <span>{profile.serviceUsername || meta.label}</span>
            {/* Queue depth indicator */}
            <span className="ml-1 flex items-center gap-1">
                <span className={`text-xs font-mono ${atCapacity ? "text-red-500" : "text-slate-400"}`}>
                    {profile.bufferCount}/{profile.bufferMax}
                </span>
                <span className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <span
                        className="h-full rounded-full block transition-all"
                        style={{
                            width: `${Math.min(100, queuePct * 100)}%`,
                            background: atCapacity ? PROD_BRAND.red : queuePct > 0.7 ? PROD_BRAND.amber : PROD_BRAND.green,
                        }}
                    />
                </span>
            </span>
            {atCapacity && <AlertCircle size={13} className="text-red-400" />}
        </button>
    )
}

// ── Quota bar ─────────────────────────────────────────────────────────────────

function QuotaBar({ used, limit }: { used: number; limit: number }) {
    const pct = limit > 0 ? used / limit : 0
    const color = pct >= 0.9 ? PROD_BRAND.red : pct >= 0.7 ? PROD_BRAND.amber : PROD_BRAND.green
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{used} sent today</span>
                <span>{limit - used} remaining</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct * 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
            <p className="text-xs text-slate-400">{limit}/day cap (Resend free tier)</p>
        </div>
    )
}

// ── Scheduling Sync Grid ──────────────────────────────────────────────────────

function SchedulingGrid({ posts, loading }: { posts: ScheduledPostRow[]; loading: boolean }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 size={22} className="animate-spin mr-2" />
                <span className="text-sm">Loading schedule…</span>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                <Calendar size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No scheduled posts yet</p>
                <p className="text-xs mt-1">Dispatch Buffer posts above to populate this grid.</p>
            </div>
        )
    }

    // Group by date
    const groups = posts.reduce<Record<string, ScheduledPostRow[]>>((acc, p) => {
        const date = new Date(p.scheduledAt).toLocaleDateString("en-US", {
            weekday: "short", month: "short", day: "numeric",
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(p)
        return acc
    }, {})

    return (
        <div className="space-y-4">
            {Object.entries(groups).map(([date, groupPosts]) => (
                <div key={date}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{date}</p>
                    <div className="space-y-2">
                        {groupPosts.map((post) => {
                            const meta = CHANNEL_META[post.channel] ?? { label: post.channel, color: "#6B7280", Icon: Globe }
                            const Icon = meta.Icon
                            const time = new Date(post.scheduledAt).toLocaleTimeString("en-US", {
                                hour: "2-digit", minute: "2-digit",
                            })
                            return (
                                <div key={post.id}
                                    className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${meta.color}15` }}>
                                        <Icon size={16} style={{ color: meta.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700">{meta.label}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {post.bufferPostId
                                                ? `Buffer ID: ${post.bufferPostId}`
                                                : post.assetId
                                                ? `Asset: ${post.assetId.slice(0, 8)}…`
                                                : "Manual post"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-slate-400 font-mono">{time}</span>
                                        <StatusPill status={post.status} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Recent jobs list ──────────────────────────────────────────────────────────

function RecentJobs({ jobs }: { jobs: PublishJob[] }) {
    const [expanded, setExpanded] = useState(false)
    const visible = expanded ? jobs : jobs.slice(0, 5)

    if (jobs.length === 0) {
        return <p className="text-sm text-slate-400 text-center py-6">No publish jobs yet.</p>
    }

    return (
        <div className="space-y-2">
            {visible.map((job) => {
                const meta = CHANNEL_META[job.channel] ?? { label: job.channel, color: "#6B7280", Icon: Globe }
                const Icon = meta.Icon
                return (
                    <div key={job.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.color}15` }}>
                            <Icon size={14} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-700">{meta.label}</span>
                            {job.recipientCount !== null && (
                                <span className="ml-2 text-slate-400 text-xs">{job.recipientCount} recipients</span>
                            )}
                            {job.errorMessage && (
                                <p className="text-xs text-red-500 mt-0.5 truncate">{job.errorMessage}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(job.createdAt).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                            </span>
                            <StatusPill status={job.status} />
                        </div>
                    </div>
                )
            })}
            {jobs.length > 5 && (
                <button onClick={() => setExpanded(prev => !prev)}
                    className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 flex items-center justify-center gap-1 transition-colors">
                    <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                    {expanded ? "Show less" : `Show ${jobs.length - 5} more`}
                </button>
            )}
        </div>
    )
}

// ── Main PublishTab component ─────────────────────────────────────────────────

export function PublishTab() {
    // ── State ──────────────────────────────────────────────────────────────────
    const [state, setState] = useState<PublishState | null>(null)
    const [stateLoading, setStateLoading] = useState(true)
    const [stateError, setStateError] = useState<string | null>(null)

    // Email blast form
    const [audienceSource, setAudienceSource] = useState<AudienceSource>("buyers")
    const [emailAssetId, setEmailAssetId] = useState("")
    const [emailSubject, setEmailSubject] = useState("")
    const [emailMaxRecipients, setEmailMaxRecipients] = useState(90)
    const [emailAssets, setEmailAssets] = useState<ContentAsset[]>([])
    const [emailAssetsLoading, setEmailAssetsLoading] = useState(false)

    // Buffer form
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set())
    const [bufferAssetId, setBufferAssetId] = useState("")
    const [bufferText, setBufferText] = useState("")
    const [bufferScheduledAt, setBufferScheduledAt] = useState("")
    const [bufferAssets, setBufferAssets] = useState<ContentAsset[]>([])
    const [bufferAssetsLoading, setBufferAssetsLoading] = useState(false)

    // Dispatch state — shared optimistic lock prevents concurrent blasts
    const [dispatching, setDispatching] = useState(false)
    const [dispatchResult, setDispatchResult] = useState<PublishResponse | null>(null)
    const [dispatchError, setDispatchError] = useState<string | null>(null)

    // ── Load publish state ────────────────────────────────────────────────────

    const loadState = useCallback(async () => {
        setStateLoading(true)
        setStateError(null)
        try {
            const res = await fetch("/api/production/publish")
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json() as PublishState
            setState(data)
        } catch (err) {
            setStateError((err as Error).message)
        } finally {
            setStateLoading(false)
        }
    }, [])

    // Load COMPLETE EMAIL_HTML assets for the email blast selector
    const loadEmailAssets = useCallback(async () => {
        setEmailAssetsLoading(true)
        try {
            const res = await fetch("/api/production/assets?assetType=EMAIL_HTML&status=COMPLETE&limit=50")
            if (!res.ok) return
            const data = await res.json() as { assets?: ContentAsset[] }
            setEmailAssets(data.assets ?? [])
        } catch { /* silent */ } finally {
            setEmailAssetsLoading(false)
        }
    }, [])

    // Load COMPLETE media assets for Buffer
    const loadBufferAssets = useCallback(async () => {
        setBufferAssetsLoading(true)
        try {
            const res = await fetch("/api/production/assets?status=COMPLETE&limit=50")
            if (!res.ok) return
            const data = await res.json() as { assets?: ContentAsset[] }
            // Filter to visual media
            setBufferAssets((data.assets ?? []).filter(
                a => a.assetType === "VIDEO_MP4" || a.assetType === "CAROUSEL_PNG"
            ))
        } catch { /* silent */ } finally {
            setBufferAssetsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadState()
        loadEmailAssets()
        loadBufferAssets()
    }, [loadState, loadEmailAssets, loadBufferAssets])

    // ── Email blast dispatch ───────────────────────────────────────────────────

    const handleEmailBlast = async () => {
        if (!emailAssetId || !emailSubject.trim()) {
            setDispatchError("Please select an asset and enter a subject line.")
            return
        }
        setDispatching(true)
        setDispatchResult(null)
        setDispatchError(null)

        try {
            const payload: PublishPayload = {
                mode: "email",
                email: {
                    audienceSource,
                    assetId: emailAssetId,
                    subject: emailSubject.trim(),
                    maxRecipients: emailMaxRecipients,
                },
            }
            const res = await fetch("/api/production/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json() as PublishResponse
            if (!res.ok) {
                setDispatchError(data.error ?? `Server error ${res.status}`)
            } else {
                setDispatchResult(data)
                await loadState()
            }
        } catch (err) {
            setDispatchError((err as Error).message)
        } finally {
            setDispatching(false)
        }
    }

    // ── Buffer blast dispatch ─────────────────────────────────────────────────

    const handleBufferBlast = async () => {
        if (selectedProfileIds.size === 0) {
            setDispatchError("Select at least one Buffer profile.")
            return
        }
        if (!bufferAssetId || !bufferText.trim()) {
            setDispatchError("Please select an asset and enter post text.")
            return
        }
        setDispatching(true)
        setDispatchResult(null)
        setDispatchError(null)

        try {
            const payload: PublishPayload = {
                mode: "buffer",
                buffer: {
                    profileIds: Array.from(selectedProfileIds),
                    assetId: bufferAssetId,
                    text: bufferText.trim(),
                    scheduledAt: bufferScheduledAt || undefined,
                },
            }
            const res = await fetch("/api/production/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json() as PublishResponse
            if (!res.ok) {
                setDispatchError(data.error ?? `Server error ${res.status}`)
            } else {
                setDispatchResult(data)
                await loadState()
            }
        } catch (err) {
            setDispatchError((err as Error).message)
        } finally {
            setDispatching(false)
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    const toggleProfile = (id: string) => {
        setSelectedProfileIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const emailQuotaOk = state ? state.emailRemainingToday > 0 : false
    const emailReady   = emailQuotaOk && !!emailAssetId && !!emailSubject.trim()
    const bufferReady  = selectedProfileIds.size > 0 && !!bufferAssetId && !!bufferText.trim()

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Publishing Pipeline</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Distribute COMPLETE assets via Email blast and Buffer social scheduling.
                    </p>
                </div>
                <button
                    onClick={() => { loadState(); loadEmailAssets(); loadBufferAssets() }}
                    disabled={stateLoading || dispatching}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
                >
                    <RefreshCw size={13} className={stateLoading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Error state */}
            {stateError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                    <AlertCircle size={16} />
                    <span>Could not load publish state: {stateError}</span>
                </div>
            )}

            {/* Dispatch result / error feedback */}
            <AnimatePresence>
                {(dispatchResult || dispatchError) && (
                    <motion.div
                        key="feedback"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`p-4 rounded-2xl border text-sm space-y-1 ${
                            dispatchError
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                    >
                        {dispatchError ? (
                            <div className="flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span className="font-semibold">{dispatchError}</span>
                            </div>
                        ) : dispatchResult && (
                            <>
                                <div className="flex items-center gap-2 font-semibold">
                                    <CheckCircle2 size={15} />
                                    <span>{dispatchResult.message ?? "Dispatched successfully"}</span>
                                </div>
                                {dispatchResult.emailCount !== undefined && (
                                    <p className="pl-5 text-xs">📧 {dispatchResult.emailCount} emails sent</p>
                                )}
                                {dispatchResult.bufferCount !== undefined && (
                                    <p className="pl-5 text-xs">📅 {dispatchResult.bufferCount} Buffer updates scheduled</p>
                                )}
                                {dispatchResult.quotaWarning && (
                                    <p className="pl-5 text-xs text-amber-600">⚠️ {dispatchResult.quotaWarning}</p>
                                )}
                                {(dispatchResult.rateLimitedChannels ?? []).length > 0 && (
                                    <p className="pl-5 text-xs text-amber-600">
                                        Rate-limited channels: {dispatchResult.rateLimitedChannels?.join(", ")}
                                    </p>
                                )}
                                {(dispatchResult.errors ?? []).length > 0 && (
                                    <ul className="pl-5 text-xs text-red-600 list-disc">
                                        {dispatchResult.errors?.map((msg, i) => <li key={i}>{msg}</li>)}
                                    </ul>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Two-column grid: Email + Buffer ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Email Blast ─────────────────────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-5">
                    {/* Section header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: "#EFF6FF" }}>
                            <Mail size={18} style={{ color: "#3B82F6" }} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800">Email Blast</h3>
                            <p className="text-xs text-slate-400">Resend API — daily quota enforced</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 border border-slate-100">
                            <Shield size={11} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">
                                {stateLoading ? "…" : `${state?.emailSentToday ?? 0}/${state?.emailDailyLimit ?? 90}/day`}
                            </span>
                        </div>
                    </div>

                    {/* Quota bar */}
                    {state && (
                        <QuotaBar used={state.emailSentToday} limit={state.emailDailyLimit} />
                    )}
                    {stateLoading && <div className="h-6 bg-slate-100 rounded-full animate-pulse" />}

                    {/* Audience selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Audience Source
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {(["buyers", "leads", "both"] as AudienceSource[]).map(src => (
                                <button
                                    key={src}
                                    onClick={() => setAudienceSource(src)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all
                                        ${audienceSource === src
                                            ? "border-blue-400 bg-blue-50 text-blue-700"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                        }`}
                                >
                                    <Users size={13} />
                                    {src === "both" ? "Buyers + Leads" : src.charAt(0).toUpperCase() + src.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Asset selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            EMAIL_HTML Asset
                        </label>
                        {emailAssetsLoading ? (
                            <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
                        ) : (
                            <select
                                value={emailAssetId}
                                onChange={e => setEmailAssetId(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">— select a COMPLETE email asset —</option>
                                {emailAssets.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.fileName ?? a.id.slice(0, 12)} ({a.assetType})
                                    </option>
                                ))}
                            </select>
                        )}
                        {!emailAssetsLoading && emailAssets.length === 0 && (
                            <p className="text-xs text-slate-400">
                                No COMPLETE EMAIL_HTML assets found. Generate assets first.
                            </p>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Subject Line
                        </label>
                        <input
                            type="text"
                            value={emailSubject}
                            onChange={e => setEmailSubject(e.target.value)}
                            placeholder="e.g. Your weekly psych case study…"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-300"
                        />
                    </div>

                    {/* Max recipients */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Max Recipients</span>
                            <span className="text-slate-400 font-normal normal-case">
                                throttle cap (max {state?.emailRemainingToday ?? 90})
                            </span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={state?.emailRemainingToday ?? 90}
                            value={emailMaxRecipients}
                            onChange={e => setEmailMaxRecipients(Math.min(
                                state?.emailRemainingToday ?? 90,
                                Math.max(1, parseInt(e.target.value, 10) || 1)
                            ))}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    {/* Dispatch button — optimistic disabled during in-flight */}
                    <button
                        onClick={handleEmailBlast}
                        disabled={dispatching || !emailReady || stateLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: dispatching || !emailReady ? "#CBD5E1" : PROD_BRAND.blue }}
                    >
                        {dispatching ? (
                            <><Loader2 size={16} className="animate-spin" /> Sending…</>
                        ) : (
                            <><Send size={16} /> Send Email Blast</>
                        )}
                    </button>

                    {state?.lastBlastAt && (
                        <p className="text-xs text-slate-400 text-center">
                            Last blast:{" "}
                            {new Date(state.lastBlastAt).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                        </p>
                    )}
                </div>

                {/* ── Buffer Multi-Channel ─────────────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-5">
                    {/* Section header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: "#F5F3FF" }}>
                            <Zap size={18} style={{ color: "#7C3AED" }} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800">Buffer Multi-Channel</h3>
                            <p className="text-xs text-slate-400">
                                LinkedIn · TikTok · Instagram · Facebook (IG cross-post)
                            </p>
                        </div>
                    </div>

                    {/* Profile selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Select Profiles
                        </label>
                        {stateLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (state?.bufferProfiles ?? []).length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <p className="text-sm text-slate-400">
                                    No Buffer profiles found.
                                </p>
                                <a
                                    href="https://buffer.com/app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1 transition-colors"
                                >
                                    Connect profiles in Buffer
                                    <ExternalLink size={11} />
                                </a>
                                <p className="text-xs text-slate-300 mt-1">
                                    Requires <code className="bg-slate-100 px-1 rounded">BUFFER_ACCESS_TOKEN</code> env var.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {state!.bufferProfiles.map(profile => (
                                    <BufferProfilePill
                                        key={profile.id}
                                        profile={profile}
                                        selected={selectedProfileIds.has(profile.id)}
                                        onToggle={() => toggleProfile(profile.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Asset selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Media Asset
                            <span className="ml-1 text-slate-300 font-normal normal-case">(VIDEO_MP4 or CAROUSEL_PNG)</span>
                        </label>
                        {bufferAssetsLoading ? (
                            <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
                        ) : (
                            <select
                                value={bufferAssetId}
                                onChange={e => setBufferAssetId(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">— select a COMPLETE media asset —</option>
                                {bufferAssets.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.fileName ?? a.id.slice(0, 12)} ({a.assetType})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Post text */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Post Caption / Text
                        </label>
                        <textarea
                            rows={4}
                            value={bufferText}
                            onChange={e => setBufferText(e.target.value)}
                            placeholder="Write your post caption here…"
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none placeholder:text-slate-300"
                        />
                        <p className="text-xs text-slate-300 text-right">{bufferText.length} chars</p>
                    </div>

                    {/* Optional schedule time */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Schedule Time
                            <span className="ml-1 text-slate-300 font-normal normal-case">(optional — uses next Buffer slot if blank)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={bufferScheduledAt}
                            onChange={e => setBufferScheduledAt(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>

                    {/* IG → FB cross-post info pill */}
                    <div className="flex items-center gap-2 p-3 bg-pink-50 border border-pink-100 rounded-2xl">
                        <Instagram size={14} className="text-pink-500 flex-shrink-0" />
                        <p className="text-xs text-pink-600">
                            Instagram profiles with a linked Facebook page will automatically cross-post
                            Reels and Carousels — unlocking a 4th distribution channel natively.
                        </p>
                    </div>

                    {/* Dispatch button — optimistic disabled during in-flight */}
                    <button
                        onClick={handleBufferBlast}
                        disabled={dispatching || !bufferReady || stateLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-white transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            background: dispatching || !bufferReady
                                ? "#CBD5E1"
                                : PROD_BRAND.gradient,
                        }}
                    >
                        {dispatching ? (
                            <><Loader2 size={16} className="animate-spin" /> Scheduling…</>
                        ) : (
                            <><Calendar size={16} /> Schedule Buffer Posts</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Scheduling Sync Dashboard Grid ─────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-violet-50">
                            <Clock size={16} style={{ color: PROD_BRAND.purple }} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800">Scheduling Sync Grid</h3>
                            <p className="text-xs text-slate-400">
                                Upcoming scheduled post releases — sorted by dispatch time
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                        {stateLoading ? "…" : `${state?.scheduledPosts.length ?? 0} queued`}
                    </span>
                </div>
                <SchedulingGrid
                    posts={state?.scheduledPosts ?? []}
                    loading={stateLoading}
                />
            </div>

            {/* ── Recent Publish Jobs ─────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-slate-50">
                        <CheckCircle2 size={16} style={{ color: PROD_BRAND.green }} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-800">Recent Publish Jobs</h3>
                        <p className="text-xs text-slate-400">History of dispatched emails and social posts</p>
                    </div>
                </div>
                <RecentJobs jobs={state?.recentJobs ?? []} />
            </div>
        </div>
    )
}
