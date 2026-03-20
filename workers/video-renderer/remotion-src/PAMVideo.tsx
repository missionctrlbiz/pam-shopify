import React from "react"
import { AbsoluteFill, Sequence, useVideoConfig, Audio } from "remotion"
import {
    PAMVideoProps,
    buildScenes,
    calculateTotalFrames,
    COLORS,
    AnyScene,
} from "./types"
import { CoverScene } from "./scenes/CoverScene"
import { TeachingScene } from "./scenes/TeachingScene"
import { CTAScene } from "./scenes/CTAScene"
import { ProgressBar } from "./components/ProgressBar"

/**
 * Google Fonts are loaded via a <style> injection.
 * Chromium has network access during Remotion rendering, so CDN URLs work.
 */
const FONT_IMPORT_URL =
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Open+Sans:wght@400;600;700&display=swap"

/**
 * PAMVideo — the root Remotion composition.
 *
 * This component:
 *   1. Injects Google Fonts via <style>
 *   2. Derives the flat scene list from props using buildScenes()
 *   3. Mounts each scene inside a <Sequence> with the correct from/duration
 *   4. Overlays the full-duration purple ProgressBar on top of everything
 */
export const PAMVideo: React.FC<PAMVideoProps> = (props) => {
    const { durationInFrames } = useVideoConfig()
    const scenes = buildScenes(props)

    return (
        <AbsoluteFill style={{ background: COLORS.white, fontSmooth: "antialiased" }}>
            {/* Google Fonts injection */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `@import url('${FONT_IMPORT_URL}'); * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }`,
                }}
            />

            {/* Background Audio or Voiceover track */}
            {props.audioUrl && <Audio src={props.audioUrl} />}

            {/* Render every scene inside its own Sequence */}
            {scenes.map((scene) => (
                <SceneSequence
                    key={`${scene.type}-${scene.startFrame}`}
                    scene={scene}
                />
            ))}

            {/* Purple gradient reading-meter — absolutely on top, always visible */}
            <ProgressBar totalFrames={durationInFrames} height={8} />
        </AbsoluteFill>
    )
}

// ──────────────────────────────────────────────────────────────
// SceneSequence — wraps a scene in a Remotion <Sequence>
// ──────────────────────────────────────────────────────────────

const SceneSequence: React.FC<{ scene: AnyScene }> = ({ scene }) => {
    if (scene.type === "COVER") {
        return (
            <Sequence
                from={scene.startFrame}
                durationInFrames={scene.durationInFrames}
                name="Cover"
            >
                <CoverScene
                    hook={scene.hook}
                    topic={scene.topic}
                    sceneDuration={scene.durationInFrames}
                    textOverlay={scene.textOverlay}
                    emojiAccent={scene.emojiAccent}
                />
            </Sequence>
        )
    }

    if (scene.type === "TEACHING") {
        return (
            <Sequence
                from={scene.startFrame}
                durationInFrames={scene.durationInFrames}
                name={`Teaching-${scene.pointIndex + 1}`}
            >
                <TeachingScene
                    pointIndex={scene.pointIndex}
                    totalPoints={scene.totalPoints}
                    text={scene.text}
                    sceneDuration={scene.durationInFrames}
                    textOverlay={scene.textOverlay}
                    emojiAccent={scene.emojiAccent}
                    visualDirection={scene.visualDirection}
                />
            </Sequence>
        )
    }

    if (scene.type === "CTA") {
        return (
            <Sequence
                from={scene.startFrame}
                durationInFrames={scene.durationInFrames}
                name="CTA"
            >
                <CTAScene
                    cta={scene.cta}
                    topic={scene.topic}
                    sceneDuration={scene.durationInFrames}
                    textOverlay={scene.textOverlay}
                    emojiAccent={scene.emojiAccent}
                />
            </Sequence>
        )
    }

    return null
}

// Re-export helpers for Root.tsx
export { calculateTotalFrames }
