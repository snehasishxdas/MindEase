from uuid import uuid4

from database import fetch_one

def log_vent(user_id: str, content: str, ai_response: str):
    """Persist a vent entry in the Supabase PostgreSQL database."""
    fetch_one(
        """INSERT INTO vent_logs (id, user_id, content, ai_response)
           VALUES (%s, %s, %s, %s) RETURNING id""",
        (str(uuid4()), user_id, content, ai_response),
    )

def log_resilience(user_id: str, scenario: str, user_response: str, ai_feedback: str):
    """Persist a resilience entry in the Supabase PostgreSQL database."""
    fetch_one(
        """INSERT INTO resilience_logs (id, user_id, scenario, user_response, ai_feedback)
           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
        (str(uuid4()), user_id, scenario, user_response, ai_feedback),
    )

def log_quiz_score(user_id: str, score: int, total: int):
    """Persist a quiz score in the Supabase PostgreSQL database."""
    fetch_one(
        """INSERT INTO quiz_scores (id, user_id, score, total)
           VALUES (%s, %s, %s, %s) RETURNING id""",
        (str(uuid4()), user_id, score, total),
    )
