-- ─── User-created public peer rooms ─────────────────────────────────────────
-- Stores every room, including the 4 built-in seed rooms.
-- member_count is a denormalised counter maintained by triggers / app logic.

CREATE TABLE IF NOT EXISTS public.peer_rooms (
    id           TEXT        PRIMARY KEY,          -- slug for built-ins, UUID for user-created
    name         TEXT        NOT NULL,
    description  TEXT        NOT NULL DEFAULT '',
    icon         TEXT        NOT NULL DEFAULT '💬',
    is_builtin   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_by   UUID        REFERENCES mindease_users(id) ON DELETE SET NULL,
    member_count INT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the four built-in rooms (idempotent)
INSERT INTO public.peer_rooms (id, name, description, icon, is_builtin)
VALUES
  ('exam',     'Exam Pressure & Deadlines',    'Vent safely about finals, submissions, and thesis stress.',            '📚', TRUE),
  ('freshers', 'Campus Life & Transition',     'Dorm life, homesickness, and navigating college.',                    '🌱', TRUE),
  ('imposter', 'Imposter Syndrome & Doubts',   'Reminding ourselves that everyone is learning as they go.',           '🧠', TRUE),
  ('wins',     'Daily Micro-Wins & Joy',       'Celebrate waking up on time, finishing a lecture, or drinking water.','☀️', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── Room membership ─────────────────────────────────────────────────────────
-- One row per (user, room) — tracks who has joined which room.

CREATE TABLE IF NOT EXISTS public.peer_room_members (
    room_id     TEXT        NOT NULL REFERENCES public.peer_rooms(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES mindease_users(id)    ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS peer_room_members_room_idx ON public.peer_room_members (room_id);
CREATE INDEX IF NOT EXISTS peer_room_members_user_idx ON public.peer_room_members (user_id);

-- ─── Keep member_count in sync automatically ─────────────────────────────────

CREATE OR REPLACE FUNCTION sync_peer_room_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.peer_rooms SET member_count = member_count + 1 WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.peer_rooms SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_peer_room_member_count ON public.peer_room_members;
CREATE TRIGGER trg_peer_room_member_count
AFTER INSERT OR DELETE ON public.peer_room_members
FOR EACH ROW EXECUTE FUNCTION sync_peer_room_member_count();
