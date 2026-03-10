"use client"

import { useState, useEffect, useCallback } from "react"
import { signOut } from "next-auth/react"
import { MotionIcon } from "motion-icons-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
    Users, Mail, BarChart3, LogOut, Plus,
    Trash2, Search, Activity, RefreshCw, Loader2
} from "lucide-react"

interface DashboardStats {
    totalBuyers: number
    totalLeads: number
    totalUsageEvents: number
}

interface BuyerRow { id: string; email: string; createdAt: string }
interface LeadRow { id: string; email: string; name: string | null; source: string; createdAt: string }

type Tab = "overview" | "buyers" | "leads" | "analytics"

const BRAND = {
    red: "#ed415b",
    pink: "#ec5185",
    purple: "#af5ce9",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
    gradientSoft: "linear-gradient(135deg, rgba(237,65,91,0.15), rgba(236,81,133,0.15), rgba(175,92,233,0.15))",
    glow: "0 4px 30px rgba(175, 92, 233, 0.2)",
}

const POLL_INTERVAL = 10000 // 10 seconds

function AnimatedIcon({ iconName, color, size = 20, animation = "pulse" }: { iconName: string; color?: string; size?: number; animation?: any }) {
    return (
        <span style={color ? { color } : {}} className="inline-flex">
            <MotionIcon
                name={iconName as any}
                size={size}
                animation={animation}
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
        { key: "overview", label: "Overview", icon: BarChart3, iconName: "BarChart3" },
        { key: "buyers", label: "Buyers", icon: Users, iconName: "Users" },
        { key: "leads", label: "Leads", icon: Mail, iconName: "Mail" },
        { key: "analytics", label: "Analytics", icon: Activity, iconName: "Activity" },
    ]

    const statCards = [
        { label: "Verified Buyers", value: stats.totalBuyers, iconName: "Users", color: BRAND.red },
        { label: "Leads Captured", value: stats.totalLeads, iconName: "Mail", color: BRAND.pink },
        { label: "Usage Events", value: stats.totalUsageEvents, iconName: "Activity", color: BRAND.purple },
    ]

    const filteredBuyers = buyers.filter(b => b.email.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 size={32} style={{ color: BRAND.pink }} />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a12]">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl border-b border-white/[0.06]" style={{ background: "rgba(10, 10, 18, 0.85)" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Image src="/logo.webp" alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
                    <div className="flex items-center gap-3">
                        <span className="text-white/40 text-xs hidden sm:block">{session?.user?.email}</span>
                        {/* Live indicator */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-400 text-[10px] font-medium">LIVE</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchData(true)}
                            className="p-2 text-white/40 hover:text-white/80 transition"
                        >
                            <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ duration: 0.6 }}>
                                <RefreshCw size={14} />
                            </motion.div>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06] transition"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </motion.button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Tab Navigation */}
                <div className="flex gap-0.5 p-1 rounded-2xl mb-8 bg-white/[0.02] border border-white/[0.04]">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.key
                        return (
                            <motion.button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${isActive ? "text-white" : "text-white/30 hover:text-white/60"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 rounded-xl border border-white/10"
                                        style={{ background: BRAND.gradientSoft }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <AnimatedIcon iconName={tab.iconName} size={16} />
                                    {tab.label}
                                </span>
                            </motion.button>
                        )
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                {statCards.map((s, i) => (
                                    <motion.div
                                        key={s.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="group relative rounded-2xl p-5 border border-white/[0.06] overflow-hidden cursor-default"
                                        style={{ background: "rgba(255,255,255,0.02)" }}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 50%, ${s.color}08, transparent 70%)` }} />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                                                    <AnimatedIcon iconName={s.iconName} color={s.color} size={20} />
                                                </div>
                                            </div>
                                            <motion.p
                                                key={s.value}
                                                initial={{ scale: 1.1, opacity: 0.7 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="text-3xl font-bold text-white tracking-tight"
                                            >
                                                {s.value}
                                            </motion.p>
                                            <p className="text-white/30 text-sm mt-1">{s.label}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <h3 className="text-base font-semibold text-white mb-5">Quick Actions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { tab: "buyers" as Tab, iconName: "Plus", icon: Plus, label: "Add Buyer", desc: "Whitelist a new email", color: BRAND.red },
                                        { tab: "leads" as Tab, iconName: "Mail", icon: Mail, label: "View Leads", desc: "Browse captured emails", color: BRAND.pink },
                                        { tab: "analytics" as Tab, iconName: "Activity", icon: Activity, label: "Analytics", desc: "Track platform usage", color: BRAND.purple },
                                    ].map(action => (
                                        <motion.button
                                            key={action.tab}
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveTab(action.tab)}
                                            className="p-5 border border-white/[0.06] hover:border-white/[0.12] rounded-2xl text-left transition-all group"
                                            style={{ background: "rgba(255,255,255,0.01)" }}
                                        >
                                            <AnimatedIcon iconName={action.iconName} color={action.color} size={22} animation="bounce" />
                                            <p className="text-white text-sm font-semibold mt-3">{action.label}</p>
                                            <p className="text-white/25 text-xs mt-0.5">{action.desc}</p>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Buyers Tab */}
                    {activeTab === "buyers" && (
                        <motion.div key="buyers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                            <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <h3 className="text-base font-semibold text-white mb-4">Add Buyer to Whitelist</h3>
                                <form onSubmit={handleAddBuyer} className="flex gap-3">
                                    <input
                                        type="email"
                                        value={newBuyerEmail}
                                        onChange={e => setNewBuyerEmail(e.target.value)}
                                        placeholder="buyer@email.com"
                                        className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition text-sm"
                                        required
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="submit"
                                        disabled={addingBuyer}
                                        className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                                        style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                                    >
                                        <AnimatedIcon iconName="Plus" size={16} animation="draw" />
                                        {addingBuyer ? "Adding..." : "Add"}
                                    </motion.button>
                                </form>
                                <AnimatePresence>
                                    {buyerMsg && (
                                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-white/70">
                                            {buyerMsg}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-white">
                                        Whitelist <span className="text-white/20 font-normal text-sm ml-1">({filteredBuyers.length})</span>
                                    </h3>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder="Search..."
                                            className="pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white text-xs placeholder-white/20 focus:outline-none focus:border-white/15 transition w-48"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    {filteredBuyers.length === 0 ? (
                                        <p className="text-white/20 text-sm text-center py-8">No buyers found.</p>
                                    ) : (
                                        filteredBuyers.map((b, i) => (
                                            <motion.div
                                                key={b.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition group"
                                            >
                                                <div>
                                                    <p className="text-white text-sm">{b.email}</p>
                                                    <p className="text-white/20 text-xs">{new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.8 }}
                                                    onClick={() => handleDeleteBuyer(b.id)}
                                                    className="p-2 text-white/10 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={15} />
                                                </motion.button>
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
                            <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <h3 className="text-base font-semibold text-white mb-5">
                                    Captured Leads <span className="text-white/20 font-normal text-sm ml-1">({leads.length})</span>
                                </h3>
                                <div className="space-y-1.5">
                                    {leads.length === 0 ? (
                                        <div className="text-center py-12">
                                            <AnimatedIcon iconName="Mail" color={BRAND.pink} size={32} />
                                            <p className="text-white/20 text-sm mt-3">No leads captured yet.</p>
                                        </div>
                                    ) : (
                                        leads.map((l, i) => (
                                            <motion.div
                                                key={l.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="p-3 rounded-xl hover:bg-white/[0.03] transition"
                                            >
                                                <p className="text-white text-sm">{l.email}</p>
                                                <p className="text-white/20 text-xs">
                                                    {l.name && <span className="text-white/30">{l.name} · </span>}
                                                    {l.source} · {new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                            <div className="rounded-2xl p-6 border border-white/[0.06] text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <div className="py-8">
                                    <motion.div
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        className="inline-block"
                                    >
                                        <Activity size={40} style={{ color: BRAND.pink }} />
                                    </motion.div>
                                    <h3 className="text-lg font-semibold text-white mt-4 mb-2">Usage Analytics</h3>
                                    <p className="text-white/30 text-sm max-w-md mx-auto">
                                        <span className="text-white font-semibold">{stats.totalUsageEvents}</span> events tracked across your platform.
                                        Advanced charts and breakdowns will appear here as more data flows in.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
