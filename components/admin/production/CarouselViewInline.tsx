"use client"

import React, { useState, useEffect } from "react"
import {
    ChevronLeft,
    ChevronRight,
    Download,
    ArrowLeft,
    Loader2,
    Layout,
    Smartphone,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CarouselAsset {
    id: string
    assetType: string
    storageUrl: string | null
    fileName: string | null
    metadata: {
        slideUrls?: string[]
        zipUrl?: string
        ratioVariants?: Record<string, string[]>
        topic?: string
        content?: string
    } | null
}

interface CarouselViewInlineProps {
    /** Directly pass asset data — skips fetch */
    asset?: CarouselAsset | null
    /** OR pass an assetId to fetch from API */
    assetId?: string
    /** Title override */
    topic?: string
    onClose: () => void
}

// ── Ratio config ─────────────────────────────────────────────────────────────

const RATIO_CONFIG = [
    {
        key: "1:1",
        label: "Square Feed",
        platform: "Instagram / LinkedIn",
        aspectClass: "aspect-square",
        icon: <Smartphone size={14} />,
        width: "320px",
    },
    {
        key: "4:5",
        label: "Portrait Feed",
        platform: "Instagram Premium",
        aspectClass: "aspect-[4/5]",
        icon: <Smartphone size={14} />,
        showControls: true,
        width: "280px",
    },
    {
        key: "9:16",
        label: "Vertical Story",
        platform: "Reels / TikTok",
        aspectClass: "aspect-[9/16]",
        icon: <Smartphone size={14} />,
        width: "240px",
    },
]

const BRAND = {
    navy: "#041f50",
    purple: "#af5ce9",
    gradient: "linear-gradient(135deg, #041f50 0%, #af5ce9 100%)",
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarouselViewInline({ asset: passedAsset, assetId, topic: topicOverride, onClose }: CarouselViewInlineProps) {
    const [fetchedAsset, setFetchedAsset] = useState<CarouselAsset | null>(null)
    const [loading, setLoading] = useState(!passedAsset)
    const [error, setError] = useState<string | null>(null)
    const [currentSlide, setCurrentSlide] = useState(0)

    const asset = passedAsset || fetchedAsset

    // Fetch asset if only assetId is provided
    useEffect(() => {
        if (passedAsset || !assetId) return
        const fetchAsset = async () => {
            try {
                const res = await fetch(`/api/production/assets/${assetId}`)
                if (!res.ok) throw new Error("Failed to fetch asset details")
                const data = await res.json()
                setFetchedAsset(data.asset)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Internal Error")
            } finally {
                setLoading(false)
            }
        }
        void fetchAsset()
    }, [assetId, passedAsset])

    const slideUrls = asset?.metadata?.slideUrls || []
    const zipUrl = asset?.metadata?.zipUrl
    const topic = topicOverride || asset?.metadata?.topic || "Clinical Carousel Preview"

    const getProxyUrl = (url: string) => url

    const handleDownloadBatch = () => {
        if (!zipUrl) {
            alert("Full batch download is still processing or unavailable for this asset.")
            return
        }
        const filename = `${(asset?.fileName || "carousel").replace(".png", "")}_batch.zip`
        // Ready for production: Direct Supabase download to avoid Vercel 4.5MB serverless payload limit
        const dlUrl = new URL(zipUrl)
        dlUrl.searchParams.set("download", filename)
        window.open(dlUrl.toString(), "_blank")
    }

    const prevSlide = () => setCurrentSlide((prev) => Math.max(0, prev - 1))
    const nextSlide = () => setCurrentSlide((prev) => Math.min(slideUrls.length - 1, prev + 1))

    return (
        <div
            onClick={onClose}
            style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                zIndex: 9999, display: "flex", alignItems: "stretch", justifyContent: "stretch",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "100%", height: "100%",
                    background: "#f8fafc",
                    display: "flex", flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* ── Loading state ──────────────────────────────────────── */}
                {loading && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                        <Loader2 size={48} className="animate-spin" style={{ color: BRAND.purple, opacity: 0.3 }} />
                        <p style={{ fontSize: 12, fontWeight: 800, color: `${BRAND.navy}66`, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                            Initializing Canvas
                        </p>
                    </div>
                )}

                {/* ── Error state ───────────────────────────────────────── */}
                {error && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
                        <Layout size={64} style={{ color: "#e2e8f0" }} />
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: BRAND.navy }}>Asset Initialization Failed</h2>
                        <p style={{ fontSize: 14, color: "#64748b", maxWidth: 400 }}>{error}</p>
                        <button
                            onClick={onClose}
                            style={{
                                padding: "12px 32px", background: BRAND.navy, color: "#fff",
                                borderRadius: 16, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
                            }}
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}

                {/* ── Main carousel view ────────────────────────────────── */}
                {!loading && !error && asset && slideUrls.length > 0 && (
                    <>
                        {/* Header */}
                        <header style={{
                            height: 72, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
                            borderBottom: "1px solid rgba(226,232,240,0.6)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0 24px", flexShrink: 0, zIndex: 100,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: 44, height: 44, borderRadius: 14,
                                        background: "#f1f5f9", border: "none", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: BRAND.navy, transition: "all 0.2s",
                                    }}
                                    onMouseEnter={e => { (e.target as HTMLElement).style.background = "#e2e8f0" }}
                                    onMouseLeave={e => { (e.target as HTMLElement).style.background = "#f1f5f9" }}
                                >
                                    <ArrowLeft size={22} />
                                </button>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                                        <span style={{
                                            background: BRAND.navy, color: "#fff",
                                            fontSize: 10, fontWeight: 900, padding: "2px 8px",
                                            borderRadius: 6, letterSpacing: "-0.02em"
                                        }}>
                                            ASSET {asset.id.slice(0, 5).toUpperCase()}
                                        </span>
                                        <h1 style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: BRAND.navy }}>
                                            {topic}
                                        </h1>
                                    </div>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        fontSize: 11, fontWeight: 700, color: "#94a3b8",
                                        textTransform: "uppercase", letterSpacing: "0.15em",
                                    }}>
                                        <span>{slideUrls.length} Sequence Slides</span>
                                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />
                                        <span>Clinical Grade</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <button
                                    disabled={!zipUrl}
                                    onClick={handleDownloadBatch}
                                    style={{
                                        height: 44, padding: "0 20px", borderRadius: 14,
                                        background: "#fff", border: "2px solid #e2e8f0",
                                        color: BRAND.navy, fontWeight: 700, fontSize: 13,
                                        cursor: zipUrl ? "pointer" : "not-allowed",
                                        display: "flex", alignItems: "center", gap: 8,
                                        opacity: zipUrl ? 1 : 0.4,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Download size={18} />
                                    Download ZIP
                                </button>
                            </div>
                        </header>

                        {/* Scrollable body */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 100px" }}>
                            {/* Viewport label */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                marginBottom: 32, borderBottom: "1px solid #e2e8f0", paddingBottom: 20,
                            }}>
                                <div>
                                    <h2 style={{
                                        fontSize: 11, fontWeight: 900, color: "#94a3b8",
                                        textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 4, margin: 0,
                                    }}>
                                        Multi-Ratio Simulation
                                    </h2>
                                    <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500, margin: 0 }}>
                                        Verify visual integrity across standard social distributions.
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 900, color: "#94a3b8",
                                        textTransform: "uppercase", letterSpacing: "0.15em",
                                        display: "block", marginBottom: 4,
                                    }}>
                                        Current Sequence
                                    </span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: BRAND.navy, fontVariantNumeric: "tabular-nums" }}>
                                        {currentSlide + 1} / {slideUrls.length}
                                    </span>
                                </div>
                            </div>

                            {/* Multi-ratio simulation grid */}
                            <div style={{
                                display: "flex", alignItems: "flex-start", justifyContent: "center",
                                gap: 40, flexWrap: "wrap",
                            }}>
                                {RATIO_CONFIG.map((ratio) => (
                                    <div key={ratio.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: ratio.width }}>
                                        {/* Ratio label */}
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "8px 16px", borderRadius: "14px 14px 0 0",
                                            background: "#fff", border: "1px solid #e2e8f0", borderBottom: "none",
                                            boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
                                        }}>
                                            <span style={{ color: BRAND.purple }}>{ratio.icon}</span>
                                            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: BRAND.navy }}>
                                                {ratio.label}
                                            </span>
                                        </div>

                                        {/* The device frame */}
                                        <div style={{
                                            width: "100%", 
                                            aspectRatio: ratio.key.replace(":", "/"),
                                            position: "relative",
                                            borderRadius: "2.5rem", padding: 10,
                                            background: BRAND.navy,
                                            boxShadow: "0 30px 60px -12px rgba(4,31,80,0.3)",
                                            overflow: "hidden",
                                        }}>
                                            <div style={{
                                                width: "100%", height: "100%", borderRadius: "2rem",
                                                background: "#fff", overflow: "hidden", position: "relative",
                                                border: "1px solid rgba(255,255,255,0.2)",
                                            }}>
                                                <AnimatePresence mode="wait">
                                                    <motion.img
                                                        key={`${ratio.key}-${currentSlide}`}
                                                        src={getProxyUrl(asset.metadata?.ratioVariants?.[ratio.key]?.[currentSlide] || slideUrls[currentSlide])}
                                                        style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", display: "block" }}
                                                        initial={{ opacity: 0, scale: 1.05 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                    />
                                                </AnimatePresence>

                                                {/* Overlay controls on portrait */}
                                                {ratio.showControls && (
                                                    <div style={{
                                                        position: "absolute", inset: 0,
                                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                                        padding: "0 12px", pointerEvents: "none",
                                                    }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); prevSlide() }}
                                                            disabled={currentSlide === 0}
                                                            style={{
                                                                width: 40, height: 40, borderRadius: "50%",
                                                                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                                                                border: "none", cursor: "pointer", pointerEvents: "auto",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                color: BRAND.navy, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                                                opacity: currentSlide === 0 ? 0 : 1,
                                                                transition: "all 0.3s",
                                                            }}
                                                        >
                                                            <ChevronLeft size={24} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); nextSlide() }}
                                                            disabled={currentSlide === slideUrls.length - 1}
                                                            style={{
                                                                width: 40, height: 40, borderRadius: "50%",
                                                                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                                                                border: "none", cursor: "pointer", pointerEvents: "auto",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                color: BRAND.navy, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                                                opacity: currentSlide === slideUrls.length - 1 ? 0 : 1,
                                                                transition: "all 0.3s",
                                                            }}
                                                        >
                                                            <ChevronRight size={24} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Platform metadata */}
                                        <div style={{ textAlign: "center", marginTop: 4 }}>
                                            <p style={{ fontSize: 10, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
                                                {ratio.platform}
                                            </p>
                                            <p style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 700, margin: 0 }}>
                                                {ratio.key} Ratio
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Navigation strip */}
                            <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
                                {/* Dots */}
                                <div style={{ display: "flex", gap: 6 }}>
                                    {slideUrls.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentSlide(i)}
                                            style={{
                                                height: 8, borderRadius: 999, padding: 0, border: "none", cursor: "pointer",
                                                width: currentSlide === i ? 40 : 8,
                                                background: currentSlide === i ? BRAND.purple : "#e2e8f0",
                                                boxShadow: currentSlide === i ? "0 0 15px rgba(175,92,233,0.5)" : "none",
                                                transition: "all 0.3s ease",
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Filmstrip */}
                                <div style={{
                                    width: "100%", background: "#fff", borderRadius: "2rem",
                                    padding: 24, boxShadow: "0 8px 30px rgba(226,232,240,0.5)",
                                    border: "1px solid #f1f5f9",
                                }}>
                                    <h3 style={{
                                        fontSize: 11, fontWeight: 900, color: "#94a3b8",
                                        textTransform: "uppercase", letterSpacing: "0.2em",
                                        marginBottom: 20, textAlign: "center", margin: "0 0 20px",
                                    }}>
                                        Slide Sequence Strip
                                    </h3>
                                    <div style={{
                                        display: "flex", gap: 14, overflowX: "auto",
                                        paddingBottom: 12, justifyContent: "center",
                                    }}>
                                        {slideUrls.map((url, i) => (
                                            <button
                                                key={url}
                                                onClick={() => setCurrentSlide(i)}
                                                style={{
                                                    position: "relative", flexShrink: 0,
                                                    width: 80, height: 80, borderRadius: 16,
                                                    overflow: "hidden", border: "none", cursor: "pointer", padding: 0,
                                                    outline: currentSlide === i ? `4px solid ${BRAND.purple}` : "none",
                                                    outlineOffset: 4,
                                                    transform: currentSlide === i ? "scale(1.1)" : "scale(1)",
                                                    opacity: currentSlide === i ? 1 : 0.4,
                                                    filter: currentSlide === i ? "none" : "grayscale(1)",
                                                    boxShadow: currentSlide === i ? "0 8px 24px rgba(0,0,0,0.15)" : "none",
                                                    transition: "all 0.3s ease",
                                                    zIndex: currentSlide === i ? 10 : 1,
                                                }}
                                            >
                                                <img src={getProxyUrl(url)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                                <div style={{
                                                    position: "absolute", top: 4, right: 4,
                                                    width: 22, height: 22, background: "#fff",
                                                    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 900, fontSize: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                                                    color: BRAND.navy,
                                                }}>
                                                    {i + 1}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
