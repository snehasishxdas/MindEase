import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq_client import ask_groq
from superbase_client import log_vent, log_resilience, log_quiz_score
from sentiment import analyze_sentiment
from database import connection, create_booking, create_journal, create_mood, create_peer_message, fetch_all

load_dotenv()

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app = Flask(__name__, template_folder=frontend_dir, static_folder=os.path.join(frontend_dir, "static"))
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

# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/vent", methods=["POST"])
def vent():
    data = request.get_json()
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "No text provided"}), 400

    user_text = data["text"].strip()

    try:
        ai_response = ask_groq(VENT_SYSTEM_PROMPT, user_text)
        log_vent(user_text, ai_response)
        return jsonify({"response": ai_response})
    except Exception as e:
        print(f"[Vent API Error] {e}")
        return jsonify({"error": "Something went wrong. Please try again."}), 500


@app.route("/api/resilience", methods=["POST"])
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
        log_resilience(scenario, user_response, ai_feedback)
        return jsonify({"response": ai_feedback})
    except Exception as e:
        print(f"[Resilience API Error] {e}")
        return jsonify({"error": "Something went wrong. Please try again."}), 500


@app.route("/api/quiz-score", methods=["POST"])
def quiz_score():
    data = request.get_json()
    score = data.get("score", 0)
    total = data.get("total", 0)
    try:
        log_quiz_score(score, total)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False}), 500


@app.route("/api/sentiment", methods=["POST"])
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
def moods():
    if request.method == "GET":
        client_id = request.args.get("client_id", "").strip()
        if not client_id:
            return jsonify({"error": "client_id is required"}), 400
        rows = fetch_all(
            "SELECT id, score, label, tags, note, created_at FROM mood_checkins WHERE client_id = %s ORDER BY created_at DESC",
            (client_id,),
        )
        return jsonify([serialize_row(row) for row in rows])

    data = request.get_json() or {}
    required = ("client_id", "score", "label")
    if any(not data.get(field) for field in required):
        return jsonify({"error": "client_id, score, and label are required"}), 400
    try:
        return jsonify(serialize_row(create_mood(data["client_id"], data["score"], data["label"], data.get("tags"), data.get("note")))), 201
    except Exception as e:
        print(f"[Mood API Error] {e}")
        return jsonify({"error": "Mood check-in could not be saved."}), 503


@app.route("/api/journals", methods=["GET", "POST", "DELETE"])
def journals():
    if request.method == "DELETE":
        entry_id = request.args.get("id", "").strip()
        with connection() as conn, conn.cursor() as cursor:
            cursor.execute("DELETE FROM journal_entries WHERE id = %s", (entry_id,))
        return jsonify({"ok": True})
    if request.method == "GET":
        client_id = request.args.get("client_id", "").strip()
        if not client_id:
            return jsonify({"error": "client_id is required"}), 400
        rows = fetch_all("SELECT * FROM journal_entries WHERE client_id = %s ORDER BY created_at DESC", (client_id,))
        return jsonify([serialize_row(row) for row in rows])

    data = request.get_json() or {}
    if not data.get("client_id") or not data.get("content", "").strip():
        return jsonify({"error": "client_id and content are required"}), 400
    try:
        result = create_journal(data["client_id"], data.get("title") or "Daily Reflection", data["content"].strip(),
                                data.get("tags"), data.get("sentimentLabel"), data.get("sentimentScore"), data.get("sentimentModel"))
        return jsonify(serialize_row(result)), 201
    except Exception as e:
        print(f"[Journal API Error] {e}")
        return jsonify({"error": "Journal entry could not be saved."}), 503


@app.route("/api/bookings", methods=["GET", "POST", "DELETE"])
def bookings():
    if request.method == "GET":
        client_id = request.args.get("client_id", "").strip()
        rows = fetch_all("SELECT * FROM counsellor_bookings WHERE client_id = %s ORDER BY created_at DESC", (client_id,))
        return jsonify([serialize_row(row) for row in rows])
    if request.method == "DELETE":
        booking_id = request.args.get("id", "").strip()
        with connection() as conn, conn.cursor() as cursor:
            cursor.execute("UPDATE counsellor_bookings SET status = 'cancelled' WHERE id = %s", (booking_id,))
        return jsonify({"ok": True})
    data = request.get_json() or {}
    try:
        return jsonify(serialize_row(create_booking(data["client_id"], data))), 201
    except Exception as e:
        print(f"[Booking API Error] {e}")
        return jsonify({"error": "Booking could not be saved."}), 503


@app.route("/api/peer-messages", methods=["GET", "POST"])
def peer_messages():
    if request.method == "GET":
        room_id = request.args.get("room_id", "").strip()
        rows = fetch_all("SELECT * FROM peer_messages WHERE room_id = %s ORDER BY created_at DESC LIMIT 100", (room_id,))
        return jsonify([serialize_row(row) for row in rows])
    data = request.get_json() or {}
    if not all(data.get(field) for field in ("roomId", "clientId", "author", "content")):
        return jsonify({"error": "roomId, clientId, author, and content are required"}), 400
    try:
        return jsonify(serialize_row(create_peer_message(data["roomId"], data["clientId"], data["author"], data["content"].strip()))), 201
    except Exception as e:
        print(f"[Peer API Error] {e}")
        return jsonify({"error": "Peer message could not be saved."}), 503


# ─── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
