"use client"

import React from "react"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import type { QualityGateResult, QualityGateStatus } from "./types"
import { PROD_BRAND } from "./CalendarTable"

const GATE_QUESTIONS = [
    "Is this unmistakably specific to psychiatric assessment mastery?",
    "Does it teach a real, actionable clinical skill?",
    "Is it saveable / reference-quality?",
    "Does the hook create genuine clinical tension or challenge a misconception?",
    "Does it reinforce trust in Tonia's specific PAM methodology?",
]

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
    const pct = (score / 5) * 100
    const color = score >= 4 ? PROD_BRAND.green : score >= 3 ? PROD_BRAND.amber : PROD_BRAND.red
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
                style={{
                    flex: 1, height: 6, borderRadius: 3,
                    background: PROD_BRAND.border, overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%", width: `${pct}%`,
                        background: color, borderRadius: 3,
                        transition: "width 0.6s ease",
                    }}
                />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 24, textAlign: "right" }}>
                {score}
            </span>
        </div>
    )
}

interface QualityGatePanelProps {
    result: QualityGateResult | null
    status: QualityGateStatus
    /** Called when the admin clicks "Run Quality Gate" (no bypass) */
    onRunGate: () => Promise<void>
    /** Called when admin clicks "Bypass Quality Gate" */
    onBypass: (reason: string) => Promise<void>
    running: boolean
}

export const QualityGatePanel: React.FC<QualityGatePanelProps> = ({
    result, status, onRunGate, onBypass, running,
}) => {
    const [bypassMode, setBypassMode] = React.useState(false)
    const [bypassReason, setBypassReason] = React.useState("")

    const scores = result
        ? [result.score1, result.score2, result.score3, result.score4, result.score5]
        : []
    const reasonings = result
        ? [result.reasoning1, result.reasoning2, result.reasoning3, result.reasoning4, result.reasoning5]
        : []

    return (
        <div>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: PROD_BRAND.navy, margin: 0 }}>
                        Anti-Generic Quality Gate
                    </h3>
                    {status === "PASSED" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: PROD_BRAND.green }}>
                            <CheckCircle2 size={13} /> PASSED
                        </span>
                    )}
                    {status === "FAILED" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: PROD_BRAND.red }}>
                            <XCircle size={13} /> FAILED
                        </span>
                    )}
                    {status === "BYPASSED" && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: PROD_BRAND.amber }}>
                            <AlertTriangle size={13} /> BYPASSED
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                    {!bypassMode && (
                        <button
                            onClick={onRunGate}
                            disabled={running}
                            style={{
                                padding: "6px 14px", borderRadius: 6, border: "none",
                                background: running ? PROD_BRAND.border : PROD_BRAND.blue,
                                color: running ? PROD_BRAND.gray : PROD_BRAND.white,
                                fontSize: 12, fontWeight: 600, cursor: running ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                            }}
                        >
                            {running ? "Running…" : status === "PENDING" ? "Run Gate" : "Re-run Gate"}
                        </button>
                    )}
                    {!bypassMode && (
                        <button
                            onClick={() => setBypassMode(true)}
                            disabled={running}
                            style={{
                                padding: "6px 14px", borderRadius: 6,
                                border: `1px solid ${PROD_BRAND.border}`,
                                background: "transparent", color: PROD_BRAND.amber,
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}
                        >
                            Bypass
                        </button>
                    )}
                </div>
            </div>

            {/* Bypass form */}
            {bypassMode && (
                <div style={{ marginBottom: 16, padding: 14, borderRadius: 8, background: PROD_BRAND.amberFaint, border: `1px solid ${PROD_BRAND.amber}33` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: PROD_BRAND.amber, marginBottom: 8 }}>
                        Bypass reason (required):
                    </div>
                    <textarea
                        value={bypassReason}
                        onChange={e => setBypassReason(e.target.value)}
                        rows={2}
                        placeholder="e.g. Manually verified — clinical accuracy confirmed"
                        style={{ width: "100%", borderRadius: 6, border: `1px solid ${PROD_BRAND.border}`, padding: "8px 10px", fontSize: 12, resize: "vertical", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                            onClick={async () => { await onBypass(bypassReason); setBypassMode(false); setBypassReason("") }}
                            disabled={!bypassReason.trim() || running}
                            style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: PROD_BRAND.amber, color: PROD_BRAND.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                            Confirm Bypass
                        </button>
                        <button
                            onClick={() => { setBypassMode(false); setBypassReason("") }}
                            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${PROD_BRAND.border}`, background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Result bypass note */}
            {status === "BYPASSED" && result?.bypassReason && (
                <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: PROD_BRAND.amberFaint, fontSize: 12, color: PROD_BRAND.amber }}>
                    <strong>Bypass reason:</strong> {result.bypassReason}
                </div>
            )}

            {/* Summary strip */}
            {result && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: result.passed ? PROD_BRAND.greenFaint : PROD_BRAND.redFaint }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: result.passed ? PROD_BRAND.green : PROD_BRAND.red, lineHeight: 1 }}>
                        {Number(result.overallScore).toFixed(1)}
                        <span style={{ fontSize: 13, fontWeight: 400, color: PROD_BRAND.gray }}> / 5</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: result.passed ? PROD_BRAND.green : PROD_BRAND.red }}>
                            {result.passed ? "Passed — 4 of 5 questions scored ≥ 3" : "Failed — fewer than 4 questions met threshold"}
                        </div>
                        {result.evaluatedAt && (
                            <div style={{ fontSize: 11, color: PROD_BRAND.gray, marginTop: 2 }}>
                                Evaluated {new Date(result.evaluatedAt).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Per-question breakdown */}
            {result && scores.length === 5 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {GATE_QUESTIONS.map((q, i) => (
                        <div key={i} style={{ borderBottom: i < 4 ? `1px solid ${PROD_BRAND.border}` : "none", paddingBottom: i < 4 ? 14 : 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: PROD_BRAND.blue, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</span>
                                <span style={{ fontSize: 12, color: PROD_BRAND.navy }}>{q}</span>
                            </div>
                            <ScoreBar score={scores[i]} />
                            {reasonings[i] && (
                                <div style={{ fontSize: 11, color: PROD_BRAND.gray, marginTop: 6, paddingLeft: 20, fontStyle: "italic" }}>
                                    {reasonings[i]}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!result && status === "PENDING" && !running && (
                <div style={{ textAlign: "center", padding: 32, color: PROD_BRAND.gray, fontSize: 13 }}>
                    Quality gate has not been run yet. Click "Run Gate" to evaluate this content.
                </div>
            )}
        </div>
    )
}


