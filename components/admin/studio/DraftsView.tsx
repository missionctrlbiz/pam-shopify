"use client"

import Image from "next/image"
import { useState } from "react"
import {
    ArrowRight,
    Brain,
    CheckCircle2,
    Circle,
    Eye,
    Grip,
    GripVertical,
    Images,
    List,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    WandSparkles,
} from "lucide-react"
import {
    GRADIENT_BG_CLASS,
    GRADIENT_SHADOW_CLASS,
    PillBadge,
    Segment,
    type DraftCardItem,
} from "./shared"

export { type DraftCardItem }

export function DraftsView({ cards, activePackageId, onOpenDraft, onCreateNew }: { cards: DraftCardItem[]; activePackageId: string | null; onOpenDraft: (id: string) => void; onCreateNew: () => void }) {
    const [search, setSearch] = useState("")
    const filteredCards = cards.filter((card) => card.title.toLowerCase().includes(search.toLowerCase()))
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-[15px] font-extrabold text-[#041f50]">Drafts</h1>
                    <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">{cards.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-[11.5px] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                    </div>
                    <button onClick={onCreateNew} className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11.5px] font-bold text-white ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <Plus size={10} />
                        New
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="inline-flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1">
                            <Segment active label="All" count={String(cards.length)} icon={GripVertical} />
                            <Segment label="Approve" count={String(cards.filter((card) => card.status === "ready").length)} icon={CheckCircle2} />
                            <Segment label="Generating" count={String(cards.filter((card) => card.status === "progress").length)} icon={RefreshCw} />
                            <Segment label="Draft" count={String(cards.filter((card) => card.status === "draft").length)} icon={Circle} />
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <button title="Grid view" aria-label="Grid view" className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#041f50]"><Grip size={11} /></button>
                            <button title="List view" aria-label="List view" className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100"><List size={11} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredCards.map((card) => (
                            <button key={card.id} onClick={() => onOpenDraft(card.id)} className={`overflow-hidden rounded-[18px] border bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_50px_-16px_rgba(175,92,233,0.22)] ${activePackageId === card.id ? "border-purple-300 shadow-[0_20px_44px_-18px_rgba(175,92,233,0.32)]" : "border-slate-200"}`}>
                                <DraftCardVisual card={card} />
                                <div className="p-4">
                                    <h3 className="mb-2 text-[13.5px] font-bold leading-snug text-[#041f50]">{card.title}</h3>
                                    <div className="mb-3.5 flex items-center justify-between text-[10.5px] text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            {card.status === "progress" ? <Sparkles size={9} className="text-purple-500" /> : <Images size={9} />}
                                            {card.slides}
                                        </span>
                                        {card.score ? <span className={`${card.status === "progress" ? "font-bold text-purple-500" : "flex items-center gap-1 text-emerald-600"}`}>{card.status === "progress" ? card.score : <><span className="text-[10px]">✦</span>{card.score}</>}</span> : null}
                                        {card.platforms.length > 0 ? (
                                            <div className="flex gap-1.5 text-slate-400">
                                                {card.platforms.map((Icon, index) => <Icon key={index} size={14} />)}
                                            </div>
                                        ) : <span />}
                                    </div>
                                    <div className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-[11.5px] font-bold transition ${card.status === "progress" ? "border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100" : card.status === "draft" ? "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-purple-600" : "border-slate-200 bg-slate-50 text-[#041f50] hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"}`}>
                                        {card.status === "progress" ? <Eye size={10} /> : card.status === "draft" ? <WandSparkles size={10} /> : <ArrowRight size={10} />}
                                        {card.button}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

export function DraftCardVisual({ card }: { card: DraftCardItem }) {
    if (card.cover === "book") {
        return (
            <div className="relative h-40 overflow-hidden bg-[#041f50]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.5),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.22),transparent_55%)]" />
                <div className="absolute left-3 top-3 z-10"><PillBadge status={card.status} /></div>
                <div className="absolute right-3 top-3 z-10"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end gap-3">
                    <Image src="/1.png" alt="book" width={48} height={64} className="h-16 w-12 rounded object-cover ring-1 ring-white/20 shadow-[0_12px_24px_-6px_rgba(0,0,0,.5)]" />
                    <div className="flex-1 min-w-0">
                        <div className="line-clamp-2 bg-[linear-gradient(135deg,#ed415b_0%,#ec5185_50%,#af5ce9_100%)] bg-clip-text text-[20px] font-black leading-tight text-transparent">{card.stat ?? card.title}</div>
                        <p className="mt-1 text-[10px] leading-tight text-white/60">{card.note}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (card.cover === "progress") {
        return (
            <div className="relative h-40 overflow-hidden bg-[linear-gradient(135deg,#1a0f2e_0%,#2d0e3a_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(237,65,91,.2),transparent_65%)]" />
                <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                        <RefreshCw size={20} className="animate-spin text-purple-400" />
                    </div>
                    <div>
                        <p className="text-[12px] font-bold text-white">Generating</p>
                        <p className="mt-0.5 text-[10px] text-white/50">{card.note}</p>
                    </div>
                </div>
                <div className="absolute left-3 top-3 z-10"><PillBadge status={card.status} /></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5"><div className={`h-full w-[60%] ${GRADIENT_BG_CLASS}`} /></div>
            </div>
        )
    }

    if (card.cover === "empty") {
        return (
            <div className="relative flex h-40 items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300">
                        <WandSparkles size={18} className="text-slate-400" />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400">Empty draft</p>
                </div>
                <div className="absolute left-3 top-3"><PillBadge status={card.status} /></div>
            </div>
        )
    }

    return (
        <div className="relative h-40 overflow-hidden bg-[#041f50]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(237,65,91,.4),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(175,92,233,.3),transparent_55%)]" />
            <div className="absolute left-3 top-3 z-10"><PillBadge status={card.status} /></div>
            <div className="absolute right-3 top-3 z-10"><Image src="/favicon-white.png" alt="PAM" width={20} height={20} className="h-5 w-5 opacity-70" /></div>
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="text-center">
                    <Brain size={30} className="mx-auto mb-2 text-purple-400" />
                    <p className="line-clamp-2 px-6 text-[18px] font-black leading-tight text-white">{card.stat ?? card.title}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{card.slides}</p>
                </div>
            </div>
        </div>
    )
}
