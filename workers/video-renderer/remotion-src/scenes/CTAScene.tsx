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
    /** Scene-director CTA text (overrides cta when provided) */
    textOverlay?: string
    /** Decorative emoji badge */
    emojiAccent?: string
}

/**
 * Final Scene — Summary + CTA
 *
 * Layout:
 *   • "SAVE THIS" header label — bold, blue accent
 *   • Full-width blue gradient divider
 *   • CTA text — large, Navy Montserrat, split to lines with spring
 *   • Action instruction (e.g. "Save • Share • Apply") — Open Sans
 *   • PAM footer brand mark
 *   • White background
 *
 * Scene-enter: fade in over 8 frames.
 * No exit fade — this is the final scene (video just ends).
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

    // Use scene-director textOverlay if available — it’s more specific and concise
    const ctaText = textOverlay ?? cta

    // Scene enter: fade in
    const enterFade = interpolate(frame, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    })

    // Top divider reveals width
    const divSpring = spring({
        frame: Math.max(0, frame - 4),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const divWidth = interpolate(divSpring, [0, 1], [0, 100])

    // Split CTA into lines — prefer scene-director ctaText
    const ctaLines = splitIntoLines(ctaText, 30)

    // Bottom decorative fade
    const bottomBarSpring = spring({
        frame: Math.max(0, frame - 30),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const bottomBarOpacity = interpolate(bottomBarSpring, [0, 1], [0, 1])

    return (
        <AbsoluteFill
            style={{
                background: COLORS.white,
                opacity: enterFade,
            }}
        >
            {/* PAM watermark */}
            <PAMLogo variant="watermark" />

            {/* Main content block */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    transform: "translateY(-54%)",
                    padding: "0 72px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    alignItems: "flex-start",
                }}
            >
                {/* "SAVE THIS" header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 40,
                    }}
                >
                    <AnimatedText
                        text="SAVE THIS"
                        fontSize={26}
                        fontWeight={700}
                        fontFamily={FONTS.body}
                        color={COLORS.blue}
                        delayFrames={5}
                        style={{ letterSpacing: "0.3em" }}
                    />
                </div>

                {/* Top divider */}
                <div
                    style={{
                        height: 4,
                        width: `${divWidth}%`,
                        background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.blueLight}, transparent)`,
                        borderRadius: 2,
                        marginBottom: 52,
                    }}
                />

                {/* CTA text — primary message */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 56,
                    }}
                >
                    {ctaLines.map((line, i) => (
                        <AnimatedText
                            key={i}
                            text={line}
                            fontSize={66}
                            fontWeight={900}
                            fontFamily={FONTS.heading}
                            color={COLORS.navy}
                            delayFrames={12 + i * 9}
                            lineHeight={1.1}
                            textAlign="left"
                        />
                    ))}
                </div>

                {/* Action pills row */}
                <ActionPills delayFrames={30 + ctaLines.length * 9} />
            </div>

            {/* Footer area — PAM branding */}
            <div
                style={{
                    position: "absolute",
                    bottom: 80,
                    left: 0,
                    right: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0,
                    opacity: bottomBarOpacity,
                }}
            >
                <PAMLogo variant="footer" opacity={0.85} />
            </div>

            {/* Subtle background box behind CTA for depth */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 6,
                    height: "100%",
                    background: `linear-gradient(180deg, ${COLORS.blue}22, ${COLORS.blueLight}44, transparent)`,
                }}
            />

            {/* Emoji accent badge — bottom-right, above PAM footer */}
            {emojiAccent && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 160,
                        right: 72,
                        fontSize: 64,
                        lineHeight: 1,
                        opacity: bottomBarOpacity,
                    }}
                >
                    {emojiAccent}
                </div>
            )}
        </AbsoluteFill>
    )
}

// ──────────────────────────────────────────────────────────────
// Action pills: "Save" | "Share" | "Apply"
// ──────────────────────────────────────────────────────────────
const ActionPills: React.FC<{ delayFrames: number }> = ({ delayFrames }) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    const sp = spring({
        frame: Math.max(0, frame - delayFrames),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const translateY = interpolate(sp, [0, 1], [30, 0])
    const opacity = interpolate(sp, [0, 1], [0, 1])

    const pills = ["Save This Post", "Share With a Colleague", "Apply Today"]

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16,
                opacity,
                transform: `translateY(${translateY}px)`,
            }}
        >
            {pills.map((label, i) => (
                <div
                    key={i}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        border: `2px solid ${i === 0 ? COLORS.blue : COLORS.grayLight}`,
                        borderRadius: 10,
                        padding: "12px 26px",
                        background: i === 0 ? `${COLORS.blue}18` : "transparent",
                    }}
                >
                    <span
                        style={{
                            fontFamily: FONTS.body,
                            fontWeight: 600,
                            fontSize: 24,
                            color: i === 0 ? COLORS.blue : COLORS.navy,
                            letterSpacing: "0.04em",
                        }}
                    >
                        {label}
                    </span>
                </div>
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
