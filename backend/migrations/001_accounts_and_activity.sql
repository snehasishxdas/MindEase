CREATE TABLE IF NOT EXISTS mindease_users (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    activity_emails_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mindease_admin_attempts (
    email TEXT PRIMARY KEY,
    attempts SMALLINT NOT NULL DEFAULT 0,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mindease_otp_challenges (
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    otp_digest TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (email, purpose)
);

CREATE TABLE IF NOT EXISTS mindease_activity (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES mindease_users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mindease_activity_user_created_idx
    ON mindease_activity (user_id, created_at DESC);

ALTER TABLE IF EXISTS public.journal_entries
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.mood_checkins
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.counsellor_bookings
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.peer_messages
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.vent_logs
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.resilience_logs
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.quiz_scores
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES mindease_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS journal_entries_user_created_idx
    ON public.journal_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mood_checkins_user_created_idx
    ON public.mood_checkins (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS counsellor_bookings_user_created_idx
    ON public.counsellor_bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS peer_messages_user_created_idx
    ON public.peer_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vent_logs_user_id_idx ON public.vent_logs (user_id);
CREATE INDEX IF NOT EXISTS resilience_logs_user_id_idx ON public.resilience_logs (user_id);
CREATE INDEX IF NOT EXISTS quiz_scores_user_id_idx ON public.quiz_scores (user_id);