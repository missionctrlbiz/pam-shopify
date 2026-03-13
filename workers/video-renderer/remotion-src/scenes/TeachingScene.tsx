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

    // Detect if the text is a bullet list (separated by " • " or " — " or newline)
    const bulletSeparators = [" • ", " — ", " – ", "\n"]
    const isBulletList = bulletSeparators.some((sep) => text.includes(sep))
    let bulletLines: string[] = []
    let mainText = text

    if (isBulletList) {
        const sep = bulletSeparators.find((s) => text.includes(s))!
        const parts = text.split(sep).map((s) => s.trim()).filter(Boolean)
        mainText = parts[0]
        bulletLines = parts.slice(1)
    }

    // Break main text into lines (≤ 28 chars for large font)
    const mainLines = splitIntoLines(mainText, 28)

    return (
        <AbsoluteFill
            style={{
                background: COLORS.white,
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
            </div>

            {/* SCENE COUNTER — bottom-right */}
            <SceneCounter current={pointIndex + 1} total={totalPoints} />
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
