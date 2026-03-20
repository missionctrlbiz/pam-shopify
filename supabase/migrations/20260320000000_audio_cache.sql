-- ---------------------------------------------------------------------------
-- Audio Cache Table
--
-- Stores hashed ElevenLabs TTS results so identical voice-over scripts are
-- served from Supabase Storage instead of re-billing the ElevenLabs API.
--
-- Key design decisions:
--   • prompt_hash is the PRIMARY KEY — SHA-256 hex of (voice_id || ':' || clean_text).
--     Deterministic hashing prevents metadata collisions across re-generate clicks.
--   • duration_ms is DOUBLE PRECISION so Remotion timeline setups receive
--     sub-millisecond precision floats from the /api/audio/generate response.
--   • last_used_at lets a future cache-eviction job identify stale entries.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audio_cache (
    -- Deterministic SHA-256 hex of "<voice_id>:<clean_text>"
    prompt_hash   TEXT        NOT NULL,

    -- Supabase Storage public URL for the cached .mp3 file
    storage_url   TEXT        NOT NULL,

    -- Object path inside the "production" bucket  (e.g. audio-cache/<hash>.mp3)
    storage_path  TEXT        NOT NULL,

    -- Audio duration in milliseconds (precision float for Remotion timeline use)
    duration_ms   DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- ElevenLabs voice ID used to generate this audio clip
    voice_id      TEXT        NOT NULL,

    -- Raw character count of the cleaned prompt (for monitoring / billing estimates)
    char_count    INTEGER     NOT NULL DEFAULT 0,

    -- Timestamps
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT audio_cache_pkey PRIMARY KEY (prompt_hash)
);

-- Index for monitoring queries that filter by voice or date
CREATE INDEX IF NOT EXISTS audio_cache_voice_id_idx   ON public.audio_cache (voice_id);
CREATE INDEX IF NOT EXISTS audio_cache_created_at_idx ON public.audio_cache (created_at DESC);

-- Row-level security: service-role key bypasses RLS; anon/authenticated reads allowed
ALTER TABLE public.audio_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
    ON public.audio_cache
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated read"
    ON public.audio_cache
    FOR SELECT
    USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.audio_cache IS
    'Cache of ElevenLabs TTS MP3 outputs keyed by SHA-256 hash of (voice_id + clean_text). '
    'Prevents duplicate API calls and billing surges when identical scripts are re-generated.';

COMMENT ON COLUMN public.audio_cache.prompt_hash IS
    'SHA-256 hex digest of "<voice_id>:<clean_text>" — used as the deterministic cache key.';

COMMENT ON COLUMN public.audio_cache.duration_ms IS
    'Audio clip duration in milliseconds (DOUBLE PRECISION) for Remotion timeline synchronisation.';
