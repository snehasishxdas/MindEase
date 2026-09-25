import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq_client import ask_groq
from superbase_client import log_vent, log_resilience, log_quiz_score

load_dotenv()

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app = Flask(__name__, template_folder=frontend_dir, static_folder=os.path.join(frontend_dir, "static"))
CORS(app)

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


# ─── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
