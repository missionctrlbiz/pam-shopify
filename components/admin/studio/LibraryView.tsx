"use client"

import Image from "next/image"
import { useState } from "react"
import {
    ArrowRight,
    Brain,
    Grip,
    HeartPulse,
    Moon,
    Search,
    Star,
} from "lucide-react"
import {
    GRADIENT_BG_CLASS,
    GRADIENT_SHADOW_CLASS,
    type LibraryCardItem,
} from "./shared"

export { type LibraryCardItem }

export function LibraryView({ cards, allItems, onUseTemplate }: { cards: LibraryCardItem[]; allItems: Array<{ id: string; title: string }>; onUseTemplate: (id: string) => void }) {
    const [search, setSearch] = useState("")
    const filteredCards = cards.filter((card) => card.title.toLowerCase().includes(search.toLowerCase()))
    const featured = filteredCards.slice(0, 3)
    const remaining = filteredCards.slice(3)
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-[15px] font-extrabold text-[#041f50]">Library</h1>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{cards.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-[11.5px] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-500">Approved in Supabase: {cards.length}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-8">
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Star size={12} className="text-amber-400" />
                                <h2 className="text-[13px] font-bold text-[#041f50]">Top Performers</h2>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">Highest quality scores first</span>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {featured.map((item) => (
                                <div key={item.title} className="overflow-hidden rounded-[18px] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-16px_rgba(175,92,233,0.22)]">
                                    <LibraryTopVisual item={item} />
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            {item.platforms.map((Icon, index) => <Icon key={index} size={14} />)}
                                        </div>
                                        <button onClick={() => onUseTemplate(allItems.find((entry) => entry.title === item.title)?.id ?? allItems[0]?.id ?? "")} className="flex items-center gap-1.5 text-[11px] font-bold text-purple-500 transition hover:text-pink-500">
                                            Use template
                                            <ArrowRight size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center gap-2.5">
                            <Grip size={12} className="text-slate-400" />
                            <h2 className="text-[13px] font-bold text-[#041f50]">All Approved</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {remaining.map((item, index) => (
                                <button key={item.title} onClick={() => onUseTemplate(allItems.find((entry) => entry.title === item.title)?.id ?? allItems[0]?.id ?? "")} className="overflow-hidden rounded-[14px] border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_24px_-12px_rgba(15,23,42,0.14)]">
                                    <div className={`flex h-24 items-center justify-center ${index % 2 === 0 ? "bg-[linear-gradient(135deg,#ed415b,#ec5185)]" : "bg-[#041f50]"}`}>
                                        {index % 2 === 0 ? <HeartPulse size={24} className="text-white" /> : <Moon size={24} className="text-purple-400" />}
                                    </div>
                                    <div className="p-3">
                                        <p className="truncate text-[11.5px] font-bold text-[#041f50]">{item.title}</p>
                                        <p className="mt-0.5 text-[9.5px] text-slate-400">{item.meta}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {filteredCards.length === 0 ? <p className="text-sm text-slate-500">No approved packages are stored in Supabase yet.</p> : null}
                    </section>
                </div>
            </main>
        </div>
    )
}

export function LibraryTopVisual({ item }: { item: LibraryCardItem }) {
    if (item.variant === "book") {
        return (
            <div className="relative h-52 overflow-hidden bg-[#041f50]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.4),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.18),transparent_60%)]" />
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Image src="/1.png" alt="PAM Book" width={176} height={176} className="h-44 w-auto rounded object-contain ring-1 ring-white/15 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.55),0_8px_18px_rgba(175,92,233,0.4)]" />
                </div>
                <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md border border-white/5 bg-[#0a0e1f]/80 px-2 py-1 text-white">
                    <span className="text-[10px] font-bold">{item.score}</span>
                    <span className="text-[10px] text-purple-400">✦</span>
                </div>
                <div className="absolute right-3 top-3 z-20"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[13px] font-bold leading-tight text-white">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-white/55">{item.meta}</p>
                </div>
            </div>
        )
    }

    if (item.variant === "text") {
        return (
            <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#1a0f2e_0%,#0a0e1f_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(237,65,91,.4),transparent_55%)]" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <Brain size={24} />
                    </div>
                    <p className="max-w-[70%] text-center text-[11px] font-semibold leading-snug text-white/70">{item.title}</p>
                </div>
                <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md border border-white/5 bg-[#0a0e1f]/80 px-2 py-1 text-white">
                    <span className="text-[10px] font-bold">{item.score}</span>
                    <span className="text-[10px] text-pink-400">✦</span>
                </div>
                <div className="absolute right-3 top-3 z-20"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[13px] font-bold leading-tight text-white">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-white/55">{item.meta}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-52 overflow-hidden border-b border-slate-100 bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.08),transparent_60%)]" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                <div className="px-6 text-center text-[18px] font-black leading-tight text-[#041f50]">{item.title}</div>
                <p className="mt-2 px-6 text-center text-[11px] font-medium text-slate-500">{item.meta}</p>
            </div>
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-md bg-[#041f50] px-2 py-1 text-white">
                <span className="text-[10px] font-bold">{item.score}</span>
                <span className="text-[10px] text-emerald-400">✦</span>
            </div>
            <div className="absolute right-3 top-3 z-20"><Image src="/logo.webp" alt="PAM" width={68} height={16} className="h-4 w-auto opacity-90" /></div>
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white/70 to-transparent p-4">
                <p className="text-[13px] font-bold leading-tight text-[#041f50]">{item.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{item.meta}</p>
            </div>
        </div>
    )
}
