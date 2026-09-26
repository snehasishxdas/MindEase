import os
import sys
from datetime import timedelta
from pathlib import Path
from flask import Flask, g, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env.local")

backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from auth import auth_bp, record_activity, send_safety_alert, user_required
from groq_client import ask_groq, ask_groq_chat
from superbase_client import log_vent, log_resilience, log_quiz_score
from sentiment import analyze_sentiment
from burnout import assess_journal
from database import connection, create_booking, create_journal, create_mood, create_peer_message, fetch_all

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app = Flask(__name__, template_folder=frontend_dir, static_folder=os.path.join(frontend_dir, "static"))
app.secret_key = os.environ.get("SESSION_SECRET")
if not app.secret_key:
    raise RuntimeError("SESSION_SECRET must be configured before starting MindEase")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=bool(os.environ.get("VERCEL_ENV")),
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
)
app.register_blueprint(auth_bp)
CORS(app)


def serialize_row(row):
    if not row:
        return row
    return {key: value.isoformat() if hasattr(value, "isoformat") else value for key, value in row.items()}

# ─── System Prompts ────────────────────────────────────────────────────────────

VENT_SYSTEM_PROMPT = """You are a compassionate student wellness assistant. The student has shared something personal. Your job is to:
(1) Identify signs of academic burnout, emotional exhaustion, or stress in their message,
(2) Acknowledge their feelings warmly and non-judgementally,
(3) Suggest 2–3 specific, practical coping mechanisms suited to students,
(4) Keep your tone gentle, warm, and encouraging.
Do not diagnose. Do not be clinical. Use empathetic, conversational language."""

RESILIENCE_SYSTEM_PROMPT = """You are a resilience coach for students. The student has been given a social or academic scenario and has written how they would respond. Your job is to:
(1) Analyse whether their response demonstrates healthy boundary-setting,
(2) Identify what they did well,
(3) Suggest how they could improve their response to be more assertive or self-caring,
(4) Provide a model response example that sets a healthy boundary compassionately.
Keep the tone supportive, never critical."""

ROLEPLAY_SCENARIOS = {
    "group-project": {
        "title": "Peer pressure on a group project",
        "description": "A classmate expects you to complete most of a group assignment because you are good at the work.",
        "other_person": "a classmate on the project",
    },
    "study-demands": {
        "title": "Constant study group demands",
        "description": "A friend keeps asking you to explain your notes late at night, cutting into your own study and rest time.",
        "other_person": "a friend from your study group",
    },
    "harsh-feedback": {
        "title": "Harsh feedback from a professor",
        "description": "A professor criticizes your presentation in front of the class, and you want to respond calmly and ask for useful feedback.",
        "other_person": "your professor",
    },
    "comparison-spiral": {
        "title": "Social media comparison spiral",
        "description": "A peer talks about internships and achievements they have posted online, and you feel behind.",
        "other_person": "a peer who is sharing recent achievements",
    },
    "deadline-clash": {
        "title": "Overwhelming deadline clash",
        "description": "Several major assignments are due on the same day, and a group member asks you to cover their share too.",
        "other_person": "a group member asking you to take on extra work",
    },
    "family-career": {
        "title": "Unsolicited family career advice",
        "description": "A family member keeps pushing you toward a career path you do not want.",
        "other_person": "a family member who cares but is being pushy",
    },
}

ROLEPLAY_SYSTEM_PROMPT = """You are playing the other person in a realistic rehearsal conversation for a student. Stay in character and respond naturally to what the student says, as a real person might. Keep each reply to 1-3 sentences and let the interaction evolve; do not agree too easily, escalate into abuse, threaten, insult, or make the scene frightening. The goal is safe practice, not winning. Do not coach or evaluate during the scene. If the student asks to stop, stop immediately and respond supportively. This is practice, not therapy or a substitute for professional support."""

ROLEPLAY_DEBRIEF_PROMPT = """You are a supportive communication-skills coach debriefing a short role-play rehearsal. Briefly reflect what the student did effectively, offer one specific alternative phrase or next step they could try, and ask how the practice felt. Be warm and nonjudgmental; do not diagnose or imply there is one perfect response. Keep the debrief under 150 words."""

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/vent", methods=["POST"])
@user_required
def vent():
    data = request.get_json()
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "No text provided"}), 400

    user_text = data["text"].strip()

    try:
        ai_response = ask_groq(VENT_SYSTEM_PROMPT, user_text)
        log_vent(str(g.current_user["id"]), user_text, ai_response)
        record_activity(g.current_user["id"], "support_chat", "Used the private support chat.")
        return jsonify({"response": ai_response})
    except Exception as e:
        print(f"[Vent API Error] {e}")
        return jsonify({"error": "Something went wrong. Please try again."}), 500


@app.route("/api/resilience", methods=["POST"])
@user_required
def resilience():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    scenario = data.get("scenario", "").strip()
    user_response = data.get("user_response", "").strip()

    if not scenario or not user_response:
        return jsonify({"error": "Scenario and response are required"}), 400

    user_message = f"Scenario: {scenario}\n\nMy Response: {user_response}"

    try:
        ai_feedback = ask_groq(RESILIENCE_SYSTEM_PROMPT, user_message)
        log_resilience(str(g.current_user["id"]), scenario, user_response, ai_feedback)
        record_activity(g.current_user["id"], "resilience_activity", "Completed a resilience reflection.")
        return jsonify({"response": ai_feedback})
    except Exception as e:
        print(f"[Resilience API Error] {e}")
        return jsonify({"error": "Something went wrong. Please try again."}), 500


@app.route("/api/resilience/roleplay", methods=["POST"])
@user_required
def resilience_roleplay():
    data = request.get_json(silent=True) or {}
    scenario = ROLEPLAY_SCENARIOS.get(data.get("scenario_id"))
    mode = data.get("mode")
    turns = data.get("turns", [])
    if not scenario:
        return jsonify({"error": "Choose a valid practice scenario."}), 400
    if mode not in {"start", "reply", "debrief"}:
        return jsonify({"error": "Choose a valid role-play action."}), 400
    if not isinstance(turns, list) or len(turns) > 16:
        return jsonify({"error": "This practice has reached its conversation limit."}), 400
    if any(
        not isinstance(turn, dict)
        or turn.get("role") not in {"user", "assistant"}
        or not isinstance(turn.get("content"), str)
        or not turn["content"].strip()
        or len(turn["content"]) > 1200
        for turn in turns
    ):
        return jsonify({"error": "The conversation contains an invalid message."}), 400

    messages = [{"role": turn["role"], "content": turn["content"]} for turn in turns]
    if mode == "start":
        messages.append({"role": "user", "content": "Begin the scene with a natural opening line."})
        system_prompt = f"{ROLEPLAY_SYSTEM_PROMPT}\n\nScenario: {scenario['description']}\nYou are {scenario['other_person']}."
    elif mode == "reply":
        user_message = data.get("message", "")
        if not isinstance(user_message, str) or not user_message.strip() or len(user_message) > 1200:
            return jsonify({"error": "Write a response of 1,200 characters or fewer."}), 400
        if assess_journal(user_message)["self_harm_concern"]:
            return jsonify({"crisis_detected": True}), 200
        messages.append({"role": "user", "content": user_message.strip()})
        system_prompt = f"{ROLEPLAY_SYSTEM_PROMPT}\n\nScenario: {scenario['description']}\nYou are {scenario['other_person']}."
    else:
        if not messages:
            return jsonify({"error": "Complete a few turns before starting a debrief."}), 400
        messages.append({"role": "user", "content": "Step out of the scene and debrief this practice with me."})
        system_prompt = ROLEPLAY_DEBRIEF_PROMPT

    try:
        response = ask_groq_chat(system_prompt, messages)
        return jsonify({"response": response})
    except Exception as error:
        app.logger.error("Role-play request failed: %s", error)
        return jsonify({"error": "The practice conversation could not respond. Please try again."}), 503


@app.route("/api/quiz-score", methods=["POST"])
@user_required
def quiz_score():
    data = request.get_json()
    score = data.get("score", 0)
    total = data.get("total", 0)
    try:
        log_quiz_score(str(g.current_user["id"]), score, total)
        record_activity(g.current_user["id"], "quiz_completed", "Completed a wellness quiz.")
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False}), 500


@app.route("/api/sentiment", methods=["POST"])
@user_required
def sentiment():
    data = request.get_json()
    text = data.get("text", "").strip() if data else ""
    if not text:
        return jsonify({"error": "Text is required"}), 400

    try:
        return jsonify(analyze_sentiment(text))
    except Exception as e:
        print(f"[Sentiment API Error] {e}")
        return jsonify({"error": "Sentiment analysis is temporarily unavailable."}), 503


@app.route("/api/moods", methods=["GET", "POST"])
@user_required
def moods():
    if request.method == "GET":
        rows = fetch_all(
            "SELECT id, score, label, tags, note, created_at FROM mood_checkins WHERE user_id = %s ORDER BY created_at DESC",
            (str(g.current_user["id"]),),
        )
        return jsonify([serialize_row(row) for row in rows])

    data = request.get_json() or {}
    required = ("score", "label")
    if any(data.get(field) is None or data.get(field) == "" for field in required):
        return jsonify({"error": "score and label are required"}), 400
    try:
        result = create_mood(str(g.current_user["id"]), data["score"], data["label"], data.get("tags"), data.get("note"))
        record_activity(g.current_user["id"], "mood_checkin", "Saved a mood check-in.")
        return jsonify(serialize_row(result)), 201
    except Exception as e:
        print(f"[Mood API Error] {e}")
        return jsonify({"error": "Mood check-in could not be saved."}), 503


@app.route("/api/journals", methods=["GET", "POST", "DELETE"])
@user_required
def journals():
    if request.method == "DELETE":
        entry_id = request.args.get("id", "").strip()
        with connection() as conn, conn.cursor() as cursor:
            cursor.execute("DELETE FROM journal_entries WHERE id = %s AND user_id = %s",
                           (entry_id, str(g.current_user["id"])))
            deleted = cursor.rowcount > 0
        if deleted:
            record_activity(g.current_user["id"], "journal_deleted", "Deleted a private journal entry.")
        return jsonify({"ok": True})
    if request.method == "GET":
        rows = fetch_all("SELECT * FROM journal_entries WHERE user_id = %s ORDER BY created_at DESC", (str(g.current_user["id"]),))
        return jsonify([serialize_row(row) for row in rows])

    data = request.get_json() or {}
    if not data.get("content", "").strip():
        return jsonify({"error": "content is required"}), 400
    try:
        screening = assess_journal(data["content"])
        result = create_journal(str(g.current_user["id"]), data.get("title") or "Daily Reflection", data["content"].strip(),
                                data.get("tags"), data.get("sentimentLabel"), data.get("sentimentScore"), data.get("sentimentModel"))
        record_activity(g.current_user["id"], "journal_entry", "Saved a private journal entry.")
        screening["admin_notified"] = False
        if screening["self_harm_concern"]:
            try:
                send_safety_alert(g.current_user)
                screening["admin_notified"] = True
            except Exception as error:
                app.logger.error("Could not send journal safety alert: %s", error)
        response = serialize_row(result)
        response["screening"] = screening
        return jsonify(response), 201
    except Exception as e:
        print(f"[Journal API Error] {e}")
        return jsonify({"error": "Journal entry could not be saved."}), 503


@app.route("/api/bookings", methods=["GET", "POST", "DELETE"])
@user_required
def bookings():
    if request.method == "GET":
        rows = fetch_all("SELECT * FROM counsellor_bookings WHERE user_id = %s ORDER BY created_at DESC", (str(g.current_user["id"]),))
        return jsonify([serialize_row(row) for row in rows])
    if request.method == "DELETE":
        booking_id = request.args.get("id", "").strip()
        with connection() as conn, conn.cursor() as cursor:
            cursor.execute("UPDATE counsellor_bookings SET status = 'cancelled' WHERE id = %s AND user_id = %s",
                           (booking_id, str(g.current_user["id"])))
        record_activity(g.current_user["id"], "booking_cancelled", "Cancelled a counselling appointment.")
        return jsonify({"ok": True})
    data = request.get_json() or {}
    try:
        result = create_booking(str(g.current_user["id"]), data)
        record_activity(g.current_user["id"], "booking_created", "Booked a counselling appointment.")
        return jsonify(serialize_row(result)), 201
    except Exception as e:
        print(f"[Booking API Error] {e}")
        return jsonify({"error": "Booking could not be saved."}), 503


@app.route("/api/peer-messages", methods=["GET", "POST"])
@user_required
def peer_messages():
    if request.method == "GET":
        room_id = request.args.get("room_id", "").strip()
        rows = fetch_all("SELECT * FROM peer_messages WHERE room_id = %s ORDER BY created_at DESC LIMIT 100", (room_id,))
        return jsonify([serialize_row(row) for row in rows])
    data = request.get_json() or {}
    if not all(data.get(field) for field in ("roomId", "author", "content")):
        return jsonify({"error": "roomId, author, and content are required"}), 400
    try:
        result = create_peer_message(data["roomId"], str(g.current_user["id"]), data["author"], data["content"].strip())
        record_activity(g.current_user["id"], "peer_message", "Posted a message in a peer support room.")
        return jsonify(serialize_row(result)), 201
    except Exception as e:
        print(f"[Peer API Error] {e}")
        return jsonify({"error": "Peer message could not be saved."}), 503


# ─── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
