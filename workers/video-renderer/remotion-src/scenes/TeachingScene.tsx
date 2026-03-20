import React from "react"
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion"
import { COLORS, FONTS } from "../types"
import { AnimatedText } from "../components/AnimatedText"
import { PAMLogo } from "../components/PAMLogo"

interface TeachingSceneProps {
    pointIndex: number  // 0-based
    totalPoints: number
    text: string
    sceneDuration: number
    /** Scene-director on-screen text (already merged into text by buildScenes) */
    textOverlay?: string
    /** Visual direction note — shown as a small caption hint */
    visualDirection?: string
    /** Decorative emoji badge */
    emojiAccent?: string
}

/**
 * Middle Teaching Scenes — one per teaching point from masterJson.
 *
 * Layout strategy:
 *   • Point number badge — top-left, large blue numeral
 *   • Dividing rule between number zone and text zone
 *   • Teaching text — large Montserrat headline style, broken into lines
 *   • "Bullet" lines (if text contains " • " or " — ") rendered as a list
 *   • PAM watermark — top-right
 *   • Scene counter pill — bottom-right (e.g. "3 / 6")
 *   • Blue left-accent gutter bar running full height beside number
 *
 * Scene-exit: fast fade out in final 10 frames.
 * Scene-enter: fast fade in over first 8 frames.
 */
export const TeachingScene: React.FC<TeachingSceneProps> = ({
    pointIndex,
    totalPoints,
    text,
    sceneDuration,
    visualDirection,
    emojiAccent,
}) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    // Scene enter: fade in
    const enterFade = interpolate(frame, [0, 8], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    })
    // Scene exit: fade out
    const exitFade = interpolate(
        frame,
        [sceneDuration - 10, sceneDuration - 1],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
    const opacity = Math.min(enterFade, exitFade)

    // Number spring
    const numSpring = spring({
        frame,
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const numTranslate = interpolate(numSpring, [0, 1], [-60, 0])
    const numOpacity = interpolate(numSpring, [0, 1], [0, 1])

    // Left gutter bar reveal (height 0 → 100%)
    const gutterSpring = spring({
        frame: Math.max(0, frame - 4),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const gutterHeight = interpolate(gutterSpring, [0, 1], [0, 100])

    // 1. Markdown Table Parsing
    const hasTable = text.includes("|") && text.split("\n").some(l => l.includes("---"))
    let tableHeaders: string[] = []
    let tableRows: string[][] = []
    let mainText = text

    if (hasTable) {
        const lines = text.split("\n").map(l => l.trim())
        const headerIndex = lines.findIndex(l => l.startsWith("|") && l.endsWith("|") && !l.includes("---"))
        const dividerIndex = lines.findIndex(l => l.includes("|") && l.includes("---"))

        if (headerIndex !== -1 && dividerIndex !== -1) {
            tableHeaders = lines[headerIndex]
                .split("|")
                .map(s => s.trim())
                .filter(Boolean)

            tableRows = lines
                .slice(dividerIndex + 1)
                .filter(l => l.startsWith("|") && l.trim().length > 1)
                .map(row => row.split("|").map(s => s.trim()).filter(Boolean))

            // Text preceding the table
            mainText = lines.slice(0, headerIndex).join("\n").trim()
            if (!mainText) mainText = "Data Overview"
        }
    }

    // 2. Detect if the text is a bullet list (separated by " • " or " — " or newline)
    const bulletSeparators = [" • ", " — ", " – ", "\n"]
    const isBulletList = !hasTable && bulletSeparators.some((sep) => mainText.includes(sep))
    let bulletLines: string[] = []

    if (isBulletList) {
        const sep = bulletSeparators.find((s) => mainText.includes(s))!
        const parts = mainText.split(sep).map((s) => s.trim()).filter(Boolean)
        mainText = parts[0]
        bulletLines = parts.slice(1)
    }

    // Break main text into lines (≤ 28 chars for large font)
    const mainLines = splitIntoLines(mainText, 28)

    return (
        <AbsoluteFill
            style={{
                background: `radial-gradient(circle at 10% 10%, #FFFFFF 0%, #F0F4F8 100%)`, // Enhanced Premium Background gradient
                opacity,
            }}
        >
            {/* PAM watermark */}
            <PAMLogo variant="watermark" />

            {/* LEFT GUTTER — blue accent bar */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    width: 6,
                    height: `${gutterHeight * 0.6}%`,
                    background: `linear-gradient(180deg, ${COLORS.blue}, ${COLORS.blueLight})`,
                    borderRadius: "0 3px 3px 0",
                }}
            />

            {/* Main layout block */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    transform: "translateY(-52%)",
                    padding: "0 72px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                {/* Point number + label row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 20,
                        marginBottom: 36,
                        opacity: numOpacity,
                        transform: `translateX(${numTranslate}px)`,
                    }}
                >
                    {/* Large numeral */}
                    <div
                        style={{
                            fontFamily: FONTS.heading,
                            fontWeight: 900,
                            fontSize: 120,
                            color: COLORS.blue,
                            lineHeight: 0.9,
                            letterSpacing: "-0.04em",
                            minWidth: 90,
                        }}
                    >
                        {String(pointIndex + 1).padStart(2, "0")}
                    </div>

                    {/* Vertical stack: "CLINICAL POINT" label */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            paddingBottom: 8,
                        }}
                    >
                        <div
                            style={{
                                fontFamily: FONTS.body,
                                fontWeight: 600,
                                fontSize: 18,
                                color: COLORS.gray,
                                letterSpacing: "0.22em",
                                textTransform: "uppercase",
                            }}
                        >
                            Clinical Point
                        </div>
                        {/* Thin divider */}
                        <div
                            style={{
                                height: 2,
                                width: 120,
                                background: `linear-gradient(90deg, ${COLORS.blue}, transparent)`,
                                borderRadius: 2,
                            }}
                        />
                    </div>
                </div>

                {/* Teaching text — primary content */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: isBulletList ? 44 : 0,
                    }}
                >
                    {mainLines.map((line, i) => (
                        <AnimatedText
                            key={i}
                            text={line}
                            fontSize={68}
                            fontWeight={800}
                            fontFamily={FONTS.heading}
                            color={COLORS.navy}
                            delayFrames={8 + i * 7}
                            lineHeight={1.15}
                            textAlign="left"
                        />
                    ))}
                </div>

                {/* Bullet sub-points (if any) */}
                {isBulletList && bulletLines.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                            borderLeft: `4px solid ${COLORS.blue}`,
                            paddingLeft: 32,
                            marginTop: 12,
                        }}
                    >
                        {bulletLines.map((bullet, i) => (
                            <AnimatedText
                                key={i}
                                text={bullet}
                                fontSize={38}
                                fontWeight={400}
                                fontFamily={FONTS.body}
                                color={COLORS.navy}
                                delayFrames={20 + i * 9}
                                lineHeight={1.45}
                                textAlign="left"
                            />
                        ))}
                    </div>
                )}

                {/* Table Layout block (Grid presentation) */}
                {hasTable && tableHeaders.length > 0 && (
                    <div
                        style={{
                            marginTop: 24,
                            background: "rgba(255, 255, 255, 0.8)",
                            borderRadius: 16,
                            padding: 24,
                            border: `1px solid ${COLORS.grayLight}`,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.03)",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        {/* Table Header Row */}
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${tableHeaders.length}, 1fr)`, gap: 12, borderBottom: `2px solid ${COLORS.blue}`, paddingBottom: 12 }}>
                            {tableHeaders.map((header, i) => (
                                <div key={i} style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 24, color: COLORS.blue }}>
                                    {header}
                                </div>
                            ))}
                        </div>

                        {/* Table Body */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                            {tableRows.map((row, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: `repeat(${tableHeaders.length}, 1fr)`,
                                        gap: 12,
                                        padding: "10px 0",
                                        borderBottom: rowIndex === tableRows.length - 1 ? "none" : `1px solid ${COLORS.grayLight}`
                                    }}
                                >
                                    {row.map((cell, cellIndex) => (
                                        <div key={cellIndex} style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: 22, color: COLORS.navy }}>
                                            {cell}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SCENE COUNTER — bottom-right */}
            <SceneCounter current={pointIndex + 1} total={totalPoints} />

            {/* Emoji accent badge — bottom-left, spring-animated */}
            {emojiAccent && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 110,
                        left: 72,
                        fontSize: 56,
                        lineHeight: 1,
                        opacity: numOpacity,
                        transform: `translateX(${numTranslate}px)`,
                    }}
                >
                    {emojiAccent}
                </div>
            )}

            {/* Visual direction hint — very small caption at bottom */}
            {visualDirection && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 52,
                        left: 72,
                        right: 120,
                        fontFamily: FONTS.body,
                        fontSize: 18,
                        fontWeight: 400,
                        color: COLORS.gray,
                        letterSpacing: "0.04em",
                        opacity: 0.4,
                    }}
                >
                    {visualDirection}
                </div>
            )}
        </AbsoluteFill>
    )
}

// ──────────────────────────────────────────────────────────────
// Scene progress dots / counter
// ──────────────────────────────────────────────────────────────

const SceneCounter: React.FC<{ current: number; total: number }> = ({
    current,
    total,
}) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()
    const sp = spring({
        frame: Math.max(0, frame - 20),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const opacity = interpolate(sp, [0, 1], [0, 0.65])

    return (
        <div
            style={{
                position: "absolute",
                bottom: 52,
                right: 60,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity,
            }}
        >
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        width: i + 1 === current ? 28 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: i + 1 === current ? COLORS.blue : COLORS.gray,
                        transition: "width 0.3s",
                        opacity: i + 1 === current ? 1 : 0.35,
                    }}
                />
            ))}
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────────────────────
function splitIntoLines(text: string, maxChars: number): string[] {
    const words = text.split(" ")
    const lines: string[] = []
    let current = ""
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word
        if (candidate.length <= maxChars) {
            current = candidate
        } else {
            if (current) lines.push(current)
            current = word
        }
    }
    if (current) lines.push(current)
    return lines
}
