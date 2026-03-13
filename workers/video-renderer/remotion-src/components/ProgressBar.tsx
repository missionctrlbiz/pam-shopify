import React from "react"
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion"
import { COLORS } from "../types"

interface ProgressBarProps {
    /** Total frames in the video — used to compute fill percentage */
    totalFrames: number
    /** Bar height in px */
    height?: number
}

/**
 * A thin purple-gradient progress bar fixed to the absolute bottom edge
 * of the video frame. Width fills smoothly from 0 → 100% over the full
 * video duration using Remotion's `interpolate`.
 *
 * Purple gradient: #7C3AED (violet) → #C026D3 (fuchsia).
 * This is the ONLY element in the composition that uses purple.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    totalFrames,
    height = 8,
}) => {
    const frame = useCurrentFrame()

    // Clamp at [0, totalFrames - 1] so we never exceed 100%
    const clampedFrame = Math.min(frame, totalFrames - 1)

    const widthPct = interpolate(clampedFrame, [0, totalFrames - 1], [0, 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    })

    return (
        <div
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height,
                background: "#1a1a2e",            // very dark track (near-black)
                zIndex: 100,
                overflow: "hidden",
            }}
        >
            {/* Filled portion */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${COLORS.purpleFrom} 0%, ${COLORS.purpleTo} 100%)`,
                    borderRadius: "0 3px 3px 0",
                }}
            />

            {/* Subtle glowing head dot */}
            {widthPct > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: `calc(${widthPct}% - ${height}px)`,
                        width: height * 1.75,
                        height: height * 1.75,
                        borderRadius: "50%",
                        background: COLORS.purpleTo,
                        transform: "translateY(-50%)",
                        boxShadow: `0 0 ${height * 2}px ${COLORS.purpleTo}`,
                        opacity: 0.9,
                    }}
                />
            )}
        </div>
    )
}
