import React from "react"
import { Composition } from "remotion"
import { PAMVideo, calculateTotalFrames } from "./PAMVideo"
import { DEFAULT_PROPS, FPS, VIDEO_WIDTH, VIDEO_HEIGHT, PAMVideoProps } from "./types"

/**
 * RemotionRoot — registered with registerRoot() in index.tsx.
 *
 * The <Composition> uses `calculateMetadata` to compute the total frame count
 * dynamically from the actual input props. This means every video automatically
 * adjusts its duration to exactly fit the number of teaching points in the
 * masterJson, with no manual frame-count configuration required.
 *
 *   • ID: "PAMVideo" — MUST match the id used in src/remotion.ts
 *   • Resolution: 1080×1920 (9:16 portrait — Instagram Reels, TikTok, Shorts)
 *   • FPS: 30
 *   • Default props: used by the Remotion Studio preview only
 */
export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition<PAMVideoProps>
                id="PAMVideo"
                component={PAMVideo}
                durationInFrames={900}    /* fallback if calculateMetadata hasn't run yet */
                fps={FPS}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                defaultProps={DEFAULT_PROPS}
                calculateMetadata={({ props }) => ({
                    durationInFrames: calculateTotalFrames(props),
                    props,
                })}
            />
        </>
    )
}
