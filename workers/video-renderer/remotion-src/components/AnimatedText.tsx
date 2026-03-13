import React from "react"
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion"
import { COLORS, FONTS } from "../types"

export interface AnimatedTextProps {
    /** The text to display */
    text: string
    /** Font size in px */
    fontSize?: number
    /** CSS font weight */
    fontWeight?: string | number
    /** CSS color */
    color?: string
    /** Font family — use FONTS.heading or FONTS.body */
    fontFamily?: string
    /** Frame offset (delay before the animation starts), relative to the current Sequence */
    delayFrames?: number
    /** Text alignment */
    textAlign?: React.CSSProperties["textAlign"]
    /** Additional style overrides */
    style?: React.CSSProperties
    /** Line height multiplier */
    lineHeight?: number | string
    /** Max width in px or CSS string */
    maxWidth?: number | string
}

/**
 * Renders a single text block that slides up and fades in using Remotion's
 * spring physics. The spring is tuned for a sharp, modern, slightly-bouncy
 * kinetic feel: mass=1, damping=14, stiffness=120.
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
    text,
    fontSize = 40,
    fontWeight = 700,
    color = COLORS.navy,
    fontFamily = FONTS.heading,
    delayFrames = 0,
    textAlign = "left",
    style,
    lineHeight = 1.35,
    maxWidth,
}) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    const progress = spring({
        frame: Math.max(0, frame - delayFrames),
        fps,
        config: {
            mass: 1,
            damping: 14,
            stiffness: 120,
        },
    })

    const translateY = interpolate(progress, [0, 1], [40, 0])
    const opacity = interpolate(progress, [0, 1], [0, 1])

    return (
        <div
            style={{
                fontFamily,
                fontSize,
                fontWeight,
                color,
                lineHeight,
                textAlign,
                maxWidth,
                transform: `translateY(${translateY}px)`,
                opacity,
                willChange: "transform, opacity",
                ...(style ?? {}),
            }}
        >
            {text}
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// AnimatedLines — renders multiple lines with staggered delays
// ──────────────────────────────────────────────────────────────

export interface AnimatedLinesProps {
    lines: string[]
    fontSize?: number
    fontWeight?: string | number
    color?: string
    fontFamily?: string
    /** Gap between consecutive line reveal starts, in frames */
    staggerFrames?: number
    /** Base delay before the first line appears */
    baseDelayFrames?: number
    textAlign?: React.CSSProperties["textAlign"]
    lineHeight?: number | string
    style?: React.CSSProperties
    maxWidth?: number | string
}

export const AnimatedLines: React.FC<AnimatedLinesProps> = ({
    lines,
    fontSize = 36,
    fontWeight = 400,
    color = COLORS.navy,
    fontFamily = FONTS.body,
    staggerFrames = 8,
    baseDelayFrames = 0,
    textAlign = "left",
    lineHeight = 1.5,
    style,
    maxWidth,
}) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth }}>
            {lines.map((line, i) => (
                <AnimatedText
                    key={i}
                    text={line}
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    color={color}
                    fontFamily={fontFamily}
                    delayFrames={baseDelayFrames + i * staggerFrames}
                    textAlign={textAlign}
                    lineHeight={lineHeight}
                    style={{ marginBottom: 12, ...(style ?? {}) }}
                />
            ))}
        </div>
    )
}
