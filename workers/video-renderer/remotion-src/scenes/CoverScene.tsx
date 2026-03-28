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
                background: COLORS.navy,
                opacity: exitFade,
            }}
        >
            {/* Removed generic decorative orbs for stricter clinical whiteboard aesthetic */}

            {/* Top accent line */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 6,
                background: `linear-gradient(90deg, ${COLORS.purpleFrom}, ${COLORS.purpleTo})`,
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
                        background: `linear-gradient(180deg, ${COLORS.purpleFrom}, ${COLORS.purpleTo})`,
                        borderRadius: 3, flexShrink: 0,
                    }} />
                    <div style={{
                        fontFamily: FONTS.body,
                        fontWeight: 600, fontSize: 20,
                        color: COLORS.white,
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
                        background: COLORS.white,
                        borderRadius: 10,
                        padding: "12px 28px",
                        marginBottom: 44,
                        boxShadow: `0 4px 20px rgba(168,85,247,0.3)`,
                    }}
                >
                    <span style={{
                        fontFamily: FONTS.body,
                        fontWeight: 700, fontSize: 22,
                        color: COLORS.navy,
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
                            fontSize={88}
                            fontWeight={900}
                            fontFamily={FONTS.heading}
                            color="#FFFFFF"
                            delayFrames={10 + i * 9}
                            lineHeight={1.1}
                            textAlign="left"
                        />
                    ))}
                </div>

                {/* Gradient divider */}
                <div style={{
                    height: 4,
                    width: `${dividerWidth}%`,
                    background: `linear-gradient(90deg, ${COLORS.purpleFrom}, ${COLORS.purpleTo}, transparent)`,
                    borderRadius: 2,
                    marginBottom: 36,
                }} />

                {/* textOverlay subtitle */}
                {textOverlay && textOverlay !== hook && (
                    <AnimatedText
                        text={textOverlay}
                        fontSize={32}
                        fontWeight={700}
                        fontFamily={FONTS.body}
                        color={COLORS.white}
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
                background: `linear-gradient(90deg, transparent, ${COLORS.purpleTo}, transparent)`,
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
