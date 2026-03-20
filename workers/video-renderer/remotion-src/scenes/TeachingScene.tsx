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

    // Alternate accent colors per point for visual variety
    const accentColors = [
        { primary: "#3B82F6", glow: "rgba(59,130,246,0.15)" },   // Blue
        { primary: "#7C3AED", glow: "rgba(124,58,237,0.15)" },   // Purple
        { primary: "#06B6D4", glow: "rgba(6,182,212,0.15)" },    // Cyan
        { primary: "#F59E0B", glow: "rgba(245,158,11,0.15)" },   // Amber
        { primary: "#10B981", glow: "rgba(16,185,129,0.15)" },   // Emerald
        { primary: "#EC4899", glow: "rgba(236,72,153,0.15)" },   // Pink
    ]
    const accent = accentColors[pointIndex % accentColors.length]

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(170deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
                opacity,
            }}
        >
            {/* Decorative floating orb */}
            <div style={{
                position: "absolute", top: 300, right: 40,
                width: 240, height: 240, borderRadius: "50%",
                background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
                transform: `translateY(${Math.sin(orbFloat * Math.PI / 180) * 10}px)`,
            }} />

            {/* Top accent line */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${accent.primary}, transparent)`,
            }} />

            {/* PAM watermark */}
            <PAMLogo variant="watermark" />

            {/* LEFT GUTTER — accent bar */}
            <div style={{
                position: "absolute", left: 0, top: "20%",
                width: 6, height: `${gutterHeight * 0.6}%`,
                background: `linear-gradient(180deg, ${accent.primary}, transparent)`,
                borderRadius: "0 3px 3px 0",
            }} />

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
                    {/* Large numeral with glow */}
                    <div style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 900, fontSize: 110,
                        color: accent.primary,
                        lineHeight: 0.9, letterSpacing: "-0.04em",
                        minWidth: 90,
                        textShadow: `0 0 40px ${accent.glow}`,
                    }}>
                        {String(pointIndex + 1).padStart(2, "0")}
                    </div>

                    {/* Label + divider */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8 }}>
                        <div style={{
                            fontFamily: FONTS.body,
                            fontWeight: 600, fontSize: 16,
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                        }}>
                            Clinical Point
                        </div>
                        <div style={{
                            height: 2, width: 120,
                            background: `linear-gradient(90deg, ${accent.primary}, transparent)`,
                            borderRadius: 2,
                        }} />
                    </div>
                </div>

                {/* Content Card — frosted glass effect */}
                <div style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 20,
                    padding: "36px 40px",
                    border: `1px solid rgba(255,255,255,0.1)`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    opacity: cardOpacity,
                    transform: `translateY(${cardTranslate}px)`,
                }}>
                    {/* Main teaching text */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {mainLines.map((line, i) => (
                            <AnimatedText
                                key={i}
                                text={line}
                                fontSize={56}
                                fontWeight={800}
                                fontFamily={FONTS.heading}
                                color="#FFFFFF"
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
                            borderLeft: `3px solid ${accent.primary}`,
                            paddingLeft: 28, marginTop: 24,
                        }}>
                            {bulletLines.map((bullet, i) => (
                                <AnimatedText
                                    key={i}
                                    text={bullet}
                                    fontSize={34}
                                    fontWeight={400}
                                    fontFamily={FONTS.body}
                                    color="rgba(255,255,255,0.8)"
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
                    color: "rgba(255,255,255,0.35)",
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
                background: "rgba(255,255,255,0.3)", borderRadius: 1,
            }} />
            <div style={{
                fontFamily: FONTS.heading, fontWeight: 600, fontSize: 18,
                color: "rgba(255,255,255,0.4)",
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
