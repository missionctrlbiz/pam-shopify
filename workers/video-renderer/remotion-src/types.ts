/** Props passed from remotion.ts → inputProps → PAMVideo composition */
export interface PAMVideoProps {
    hook: string
    teachingPoints: string[]
    cta: string
    audioUrl: string
    topic: string
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
}

export interface TeachingSceneData extends Scene {
    type: "TEACHING"
    pointIndex: number   // 0-based
    totalPoints: number
    text: string
}

export interface CTASceneData extends Scene {
    type: "CTA"
    cta: string
    topic: string
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
