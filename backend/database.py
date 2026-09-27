import json
import os
from uuid import uuid4
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")


@contextmanager
def connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetch_all(query, params=()):
    with connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]


def fetch_one(query, params=()):
    with connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None


def create_mood(user_id, score, label, tags, note):
    return fetch_one(
        """INSERT INTO mood_checkins (id, client_id, user_id, score, label, tags, note)
              VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
           RETURNING id, client_id, score, label, tags, note, created_at""",
        (str(uuid4()), user_id, user_id, score, label, json.dumps(tags or []), note or None),
    )


def create_journal(user_id, title, content, tags, sentiment_label, sentiment_score, sentiment_model):
    return fetch_one(
          """INSERT INTO journal_entries
              (id, client_id, user_id, title, content, tags, sentiment_label, sentiment_score, sentiment_model)
              VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s)
           RETURNING id, client_id, title, content, tags, sentiment_label, sentiment_score, sentiment_model, created_at""",
        (str(uuid4()), user_id, user_id, title, content, json.dumps(tags or []), sentiment_label, sentiment_score, sentiment_model),
    )


def create_booking(user_id, booking):
    return fetch_one(
          """INSERT INTO counsellor_bookings
              (id, client_id, user_id, counsellor_id, counsellor_name, role, location, booking_date, booking_time, mode, note)
              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           RETURNING *""",
          (str(uuid4()), user_id, user_id, booking["counsellorId"], booking["counsellorName"], booking["role"], booking["location"],
         booking["date"], booking["time"], booking["mode"], booking.get("note", "")),
    )


def create_peer_message(room_id, user_id, author, content):
    return fetch_one(
        """INSERT INTO peer_messages (id, room_id, client_id, user_id, author, content)
              VALUES (%s, %s, %s, %s, %s, %s)
           RETURNING *""",
        (str(uuid4()), room_id, user_id, user_id, author, content),
    )


# ─── Peer rooms ───────────────────────────────────────────────────────────────

def fetch_peer_rooms():
    """Return all rooms ordered by built-ins first, then newest user-created."""
    return fetch_all(
        "SELECT * FROM public.peer_rooms ORDER BY is_builtin DESC, created_at ASC"
    )


def create_peer_room(name, description, icon, created_by):
    room_id = str(uuid4())
    return fetch_one(
        """INSERT INTO public.peer_rooms (id, name, description, icon, is_builtin, created_by)
              VALUES (%s, %s, %s, %s, FALSE, %s)
           RETURNING *""",
        (room_id, name.strip(), description.strip(), icon.strip() or "💬", created_by),
    )


def join_peer_room(room_id, user_id):
    """Insert membership row; ignore if already joined. Returns current member_count."""
    with connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """INSERT INTO public.peer_room_members (room_id, user_id)
               VALUES (%s, %s) ON CONFLICT DO NOTHING""",
            (room_id, user_id),
        )
        cursor.execute(
            "SELECT member_count FROM public.peer_rooms WHERE id = %s", (room_id,)
        )
        row = cursor.fetchone()
        return dict(row)["member_count"] if row else 0


def leave_peer_room(room_id, user_id):
    """Remove membership row. Returns current member_count."""
    with connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "DELETE FROM public.peer_room_members WHERE room_id = %s AND user_id = %s",
            (room_id, user_id),
        )
        cursor.execute(
            "SELECT member_count FROM public.peer_rooms WHERE id = %s", (room_id,)
        )
        row = cursor.fetchone()
        return dict(row)["member_count"] if row else 0


def get_joined_rooms(user_id):
    """Return set of room_ids the user has joined."""
    rows = fetch_all(
        "SELECT room_id FROM public.peer_room_members WHERE user_id = %s",
        (user_id,),
    )
    return {r["room_id"] for r in rows}