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

// ── Publishing Pipeline Types ─────────────────────────────────────────────────

/** Social channel supported by Buffer */
export type BufferService = "linkedin" | "tiktok" | "instagram" | "facebook"

/** Buffer free-tier profile summary */
export interface BufferProfile {
    id: string
    service: BufferService
    serviceUsername: string
    serviceType: "profile" | "page"
    avatarUrl: string | null
    timezone: string
    /** Number of posts currently buffered (free tier max = 10) */
    bufferCount: number
    /** Maximum queue size for this profile */
    bufferMax: number
}

/** Media attachment for a Buffer post (image, video, or carousel) */
export interface BufferMediaAttachment {
    photo?: string      // Public CDN URL for image
    video?: string      // Public CDN URL for video (mp4)
    thumbnail?: string  // Video thumbnail (required for TikTok)
    altText?: string    // Accessibility alt text
    /** TikTok-specific: 9:16 vertical frame required */
    tiktokViewport?: boolean
}

/** Typed payload for creating a Buffer update */
export interface BufferPostPayload {
    profile_ids: string[]
    text: string
    media?: BufferMediaAttachment
    /** ISO 8601 scheduled publish time; omit to post at next buffer slot */
    scheduled_at?: string
    shorten?: boolean
    now?: boolean
    top?: boolean
}

/** A single update returned from Buffer after scheduling */
export interface BufferScheduledUpdate {
    id: string
    created_at: number
    day: string
    due_at: number
    due_time: string
    media: BufferMediaAttachment | null
    profile_id: string
    profile_service: BufferService
    shared_now: boolean
    status: "buffer" | "sent" | "error"
    text: string
    text_formatted: string
    type: string
    updated_at: number
    via: string
}

/** Response from POST /1/updates/create.json */
export interface BufferPostResponse {
    success: boolean
    buffer_count: number
    buffer_percentage: number
    updates: BufferScheduledUpdate[]
}

// ── Email Blast Types ─────────────────────────────────────────────────────────

/** Which Supabase audience table to pull recipients from */
export type AudienceSource = "buyers" | "leads" | "both"

/** Configuration for a single email blast job */
export interface EmailBlastConfig {
    audienceSource: AudienceSource
    /** ID of the content_assets row with assetType === EMAIL_HTML */
    assetId: string
    /** Email subject line */
    subject: string
    /** Hard cap per dispatch; must stay ≤ daily quota (default 90) */
    maxRecipients: number
}

/** Configuration for a Buffer multi-channel blast */
export interface BufferBlastConfig {
    profileIds: string[]
    /** ID of the content_assets row used as media source */
    assetId: string
    text: string
    /** Optional ISO 8601 scheduled time; defaults to next buffer slot */
    scheduledAt?: string
}

/** Top-level publish request body */
export interface PublishPayload {
    mode: "email" | "buffer" | "all"
    email?: EmailBlastConfig
    buffer?: BufferBlastConfig
}

// ── Publish Job Tracking ──────────────────────────────────────────────────────

export type PublishChannel = "EMAIL" | "LINKEDIN" | "TIKTOK" | "INSTAGRAM" | "FACEBOOK"
export type PublishJobStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED" | "RATE_LIMITED"

/** Row from the publish_jobs table */
export interface PublishJob {
    id: string
    channel: PublishChannel
    assetId: string | null
    recipientCount: number | null
    bufferPostId: string | null
    scheduledAt: string | null
    dispatchedAt: string | null
    status: PublishJobStatus
    errorMessage: string | null
    createdAt: string
}

/** Row shown in the Scheduling Sync dashboard grid */
export interface ScheduledPostRow {
    id: string
    channel: PublishChannel
    scheduledAt: string
    text: string
    mediaUrl: string | null
    status: "scheduled" | "sent" | "failed"
    bufferPostId: string | null
    assetId: string | null
}

/** Full state returned by GET /api/production/publish */
export interface PublishState {
    emailSentToday: number
    emailDailyLimit: number
    emailRemainingToday: number
    bufferProfiles: BufferProfile[]
    scheduledPosts: ScheduledPostRow[]
    recentJobs: PublishJob[]
    lastBlastAt: string | null
}

/** Response body for POST /api/production/publish */
export interface PublishResponse {
    /** Top-level single error message (returned when the entire request fails) */
    error?: string
    emailJobId?: string
    bufferUpdateIds?: string[]
    emailCount?: number
    bufferCount?: number
    rateLimitedChannels?: string[]
    errors?: string[]
    quotaWarning?: string
    message?: string
}
