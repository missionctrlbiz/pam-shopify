/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"
import { MotionIcon } from "motion-icons-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
    Users, Mail, BarChart3, LogOut, Plus,
    Trash2, Search, Activity, RefreshCw, Loader2, FileEdit
} from "lucide-react"
import { ContentEditor } from "./ContentEditor"
import Link from "next/link"

interface DashboardStats {
    totalBuyers: number
    totalLeads: number
    totalUsageEvents: number
}

interface BuyerRow { id: string; email: string; createdAt: string }
interface LeadRow { id: string; email: string; name: string | null; source: string; createdAt: string }

type Tab = "overview" | "buyers" | "leads" | "analytics" | "content"

const BRAND = {
    red: "#ed415b",
    pink: "#ec5185",
    purple: "#af5ce9",
    navy: "#041f50",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
    gradientSoft: "linear-gradient(135deg, rgba(237,65,91,0.1), rgba(236,81,133,0.1), rgba(175,92,233,0.1))",
    glow: "0 8px 24px rgba(175, 92, 233, 0.25)",
}

const POLL_INTERVAL = 10000 // 10 seconds

function AnimatedIcon({ iconName, color, size = 20, animation = "pulse" }: { iconName: string; color?: string; size?: number; animation?: any }) {
    return (
        <span style={color ? { color } : {}} className="inline-flex">
            <MotionIcon
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={iconName as any}
                size={size}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                animation={animation as any}
            />
        </span>
    )
}

export function AdminDashboardClient({ session }: { session: any }) {
    const [activeTab, setActiveTab] = useState<Tab>("overview")
    const [newBuyerEmail, setNewBuyerEmail] = useState("")
    const [addingBuyer, setAddingBuyer] = useState(false)
    const [buyerMsg, setBuyerMsg] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    const [stats, setStats] = useState<DashboardStats>({ totalBuyers: 0, totalLeads: 0, totalUsageEvents: 0 })
    const [buyers, setBuyers] = useState<BuyerRow[]>([])
    const [leads, setLeads] = useState<LeadRow[]>([])

    const fetchData = useCallback(async (showSpinner = false) => {
        if (showSpinner) setIsRefreshing(true)
        try {
            const res = await fetch("/api/admin/stats")
            if (res.ok) {
                const data = await res.json()
                setStats(data.stats)
                setBuyers(data.recentBuyers)
                setLeads(data.recentLeads)
                setIsLoaded(true)
            }
        } catch { /* silently fail */ }
        if (showSpinner) setTimeout(() => setIsRefreshing(false), 400)
    }, [])

    // Initial load + auto-poll
    useEffect(() => {
        fetchData(true)
        const interval = setInterval(() => fetchData(false), POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchData])

    async function handleAddBuyer(e: React.FormEvent) {
        e.preventDefault()
        if (!newBuyerEmail.trim()) return
        setAddingBuyer(true)
        setBuyerMsg("")

        try {
            const res = await fetch("/api/admin/buyers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newBuyerEmail.trim().toLowerCase() }),
            })
            const data = await res.json()
            if (res.ok) {
                setBuyerMsg(`✅ ${data.email} added successfully!`)
                setNewBuyerEmail("")
                // Immediately refetch everything for true real-time
                await fetchData(false)
            } else {
                setBuyerMsg(`❌ ${data.error || "Failed to add buyer"}`)
            }
        } catch {
            setBuyerMsg("❌ Network error — check your connection")
        } finally {
            setAddingBuyer(false)
        }
    }

    async function handleDeleteBuyer(id: string) {
        if (!confirm("Remove this buyer from the whitelist?")) return
        try {
            const res = await fetch(`/api/admin/buyers?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                await fetchData(false)
            }
        } catch { /* silently fail */ }
    }

    const tabs: { key: Tab; label: string; icon: any; iconName: string }[] = [
        { key: "overview", label: "Overview", icon: BarChart3, iconName: "LayoutDashboard" },
        { key: "buyers", label: "Buyers List", icon: Users, iconName: "Users" },
        { key: "leads", label: "Captured Leads", icon: Mail, iconName: "Mail" },
        { key: "analytics", label: "Platform Analytics", icon: Activity, iconName: "Activity" },
        { key: "content", label: "Site Content", icon: FileEdit, iconName: "FileEdit" },
    ]

    const statCards = [
        { label: "Verified Buyers", value: stats.totalBuyers, iconName: "Users", color: BRAND.red },
        { label: "Leads Captured", value: stats.totalLeads, iconName: "Mail", color: BRAND.pink },
        { label: "Usage Events", value: stats.totalUsageEvents, iconName: "Activity", color: BRAND.purple },
    ]

    const filteredBuyers = buyers.filter(b => b.email.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 size={32} style={{ color: BRAND.purple }} />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col md:sticky md:top-0 md:h-screen z-40 hidden md:flex">
                <div className="p-6 border-b border-slate-100 flex items-center justify-center">
                    <Link href="/">
                        <Image src="/logo.webp" alt="Logo" width={140} height={45} className="h-10 w-auto object-contain cursor-pointer" />
                    </Link>
                </div>

                <div className="flex flex-col gap-1 p-4 flex-grow overflow-y-auto">
                    <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Menu</p>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left relative ${isActive ? "text-[#041f50] bg-slate-50 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActive"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full"
                                        style={{ background: BRAND.gradient }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <AnimatedIcon iconName={tab.iconName} size={18} color={isActive ? BRAND.purple : "currentColor"} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-slate-100 mt-auto space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shadow-inner">
                            {session?.user?.email?.charAt(0) || "A"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-700 truncate">{session?.user?.email}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Administrator</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header (shown only on small screens) */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex items-center justify-between">
                <Image src="/logo.webp" alt="Logo" width={120} height={35} className="h-8 w-auto object-contain" />
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="p-2 text-slate-500 bg-slate-100 rounded-lg"
                >
                    <LogOut size={18} />
                </button>
            </div>

            {/* Mobile Tab Scroller */}
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex overflow-x-auto gap-2 no-scrollbar">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? "text-white shadow-md" : "text-slate-500 bg-slate-50 border border-slate-100"}`}
                            style={isActive ? { background: BRAND.gradient } : {}}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>


            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 hidden md:block">
                    <div className="px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-extrabold text-[#041f50] tracking-tight">{tabs.find(t => t.key === activeTab)?.label}</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">Sys. Live</span>
                            </div>
                            <button
                                onClick={() => fetchData(true)}
                                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm text-sm font-bold"
                            >
                                <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ duration: 0.6 }}>
                                    <RefreshCw size={14} />
                                </motion.div>
                                Sync Data
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1">
                    <AnimatePresence mode="wait">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                                    {statCards.map((s, i) => (
                                        <motion.div
                                            key={s.label}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.08 }}
                                            className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10" style={{ background: `radial-gradient(circle at top right, ${s.color}, transparent)` }} />
                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex items-start justify-between mb-8">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${s.color}15`, color: s.color }}>
                                                        <AnimatedIcon iconName={s.iconName} size={24} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{s.label}</h3>
                                                    <motion.p
                                                        key={s.value}
                                                        initial={{ scale: 1.1, opacity: 0.7 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="text-4xl font-extrabold text-[#041f50] tracking-tight"
                                                    >
                                                        {s.value}
                                                    </motion.p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                                    <h3 className="text-xl font-bold text-[#041f50] mb-6 tracking-tight">Quick Jump Actions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        {[
                                            { tab: "buyers" as Tab, iconName: "Plus", icon: Plus, label: "Add Buyer", desc: "Whitelist email", color: BRAND.red },
                                            { tab: "leads" as Tab, iconName: "Mail", icon: Mail, label: "View Leads", desc: "Captured emails", color: BRAND.pink },
                                            { tab: "analytics" as Tab, iconName: "Activity", icon: Activity, label: "Analytics", desc: "Track usage", color: BRAND.purple },
                                            { tab: "content" as Tab, iconName: "FileEdit", icon: FileEdit, label: "Edit Site", desc: "Update copy", color: BRAND.red },
                                        ].map(action => (
                                            <button
                                                key={action.tab}
                                                onClick={() => setActiveTab(action.tab)}
                                                className="p-5 border border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl text-left transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 text-slate-700 group-hover:text-[#af5ce9] transition-colors">
                                                    <AnimatedIcon iconName={action.iconName} size={20} />
                                                </div>
                                                <p className="text-[#041f50] text-sm font-bold">{action.label}</p>
                                                <p className="text-slate-500 text-xs mt-1 font-medium">{action.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Buyers Tab */}
                        {activeTab === "buyers" && (
                            <motion.div key="buyers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                                    <h3 className="text-xl font-bold text-[#041f50] mb-6 tracking-tight">Add Buyer Whitelist</h3>
                                    <form onSubmit={handleAddBuyer} className="flex flex-col sm:flex-row gap-4">
                                        <input
                                            type="email"
                                            value={newBuyerEmail}
                                            onChange={e => setNewBuyerEmail(e.target.value)}
                                            placeholder="Add a new verified buyer email..."
                                            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#af5ce9] focus:ring-1 focus:ring-[#af5ce9]/50 transition text-sm font-medium"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={addingBuyer}
                                            className="px-8 py-3.5 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                            style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                                        >
                                            <AnimatedIcon iconName="Plus" size={18} animation="draw" />
                                            {addingBuyer ? "Adding..." : "Whitelist Buyer"}
                                        </button>
                                    </form>
                                    <AnimatePresence>
                                        {buyerMsg && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className={`mt-4 p-4 rounded-xl text-sm font-medium ${buyerMsg.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}
                                            >
                                                {buyerMsg}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-100">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#041f50] tracking-tight">Registered Buyers</h3>
                                            <p className="text-sm font-medium text-slate-500 mt-1">{filteredBuyers.length} total access grants</p>
                                        </div>
                                        <div className="relative w-full md:w-auto">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                placeholder="Search emails..."
                                                className="w-full md:w-64 pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-[#af5ce9] transition shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                                        {filteredBuyers.length === 0 ? (
                                            <div className="text-center py-16">
                                                <p className="text-slate-400 font-medium">No verified buyers found matching your criteria.</p>
                                            </div>
                                        ) : (
                                            filteredBuyers.map((b, i) => (
                                                <motion.div
                                                    key={b.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:px-8 hover:bg-slate-50 transition group gap-4"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                            {b.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-[#041f50] font-bold">{b.email}</p>
                                                            <p className="text-slate-500 text-xs mt-0.5">Added {new Date(b.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteBuyer(b.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition self-end sm:self-auto"
                                                        title="Revoke Access"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Leads Tab */}
                        {activeTab === "leads" && (
                            <motion.div key="leads" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-100">
                                    <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#041f50] tracking-tight">Lead Database</h3>
                                            <p className="text-sm font-medium text-slate-500 mt-1">{leads.length} contacts captured</p>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {leads.length === 0 ? (
                                            <div className="text-center py-20">
                                                <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <AnimatedIcon iconName="Mail" color={BRAND.pink} size={28} />
                                                </div>
                                                <p className="text-slate-500 font-medium">Your lead pipeline is currently empty.</p>
                                            </div>
                                        ) : (
                                            leads.map((l, i) => (
                                                <motion.div
                                                    key={l.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:px-8 hover:bg-slate-50 transition gap-4"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm">
                                                            {l.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-[#041f50] font-bold">{l.email}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {l.name && <span className="text-slate-600 font-medium text-xs">{l.name}</span>}
                                                                {l.name && <span className="text-slate-300">•</span>}
                                                                <span className="text-slate-500 text-xs px-2 py-0.5 bg-slate-100 rounded-full font-medium">{l.source}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-400 font-medium text-xs sm:text-right">
                                                        {new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === "analytics" && (
                            <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                <div className="bg-white rounded-3xl p-12 text-center shadow-xl shadow-slate-200/40 border border-slate-100">
                                    <motion.div
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        className="w-24 h-24 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"
                                    >
                                        <Activity size={48} style={{ color: BRAND.purple }} />
                                    </motion.div>
                                    <h3 className="text-3xl font-extrabold text-[#041f50] mb-4 tracking-tight">Platform Analytics</h3>
                                    <p className="text-slate-500 text-lg max-w-lg mx-auto font-medium">
                                        <strong className="text-purple-600 mx-1">{stats.totalUsageEvents}</strong> AI generation events tracked globally.
                                    </p>
                                    <p className="text-slate-400 mt-6 text-sm">Advanced visual charts and historical telemetry pipelines are currently gathering statistical baseline data.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Content Tab */}
                        {activeTab === "content" && (
                            <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
                                <ContentEditor />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
