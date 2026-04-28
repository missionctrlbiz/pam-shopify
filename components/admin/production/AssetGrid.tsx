"use client"

import React, { useEffect, useCallback } from "react"
import {
    Image, FileText, Video, Music, ExternalLink,
    RefreshCw, AlertCircle, Clock, Zap, CheckCircle2, Copy, Check, X,
    Download, Eye, Package
} from "lucide-react"
import type { ContentAsset, RenderJob, AssetStatus, AssetType } from "./types"
import { PROD_BRAND } from "./CalendarTable"
import { CarouselPreview } from "./CarouselPreview"
import { CarouselViewInline } from "./CarouselViewInline"

const ASSET_ICON: Record<AssetType, React.ReactNode> = {
    CAROUSEL_PNG: <Image size={16} />,
    VIDEO_MP4: <Video size={16} />,
    TEXT_POST: <FileText size={16} />,
    EMAIL_HTML: <FileText size={16} />,
    AUDIO_MP3: <Music size={16} />,
    VIDEO_SCRIPT_JSON: <FileText size={16} />,
}

const ASSET_STATUS_STYLE: Record<AssetStatus, { icon: React.ReactNode; color: string; label: string }> = {
    PENDING: { icon: <Clock size={12} />, color: PROD_BRAND.gray, label: "Pending" },
    GENERATING: { icon: <Zap size={12} />, color: PROD_BRAND.blue, label: "Rendering…" },
    COMPLETE: { icon: <CheckCircle2 size={12} />, color: PROD_BRAND.green, label: "Complete" },
    FAILED: { icon: <AlertCircle size={12} />, color: PROD_BRAND.red, label: "Failed" },
}

interface AssetGridProps {
    assets: ContentAsset[]
    renderJobs: RenderJob[]
    entryId: string
    /** Called after a successful generate-assets dispatch to start polling */
    onGenerateAssets: () => Promise<void>
    generating: boolean
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = React.useState(false)
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
            style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600, background: "none",
                border: "none", cursor: "pointer",
                color: copied ? PROD_BRAND.green : PROD_BRAND.blue, padding: 0,
            }}
            title="Copy to clipboard"
        >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy"}
        </button>
    )
}

function AssetPreviewModal({ asset, onClose }: { asset: ContentAsset, onClose: () => void }) {
    const [content, setContent] = React.useState<string>("");
    const [loading, setLoading] = React.useState(true);

    const isCarousel = asset.assetType === "CAROUSEL_PNG"
    const slideUrls = (asset.metadata?.slideUrls as string[]) ?? []

    useEffect(() => {
        // Carousels don't need text content fetched
        if (isCarousel) {
            setLoading(false);
            return;
        }

        const meta = asset.metadata as Record<string, unknown> | null;
        if (meta?.content) {
            setContent(meta.content as string);
            setLoading(false);
        } else if (asset.storageUrl) {
            fetch(asset.storageUrl)
                .then(res => res.text())
                .then(text => setContent(text))
                .catch(err => setContent("Error loading content: " + String(err)))
                .finally(() => setLoading(false));
        } else {
            setContent("");
            setLoading(false);
        }
    }, [asset, isCarousel]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.6)", zIndex: 9999, backdropFilter: "blur(2px)",
                display: "flex", alignItems: "stretch", justifyContent: "stretch",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 0, padding: 24, width: "100%", height: "100%",
                    display: "flex", flexDirection: "column", gap: 16,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: PROD_BRAND.gray }}>{ASSET_ICON[asset.assetType] ?? <FileText size={16} />}</span>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: PROD_BRAND.navy }}>{asset.assetType.replace(/_/g, " ")}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={PROD_BRAND.gray} /></button>
                </div>
                {loading ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: PROD_BRAND.gray }}>
                        <RefreshCw size={24} className="animate-spin" />
                    </div>
                ) : isCarousel && slideUrls.length > 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <CarouselPreview slideUrls={slideUrls} />
                    </div>
                ) : (
                    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 16 }}>
                        {asset.assetType === "EMAIL_HTML" ? (
                            <iframe srcDoc={content} style={{ width: "100%", flex: 1, border: `1px solid ${PROD_BRAND.border}`, borderRadius: 8, background: "#fff" }} />
                        ) : (
                            <pre style={{ width: "100%", flex: 1, overflow: "auto", background: PROD_BRAND.grayFaint, padding: 16, borderRadius: 8, margin: 0, fontSize: 12, whiteSpace: "pre-wrap", color: PROD_BRAND.navy, border: `1px solid ${PROD_BRAND.border}` }}>{content}</pre>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 12, color: PROD_BRAND.gray }}>
                                <span style={{ fontWeight: 600 }}>File:</span> {asset.fileName ?? "N/A"}
                            </div>
                            <div style={{ padding: "8px 16px", background: PROD_BRAND.blueFaint, borderRadius: 8 }}>
                                <CopyButton text={content} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: PROD_BRAND.blue, marginLeft: 6 }}>Copy Raw Code</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export const AssetGrid: React.FC<AssetGridProps> = ({
    assets, renderJobs, entryId, onGenerateAssets, generating,
}) => {
    const hasActiveJobs = renderJobs.some(j => j.status === "QUEUED" || j.status === "RUNNING")
    const hasAnyAssets = assets.length > 0
    const [previewAsset, setPreviewAsset] = React.useState<ContentAsset | null>(null)

    // ── Polling: auto-refresh every 5 s while jobs are active ──────────────
    const [pollCount, setPollCount] = React.useState(0)

    useEffect(() => {
        if (!hasActiveJobs) return
        const t = setInterval(() => setPollCount(n => n + 1), 5000)
        return () => clearInterval(t)
    }, [hasActiveJobs])

    // Surface poll count to parent so it can re-fetch entry detail
    const onPollTick = React.useRef<(() => void) | null>(null)
    useEffect(() => {
        if (onPollTick.current) onPollTick.current()
    }, [pollCount])

    return (
        <div style={{ marginTop: 24, borderTop: `1px solid ${PROD_BRAND.border}`, paddingTop: 24 }}>
            {/* Header + generate button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: PROD_BRAND.navy, margin: 0, letterSpacing: "-0.01em" }}>
                        Clinical Distribution Assets
                    </h3>
                    {hasActiveJobs && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <div className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: PROD_BRAND.blue }} />
                            <span style={{ fontSize: 11, color: PROD_BRAND.blue, fontWeight: 600 }}>
                                Active generation cycle in progress…
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onGenerateAssets}
                    disabled={generating}
                    style={{
                        padding: "8px 18px", borderRadius: 10, border: "none",
                        background: generating ? PROD_BRAND.border : "linear-gradient(135deg, #041f50, #1e3a8a)",
                        color: "#fff",
                        fontSize: 13, fontWeight: 700,
                        cursor: generating ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                        boxShadow: "0 4px 12px rgba(4, 31, 80, 0.15)",
                        transition: "transform 0.2s"
                    }}
                    onMouseOver={e => !generating && (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseOut={e => !generating && (e.currentTarget.style.transform = "translateY(0)")}
                >
                    {generating
                        ? <><RefreshCw size={14} className="animate-spin" /> Preparing…</>
                        : hasAnyAssets
                            ? <><RefreshCw size={14} /> Refresh All</>
                            : <><Zap size={14} /> Initialize Assets</>
                    }
                </button>
            </div>

            {/* RenderJob status timeline (Clean) */}
            {renderJobs.length > 0 && (
                <div style={{ 
                    marginBottom: 24, padding: "16px", background: "#f8fafc", borderRadius: 16, 
                    border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: PROD_BRAND.gray, textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Queue Status</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {renderJobs.map(job => {
                            const isActive = job.status === "QUEUED" || job.status === "RUNNING"
                            return (
                                <div
                                    key={job.id}
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: 8,
                                        padding: "6px 14px", borderRadius: 12,
                                        background: isActive ? "#fff" : job.status === "COMPLETE" ? PROD_BRAND.greenFaint : "#fff",
                                        border: `1px solid ${isActive ? PROD_BRAND.blue : job.status === "COMPLETE" ? PROD_BRAND.green + "22" : "#e2e8f0"}`,
                                        fontSize: 12, fontWeight: 700,
                                        color: isActive ? PROD_BRAND.blue : job.status === "COMPLETE" ? PROD_BRAND.green : PROD_BRAND.gray,
                                        boxShadow: isActive ? "0 4px 10px rgba(59, 130, 246, 0.1)" : "none"
                                    }}
                                >
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: isActive ? PROD_BRAND.blueFaint : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {ASSET_ICON[job.jobType as AssetType] || <FileText size={14} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11 }}>{job.jobType.replace(/_/g, " ")}</div>
                                        <div style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase" }}>{job.status === "QUEUED" ? "Queued" : job.status === "RUNNING" ? "Processing…" : "Ready"}</div>
                                    </div>
                                    {isActive && <RefreshCw size={12} className="animate-spin" style={{ marginLeft: 4 }} />}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Asset grid — only completed assets are shown; in-flight work is reflected in the Active Queue Status above */}
            {(() => {
                const completedAssets = assets.filter(a => a.assetStatus === "COMPLETE" && a.storageUrl)
                if (completedAssets.length === 0) {
                    return hasActiveJobs ? null : (
                        <div style={{
                            textAlign: "center", padding: "60px 20px", color: PROD_BRAND.gray,
                            background: "#fcfdff", borderRadius: 20, border: `2px dashed #e2e8f0`
                        }}>
                            <div style={{ opacity: 0.3, marginBottom: 16 }}><Package size={48} /></div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                                Click &apos;Initialize Assets&apos; to begin the clinical generation process.
                            </p>
                        </div>
                    )
                }
                return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                    {completedAssets.map(asset => {
                        const isImage = asset.assetType === "CAROUSEL_PNG"
                        const isVideo = asset.assetType === "VIDEO_MP4"

                        return (
                            <div
                                key={asset.id}
                                style={{
                                    borderRadius: 24, overflow: "hidden",
                                    background: "#fff",
                                    border: `1px solid ${asset.assetStatus === "COMPLETE" ? "#eef2f6" : PROD_BRAND.blue + "22"}`,
                                    boxShadow: "0 10px 30px rgba(4, 31, 80, 0.04)",
                                    transition: "all 0.3s ease",
                                    display: "flex", flexDirection: "column"
                                }}
                            >
                                {/* Preview / Thumbnail Area */}
                                <div style={{ height: 160, background: "#f8fafc", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {asset.assetStatus === "COMPLETE" && asset.storageUrl ? (
                                        isImage ? (
                                            (() => {
                                                const slideUrls = (asset.metadata?.slideUrls as string[]) ?? []
                                                return slideUrls.length > 0 ? (
                                                    <CarouselPreview slideUrls={slideUrls} />
                                                ) : (
                                                    <img src={asset.storageUrl!} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Thumbnail" />
                                                )
                                            })()
                                        ) : isVideo ? (
                                            <video muted src={asset.storageUrl!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{ opacity: 0.1, color: PROD_BRAND.navy }}>{React.cloneElement(ASSET_ICON[asset.assetType] as any, { size: 64 })}</div>
                                        )
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                            <div className="animate-spin text-blue-500"><RefreshCw size={28} /></div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: PROD_BRAND.blue, textTransform: "uppercase" }}>{asset.assetStatus}</div>
                                        </div>
                                    )}
                                    
                                    {/* Type Overlay */}
                                    <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 12px", borderRadius: 10, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, color: PROD_BRAND.navy, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                                        {ASSET_ICON[asset.assetType]} {asset.assetType.replace(/_/g, " ")}
                                    </div>
                                </div>

                                {/* Body */}
                                <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: PROD_BRAND.navy, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {asset.fileName || "clinical_distribution_asset"}
                                        </div>
                                        <div style={{ fontSize: 10, color: PROD_BRAND.gray, fontWeight: 600 }}>{asset.platform} • Digital Asset</div>
                                    </div>

                                    {/* Footer / Actions */}
                                    <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                                        {asset.assetStatus === "COMPLETE" && asset.storageUrl ? (
                                            <>
                                                <button
                                                    onClick={() => setPreviewAsset(asset)}
                                                    style={{ flex: 1, height: 36, borderRadius: 10, background: "#f1f5f9", border: "none", color: PROD_BRAND.navy, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                <a
                                                    href={`${asset.storageUrl}?download=${encodeURIComponent(asset.fileName || "asset")}`}
                                                    download={asset.fileName || true}
                                                    style={{ width: 36, height: 36, borderRadius: 10, background: PROD_BRAND.blueLight, border: "none", color: PROD_BRAND.blue, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                                                >
                                                    <Download size={14} />
                                                </a>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                )
            })()}

            {/* Modal — carousel gets full viewer, others get text preview */}
            {previewAsset && previewAsset.assetType === "CAROUSEL_PNG" ? (
                <CarouselViewInline
                    asset={{
                        id: previewAsset.id,
                        assetType: previewAsset.assetType,
                        storageUrl: previewAsset.storageUrl,
                        fileName: previewAsset.fileName,
                        metadata: previewAsset.metadata as any,
                    }}
                    onClose={() => setPreviewAsset(null)}
                />
            ) : previewAsset ? (
                <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
            ) : null}
        </div>
    )
}
