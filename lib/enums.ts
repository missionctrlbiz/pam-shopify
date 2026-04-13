type ValueOf<T extends Record<string, string>> = T[keyof T]

export const UserRole = {
    USER: "USER",
    ADMIN: "ADMIN",
} as const
export type UserRole = ValueOf<typeof UserRole>

export const Platform = {
    IG: "IG",
    FB: "FB",
    TIKTOK: "TIKTOK",
    LINKEDIN: "LINKEDIN",
    EMAIL: "EMAIL",
    VIDEO: "VIDEO",
} as const
export type Platform = ValueOf<typeof Platform>

export const FunnelStage = {
    AWARENESS: "AWARENESS",
    CONSIDERATION: "CONSIDERATION",
    CONVERSION: "CONVERSION",
    RETENTION: "RETENTION",
} as const
export type FunnelStage = ValueOf<typeof FunnelStage>

export const PostType = {
    CAROUSEL: "CAROUSEL",
    TEXT_POST: "TEXT_POST",
    EMAIL_LESSON: "EMAIL_LESSON",
} as const;
export type PostType = ValueOf<typeof PostType>

export const PublishStatus = {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    GENERATING: "GENERATING",
    SCHEDULED: "SCHEDULED",
    PUBLISHED: "PUBLISHED",
    ARCHIVED: "ARCHIVED",
} as const
export type PublishStatus = ValueOf<typeof PublishStatus>

export const AssetType = {
    CAROUSEL_PNG: "CAROUSEL_PNG",
    VIDEO_MP4: "VIDEO_MP4",
    TEXT_POST: "TEXT_POST",
    EMAIL_HTML: "EMAIL_HTML",
    AUDIO_MP3: "AUDIO_MP3",
    VIDEO_SCRIPT_JSON: "VIDEO_SCRIPT_JSON",
} as const
export type AssetType = ValueOf<typeof AssetType>

export const AssetStatus = {
    PENDING: "PENDING",
    GENERATING: "GENERATING",
    COMPLETE: "COMPLETE",
    FAILED: "FAILED",
} as const
export type AssetStatus = ValueOf<typeof AssetStatus>

export const RenderJobType = {
    CAROUSEL: "CAROUSEL",
    VIDEO: "VIDEO",
    AUDIO: "AUDIO",
    REPURPOSE: "REPURPOSE",
} as const
export type RenderJobType = ValueOf<typeof RenderJobType>

export const RenderJobStatus = {
    QUEUED: "QUEUED",
    RUNNING: "RUNNING",
    COMPLETE: "COMPLETE",
    FAILED: "FAILED",
} as const
export type RenderJobStatus = ValueOf<typeof RenderJobStatus>

export const QualityGateStatus = {
    PENDING: "PENDING",
    PASSED: "PASSED",
    FAILED: "FAILED",
    BYPASSED: "BYPASSED",
} as const
export type QualityGateStatus = ValueOf<typeof QualityGateStatus>

export const FieldCategory = {
    CHIEF_COMPLAINT: "CHIEF_COMPLAINT",
    MSE: "MSE",
    DIAGNOSTIC: "DIAGNOSTIC",
    RISK_ASSESSMENT: "RISK_ASSESSMENT",
    DOCUMENTATION: "DOCUMENTATION",
    INTERVIEW: "INTERVIEW",
} as const
export type FieldCategory = ValueOf<typeof FieldCategory>
