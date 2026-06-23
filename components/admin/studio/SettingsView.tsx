"use client"

import {
    ArrowRight,
    Bookmark,
    CheckCircle2,
    Circle,
    CircleHelp,
    GripVertical,
    ImagePlus,
    Link as LinkIcon,
    MessageCircleMore,
    MicVocal,
    Palette,
    PencilRuler,
    Plus,
    ShieldCheck,
    X,
} from "lucide-react"
import {
    Field,
    SurfaceCard,
    AssetTile,
    DistributionCard,
    GRADIENT_BG_CLASS,
    GRADIENT_SHADOW_CLASS,
    Music2Icon,
    type PlatformKey,
    type SettingsTab,
    type ContextTab,
} from "./shared"
import type { StudioSettings } from "@/lib/studio/types"

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { key: "brand", label: "Brand Brief", icon: Bookmark },
    { key: "voice", label: "Voice & Tone", icon: MicVocal },
    { key: "cta", label: "CTA Presets", icon: ArrowRight },
    { key: "platform", label: "Distribution", icon: LinkIcon },
    { key: "quality", label: "Quality & Defaults", icon: ShieldCheck },
]

const TONE_CARDS = [
    { title: "Authoritative", note: "Clinical · evidence-led · precise." },
    { title: "Empathetic", note: "Warm · accessible · student-first." },
    { title: "Direct", note: "Academic · concise · bullet-driven." },
    { title: "Practitioner", note: "Conversational · POV · field notes." },
]

const HOOK_STYLE_OPTIONS = ["STAT_LED", "QUESTION_LED", "MYTH_BUST", "CHECKLIST"]

const PLATFORM_META: Record<PlatformKey, {
    name: string
    spec: string
    swatchClass: string
    icon: React.ComponentType<{ size?: number; className?: string }>
}> = {
    instagram: {
        name: "Instagram",
        spec: "2,200 char · 30 hashtags",
        swatchClass: "bg-[linear-gradient(135deg,#ec5185,#ed415b)]",
        icon: Bookmark,
    },
    facebook: {
        name: "Facebook",
        spec: "63K char · 30 hashtags",
        swatchClass: "bg-[#1877f2]",
        icon: Bookmark,
    },
    linkedin: {
        name: "LinkedIn",
        spec: "3,000 char · 5 hashtags",
        swatchClass: "bg-[#0a66c2]",
        icon: Bookmark,
    },
    tiktok: {
        name: "TikTok",
        spec: "2,200 char · 100 hashtags",
        swatchClass: "bg-[#0f172a]",
        icon: Music2Icon,
    },
}

export function SettingsView({
    settings,
    onAssetUpload,
    setSettings,
    settingsTab,
    setSettingsTab,
    contextTab,
    setContextTab,
    tone,
    setTone,
    onSave,
    isSaving,
}: {
    settings: StudioSettings
    onAssetUpload: (assetKind: "logo" | "book" | "alt", file: File) => void
    setSettings: (settings: StudioSettings) => void
    settingsTab: SettingsTab
    setSettingsTab: (tab: SettingsTab) => void
    contextTab: ContextTab
    setContextTab: (tab: ContextTab) => void
    tone: string
    setTone: (tone: string) => void
    onSave: () => void
    isSaving: boolean
}) {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <header className="flex flex-col gap-3 border-b border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <h1 className="text-[15px] font-extrabold text-[#041f50]">Studio Settings</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Updated {new Date(settings.updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <button onClick={onSave} disabled={isSaving} className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS}`}>
                        <PencilRuler size={10} />
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200/70 bg-slate-50/50 px-3 py-3 lg:w-52 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
                    {SETTINGS_TABS.map((item) => {
                        const Icon = item.icon
                        const active = settingsTab === item.key
                        return (
                            <button key={item.key} onClick={() => setSettingsTab(item.key)} className={`flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[12px] font-semibold transition ${active ? "bg-white text-slate-900 shadow-[0_4px_14px_-4px_rgba(15,23,42,.08)]" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}>
                                <Icon size={13} className={active ? "text-purple-500" : "text-slate-400"} />
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                <div className="flex-1 overflow-y-auto bg-[#f6f7fb] p-5 md:p-8">
                    <div className="mx-auto max-w-3xl space-y-5">
                        {settingsTab === "brand" && (
                            <>
                                <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
                                    <CircleHelp size={12} className="text-purple-500" />
                                    <p className="text-[12.5px] leading-snug text-slate-600">Injected into every generation.</p>
                                </div>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><Bookmark size={11} className="text-purple-500" />Identity</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Field label="Brand" value={settings.brandJson.brand_name} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, brand_name: value } })} />
                                        <Field label="Site URL" value={settings.brandJson.site_url} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, site_url: value } })} />
                                        <Field label="Product URL" value={settings.brandJson.product_url} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, product_url: value } })} />
                                        <Field label="Audience" value={settings.brandJson.audience} onChange={(value) => setSettings({ ...settings, brandJson: { ...settings.brandJson, audience: value } })} />
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><ImagePlus size={11} className="text-purple-500" />Visual Assets</h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <AssetTile label="Logo" path={settings.brandJson.logo_path} previewSrc={settings.brandJson.logo_url || "/logo.webp"} onUpload={(file) => onAssetUpload("logo", file)} />
                                        <AssetTile label="Book cover" path={settings.brandJson.book_path} previewSrc={settings.brandJson.book_url || "/1.png"} onUpload={(file) => onAssetUpload("book", file)} />
                                        <AssetTile label="Alt asset" path={settings.brandJson.alt_path ?? "Not configured"} previewSrc={settings.brandJson.alt_url || undefined} onUpload={(file) => onAssetUpload("alt", file)} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>Logo · Book cover · Optional secondary</span>
                                        <span>PNG · WebP · SVG</span>
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><Palette size={11} className="text-purple-500" />Palette</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {settings.brandJson.palette.map((color) => (
                                            <div key={color} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-500">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-3 p-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#041f50]"><MessageCircleMore size={11} className="text-purple-500" />Studio Context</h3>
                                        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-[3px]">
                                            <button onClick={() => setContextTab("always")} className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition ${contextTab === "always" ? "bg-[#0a0e1f] text-white" : "text-slate-500"}`}>Always say</button>
                                            <button onClick={() => setContextTab("never")} className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition ${contextTab === "never" ? "bg-[#0a0e1f] text-white" : "text-slate-500"}`}>Never say</button>
                                        </div>
                                    </div>
                                    {contextTab === "always" ? (
                                        <textarea title="Always say" value={settings.alwaysSay ?? ""} onChange={(event) => setSettings({ ...settings, alwaysSay: event.target.value })} className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                                    ) : (
                                        <textarea title="Never say" value={settings.neverSay ?? ""} onChange={(event) => setSettings({ ...settings, neverSay: event.target.value })} className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                                    )}
                                </SurfaceCard>
                            </>
                        )}
                        {settingsTab === "voice" && (
                            <>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="text-[13px] font-bold text-[#041f50]">Tone</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {TONE_CARDS.map((card) => {
                                            const active = tone === card.title
                                            return (
                                                <button key={card.title} onClick={() => { setTone(card.title); setSettings({ ...settings, tone: card.title.toUpperCase().replace(/\s+/g, "_") }) }} className={`rounded-[14px] border px-4 py-4 text-left transition ${active ? "border-purple-300 bg-[linear-gradient(135deg,rgba(175,92,233,.06),rgba(237,65,91,.04))]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                        <span className={`text-[12.5px] font-bold ${active ? "text-purple-700" : "text-[#041f50]"}`}>{card.title}</span>
                                                        {active ? <CheckCircle2 size={12} className="text-purple-500" /> : <Circle size={12} className="text-slate-300" />}
                                                    </div>
                                                    <p className="text-[11px] leading-snug text-slate-500">{card.note}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </SurfaceCard>
                                <SurfaceCard className="space-y-4 p-5">
                                    <h3 className="text-[13px] font-bold text-[#041f50]">Hook & Hashtags</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Field label="Hook style" value={settings.hookStyle} asSelect options={HOOK_STYLE_OPTIONS} onChange={(value) => setSettings({ ...settings, hookStyle: value })} />
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Hashtag cluster</label>
                                            <input title="Hashtag cluster" value={settings.hashtagCluster} onChange={(event) => setSettings({ ...settings, hashtagCluster: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
                                        </div>
                                    </div>
                                </SurfaceCard>
                            </>
                        )}
                        {settingsTab === "cta" && (
                            <SurfaceCard className="space-y-3 p-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-bold text-[#041f50]">CTA Presets</h3>
                                    <span className="text-[10px] font-semibold text-slate-400">Drag to reorder</span>
                                </div>
                                {settings.ctaPresets.map((item, index) => (
                                    <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-purple-300">
                                        <GripVertical size={14} className="cursor-grab text-slate-300" />
                                        <input title="CTA preset" value={item} onChange={(event) => setSettings({ ...settings, ctaPresets: settings.ctaPresets.map((preset, presetIndex) => presetIndex === index ? event.target.value : preset) })} className="flex-1 bg-transparent text-[12.5px] font-semibold text-[#041f50] outline-none" />
                                        <button title="Pin CTA preset" aria-label="Pin CTA preset" className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${index === 0 ? "bg-amber-50 text-amber-600" : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"}`}>
                                            <Bookmark size={10} />
                                        </button>
                                        <button onClick={() => setSettings({ ...settings, ctaPresets: settings.ctaPresets.filter((_, presetIndex) => presetIndex !== index) })} title="Remove CTA preset" aria-label="Remove CTA preset" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500">
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setSettings({ ...settings, ctaPresets: [...settings.ctaPresets, "New CTA preset"] })} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-200 py-2.5 text-[11.5px] font-bold text-purple-600 transition hover:border-purple-400 hover:bg-purple-50">
                                    <Plus size={10} />
                                    Add preset
                                </button>
                            </SurfaceCard>
                        )}
                        {settingsTab === "platform" && (
                            <SurfaceCard className="space-y-4 p-5">
                                <div>
                                    <h3 className="text-[13px] font-bold text-[#041f50]">Manual Distribution</h3>
                                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Carousel Studio does not store social tokens or auto-post. Export the PNG bundle, copy each platform caption, then schedule manually in the platform or scheduler you already trust.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {(Object.keys(PLATFORM_META) as PlatformKey[]).map((platformKey) => {
                                        const meta = PLATFORM_META[platformKey]
                                        return (
                                            <DistributionCard
                                                key={platformKey}
                                                name={meta.name}
                                                detail={meta.spec}
                                                icon={meta.icon}
                                                bgClass={meta.swatchClass}
                                            />
                                        )
                                    })}
                                </div>
                            </SurfaceCard>
                        )}
                        {settingsTab === "quality" && (
                            <SurfaceCard className="space-y-5 p-5">
                                <h3 className="text-[13px] font-bold text-[#041f50]">Quality & Defaults</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Gate Threshold</label>
                                        <span className="text-[12px] font-bold text-purple-600">{settings.gateThreshold.toFixed(1)} / 5</span>
                                    </div>
                                    <input title="Gate threshold" type="range" min="1" max="5" step="0.5" value={settings.gateThreshold} onChange={(event) => setSettings({ ...settings, gateThreshold: Number(event.target.value) })} className="w-full accent-purple-500" />
                                    <p className="text-[10px] text-slate-400">Min 4 of 5 questions must score ≥ this</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Default slides per carousel</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {["3", "4", "5", "6", "7", "8", "10", "12"].map((option) => (
                                            <button key={option} onClick={() => setSettings({ ...settings, defaultSlides: Number(option) })} className={`min-w-12 flex-1 rounded-lg py-2 text-[12px] font-bold ${Number(option) === settings.defaultSlides ? `${GRADIENT_BG_CLASS} ${GRADIENT_SHADOW_CLASS} text-white` : "border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-purple-300"}`}>{option}</button>
                                        ))}
                                    </div>
                                </div>
                            </SurfaceCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
