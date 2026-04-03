"use client"

import { useState, useEffect, useCallback, type ComponentType } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Globe, Home, Brain, Sparkles, Tag, User, Zap,
    Save, CheckCircle, AlertCircle, Loader2, RefreshCw,
    ChevronDown, ChevronUp, Info
} from "lucide-react"

const BRAND = {
    red: "#ed415b",
    pink: "#ec5185",
    purple: "#af5ce9",
    gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
    gradientSoft: "linear-gradient(135deg, rgba(237,65,91,0.15), rgba(236,81,133,0.15), rgba(175,92,233,0.15))",
    glow: "0 4px 30px rgba(175, 92, 233, 0.2)",
}

/* ── Deep-path helpers ─────────────────────────────────── */
function getAt(obj: unknown, path: string): unknown {
    return path.split(".").reduce((acc, k) => (acc as Record<string, unknown>)?.[k], obj)
}
function setAt(obj: unknown, path: string, value: unknown): Record<string, unknown> {
    const clone = structuredClone(obj) as Record<string, unknown>
    const keys = path.split(".")
    let cur: Record<string, unknown> = clone
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>
    cur[keys[keys.length - 1]] = value
    return clone
}

/* ── Sub-sections ──────────────────────────────────────── */
type Section =
    | "global"
    | "hero"
    | "problem"
    | "soap-teaser"
    | "pricing"
    | "about"
    | "soap-page"
    | "navigation"

const SECTIONS: { key: Section; label: string; icon: ComponentType<{ size?: number }>; desc: string }[] = [
    { key: "global", label: "Brand & Global", icon: Globe, desc: "Name, price, footer, cookies" },
    { key: "navigation", label: "Navigation", icon: Zap, desc: "Menu links and labels" },
    { key: "hero", label: "Homepage Hero", icon: Home, desc: "Headline, subheadline, CTAs" },
    { key: "problem", label: "Problem & Solution", icon: Brain, desc: "Pain points and features" },
    { key: "soap-teaser", label: "SOAP Teaser", icon: Sparkles, desc: "Homepage SOAP section" },
    { key: "pricing", label: "Pricing Cards", icon: Tag, desc: "Products and call-to-action" },
    { key: "about", label: "About Author", icon: User, desc: "Bio, credentials, feedback form" },
    { key: "soap-page", label: "SOAP Architect Page", icon: Brain, desc: "Full SOAP page copy" },
]

/* ── Field primitives ──────────────────────────────────── */
interface FieldProps {
    label: string
    path: string
    type?: "text" | "textarea" | "url"
    note?: string
    rows?: number
    content: Record<string, unknown>
    onChange: (path: string, value: string) => void
}
function Field({ label, path, type = "text", note, rows = 3, content, onChange }: FieldProps) {
    const value = (getAt(content, path) ?? "") as string
    const base = "w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#af5ce9]/50 focus:border-[#af5ce9] transition"

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            {type === "textarea" ? (
                <textarea
                    rows={rows}
                    value={value}
                    title={label}
                    onChange={e => onChange(path, e.target.value)}
                    className={`${base} px-4 py-3 resize-y`}
                />
            ) : (
                <input
                    type={type === "url" ? "url" : "text"}
                    value={value}
                    title={label}
                    onChange={e => onChange(path, e.target.value)}
                    className={`${base} px-4 py-2.5 h-10`}
                />
            )}
            {note && <p className="text-[11px] text-slate-400 leading-relaxed">{note}</p>}
        </div>
    )
}

/* ── Collapsible group card ────────────────────────────── */
function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition"
            >
                <span className="text-sm font-semibold text-slate-800">{title}</span>
                {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function FullWidthGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition"
            >
                <span className="text-sm font-semibold text-slate-800">{title}</span>
                {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ── JSON textarea editor for complex nested arrays ──── */
function JsonArrayField({ label, path, content, onChange, note }: {
    label: string; path: string; note?: string; content: Record<string, unknown>
    onChange: (path: string, value: unknown) => void
}) {
    const value = getAt(content, path)
    const [raw, setRaw] = useState(JSON.stringify(value, null, 2))
    const [err, setErr] = useState("")

    useEffect(() => {
        setRaw(JSON.stringify(getAt(content, path), null, 2))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path]) // only re-sync when path changes, not on every keystroke

    function handleBlur() {
        try {
            const parsed = JSON.parse(raw)
            onChange(path, parsed)
            setErr("")
        } catch {
            setErr("Invalid JSON — changes not saved")
        }
    }

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            <textarea
                rows={8}
                value={raw}
                title={label}
                onChange={e => setRaw(e.target.value)}
                onBlur={handleBlur}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#af5ce9]/50 focus:border-[#af5ce9] transition px-4 py-3 resize-y"
                spellCheck={false}
            />
            {err && <p className="text-[11px] text-red-500">{err}</p>}
            {note && <p className="text-[11px] text-slate-400 leading-relaxed">{note}</p>}
        </div>
    )
}

/* ── Main Component ────────────────────────────────────── */
export function ContentEditor() {
    const [content, setContent] = useState<Record<string, unknown> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [activeSection, setActiveSection] = useState<Section>("global")
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const loadContent = useCallback(async () => {
        setIsLoading(true)
        setLoadError("")
        try {
            const res = await fetch("/api/admin/content")
            if (!res.ok) throw new Error("Failed to load")
            const data = await res.json()
            setContent(data.content)
        } catch {
            setLoadError("Could not load content. Make sure the dev server is running.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { loadContent() }, [loadContent])

    function handleChange(path: string, value: unknown) {
        setContent((prev) => prev ? setAt(prev, path, value) : null)
        setIsDirty(true)
        setSaveMsg(null)
    }

    async function handleSave() {
        setSaving(true)
        setSaveMsg(null)
        try {
            const res = await fetch("/api/admin/content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            })
            const data = await res.json()
            if (res.ok) {
                setIsDirty(false)
                setSaveMsg({ type: "success", text: "✅ Published! Changes saved to site-content.json." })
            } else {
                setSaveMsg({ type: "error", text: `❌ ${data.error || "Failed to save"}` })
            }
        } catch {
            setSaveMsg({ type: "error", text: "❌ Network error. Check your connection." })
        } finally {
            setSaving(false)
        }
    }

    const f = (label: string, path: string, opts?: Partial<FieldProps>) => (
        <Field key={path} label={label} path={path} content={content ?? {}} onChange={handleChange} {...opts} />
    )
    const jf = (label: string, path: string, note?: string) => (
        <JsonArrayField key={path} label={label} path={path} content={content ?? {}} onChange={handleChange} note={note} />
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-slate-400" />
            </div>
        )
    }

    if (loadError || !content) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
                <AlertCircle size={32} className="mx-auto text-red-500 mb-3" />
                <p className="text-red-700 text-sm font-medium">{loadError || "Unknown error"}</p>
                <button onClick={loadContent} className="mt-4 px-4 py-2 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition shadow-sm">
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#041f50]">Site Content Editor</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Edit all public-facing text from one place. Click <strong className="text-slate-800">Publish</strong> to save changes.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <span className="text-xs font-medium text-amber-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                            Unsaved changes
                        </span>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={loadContent}
                        className="p-2.5 text-slate-400 hover:text-slate-600 border border-slate-200 bg-white rounded-xl shadow-sm transition"
                        title="Reload from file"
                    >
                        <RefreshCw size={16} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
                         
                        style={{ background: BRAND.gradient, boxShadow: isDirty ? BRAND.glow : "none" }}
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? "Saving..." : "Publish Changes"}
                    </motion.button>
                </div>
            </div>

            {/* Save message */}
            <AnimatePresence>
                {saveMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm ${saveMsg.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : "bg-red-500/10 border-red-500/20 text-red-300"
                            }`}
                    >
                        {saveMsg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {saveMsg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vercel notice */}
            <div className="flex items-start gap-3 px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium">
                <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span>Changes are written to <code className="text-slate-700 bg-slate-200/50 px-1.5 py-0.5 rounded font-mono">content/site-content.json</code> on the local dev server. After publishing, <strong className="text-slate-800">commit and push to GitHub</strong> to deploy the changes to your live site.</span>
            </div>

            {/* Section pills */}
            <div className="flex flex-wrap gap-2">
                {SECTIONS.map(s => {
                    const Icon = s.icon
                    const isActive = activeSection === s.key
                    return (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border ${isActive
                                ? "text-white border-transparent"
                                : "text-slate-600 bg-white border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            style={isActive ? { background: BRAND.gradient, boxShadow: BRAND.glow } : undefined}
                        >
                            <Icon size={16} />
                            {s.label}
                        </button>
                    )
                })}
            </div>

            {/* Section description */}
            <p className="text-sm font-medium text-slate-500 mt-2">
                {SECTIONS.find(s => s.key === activeSection)?.desc}
            </p>

            {/* ─── Sections ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                >

                    {/* ── GLOBAL ─────────────────────────────────── */}
                    {activeSection === "global" && <>
                        <Group title="Brand Identity">
                            {f("Brand Name", "global.brandName")}
                            {f("Introductory Price (display text)", "global.introductoryPrice", { note: "e.g. $69.99 USD — shown in nav and hero" })}
                            {f("Primary CTA Button Text", "global.ctaButton")}
                        </Group>
                        <Group title="Footer">
                            {f("Footer Copyright", "global.footerCopyright")}
                            {f("Footer Disclaimer", "global.footerDisclaimer", { type: "textarea", rows: 3 })}
                        </Group>
                        <Group title="Social Media Links">
                            {f("Facebook URL", "global.socialLinks.facebook", { type: "url" })}
                            {f("Instagram URL", "global.socialLinks.instagram", { type: "url" })}
                            {f("TikTok URL", "global.socialLinks.tiktok", { type: "url" })}
                            {f("LinkedIn URL", "global.socialLinks.linkedin", { type: "url" })}
                        </Group>
                        <Group title="Cookie Banner">
                            {f("Banner Message", "global.cookieBanner.message", { type: "textarea", rows: 2 })}
                            {f("Accept Button Label", "global.cookieBanner.accept")}
                            {f("Decline Button Label", "global.cookieBanner.decline")}
                        </Group>
                    </>}

                    {/* ── NAVIGATION ─────────────────────────────── */}
                    {activeSection === "navigation" && <>
                        <FullWidthGroup title="Navigation Items">
                            <p className="text-xs font-medium text-slate-500">Edit the array of navigation links below. Each item has a <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">label</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">href</code>, and an optional <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">badge</code>.</p>
                            {jf("Navigation Links (JSON)", "global.navigation", "Edit the label, href, and optional badge for each nav item. Save as valid JSON.")}
                        </FullWidthGroup>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Quick Labels</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {((getAt(content, "global.navigation") as unknown[] | null) ?? []).map((_: unknown, i: number) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex-1">
                                            {f("Nav Item " + (i + 1) + " Label", "global.navigation." + i + ".label")}
                                        </div>
                                        <div className="flex-1">
                                            {f("Nav Item " + (i + 1) + " Href", "global.navigation." + i + ".href")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>}

                    {/* ── HERO ───────────────────────────────────── */}
                    {activeSection === "hero" && <>
                        <Group title="Hero Headline">
                            {f("Badge Text", "homePage.hero.badge")}
                            {f("Main Headline", "homePage.hero.headline", { note: "First part — e.g. \"Don't Just Read About Assessment.\"" })}
                            {f("Headline Accent", "homePage.hero.headlineAccent", { note: "Styled accent line — e.g. \"Practice It.\"" })}
                            {f("Subheadline", "homePage.hero.subheadline", { type: "textarea", rows: 2 })}
                        </Group>
                        <Group title="Calls to Action">
                            {f("Primary Button Label", "homePage.hero.primaryCTA.label")}
                            {f("Primary Button Link", "homePage.hero.primaryCTA.href", { type: "url" })}
                            {f("Secondary Button Label", "homePage.hero.secondaryCTA.label")}
                            {f("Secondary Button Link", "homePage.hero.secondaryCTA.href", { type: "url" })}
                        </Group>
                        <Group title="Visual Break Section" defaultOpen={false}>
                            {f("Headline", "homePage.visualBreak.headline")}
                            {f("Headline Accent", "homePage.visualBreak.headlineAccent")}
                            {f("Description", "homePage.visualBreak.description", { type: "textarea", rows: 2 })}
                            {f("CTA Button Label", "homePage.visualBreak.ctaLabel")}
                        </Group>
                    </>}

                    {/* ── PROBLEM & SOLUTION ─────────────────────── */}
                    {activeSection === "problem" && <>
                        <FullWidthGroup title="What We Do Section">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {f("Section Label", "homePage.whatWeDo.sectionLabel")}
                                {f("Headline", "homePage.whatWeDo.headline")}
                                {f("Subheadline", "homePage.whatWeDo.subheadline", { type: "textarea", rows: 2 })}
                                {f("Footnote Text", "homePage.whatWeDo.footnote", { type: "textarea", rows: 2 })}
                            </div>
                            {jf("Items (emoji icons)", "homePage.whatWeDo.items", "Array of { label, icon } objects. Add or remove items freely.")}
                        </FullWidthGroup>

                        <Group title="Problem Section">
                            {f("Headline", "homePage.problem.headline")}
                            {f("Sub Label", "homePage.problem.subLabel")}
                            {f("Description", "homePage.problem.description", { type: "textarea", rows: 3 })}
                        </Group>

                        <Group title="Pain Point 1 — Imposter Syndrome">
                            {f("Title", "homePage.problem.painPoints.0.title")}
                            {f("Description", "homePage.problem.painPoints.0.description", { type: "textarea", rows: 2 })}
                        </Group>
                        <Group title="Pain Point 2 — Documentation Dread">
                            {f("Title", "homePage.problem.painPoints.1.title")}
                            {f("Description", "homePage.problem.painPoints.1.description", { type: "textarea", rows: 2 })}
                        </Group>
                        <Group title="Pain Point 3 — Safety Blindspots">
                            {f("Title", "homePage.problem.painPoints.2.title")}
                            {f("Description", "homePage.problem.painPoints.2.description", { type: "textarea", rows: 2 })}
                        </Group>

                        <Group title="Solution Section">
                            {f("Headline", "homePage.solution.headline")}
                            {f("Subheadline", "homePage.solution.subheadline", { type: "textarea", rows: 2 })}
                        </Group>
                        <Group title="Solution Feature 1 — Simple English">
                            {f("Emoji", "homePage.solution.features.0.emoji")}
                            {f("Title", "homePage.solution.features.0.title")}
                            {f("Tag", "homePage.solution.features.0.tag")}
                            {f("Description", "homePage.solution.features.0.description", { type: "textarea", rows: 2 })}
                        </Group>
                        <Group title="Solution Feature 2 — Phrase Banks">
                            {f("Emoji", "homePage.solution.features.1.emoji")}
                            {f("Title", "homePage.solution.features.1.title")}
                            {f("Tag", "homePage.solution.features.1.tag")}
                            {f("Description", "homePage.solution.features.1.description", { type: "textarea", rows: 2 })}
                        </Group>
                        <Group title="Solution Feature 3 — Preceptor Red Flags">
                            {f("Emoji", "homePage.solution.features.2.emoji")}
                            {f("Title", "homePage.solution.features.2.title")}
                            {f("Tag", "homePage.solution.features.2.tag")}
                            {f("Description", "homePage.solution.features.2.description", { type: "textarea", rows: 2 })}
                        </Group>
                    </>}

                    {/* ── SOAP TEASER ────────────────────────────── */}
                    {activeSection === "soap-teaser" && <>
                        <Group title="SOAP Teaser Header">
                            {f("Badge", "homePage.soapArchitectTeaser.badge")}
                            {f("Headline", "homePage.soapArchitectTeaser.headline")}
                            {f("Subheadline", "homePage.soapArchitectTeaser.subheadline", { type: "textarea", rows: 2 })}
                            {f("Value Proposition", "homePage.soapArchitectTeaser.valueProp", { type: "textarea", rows: 2 })}
                            {f("Auth Trigger Message", "homePage.soapArchitectTeaser.authTrigger", { note: "Shown to logged-out users" })}
                            {f("Disclaimer", "homePage.soapArchitectTeaser.disclaimer")}
                        </Group>
                        <Group title="CTA Button">
                            {f("CTA Label", "homePage.soapArchitectTeaser.ctaLabel")}
                            {f("CTA Link", "homePage.soapArchitectTeaser.ctaHref", { type: "url" })}
                        </Group>
                        <FullWidthGroup title="Features List" defaultOpen={false}>
                            {jf("Features (string array)", "homePage.soapArchitectTeaser.features", "Array of feature strings displayed as bullet points.")}
                        </FullWidthGroup>
                        <Group title="Demo Block Labels">
                            {f("Input Label", "homePage.soapArchitectTeaser.demo.inputLabel")}
                            {f("Sample Input Text", "homePage.soapArchitectTeaser.demo.inputText", { type: "textarea", rows: 2 })}
                            {f("Output Label", "homePage.soapArchitectTeaser.demo.outputLabel")}
                            {f("Output — Subjective", "homePage.soapArchitectTeaser.demo.outputSubjective", { type: "textarea", rows: 2 })}
                            {f("Output — Objective", "homePage.soapArchitectTeaser.demo.outputObjective", { type: "textarea", rows: 2 })}
                            {f("Output — Assessment", "homePage.soapArchitectTeaser.demo.outputAssessment", { type: "textarea", rows: 2 })}
                        </Group>
                    </>}

                    {/* ── PRICING ────────────────────────────────── */}
                    {activeSection === "pricing" && <>
                        <Group title="Pricing Section Header">
                            {f("Headline", "homePage.pricing.headline")}
                            {f("Subheadline", "homePage.pricing.subheadline", { type: "textarea", rows: 2 })}
                        </Group>

                        <FullWidthGroup title="Digital Edition Card">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {f("Card Title", "homePage.pricing.cards.0.title")}
                                {f("Card Subtitle", "homePage.pricing.cards.0.subtitle")}
                                {f("Price", "homePage.pricing.cards.0.price")}
                                {f("Badge", "homePage.pricing.cards.0.badge")}
                                {f("CTA Button Label", "homePage.pricing.cards.0.ctaLabel")}
                            </div>
                            {jf("Feature Items", "homePage.pricing.cards.0.items", "Array of { text, bold, highlight } objects. \"highlight\" = true makes the row stand out.")}
                        </FullWidthGroup>

                        <FullWidthGroup title="SOAP Architect (Free) Card" defaultOpen={false}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {f("Card Title", "homePage.pricing.cards.1.title")}
                                {f("Card Subtitle", "homePage.pricing.cards.1.subtitle")}
                                {f("Price", "homePage.pricing.cards.1.price")}
                                {f("Badge", "homePage.pricing.cards.1.badge")}
                                {f("CTA Button Label", "homePage.pricing.cards.1.ctaLabel")}
                            </div>
                            {jf("Feature Items", "homePage.pricing.cards.1.items", "Array of { text, bold, highlight } objects.")}
                        </FullWidthGroup>
                    </>}

                    {/* ── ABOUT AUTHOR ───────────────────────────── */}
                    {activeSection === "about" && <>
                        <Group title="Author Introduction">
                            {f("Section Label", "homePage.aboutAuthor.sectionLabel")}
                            {f("Headline (name)", "homePage.aboutAuthor.headline")}
                            {f("Role / Title", "homePage.aboutAuthor.role")}
                            {f("CTA Label", "homePage.aboutAuthor.ctaLabel")}
                            {f("CTA Link", "homePage.aboutAuthor.ctaHref", { type: "url" })}
                        </Group>
                        <FullWidthGroup title="Bio & Mission">
                            {f("Bio", "homePage.aboutAuthor.bio", { type: "textarea", rows: 5 })}
                            {f("Mission Statement", "homePage.aboutAuthor.mission", { type: "textarea", rows: 3 })}
                            {jf("Credentials (string array)", "homePage.aboutAuthor.credentials", "Array of credential strings shown as badges.")}
                        </FullWidthGroup>
                        <Group title="Feedback Form Labels">
                            {f("Form Headline", "homePage.aboutAuthor.feedbackForm.headline")}
                            {f("Form Description", "homePage.aboutAuthor.feedbackForm.description", { type: "textarea", rows: 2 })}
                            {f("Name Field Label", "homePage.aboutAuthor.feedbackForm.nameLabel")}
                            {f("Name Placeholder", "homePage.aboutAuthor.feedbackForm.namePlaceholder")}
                            {f("Email Field Label", "homePage.aboutAuthor.feedbackForm.emailLabel")}
                            {f("Email Placeholder", "homePage.aboutAuthor.feedbackForm.emailPlaceholder")}
                            {f("Message Field Label", "homePage.aboutAuthor.feedbackForm.messageLabel")}
                            {f("Message Placeholder", "homePage.aboutAuthor.feedbackForm.messagePlaceholder")}
                            {f("Submit Button Label", "homePage.aboutAuthor.feedbackForm.submitLabel")}
                            {f("Success Message", "homePage.aboutAuthor.feedbackForm.successMessage")}
                        </Group>
                    </>}

                    {/* ── SOAP ARCHITECT PAGE ────────────────────── */}
                    {activeSection === "soap-page" && <>
                        <Group title="Hero Section">
                            {f("Badge", "soapArchitectPage.hero.badge")}
                            {f("Headline", "soapArchitectPage.hero.headline")}
                            {f("Subheadline", "soapArchitectPage.hero.subheadline", { type: "textarea", rows: 2 })}
                            {f("Value Proposition", "soapArchitectPage.hero.valueProp", { type: "textarea", rows: 2 })}
                            {f("Auth Trigger", "soapArchitectPage.hero.authTrigger")}
                            {f("CTA Label", "soapArchitectPage.hero.ctaLabel")}
                            {f("Disclaimer", "soapArchitectPage.hero.disclaimer")}
                        </Group>
                        <Group title="How It Works">
                            {f("Headline", "soapArchitectPage.howItWorks.headline")}
                            {f("Disclaimer Note", "soapArchitectPage.howItWorks.disclaimerNote")}
                        </Group>

                        {[0, 1, 2, 3].map(i => (
                            <Group key={i} title={`Step ${i + 1}`} defaultOpen={i === 0}>
                                {f("Step Label", `soapArchitectPage.howItWorks.steps.${i}.label`)}
                                {f("Step Description", `soapArchitectPage.howItWorks.steps.${i}.desc`, { type: "textarea", rows: 2 })}
                            </Group>
                        ))}

                        <Group title="Problem Block">
                            {f("Headline", "soapArchitectPage.problemBlock.headline")}
                            {f("Blockquote", "soapArchitectPage.problemBlock.blockquote", { type: "textarea", rows: 2 })}
                        </Group>
                        <FullWidthGroup title="Problem Items" defaultOpen={false}>
                            {jf("Items (string array)", "soapArchitectPage.problemBlock.items", "Short problem statements shown as bullet points.")}
                        </FullWidthGroup>

                        <Group title="What It Does Section">
                            {f("Headline", "soapArchitectPage.whatItDoes.headline")}
                            {f("Important Note", "soapArchitectPage.whatItDoes.importantNote", { type: "textarea", rows: 2 })}
                        </Group>
                        <FullWidthGroup title="What It Does — Features" defaultOpen={false}>
                            {jf("Features (string array)", "soapArchitectPage.whatItDoes.features", "Feature strings shown as bullet points.")}
                        </FullWidthGroup>

                        <Group title="Before / After Demo">
                            {f("Headline", "soapArchitectPage.beforeAfterDemo.headline")}
                            {f("Input Label", "soapArchitectPage.beforeAfterDemo.input.label")}
                            {f("Input Sample Text", "soapArchitectPage.beforeAfterDemo.input.text", { type: "textarea", rows: 2 })}
                            {f("Output Label", "soapArchitectPage.beforeAfterDemo.output.label")}
                            {f("Output Subjective", "soapArchitectPage.beforeAfterDemo.output.subjective", { type: "textarea", rows: 2 })}
                            {f("Output Assessment", "soapArchitectPage.beforeAfterDemo.output.assessment", { type: "textarea", rows: 2 })}
                        </Group>

                        <Group title="Interactive Tool Section">
                            {f("Headline", "soapArchitectPage.interactiveTool.headline")}
                            {f("Subheadline", "soapArchitectPage.interactiveTool.subheadline", { type: "textarea", rows: 2 })}
                            {f("Disclaimer", "soapArchitectPage.interactiveTool.disclaimer")}
                        </Group>

                        <Group title="CTA Banner">
                            {f("Headline", "soapArchitectPage.ctaBanner.headline")}
                            {f("Description", "soapArchitectPage.ctaBanner.description", { type: "textarea", rows: 2 })}
                            {f("CTA Button Label", "soapArchitectPage.ctaBanner.ctaLabel")}
                            {f("Price Note", "soapArchitectPage.ctaBanner.priceNote")}
                        </Group>
                    </>}

                </motion.div>
            </AnimatePresence>

            {/* Sticky footer save */}
            {isDirty && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky bottom-4 flex justify-end"
                >
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-2xl shadow-2xl transition disabled:opacity-50"
                         
                        style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? "Saving..." : "Publish Changes"}
                    </button>
                </motion.div>
            )}
        </div>
    )
}
