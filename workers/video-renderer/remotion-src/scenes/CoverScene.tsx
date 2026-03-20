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

interface CoverSceneProps {
    hook: string
    topic: string
    sceneDuration: number
    textOverlay?: string
    emojiAccent?: string
}

/**
 * Scene 1 — Cover / Hook
 * PREMIUM DESIGN: Deep navy gradient background, glowing accent elements,
 * large typography with spring animations, floating decorative orbs.
 */
export const CoverScene: React.FC<CoverSceneProps> = ({
    hook,
    topic,
    sceneDuration,
    textOverlay,
    emojiAccent,
}) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    // Scene exit fade
    const exitFade = interpolate(
        frame,
        [sceneDuration - 12, sceneDuration - 1],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )

    // Blue divider line
    const dividerSpring = spring({
        frame: Math.max(0, frame - 6),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const dividerWidth = interpolate(dividerSpring, [0, 1], [0, 100])

    // Split hook into lines
    const hookLines = splitIntoLines(hook, 28)

    // Topic pill spring
    const pillSpring = spring({
        frame: Math.max(0, frame - 3),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const pillOpacity = interpolate(pillSpring, [0, 1], [0, 1])
    const pillTranslate = interpolate(pillSpring, [0, 1], [20, 0])

    // Emoji badge
    const emojiBadgeSpring = spring({
        frame: Math.max(0, frame - 8),
        fps,
        config: { mass: 1, damping: 12, stiffness: 180 },
    })
    const emojiBadgeScale = interpolate(emojiBadgeSpring, [0, 1], [0.4, 1])
    const emojiBadgeOpacity = interpolate(emojiBadgeSpring, [0, 1], [0, 1])

    // Floating orb animation
    const orbFloat = interpolate(frame, [0, 120], [0, 360], { extrapolateRight: "extend" })

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(160deg, #0F172A 0%, #1E293B 40%, #1E3A5F 100%)",
                opacity: exitFade,
            }}
        >
            {/* Decorative floating orbs for depth */}
            <div style={{
                position: "absolute", top: 120, right: 60,
                width: 280, height: 280, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
                transform: `translateY(${Math.sin(orbFloat * Math.PI / 180) * 8}px)`,
            }} />
            <div style={{
                position: "absolute", bottom: 200, left: -40,
                width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
                transform: `translateY(${Math.cos(orbFloat * Math.PI / 180) * 6}px)`,
            }} />

            {/* Top accent line */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 6,
                background: "linear-gradient(90deg, #3B82F6, #7C3AED, #C026D3)",
            }} />

            {/* PAM watermark */}
            <PAMLogo variant="watermark" />

            {/* Main content */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0, right: 0,
                    transform: "translateY(-54%)",
                    padding: "0 72px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0,
                }}
            >
                {/* Brand label */}
                <div
                    style={{
                        opacity: pillOpacity,
                        transform: `translateY(${pillTranslate}px)`,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 36,
                    }}
                >
                    <div style={{
                        width: 4, height: 40,
                        background: "linear-gradient(180deg, #3B82F6, #7C3AED)",
                        borderRadius: 3, flexShrink: 0,
                    }} />
                    <div style={{
                        fontFamily: FONTS.body,
                        fontWeight: 600, fontSize: 20,
                        color: "#60A5FA",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                    }}>
                        Psychiatric Assessment Mastery
                    </div>
                </div>

                {/* Topic chip */}
                <div
                    style={{
                        opacity: pillOpacity,
                        transform: `translateY(${pillTranslate}px)`,
                        display: "inline-flex",
                        alignItems: "center",
                        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                        borderRadius: 10,
                        padding: "12px 28px",
                        marginBottom: 44,
                        boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
                    }}
                >
                    <span style={{
                        fontFamily: FONTS.body,
                        fontWeight: 700, fontSize: 22,
                        color: "#FFFFFF",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}>
                        {topic}
                    </span>
                </div>

                {/* Hook text — large, white on dark */}
                <div style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    marginBottom: 48,
                }}>
                    {hookLines.map((line, i) => (
                        <AnimatedText
                            key={i}
                            text={line}
                            fontSize={72}
                            fontWeight={900}
                            fontFamily={FONTS.heading}
                            color="#FFFFFF"
                            delayFrames={10 + i * 9}
                            lineHeight={1.12}
                            textAlign="left"
                        />
                    ))}
                </div>

                {/* Gradient divider */}
                <div style={{
                    height: 4,
                    width: `${dividerWidth}%`,
                    background: "linear-gradient(90deg, #3B82F6, #7C3AED, transparent)",
                    borderRadius: 2,
                    marginBottom: 36,
                }} />

                {/* textOverlay subtitle */}
                {textOverlay && textOverlay !== hook && (
                    <AnimatedText
                        text={textOverlay}
                        fontSize={32}
                        fontWeight={600}
                        fontFamily={FONTS.body}
                        color="#93C5FD"
                        delayFrames={36}
                        lineHeight={1.35}
                        textAlign="left"
                        style={{ marginBottom: 28 }}
                    />
                )}

                {/* Swipe hint */}
                <AnimatedText
                    text="Swipe to learn →"
                    fontSize={24}
                    fontWeight={400}
                    fontFamily={FONTS.body}
                    color="rgba(255,255,255,0.5)"
                    delayFrames={40}
                    textAlign="left"
                    style={{ letterSpacing: "0.08em" }}
                />
            </div>

            {/* Emoji accent */}
            {emojiAccent && (
                <div style={{
                    position: "absolute", top: 100, right: 72,
                    fontSize: 72, lineHeight: 1,
                    opacity: emojiBadgeOpacity,
                    transform: `scale(${emojiBadgeScale})`,
                    transformOrigin: "top right",
                }}>
                    {emojiAccent}
                </div>
            )}

            {/* Bottom accent line */}
            <div style={{
                position: "absolute", bottom: 28, left: 72, right: 72,
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)",
                borderRadius: 2,
                opacity: interpolate(dividerSpring, [0, 1], [0, 0.6]),
            }} />
        </AbsoluteFill>
    )
}

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
