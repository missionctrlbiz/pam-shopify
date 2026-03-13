import React from "react"
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion"
import { COLORS, FONTS } from "../types"

interface PAMLogoProps {
    /** Display variant */
    variant?: "watermark" | "header" | "footer"
    /** Override opacity (watermark sets it very low) */
    opacity?: number
}

/**
 * PAM brand mark — "Psychiatric Assessment Mastery" wordmark rendered
 * purely in CSS/text. No external image dependency. Used as a subtle
 * watermark (top-right corner) and as a bold footer brand on the CTA scene.
 */
export const PAMLogo: React.FC<PAMLogoProps> = ({
    variant = "watermark",
    opacity,
}) => {
    const frame = useCurrentFrame()
    const { fps } = useVideoConfig()

    const progress = spring({
        frame,
        fps,
        config: { mass: 1, damping: 14, stiffness: 120 },
    })

    const computedOpacity =
        opacity !== undefined
            ? opacity
            : variant === "watermark"
                ? 0.12
                : variant === "footer"
                    ? 0.9
                    : 1

    const finalOpacity = interpolate(progress, [0, 1], [0, computedOpacity])

    if (variant === "watermark") {
        return (
            <div
                style={{
                    position: "absolute",
                    top: 48,
                    right: 52,
                    opacity: finalOpacity,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                {/* Large PAM monogram */}
                <div
                    style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 900,
                        fontSize: 52,
                        color: COLORS.navy,
                        letterSpacing: "0.08em",
                        lineHeight: 1,
                    }}
                >
                    PAM™
                </div>
                {/* Subtitle */}
                <div
                    style={{
                        fontFamily: FONTS.body,
                        fontWeight: 600,
                        fontSize: 14,
                        color: COLORS.navy,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        marginTop: 4,
                        lineHeight: 1,
                    }}
                >
                    Psychiatric Assessment Mastery
                </div>
                {/* Thin blue accent underline */}
                <div
                    style={{
                        width: "100%",
                        height: 2,
                        background: `linear-gradient(90deg, transparent, ${COLORS.blue})`,
                        marginTop: 6,
                        borderRadius: 2,
                    }}
                />
            </div>
        )
    }

    if (variant === "header") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    opacity: finalOpacity,
                }}
            >
                {/* Blue accent bar */}
                <div
                    style={{
                        width: 5,
                        height: 44,
                        background: `linear-gradient(180deg, ${COLORS.blue}, ${COLORS.blueLight})`,
                        borderRadius: 3,
                        flexShrink: 0,
                    }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div
                        style={{
                            fontFamily: FONTS.heading,
                            fontWeight: 900,
                            fontSize: 26,
                            color: COLORS.navy,
                            letterSpacing: "0.06em",
                            lineHeight: 1,
                        }}
                    >
                        PAM™
                    </div>
                    <div
                        style={{
                            fontFamily: FONTS.body,
                            fontWeight: 600,
                            fontSize: 11,
                            color: COLORS.gray,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                        }}
                    >
                        Psychiatric Assessment Mastery
                    </div>
                </div>
            </div>
        )
    }

    // footer variant
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                opacity: finalOpacity,
            }}
        >
            <div
                style={{
                    width: 60,
                    height: 2,
                    background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.blueLight})`,
                    borderRadius: 2,
                    marginBottom: 10,
                }}
            />
            <div
                style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 900,
                    fontSize: 36,
                    color: COLORS.navy,
                    letterSpacing: "0.1em",
                }}
            >
                PAM™
            </div>
            <div
                style={{
                    fontFamily: FONTS.body,
                    fontWeight: 400,
                    fontSize: 16,
                    color: COLORS.gray,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                }}
            >
                Psychiatric Assessment Mastery
            </div>
        </div>
    )
}
