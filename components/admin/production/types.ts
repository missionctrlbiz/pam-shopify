/** Shared TypeScript types for the /admin/production UI. */

// ── Enum mirrors ──────────────────────────────────────────────────────────────
export type Platform = "IG" | "FB" | "TIKTOK" | "LINKEDIN" | "EMAIL" | "VIDEO"
export type PostType = "CAROUSEL" | "VIDEO" | "TEXT_POST" | "REEL" | "STORY" | "EMAIL_LESSON"
export type PublishStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "GENERATING" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED"
export type AssetStatus = "PENDING" | "GENERATING" | "COMPLETE" | "FAILED"
export type AssetType = "CAROUSEL_PNG" | "VIDEO_MP4" | "TEXT_POST" | "EMAIL_HTML" | "AUDIO_MP3" | "VIDEO_SCRIPT_JSON"
export type RenderJobStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "FAILED"
export type QualityGateStatus = "PENDING" | "PASSED" | "FAILED" | "BYPASSED"
export type AudioStatus = "PENDING" | "GENERATING" | "COMPLETE" | "FAILED"

// ── List view (from GET /api/production/calendar) ────────────────────────────
export interface CalendarEntryRow {
    id: string
    dayNumber: number
    entryDate: string
    platform: Platform
    postType: PostType
    publishStatus: PublishStatus
    topic: string | null
    contentGoal: string | null
    contentIdea: {
        id: string
        hook: string | null
        qualityGateStatus: QualityGateStatus
        qualityGateResult: {
            passed: boolean
            overallScore: number
        } | null
        clinicalField: {
            fieldKey: string
            displayName: string
            fieldCategory: string
        } | null
    } | null
}

// ── Detail view (from GET /api/production/calendar/[id]) ─────────────────────
export interface QualityGateResult {
    id: string
    passed: boolean
    overallScore: number
    qualityGateStatus: QualityGateStatus
    score1: number; score2: number; score3: number; score4: number; score5: number
    reasoning1: string; reasoning2: string; reasoning3: string; reasoning4: string; reasoning5: string
    bypassReason: string | null
    evaluatedAt: string | null
    createdAt: string
}

export interface ContentAsset {
    id: string
    assetType: AssetType
    platform: Platform
    assetStatus: AssetStatus
    storageUrl: string | null
    fileName: string | null
    storagePath: string | null
    contentType: string | null
    fileSizeBytes: number | null
    metadata: Record<string, unknown> | null
    createdAt: string
    updatedAt: string
}

export interface RenderJob {
    id: string
    jobType: string
    status: RenderJobStatus
    taskId: string | null
    queuedAt: string
    startedAt: string | null
    completedAt: string | null
    errorMessage: string | null
}

export interface VideoScript {
    id: string
    scriptJson: unknown
    totalDurationSecs: number | null
    audioStatus: AudioStatus
    audioStorageUrl: string | null
    elevenLabsJobId: string | null
}

export interface ContentIdeaDetail {
    id: string
    hook: string | null
    cta: string | null
    masterJson: unknown
    qualityGateStatus: QualityGateStatus
    clinicalField: {
        fieldKey: string
        displayName: string
        fieldCategory: string
        description: string | null
    } | null
    qualityGateResult: QualityGateResult | null
    videoScript: VideoScript | null
    assets: ContentAsset[]
    renderJobs: RenderJob[]
}

export interface CalendarEntryDetail {
    id: string
    dayNumber: number
    entryDate: string
    platform: Platform
    postType: PostType
    publishStatus: PublishStatus
    topic: string | null
    contentGoal: string | null
    scheduledAt: string | null
    approvedAt: string | null
    approvedBy: { id: string; name: string | null; email: string | null } | null
    contentIdea: ContentIdeaDetail | null
}

// ── API response shapes ───────────────────────────────────────────────────────
export interface CalendarListResponse {
    entries: CalendarEntryRow[]
    pagination: { total: number; page: number; limit: number; totalPages: number }
}

export interface ApproveResponse {
    approved: boolean
    bypass: boolean
    entryId: string
    newStatus: PublishStatus
    qualityGate: {
        passed: boolean
        overallScore: number
        scores: Record<string, number>
        reasoning: Record<string, string>
    }
}

export interface GenerateAssetsResponse {
    queued?: number
    jobs?: { jobType: string; taskId: string; renderJobId: string }[]
    errors?: string[]
    message?: string
}

export interface GenerateCycleResponse {
    generated: number
    failed: number
    entries: { dayNumber: number; entryId: string; topic: string }[]
    errors?: string[]
    queued?: boolean
    batchId?: string
    requestedDays?: number
    message?: string
}
