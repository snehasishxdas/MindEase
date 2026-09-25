import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None

def get_supabase():
    global supabase
    if supabase is None and SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

def log_vent(content: str, ai_response: str):
    """Log a vent entry to Supabase (silently fails if not configured)."""
    try:
        db = get_supabase()
        if db:
            db.table("vent_logs").insert({
                "content": content,
                "ai_response": ai_response
            }).execute()
    except Exception as e:
        print(f"[Supabase] vent_logs insert failed: {e}")

def log_resilience(scenario: str, user_response: str, ai_feedback: str):
    """Log a resilience entry to Supabase (silently fails if not configured)."""
    try:
        db = get_supabase()
        if db:
            db.table("resilience_logs").insert({
                "scenario": scenario,
                "user_response": user_response,
                "ai_feedback": ai_feedback
            }).execute()
    except Exception as e:
        print(f"[Supabase] resilience_logs insert failed: {e}")

def log_quiz_score(score: int, total: int):
    """Log a quiz score to Supabase (silently fails if not configured)."""
    try:
        db = get_supabase()
        if db:
            db.table("quiz_scores").insert({
                "score": score,
                "total": total
            }).execute()
    except Exception as e:
        print(f"[Supabase] quiz_scores insert failed: {e}")
