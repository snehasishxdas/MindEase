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