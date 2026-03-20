"use client"

import React, { useEffect, useCallback } from "react"
import {
    Image, FileText, Video, Music, ExternalLink,
    RefreshCw, AlertCircle, Clock, Zap, CheckCircle2, Copy, Check, X,
} from "lucide-react"
import type { ContentAsset, RenderJob, AssetStatus, AssetType } from "./types"
import { PROD_BRAND } from "./CalendarTable"

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

    useEffect(() => {
        const meta = asset.metadata as Record<string, unknown> | null;
        if (meta?.content) {
            setContent(meta.content as string);
            setLoading(false);
        } else if (asset.storageUrl) {
            fetch(`/api/production/assets/proxy?url=${encodeURIComponent(asset.storageUrl)}`)
                .then(res => res.text())
                .then(text => setContent(text))
                .catch(err => setContent("Error loading content: " + String(err)))
                .finally(() => setLoading(false));
        } else {
            setContent("");
            setLoading(false);
        }
    }, [asset]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.6)", zIndex: 9999, backdropFilter: "blur(2px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 20
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 800,
                    height: "80vh", display: "flex", flexDirection: "column", gap: 16,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
        <div>
            {/* Header + generate button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: PROD_BRAND.navy, margin: 0 }}>
                    Generated Assets
                    {hasActiveJobs && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: PROD_BRAND.blue, fontWeight: 400 }}>
                            (rendering in progress…)
                        </span>
                    )}
                </h3>

                <button
                    onClick={onGenerateAssets}
                    disabled={generating}
                    style={{
                        padding: "6px 14px", borderRadius: 6, border: "none",
                        background: generating ? PROD_BRAND.border : hasActiveJobs ? PROD_BRAND.amber : PROD_BRAND.navy,
                        color: generating ? PROD_BRAND.gray : PROD_BRAND.white,
                        fontSize: 12, fontWeight: 600,
                        cursor: generating ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                    }}
                >
                    {generating
                        ? <><RefreshCw size={12} className="animate-spin" /> Queueing…</>
                        : hasActiveJobs
                            ? <><RefreshCw size={12} /> Force Retry</>
                            : hasAnyAssets
                                ? <><RefreshCw size={12} /> Re-generate</>
                                : <><Zap size={12} /> Generate Assets</>
                    }
                </button>
            </div>

            {/* RenderJob status strip */}
            {renderJobs.length > 0 && (
                <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {renderJobs.map(job => {
                        const isActive = job.status === "QUEUED" || job.status === "RUNNING"
                        return (
                            <div
                                key={job.id}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "4px 10px", borderRadius: 20,
                                    background: isActive ? PROD_BRAND.blueFaint : job.status === "COMPLETE" ? PROD_BRAND.greenFaint : PROD_BRAND.redFaint,
                                    fontSize: 11, fontWeight: 600,
                                    color: isActive ? PROD_BRAND.blue : job.status === "COMPLETE" ? PROD_BRAND.green : PROD_BRAND.red,
                                }}
                            >
                                {job.jobType}
                                {isActive && <RefreshCw size={10} className="animate-spin" />}
                                {job.status === "COMPLETE" && <CheckCircle2 size={10} />}
                                {job.status === "FAILED" && <AlertCircle size={10} />}
                                <span style={{ fontWeight: 400, marginLeft: 2 }}>{job.status}</span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Asset grid */}
            {assets.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: PROD_BRAND.gray, fontSize: 13 }}>
                    {hasActiveJobs
                        ? "Assets are being generated. This panel refreshes automatically."
                        : "No assets generated yet. Click \"Generate Assets\" to start rendering."}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {assets.map(asset => {
                        const statusMeta = ASSET_STATUS_STYLE[asset.assetStatus] ?? { icon: <Clock size={12} />, color: PROD_BRAND.gray, label: asset.assetStatus }
                        const isImage = asset.assetType === "CAROUSEL_PNG"
                        const isVideo = asset.assetType === "VIDEO_MP4"

                        return (
                            <div
                                key={asset.id}
                                style={{
                                    border: `1px solid ${PROD_BRAND.border}`,
                                    borderRadius: 8, overflow: "hidden",
                                    background: PROD_BRAND.white,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                }}
                            >
                                {/* Preview area */}
                                <div
                                    style={{
                                        height: 120, background: PROD_BRAND.grayFaint,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        position: "relative", overflow: "hidden",
                                    }}
                                >
                                    {isImage && asset.storageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={asset.storageUrl}
                                            alt={asset.fileName ?? "Asset"}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : isVideo && asset.storageUrl ? (
                                        <video
                                            src={asset.storageUrl}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            muted
                                            preload="metadata"
                                        />
                                    ) : (
                                        <div style={{ color: PROD_BRAND.gray, opacity: 0.4 }}>
                                            {ASSET_ICON[asset.assetType]}
                                        </div>
                                    )}

                                    {/* Status overlay */}
                                    {asset.assetStatus !== "COMPLETE" && (
                                        <div
                                            style={{
                                                position: "absolute", inset: 0,
                                                background: "rgba(255,255,255,0.72)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexDirection: "column", gap: 6,
                                            }}
                                        >
                                            <span style={{ color: statusMeta.color }}>{statusMeta.icon}</span>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: statusMeta.color }}>
                                                {statusMeta.label}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info row */}
                                <div style={{ padding: "8px 10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                        <span style={{ color: PROD_BRAND.gray }}>{ASSET_ICON[asset.assetType]}</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: PROD_BRAND.navy, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {asset.assetType.replace("_", " ")}
                                        </span>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: statusMeta.color }}>
                                            {statusMeta.icon}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 10, color: PROD_BRAND.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {asset.fileName ?? asset.platform}
                                    </div>

                                    {/* Text preview + copy for inline-generated text assets */}
                                    {asset.assetStatus === "COMPLETE" && (asset.assetType === "TEXT_POST" || asset.assetType === "EMAIL_HTML" || asset.assetType === "VIDEO_SCRIPT_JSON") && (() => {
                                        const meta = asset.metadata as Record<string, unknown> | null
                                        const content = (meta?.content as string) ?? ""
                                        const preview = content.slice(0, 90) + (content.length > 90 ? "…" : "")
                                        return content ? (
                                            <div style={{ marginTop: 6 }}>
                                                <div style={{
                                                    fontSize: 10, color: PROD_BRAND.gray,
                                                    background: PROD_BRAND.grayFaint,
                                                    padding: "4px 6px", borderRadius: 4,
                                                    marginBottom: 4, lineHeight: 1.4,
                                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                                }}>{preview}</div>
                                                <CopyButton text={content} />
                                            </div>
                                        ) : null
                                    })()}

                                    {/* Audio player for MP3 */}
                                    {asset.assetType === "AUDIO_MP3" && asset.assetStatus === "COMPLETE" && asset.storageUrl && !asset.storageUrl.startsWith("data:") && (
                                        <div style={{ marginTop: 6 }}>
                                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                            <audio controls style={{ width: "100%", height: 28 }} src={asset.storageUrl} />
                                        </div>
                                    )}

                                    {/* Video player controls for MP4 */}
                                    {asset.assetType === "VIDEO_MP4" && asset.assetStatus === "COMPLETE" && asset.storageUrl && (
                                        <div style={{ marginTop: 6 }}>
                                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                            <video
                                                controls
                                                style={{ width: "100%", borderRadius: 6, maxHeight: 160 }}
                                                src={asset.storageUrl}
                                            />
                                        </div>
                                    )}

                                    {/* Carousel: all slide links */}
                                    {asset.assetType === "CAROUSEL_PNG" && asset.assetStatus === "COMPLETE" && (() => {
                                        const meta = asset.metadata as Record<string, unknown> | null
                                        const slideUrls = meta?.slideUrls as string[] | undefined
                                        if (!slideUrls || slideUrls.length <= 1) return null
                                        return (
                                            <div style={{ marginTop: 6, display: "flex", overflowX: "auto", gap: 8, paddingBottom: 8 }} className="no-scrollbar">
                                                {slideUrls.map((url, i) => (
                                                    <div key={i} style={{ flexShrink: 0, width: 120, borderRadius: 8, overflow: "hidden", border: `1px solid ${PROD_BRAND.border}`, background: PROD_BRAND.grayFaint }}>
                                                        <img src={`/api/production/assets/proxy?url=${encodeURIComponent(url)}`} alt={`Slide ${i + 1}`} style={{ width: "100%", height: "auto", display: "block", aspectRatio: "1/1", objectFit: "cover" }} />
                                                        <div style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-montserrat)", color: PROD_BRAND.navy, textAlign: "center", borderTop: `1px solid ${PROD_BRAND.border}`, background: PROD_BRAND.white }}>
                                                            SLIDE {i + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })()}

                                    {asset.storageUrl && asset.assetStatus === "COMPLETE" &&
                                        !asset.storageUrl.startsWith("data:") && (
                                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                {(asset.assetType === "EMAIL_HTML" || asset.assetType === "TEXT_POST" || asset.assetType === "VIDEO_SCRIPT_JSON") ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: PROD_BRAND.blue, textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                                    >
                                                        Open <ExternalLink size={10} />
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={asset.storageUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: PROD_BRAND.blue, textDecoration: "none" }}
                                                    >
                                                        Open <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {(asset.assetType === "VIDEO_MP4" || asset.assetType === "AUDIO_MP3" || asset.assetType === "CAROUSEL_PNG" || asset.assetType === "VIDEO_SCRIPT_JSON" || asset.assetType === "EMAIL_HTML") && (
                                                    <a
                                                        href={asset.storageUrl}
                                                        download={asset.fileName ?? undefined}
                                                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: PROD_BRAND.green, textDecoration: "none" }}
                                                    >
                                                        DL <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            {previewAsset && <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />}
        </div>
    )
}
