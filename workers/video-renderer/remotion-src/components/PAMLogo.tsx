import React from "react"
import { useCurrentFrame, spring, useVideoConfig, interpolate, Img, staticFile } from "remotion"
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
                <Img
                    src="https://pam-shopify.vercel.app/favicon-white.png"
                    style={{
                        width: 72,
                        height: 72,
                        objectFit: "contain",
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
                <Img
                    src="https://pam-shopify.vercel.app/logo.png"
                    style={{
                        height: 48,
                        objectFit: "contain",
                    }}
                />
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
            <Img
                src="https://pam-shopify.vercel.app/logo.png"
                style={{
                    height: 80,
                    objectFit: "contain",
                }}
            />
        </div>
    )
}
