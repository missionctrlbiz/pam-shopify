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
    /** Total frames in the entire video — for the scene-transition fade */
    sceneDuration: number
    /** Scene-director on-screen text (supplementary subtitle below hook) */
    textOverlay?: string
    /** Decorative emoji — spring-animated badge */
    emojiAccent?: string
}

/**
 * Scene 1 — Cover / Hook
 *
 * Layout (1080×1920):
 *   • PAM™ watermark — top-right, fades in with the scene
 *   • "PSYCHIATRIC ASSESSMENT MASTERY" — thin label with blue accent bar
 *   • Topic pill — navy background, white text
 *   • Hook text — large Montserrat, Navy, spring-animated line-by-line
 *   • Blue gradient divider — reveals width via spring
 *   • White background
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

    // Emoji badge spring (appears at frame 8, top-right corner)
    const emojiBadgeSpring = spring({
        frame: Math.max(0, frame - 8),
        fps,
        config: { mass: 1, damping: 12, stiffness: 180 },
    })
    const emojiBadgeScale = interpolate(emojiBadgeSpring, [0, 1], [0.4, 1])
    const emojiBadgeOpacity = interpolate(emojiBadgeSpring, [0, 1], [0, 1])

    // Scene-exit fade in the last 10 frames
    const exitFade = interpolate(
        frame,
        [sceneDuration - 12, sceneDuration - 1],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )

    // Blue divider line: reveals width 0 → 100% via spring (starts at frame 6)
    const dividerSpring = spring({
        frame: Math.max(0, frame - 6),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const dividerWidth = interpolate(dividerSpring, [0, 1], [0, 100])

    // Split hook into semantic lines (≤ ~35 chars each for readability at this size)
    const hookLines = splitIntoLines(hook, 32)

    // Topic pill spring (appears early)
    const pillSpring = spring({
        frame: Math.max(0, frame - 3),
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })
    const pillOpacity = interpolate(pillSpring, [0, 1], [0, 1])
    const pillTranslate = interpolate(pillSpring, [0, 1], [20, 0])

    return (
        <AbsoluteFill
            style={{
                background: COLORS.white,
                opacity: exitFade,
            }}
        >
            {/* PAM watermark — top right */}
            <PAMLogo variant="watermark" />

            {/* Main content block — vertically centred, slightly above middle */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    transform: "translateY(-58%)",
                    padding: "0 72px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0,
                }}
            >
                {/* PSYCHIATRIC ASSESSMENT MASTERY label */}
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
                    {/* Blue vertical accent bar */}
                    <div
                        style={{
                            width: 4,
                            height: 40,
                            background: `linear-gradient(180deg, ${COLORS.blue}, ${COLORS.blueLight})`,
                            borderRadius: 3,
                            flexShrink: 0,
                        }}
                    />
                    <div
                        style={{
                            fontFamily: FONTS.body,
                            fontWeight: 600,
                            fontSize: 22,
                            color: COLORS.blue,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                        }}
                    >
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
                        background: COLORS.navy,
                        borderRadius: 8,
                        padding: "10px 24px",
                        marginBottom: 44,
                    }}
                >
                    <span
                        style={{
                            fontFamily: FONTS.body,
                            fontWeight: 700,
                            fontSize: 24,
                            color: COLORS.white,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        {topic}
                    </span>
                </div>

                {/* Hook — large Montserrat, staggered by line */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 48,
                    }}
                >
                    {hookLines.map((line, i) => (
                        <AnimatedText
                            key={i}
                            text={line}
                            fontSize={76}
                            fontWeight={900}
                            fontFamily={FONTS.heading}
                            color={COLORS.navy}
                            delayFrames={10 + i * 9}
                            lineHeight={1.1}
                            textAlign="left"
                        />
                    ))}
                </div>

                {/* Blue gradient divider — width springs open */}
                <div
                    style={{
                        height: 4,
                        width: `${dividerWidth}%`,
                        background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.blueLight}, transparent)`,
                        borderRadius: 2,
                        marginBottom: 36,
                    }}
                />

                {/* textOverlay — scene-director subtitle */}
                {textOverlay && textOverlay !== hook && (
                    <AnimatedText
                        text={textOverlay}
                        fontSize={34}
                        fontWeight={600}
                        fontFamily={FONTS.body}
                        color={COLORS.blue}
                        delayFrames={36}
                        lineHeight={1.35}
                        textAlign="left"
                        style={{ marginBottom: 28 }}
                    />
                )}

                {/* "Read on →" subdued hint */}
                <AnimatedText
                    text="Read on →"
                    fontSize={26}
                    fontWeight={400}
                    fontFamily={FONTS.body}
                    color={COLORS.gray}
                    delayFrames={40}
                    textAlign="left"
                    style={{ letterSpacing: "0.08em" }}
                />
            </div>

            {/* Emoji accent badge — top-right floating */}
            {emojiAccent && (
                <div
                    style={{
                        position: "absolute",
                        top: 90,
                        right: 72,
                        fontSize: 72,
                        lineHeight: 1,
                        opacity: emojiBadgeOpacity,
                        transform: `scale(${emojiBadgeScale})`,
                        transformOrigin: "top right",
                    }}
                >
                    {emojiAccent}
                </div>
            )}

            {/* Bottom decorative accent — horizontal blue strip */}
            <div
                style={{
                    position: "absolute",
                    bottom: 28,
                    left: 72,
                    right: 72,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${COLORS.blue}, transparent)`,
                    borderRadius: 2,
                    opacity: interpolate(dividerSpring, [0, 1], [0, 0.4]),
                }}
            />
        </AbsoluteFill>
    )
}

// ──────────────────────────────────────────────────────────────
// Helper: split a long string into lines of ≤ maxChars
// Breaks at word boundaries only.
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
