/**
 * PAMSceneData — mirrors lib/production/contentStrategist.ts PAMScene.
 * Kept self-contained so the Remotion bundle has no dependency on the Next.js lib.
 */
export interface PAMSceneData {
    type: "COVER" | "TEACHING" | "CTA"
    durationSecs: number
    voiceoverText: string
    visualDirection: string
    textOverlay: string
    emojiAccent?: string
}

/** Props passed from remotion.ts → inputProps → PAMVideo composition */
export interface PAMVideoProps {
    hook: string
    teachingPoints: string[]
    cta: string
    audioUrl: string
    topic: string
    /** Scene-director result — when present, overrides fixed SCENE_DURATIONS */
    scenes?: PAMSceneData[]
}

// ──────────────────────────────────────────────────────────────
// Scene types — derived internally by PAMVideo from the raw props
// ──────────────────────────────────────────────────────────────

export type SceneType = "COVER" | "TEACHING" | "CTA"

export interface Scene {
    type: SceneType
    /** Start frame within the full video timeline */
    startFrame: number
    /** How many frames this scene occupies */
    durationInFrames: number
}

export interface CoverSceneData extends Scene {
    type: "COVER"
    hook: string
    topic: string
    textOverlay?: string    // from scene director — supplementary on-screen text
    emojiAccent?: string    // decorative emoji badge
}

export interface TeachingSceneData extends Scene {
    type: "TEACHING"
    pointIndex: number   // 0-based
    totalPoints: number
    text: string
    textOverlay?: string    // replaces/supplements text when scene-director driven
    emojiAccent?: string
    visualDirection?: string  // scene-director visual note (shown as caption hint)
}

export interface CTASceneData extends Scene {
    type: "CTA"
    cta: string
    topic: string
    textOverlay?: string
    emojiAccent?: string
}

export type AnyScene = CoverSceneData | TeachingSceneData | CTASceneData

// ──────────────────────────────────────────────────────────────
// Brand constants — single source of truth for the composition
// ──────────────────────────────────────────────────────────────

export const FPS = 30

/** Duration in seconds for each scene type */
export const SCENE_DURATIONS = {
    COVER: 5,
    TEACHING: 4.5,
    CTA: 5,
} as const

/** Frames per scene type */
export const SCENE_FRAMES = {
    COVER: SCENE_DURATIONS.COVER * FPS,       // 150
    TEACHING: SCENE_DURATIONS.TEACHING * FPS, // 135
    CTA: SCENE_DURATIONS.CTA * FPS,           // 150
} as const

export const VIDEO_WIDTH = 1080
export const VIDEO_HEIGHT = 1920

export const COLORS = {
    white: "#FFFFFF",
    navy: "#1F2A44",
    blue: "#3B82F6",
    blueLight: "#60A5FA",
    purpleFrom: "#7C3AED",
    purpleTo: "#C026D3",
    gray: "#6B7280",
    grayLight: "#F3F4F6",
} as const

export const FONTS = {
    heading: "'Montserrat', sans-serif",
    body: "'Open Sans', sans-serif",
} as const

/** Build a flat array of AnyScene from raw video props */
export function buildScenes(props: PAMVideoProps): AnyScene[] {
    // ── Scene-director-driven path ──────────────────────────────────────────
    if (props.scenes && props.scenes.length > 0) {
        const output: AnyScene[] = []
        let cursor = 0
        const teachingSlots = props.scenes.filter((s) => s.type === "TEACHING")
        const totalPoints = teachingSlots.length
        let teachingIdx = 0

        for (const s of props.scenes) {
            const durationInFrames = Math.round(s.durationSecs * FPS)
            if (s.type === "COVER") {
                output.push({
                    type: "COVER",
                    startFrame: cursor,
                    durationInFrames,
                    hook: props.hook,
                    topic: props.topic,
                    textOverlay: s.textOverlay,
                    emojiAccent: s.emojiAccent,
                })
            } else if (s.type === "TEACHING") {
                output.push({
                    type: "TEACHING",
                    startFrame: cursor,
                    durationInFrames,
                    pointIndex: teachingIdx,
                    totalPoints,
                    // textOverlay from scene director is the primary on-screen text
                    text: s.textOverlay || props.teachingPoints[teachingIdx] || "",
                    textOverlay: s.textOverlay,
                    emojiAccent: s.emojiAccent,
                    visualDirection: s.visualDirection,
                })
                teachingIdx++
            } else if (s.type === "CTA") {
                output.push({
                    type: "CTA",
                    startFrame: cursor,
                    durationInFrames,
                    cta: props.cta,
                    topic: props.topic,
                    textOverlay: s.textOverlay,
                    emojiAccent: s.emojiAccent,
                })
            }
            cursor += durationInFrames
        }
        return output
    }

    // ── Legacy flat-props path ──────────────────────────────────────────────
    const scenes: AnyScene[] = []
    let cursor = 0

    // Cover
    scenes.push({
        type: "COVER",
        startFrame: cursor,
        durationInFrames: SCENE_FRAMES.COVER,
        hook: props.hook,
        topic: props.topic,
    })
    cursor += SCENE_FRAMES.COVER

    // Teaching points — one scene per point
    const totalPoints = props.teachingPoints.length
    for (let i = 0; i < totalPoints; i++) {
        scenes.push({
            type: "TEACHING",
            startFrame: cursor,
            durationInFrames: SCENE_FRAMES.TEACHING,
            pointIndex: i,
            totalPoints,
            text: props.teachingPoints[i],
        })
        cursor += SCENE_FRAMES.TEACHING
    }

    // CTA
    scenes.push({
        type: "CTA",
        startFrame: cursor,
        durationInFrames: SCENE_FRAMES.CTA,
        cta: props.cta,
        topic: props.topic,
    })

    return scenes
}

/** Total frame count derived from the actual props */
export function calculateTotalFrames(props: PAMVideoProps): number {
    if (props.scenes && props.scenes.length > 0) {
        return Math.round(
            props.scenes.reduce((sum, s) => sum + s.durationSecs, 0) * FPS
        )
    }
    const scenes = buildScenes(props)
    const last = scenes[scenes.length - 1]
    return last.startFrame + last.durationInFrames
}

/** Default props used by Remotion's composition preview */
export const DEFAULT_PROPS: PAMVideoProps = {
    hook: "Are you missing this critical MSE finding in your psychiatric assessments?",
    teachingPoints: [
        "The Mental Status Exam is not a checklist — it is a dynamic clinical observation tool.",
        "Affect and mood are distinct findings. Documenting only 'mood' is an incomplete MSE.",
        "Thought process disorders precede psychotic breaks — they are detectable early.",
        "Insight and judgment are the two most underrated components of the MSE rubric.",
    ],
    cta: "Save this post. Review your last MSE documentation and check all 9 domains.",
    audioUrl: "",
    topic: "Mental Status Exam",
}
