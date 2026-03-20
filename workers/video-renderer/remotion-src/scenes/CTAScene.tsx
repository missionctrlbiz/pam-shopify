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

interface CTASceneProps {
    cta: string
    topic: string
    sceneDuration: number
    textOverlay?: string
    emojiAccent?: string
}

/**
 * CTA Scene — PREMIUM DESIGN
 * Vibrant gradient background with bold CTA, glowing action buttons,
 * animated brand footer, floating accent orbs.
 */
export const CTAScene: React.FC<CTASceneProps> = ({
    cta,
    topic,
    sceneDuration,
    textOverlay,
    emojiAccent,
}) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    const ctaText = textOverlay ?? cta

    // Scene enter fade
    const enterFade = interpolate(frame, [0, 10], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })

    // Divider spring
    const divSpring = spring({
        frame: Math.max(0, frame - 4), fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const divWidth = interpolate(divSpring, [0, 1], [0, 100])

    const ctaLines = splitIntoLines(ctaText, 26)

    // Footer animation
    const bottomBarSpring = spring({
        frame: Math.max(0, frame - 30), fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const bottomBarOpacity = interpolate(bottomBarSpring, [0, 1], [0, 1])

    // Floating orb
    const orbFloat = interpolate(frame, [0, 120], [0, 360], { extrapolateRight: "extend" })

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(150deg, #1E1B4B 0%, #312E81 40%, #1E3A5F 100%)",
                opacity: enterFade,
            }}
        >
            {/* Decorative gradient orbs */}
            <div style={{
                position: "absolute", top: 200, right: -60,
                width: 350, height: 350, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
                transform: `translateY(${Math.sin(orbFloat * Math.PI / 180) * 12}px)`,
            }} />
            <div style={{
                position: "absolute", bottom: 300, left: -80,
                width: 280, height: 280, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
                transform: `translateY(${Math.cos(orbFloat * Math.PI / 180) * 8}px)`,
            }} />

            {/* Top accent line — gradient purple to pink */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 6,
                background: "linear-gradient(90deg, #7C3AED, #EC4899, #F59E0B)",
            }} />

            {/* PAM watermark */}
            <PAMLogo variant="watermark" />

            {/* Main CTA content */}
            <div style={{
                position: "absolute", top: "50%", left: 0, right: 0,
                transform: "translateY(-54%)",
                padding: "0 72px",
                display: "flex", flexDirection: "column",
                gap: 0, alignItems: "flex-start",
            }}>
                {/* "TAKE ACTION" header */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    marginBottom: 40,
                }}>
                    <div style={{
                        width: 4, height: 32,
                        background: "linear-gradient(180deg, #F59E0B, #EC4899)",
                        borderRadius: 3,
                    }} />
                    <AnimatedText
                        text="TAKE ACTION"
                        fontSize={24}
                        fontWeight={700}
                        fontFamily={FONTS.body}
                        color="#F59E0B"
                        delayFrames={5}
                        style={{ letterSpacing: "0.3em" }}
                    />
                </div>

                {/* Gradient divider */}
                <div style={{
                    height: 4,
                    width: `${divWidth}%`,
                    background: "linear-gradient(90deg, #7C3AED, #EC4899, transparent)",
                    borderRadius: 2, marginBottom: 52,
                }} />

                {/* CTA text */}
                <div style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    marginBottom: 56,
                }}>
                    {ctaLines.map((line, i) => (
                        <AnimatedText
                            key={i}
                            text={line}
                            fontSize={60}
                            fontWeight={900}
                            fontFamily={FONTS.heading}
                            color="#FFFFFF"
                            delayFrames={12 + i * 9}
                            lineHeight={1.15}
                            textAlign="left"
                        />
                    ))}
                </div>

                {/* Action pills */}
                <ActionPills delayFrames={30 + ctaLines.length * 9} />
            </div>

            {/* Footer PAM branding */}
            <div style={{
                position: "absolute", bottom: 80, left: 0, right: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 0,
                opacity: bottomBarOpacity,
            }}>
                <PAMLogo variant="footer" opacity={0.7} />
            </div>

            {/* Right accent strip */}
            <div style={{
                position: "absolute", top: 0, right: 0,
                width: 6, height: "100%",
                background: "linear-gradient(180deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3), transparent)",
            }} />

            {/* Emoji accent badge */}
            {emojiAccent && (
                <div style={{
                    position: "absolute", bottom: 160, right: 72,
                    fontSize: 64, lineHeight: 1,
                    opacity: bottomBarOpacity,
                }}>
                    {emojiAccent}
                </div>
            )}
        </AbsoluteFill>
    )
}

// ── Action Pills ──────────────────────────────────────────────
const ActionPills: React.FC<{ delayFrames: number }> = ({ delayFrames }) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    const sp = spring({
        frame: Math.max(0, frame - delayFrames), fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const translateY = interpolate(sp, [0, 1], [30, 0])
    const opacity = interpolate(sp, [0, 1], [0, 1])

    const pills = [
        { label: "💾  Save This Post", primary: true },
        { label: "🔗  Share With a Colleague", primary: false },
        { label: "✅  Apply Today", primary: false },
    ]

    return (
        <div style={{
            display: "flex", flexDirection: "row", flexWrap: "wrap",
            gap: 14, opacity, transform: `translateY(${translateY}px)`,
        }}>
            {pills.map((pill, i) => (
                <div
                    key={i}
                    style={{
                        display: "inline-flex",
                        alignItems: "center", gap: 10,
                        border: pill.primary
                            ? "none"
                            : "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 12,
                        padding: "14px 28px",
                        background: pill.primary
                            ? "linear-gradient(135deg, #3B82F6, #7C3AED)"
                            : "rgba(255,255,255,0.06)",
                        boxShadow: pill.primary
                            ? "0 4px 20px rgba(59,130,246,0.3)"
                            : "none",
                    }}
                >
                    <span style={{
                        fontFamily: FONTS.body,
                        fontWeight: 700, fontSize: 22,
                        color: "#FFFFFF",
                        letterSpacing: "0.02em",
                    }}>
                        {pill.label}
                    </span>
                </div>
            ))}
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
