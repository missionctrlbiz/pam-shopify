"use client"

import React, { useEffect, useCallback } from "react"
import {
    Image, FileText, Video, Music, ExternalLink,
    RefreshCw, AlertCircle, Clock, Zap, CheckCircle2, Copy, Check,
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

export const AssetGrid: React.FC<AssetGridProps> = ({
    assets, renderJobs, entryId, onGenerateAssets, generating,
}) => {
    const hasActiveJobs = renderJobs.some(j => j.status === "QUEUED" || j.status === "RUNNING")
    const hasAnyAssets = assets.length > 0

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

                                    {/* Carousel: all slide links */}
                                    {asset.assetType === "CAROUSEL_PNG" && asset.assetStatus === "COMPLETE" && (() => {
                                        const meta = asset.metadata as Record<string, unknown> | null
                                        const slideUrls = meta?.slideUrls as string[] | undefined
                                        if (!slideUrls || slideUrls.length <= 1) return null
                                        return (
                                            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {slideUrls.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                        style={{ fontSize: 10, fontWeight: 600, color: PROD_BRAND.blue, textDecoration: "none" }}
                                                    >
                                                        Slide {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )
                                    })()}

                                    {/* Open/download for binary assets */}
                                    {asset.storageUrl && asset.assetStatus === "COMPLETE" &&
                                        !asset.storageUrl.startsWith("data:") && (
                                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                                <a
                                                    href={asset.storageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: PROD_BRAND.blue, textDecoration: "none" }}
                                                >
                                                    Open <ExternalLink size={10} />
                                                </a>
                                                {(asset.assetType === "VIDEO_MP4" || asset.assetType === "AUDIO_MP3" || asset.assetType === "CAROUSEL_PNG" || asset.assetType === "VIDEO_SCRIPT_JSON") && (
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
        </div>
    )
}
