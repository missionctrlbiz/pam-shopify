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
    pointIndex: number
    totalPoints: number
    text: string
    sceneDuration: number
    textOverlay?: string
    visualDirection?: string
    emojiAccent?: string
}

/**
 * Teaching Scene — PREMIUM DESIGN
 * Dark gradient background with glowing accent card, animated number badge,
 * clean typography, subtle floating orb effects.
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

    // Scene enter/exit
    const enterFade = interpolate(frame, [0, 8], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
    const exitFade = interpolate(frame, [sceneDuration - 10, sceneDuration - 1], [1, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
    const opacity = Math.min(enterFade, exitFade)

    // Number spring
    const numSpring = spring({ frame, fps, config: { mass: 1, damping: 14, stiffness: 120 } })
    const numTranslate = interpolate(numSpring, [0, 1], [-60, 0])
    const numOpacity = interpolate(numSpring, [0, 1], [0, 1])

    // Left accent bar
    const gutterSpring = spring({
        frame: Math.max(0, frame - 4), fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const gutterHeight = interpolate(gutterSpring, [0, 1], [0, 100])

    // Content card spring
    const cardSpring = spring({
        frame: Math.max(0, frame - 6), fps,
        config: { mass: 1, damping: 16, stiffness: 100 },
    })
    const cardTranslate = interpolate(cardSpring, [0, 1], [40, 0])
    const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1])

    // Floating orb
    const orbFloat = interpolate(frame, [0, 120], [0, 360], { extrapolateRight: "extend" })

    // Detect bullet list
    const bulletSeparators = [" • ", " — ", " – "]
    const isBulletList = bulletSeparators.some((sep) => text.includes(sep))
    let bulletLines: string[] = []
    let mainText = text

    if (isBulletList) {
        const sep = bulletSeparators.find((s) => text.includes(s))!
        const parts = text.split(sep).map((s) => s.trim()).filter(Boolean)
        mainText = parts[0]
        bulletLines = parts.slice(1)
    }

    const mainLines = splitIntoLines(mainText, 26)

    // Alternate accent colors
    const accentColors = [
        { primary: COLORS.purpleFrom, glow: "rgba(168,85,247,0.15)" },
        { primary: COLORS.purpleTo, glow: "rgba(109,40,217,0.15)" },
    ]
    const accent = accentColors[pointIndex % accentColors.length]

    // LAYOUT variations
    const layoutVariant = pointIndex % 3; // 0: Spotlight Card, 1: Flush Edge + Arrow, 2: Split Screen SVG

    return (
        <AbsoluteFill
            style={{
                background: COLORS.white,
                opacity,
            }}
        >
            {/* Layout 2: Massive Split Screen Icon Background */}
            {layoutVariant === 2 && (
                <div style={{
                    position: "absolute", top: "15%", right: -120,
                    opacity: 0.04, transform: `scale(5) rotate(-15deg)`
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none" stroke={COLORS.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                </div>
            )}

            {/* Top accent line */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${COLORS.purpleFrom}, ${COLORS.purpleTo}, transparent)`,
            }} />

            {/* PAM watermark */}
            <PAMLogo variant="watermark" />

            {/* LEFT GUTTER — accent bar (Only for Layout 0 and 2) */}
            {layoutVariant !== 1 && (
                <div style={{
                    position: "absolute", left: 0, top: "20%",
                    width: 6, height: `${gutterHeight * 0.6}%`,
                    background: `linear-gradient(180deg, ${COLORS.purpleFrom}, ${COLORS.purpleTo})`,
                    borderRadius: "0 3px 3px 0",
                }} />
            )}

            {/* Main content area */}
            <div style={{
                position: "absolute", top: "50%", left: 0, right: 0,
                transform: "translateY(-52%)", padding: "0 72px",
                display: "flex", flexDirection: "column", gap: 0,
            }}>
                {/* Point number + label row */}
                <div style={{
                    display: "flex", alignItems: "flex-end", gap: 20,
                    marginBottom: 36,
                    opacity: numOpacity,
                    transform: `translateX(${numTranslate}px)`,
                }}>
                    {/* Large numeral */}
                    <div style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 900, fontSize: layoutVariant === 1 ? 140 : 110,
                        color: COLORS.purpleFrom,
                        lineHeight: 0.9, letterSpacing: "-0.04em",
                        minWidth: layoutVariant === 1 ? 110 : 90,
                    }}>
                        {String(pointIndex + 1).padStart(2, "0")}
                    </div>

                    {/* Label + divider */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8 }}>
                        <div style={{
                            fontFamily: FONTS.body,
                            fontWeight: 800, fontSize: 16,
                            color: COLORS.gray,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                        }}>
                            Clinical Point
                        </div>
                        <div style={{
                            height: 2, width: 120,
                            background: `linear-gradient(90deg, ${COLORS.purpleFrom}, transparent)`,
                            borderRadius: 2,
                        }} />
                    </div>
                </div>

                {/* Content Container (Card vs Flush edge) */}
                <div style={{
                    background: layoutVariant === 0 ? COLORS.white : "transparent",
                    borderRadius: layoutVariant === 0 ? 20 : 0,
                    padding: layoutVariant === 0 ? "36px 40px" : layoutVariant === 1 ? "20px 0 20px 40px" : "10px 0",
                    border: layoutVariant === 0 ? `1px solid ${COLORS.grayLight}` : "none",
                    borderLeft: layoutVariant === 1 ? `12px solid ${COLORS.purpleTo}` : "none",
                    boxShadow: layoutVariant === 0 ? `0 8px 32px rgba(15, 23, 42, 0.08)` : "none",
                    opacity: cardOpacity,
                    transform: `translateY(${cardTranslate}px)`,
                }}>
                    {/* Main teaching text */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
                        {layoutVariant === 1 && (
                            <div style={{ position: "absolute", left: -90, top: 10, animation: "bounce 2s infinite" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={COLORS.purpleTo} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </div>
                        )}
                        {mainLines.map((line, i) => (
                            <AnimatedText
                                key={i}
                                text={line}
                                fontSize={56}
                                fontWeight={800}
                                fontFamily={FONTS.heading}
                                color={COLORS.navy}
                                delayFrames={10 + i * 7}
                                lineHeight={1.2}
                                textAlign="left"
                            />
                        ))}
                    </div>

                    {/* Bullet sub-points */}
                    {isBulletList && bulletLines.length > 0 && (
                        <div style={{
                            display: "flex", flexDirection: "column", gap: 16,
                            borderLeft: `3px solid ${COLORS.purpleTo}`,
                            paddingLeft: 28, marginTop: 24,
                        }}>
                            {bulletLines.map((bullet, i) => (
                                <AnimatedText
                                    key={i}
                                    text={bullet}
                                    fontSize={34}
                                    fontWeight={700}
                                    fontFamily={FONTS.body}
                                    color={COLORS.gray}
                                    delayFrames={22 + i * 9}
                                    lineHeight={1.45}
                                    textAlign="left"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SCENE COUNTER — bottom-right */}
            <SceneCounter current={pointIndex + 1} total={totalPoints} accent={accent.primary} />

            {/* Emoji accent badge */}
            {emojiAccent && (
                <div style={{
                    position: "absolute", bottom: 110, left: 72,
                    fontSize: 56, lineHeight: 1,
                    opacity: numOpacity,
                    transform: `translateX(${numTranslate}px)`,
                }}>
                    {emojiAccent}
                </div>
            )}

            {/* Visual direction hint */}
            {visualDirection && (
                <div style={{
                    position: "absolute", bottom: 52, left: 72, right: 120,
                    fontFamily: FONTS.body,
                    fontSize: 16, fontWeight: 400,
                    color: COLORS.gray,
                    letterSpacing: "0.04em",
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}>
                    {visualDirection}
                </div>
            )}
        </AbsoluteFill>
    )
}

// ── Scene Counter ─────────────────────────────────────────────
const SceneCounter: React.FC<{ current: number; total: number; accent: string }> = ({ current, total, accent }) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()
    const sp = spring({
        frame: Math.max(0, frame - 12), fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const opacity = interpolate(sp, [0, 1], [0, 1])

    return (
        <div style={{
            position: "absolute", bottom: 56, right: 72,
            display: "flex", alignItems: "center", gap: 8,
            opacity,
        }}>
            <div style={{
                fontFamily: FONTS.heading, fontWeight: 800, fontSize: 22,
                color: accent, letterSpacing: "0.08em",
            }}>
                {String(current).padStart(2, "0")}
            </div>
            <div style={{
                width: 24, height: 2,
                background: COLORS.grayLight, borderRadius: 1,
            }} />
            <div style={{
                fontFamily: FONTS.heading, fontWeight: 600, fontSize: 18,
                color: COLORS.gray,
            }}>
                {String(total).padStart(2, "0")}
            </div>
        </div>
    )
}

// ── Helper ────────────────────────────────────────────────────
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
