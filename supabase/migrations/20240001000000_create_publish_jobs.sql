-- Migration: Publishing Pipeline — publish_jobs table
-- Tracks every email blast and Buffer social post dispatched through
-- the /api/production/publish endpoint.

-- Enable pgcrypto for gen_random_uuid() if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── publish_jobs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publish_jobs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which distribution channel this job targets
    channel         TEXT        NOT NULL
                    CHECK (channel IN ('EMAIL','LINKEDIN','TIKTOK','INSTAGRAM','FACEBOOK')),

    -- The content_assets row used as source (nullable for manual text posts)
    asset_id        UUID        REFERENCES content_assets(id) ON DELETE SET NULL,

    -- Email-specific: how many recipients were addressed
    recipient_count INTEGER,

    -- Buffer-specific: the update ID returned from Buffer API
    buffer_post_id  TEXT,

    -- When the post is/was scheduled to go live
    scheduled_at    TIMESTAMPTZ,

    -- When this job was actually dispatched (NULL until fired)
    dispatched_at   TIMESTAMPTZ,

    -- Job lifecycle status
    status          TEXT        NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','RUNNING','COMPLETE','FAILED','RATE_LIMITED')),

    error_message   TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── email_blast_log ───────────────────────────────────────────────────────────
-- Per-day counter table enabling fast daily quota checks.
CREATE TABLE IF NOT EXISTS email_blast_log (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recipient_email TEXT        NOT NULL,
    asset_id        UUID        REFERENCES content_assets(id) ON DELETE SET NULL,
    publish_job_id  UUID        REFERENCES publish_jobs(id) ON DELETE CASCADE,
    -- Track SMTP success vs. failure
    delivery_status TEXT        NOT NULL DEFAULT 'sent'
                    CHECK (delivery_status IN ('sent', 'failed', 'bounced'))
);

-- Index for fast "emails sent today" quota check
CREATE INDEX IF NOT EXISTS idx_email_blast_log_sent_at
    ON email_blast_log (sent_at);

-- Index for publish_jobs ordered dashboard queries
CREATE INDEX IF NOT EXISTS idx_publish_jobs_created_at
    ON publish_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_status
    ON publish_jobs (status);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_scheduled_at
    ON publish_jobs (scheduled_at);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- These tables are admin-only; all access goes through the service-role client.
ALTER TABLE publish_jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blast_log   ENABLE ROW LEVEL SECURITY;

-- Service-role key bypasses RLS — no additional policy needed for server usage.
-- Deny all access via the anon/authenticated keys for safety:
CREATE POLICY "deny_anon_publish_jobs"
    ON publish_jobs FOR ALL TO anon USING (false);

CREATE POLICY "deny_anon_email_blast_log"
    ON email_blast_log FOR ALL TO anon USING (false);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER publish_jobs_updated_at
    BEFORE UPDATE ON publish_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
