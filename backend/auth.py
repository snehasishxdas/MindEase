import hashlib
import hmac
import html
import json
import os
import re
import secrets
import smtplib
import uuid
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request, session
from psycopg2.extras import RealDictCursor
from werkzeug.security import check_password_hash

from database import connection, fetch_all, fetch_one

auth_bp = Blueprint("auth", __name__)


def _email(value):
    if not isinstance(value, str):
        return None
    email = (value or "").strip().lower()
    if len(email) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return None
    return email


def _profile_fields(data):
    if not isinstance(data, dict):
        return None
    full_name = (data.get("full_name") or "").strip()
    mobile = re.sub(r"[\s()-]", "", (data.get("mobile") or "").strip())
    try:
        birth_date = date.fromisoformat(data.get("date_of_birth", ""))
    except (TypeError, ValueError):
        return None
    if not 1 <= len(full_name) <= 100:
        return None
    if not re.fullmatch(r"\+?[0-9]{7,15}", mobile):
        return None
    if birth_date >= date.today():
        return None
    return {"full_name": full_name, "mobile": mobile, "date_of_birth": birth_date.isoformat()}


def _public_user(user):
    result = dict(user)
    for field in ("date_of_birth", "created_at"):
        value = result.get(field)
        if hasattr(value, "isoformat"):
            result[field] = value.isoformat()
    result.pop("activity_emails_enabled", None)
    return result


def _otp_digest(email, purpose, code):
    pepper = os.environ.get("OTP_PEPPER") or current_app.secret_key
    message = f"{email}:{purpose}:{code}".encode("utf-8")
    return hmac.new(str(pepper).encode("utf-8"), message, hashlib.sha256).hexdigest()


def _send_email(recipient, subject, heading, paragraphs, code=None):
    sender = os.environ.get("SMTP_EMAIL", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    if not sender or not password:
        raise RuntimeError("SMTP_EMAIL and SMTP_PASSWORD must be configured")

    safe_heading = html.escape(heading)
    safe_paragraphs = "".join(f"<p>{html.escape(text)}</p>" for text in paragraphs)
    code_block = (
        f'<div style="font-size:30px;font-weight:700;letter-spacing:6px;padding:18px;'
        f'background:#f2f7f5;border-radius:8px;text-align:center">{html.escape(code)}</div>'
        if code else ""
    )
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr(("MindEase", sender))
    message["To"] = recipient
    text_code = f"\nVerification code: {code}\n" if code else ""
    message.set_content(f"{heading}\n\n{' '.join(paragraphs)}{text_code}\nThank you for using MindEase.")
    message.add_alternative(
        "<!doctype html><html><body style=\"margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#17352e\">"
        "<main style=\"max-width:560px;margin:32px auto;padding:32px;background:white;border-radius:12px\">"
        "<div style=\"color:#21866b;font-weight:700\">MindEase</div>"
        f"<h1 style=\"font-size:24px\">{safe_heading}</h1>{safe_paragraphs}{code_block}"
        "<p style=\"margin-top:28px\">Thank you for using MindEase.</p></main></body></html>",
        subtype="html",
    )
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=15) as smtp:
        smtp.starttls()
        smtp.login(sender, password)
        smtp.send_message(message)


def _send_otp(email, purpose, payload=None):
    now = datetime.now(timezone.utc)
    code = f"{secrets.randbelow(1_000_000):06d}"
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"{email}:{purpose}",))
        cursor.execute(
            "SELECT sent_at FROM mindease_otp_challenges WHERE email = %s AND purpose = %s FOR UPDATE",
            (email, purpose),
        )
        existing = cursor.fetchone()
        if existing and now - existing[0] < timedelta(seconds=60):
            return False
        cursor.execute(
            """INSERT INTO mindease_otp_challenges
                   (email, purpose, otp_digest, payload, expires_at, sent_at, attempts)
               VALUES (%s, %s, %s, %s::jsonb, %s, %s, 0)
               ON CONFLICT (email, purpose) DO UPDATE SET
                   otp_digest = EXCLUDED.otp_digest,
                   payload = EXCLUDED.payload,
                   expires_at = EXCLUDED.expires_at,
                   sent_at = EXCLUDED.sent_at,
                   attempts = 0""",
            (email, purpose, _otp_digest(email, purpose, code), json.dumps(payload or {}),
             now + timedelta(minutes=10), now),
        )

    purpose_text = {
        "register": "Complete your MindEase registration",
        "login": "Sign in to MindEase",
        "profile": "Confirm your account detail update",
        "delete": "Confirm your account deletion",
    }.get(purpose, "Verify your MindEase account")
    _send_email(email, "Your MindEase verification code", purpose_text,
                ["Use this one-time code to continue. It expires in 10 minutes. If you did not request it, you can ignore this email."], code)
    return True


def _consume_otp(email, purpose, code):
    now = datetime.now(timezone.utc)
    with connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            """SELECT otp_digest, payload, expires_at, attempts
               FROM mindease_otp_challenges WHERE email = %s AND purpose = %s FOR UPDATE""",
            (email, purpose),
        )
        challenge = cursor.fetchone()
        if not challenge:
            return None
        if challenge["expires_at"] <= now or challenge["attempts"] >= 5:
            cursor.execute("DELETE FROM mindease_otp_challenges WHERE email = %s AND purpose = %s", (email, purpose))
            return None
        expected = challenge["otp_digest"]
        supplied = _otp_digest(email, purpose, str(code or ""))
        if not hmac.compare_digest(expected, supplied):
            cursor.execute(
                "UPDATE mindease_otp_challenges SET attempts = attempts + 1 WHERE email = %s AND purpose = %s",
                (email, purpose),
            )
            return None
        cursor.execute("DELETE FROM mindease_otp_challenges WHERE email = %s AND purpose = %s", (email, purpose))
        return challenge["payload"]


def record_activity(user_id, event_type, summary, email_user=True):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO mindease_activity (id, user_id, event_type, summary) VALUES (%s, %s, %s, %s)",
            (str(uuid.uuid4()), str(user_id), event_type, summary),
        )
    if email_user:
        user = fetch_one("SELECT full_name, email, activity_emails_enabled FROM mindease_users WHERE id = %s", (str(user_id),))
        if user and user["activity_emails_enabled"]:
            try:
                _send_email(user["email"], "MindEase account activity", "Activity on your account",
                            [f"Hello {user['full_name']},", summary,
                             f"Recorded at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}.",
                             "If this was not you, sign in and secure your account."])
            except Exception as error:
                current_app.logger.error("Could not send activity email: %s", error)


def user_required(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        if session.get("role") != "user" or not session.get("user_id"):
            return jsonify({"error": "Please sign in to continue."}), 401
        user = fetch_one(
            """SELECT id, full_name, email, mobile, date_of_birth, activity_emails_enabled, created_at
               FROM mindease_users WHERE id = %s""",
            (session["user_id"],),
        )
        if not user:
            session.clear()
            return jsonify({"error": "Please sign in to continue."}), 401
        g.current_user = user
        return function(*args, **kwargs)
    return wrapped


def _admin_is_rate_limited(email):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            "SELECT attempts, window_started_at FROM mindease_admin_attempts WHERE email = %s FOR UPDATE",
            (email,),
        )
        row = cursor.fetchone()
        if not row:
            return False
        if datetime.now(timezone.utc) - row[1] >= timedelta(minutes=15):
            cursor.execute("DELETE FROM mindease_admin_attempts WHERE email = %s", (email,))
            return False
        return row[0] >= 5


def _record_admin_failure(email):
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            """INSERT INTO mindease_admin_attempts (email, attempts, window_started_at)
               VALUES (%s, 1, NOW())
               ON CONFLICT (email) DO UPDATE SET
                   attempts = CASE WHEN mindease_admin_attempts.window_started_at < NOW() - INTERVAL '15 minutes'
                                   THEN 1 ELSE mindease_admin_attempts.attempts + 1 END,
                   window_started_at = CASE WHEN mindease_admin_attempts.window_started_at < NOW() - INTERVAL '15 minutes'
                                            THEN NOW() ELSE mindease_admin_attempts.window_started_at END""",
            (email,),
        )


def admin_required(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        if session.get("role") != "admin":
            return jsonify({"error": "Administrator access required."}), 403
        return function(*args, **kwargs)
    return wrapped


@auth_bp.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    email = _email(data.get("email"))
    profile = _profile_fields(data)
    if not email or not profile:
        return jsonify({"error": "Enter a valid email and complete name, mobile number, and date of birth."}), 400
    profile["activity_emails_enabled"] = data.get("activity_emails_enabled") is True
    if email == _email(os.environ.get("ADMIN_EMAIL")):
        return jsonify({"error": "This email is reserved for administrator access."}), 409
    if fetch_one("SELECT id FROM mindease_users WHERE email = %s", (email,)):
        return jsonify({"error": "An account already exists for this email. Sign in instead."}), 409
    try:
        if not _send_otp(email, "register", profile):
            return jsonify({"error": "Wait one minute before requesting another code."}), 429
    except Exception as error:
        current_app.logger.error("Registration email failed: %s", error)
        return jsonify({"error": "We could not send a verification code. Check email settings and try again."}), 503
    return jsonify({"ok": True, "message": "Check your email for a verification code."})


@auth_bp.post("/api/auth/register/verify")
def register_verify():
    data = request.get_json() or {}
    email = _email(data.get("email"))
    if not email:
        return jsonify({"error": "Invalid verification request."}), 400
    payload = _consume_otp(email, "register", data.get("otp"))
    if not payload:
        return jsonify({"error": "The code is invalid or expired. Request a new one."}), 400
    user_id = str(uuid.uuid4())
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            """INSERT INTO mindease_users
                   (id, full_name, email, mobile, date_of_birth, activity_emails_enabled)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (user_id, payload["full_name"], email, payload["mobile"], payload["date_of_birth"],
             payload.get("activity_emails_enabled", False)),
        )
    session.clear()
    session["user_id"] = user_id
    session["role"] = "user"
    session.permanent = True
    record_activity(user_id, "account_created", "Your MindEase account was created.", email_user=False)
    try:
        _send_email(email, "Welcome to MindEase", "Your account is ready",
                    [f"Hello {payload['full_name']},", "Your email has been verified and your account is ready to use."])
    except Exception as error:
        current_app.logger.error("Welcome email failed: %s", error)
    return jsonify({"ok": True})


@auth_bp.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = _email(data.get("email"))
    if not email:
        return jsonify({"error": "Enter a valid email address."}), 400
    if fetch_one("SELECT id FROM mindease_users WHERE email = %s", (email,)):
        try:
            _send_otp(email, "login")
        except Exception as error:
            current_app.logger.error("Login email failed: %s", error)
    return jsonify({"ok": True, "message": "If an account exists, a sign-in code has been sent."})


@auth_bp.post("/api/auth/login/verify")
def login_verify():
    data = request.get_json() or {}
    email = _email(data.get("email"))
    if not email:
        return jsonify({"error": "The code is invalid or expired."}), 400
    payload = _consume_otp(email, "login", data.get("otp"))
    user = fetch_one("SELECT id, full_name FROM mindease_users WHERE email = %s", (email,)) if payload is not None else None
    if not user:
        return jsonify({"error": "The code is invalid or expired."}), 400
    session.clear()
    session["user_id"] = str(user["id"])
    session["role"] = "user"
    session.permanent = True
    record_activity(user["id"], "login", "You signed in to MindEase.")
    return jsonify({"ok": True})


@auth_bp.post("/api/auth/admin/login")
def admin_login():
    data = request.get_json() or {}
    email = _email(data.get("email"))
    admin_email = _email(os.environ.get("ADMIN_EMAIL"))
    password_hash = os.environ.get("ADMIN_PASSWORD_HASH", "")
    if not admin_email or not password_hash:
        return jsonify({"error": "Administrator credentials are not configured."}), 503
    if not email or email != admin_email:
        return jsonify({"error": "Invalid administrator credentials."}), 401
    if _admin_is_rate_limited(email):
        return jsonify({"error": "Too many attempts. Try again in 15 minutes."}), 429
    try:
        password_valid = check_password_hash(password_hash, data.get("password", ""))
    except (TypeError, ValueError):
        password_valid = False
    if not password_valid:
        _record_admin_failure(email)
        return jsonify({"error": "Invalid administrator credentials."}), 401
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("DELETE FROM mindease_admin_attempts WHERE email = %s", (email,))
    try:
        _send_email(admin_email, "MindEase administrator sign-in", "Administrator sign-in detected",
                    ["An administrator signed in to the MindEase account portal."])
    except Exception as error:
        current_app.logger.error("Admin sign-in notification failed: %s", error)
        return jsonify({"error": "The sign-in alert could not be sent. Try again after checking mail settings."}), 503
    session.clear()
    session["role"] = "admin"
    session.permanent = True
    return jsonify({"ok": True})


@auth_bp.get("/api/auth/me")
def auth_me():
    if session.get("role") == "admin":
        return jsonify({"role": "admin", "user": None})
    user_id = session.get("user_id")
    if not user_id or session.get("role") != "user":
        return jsonify({"role": None, "user": None})
    user = fetch_one(
        """SELECT id, full_name, email, mobile, date_of_birth, created_at
           FROM mindease_users WHERE id = %s""",
        (user_id,),
    )
    return jsonify({"role": "user", "user": _public_user(user)}) if user else jsonify({"role": None, "user": None})


@auth_bp.post("/api/auth/logout")
def auth_logout():
    if session.get("role") == "user" and session.get("user_id"):
        record_activity(session["user_id"], "logout", "You signed out of MindEase.")
    session.clear()
    return jsonify({"ok": True})


@auth_bp.post("/api/auth/profile/request")
@user_required
def profile_request():
    data = request.get_json() or {}
    profile = _profile_fields(data)
    if not profile:
        return jsonify({"error": "Enter a valid name, mobile number, and date of birth."}), 400
    try:
        if not _send_otp(g.current_user["email"], "profile", profile):
            return jsonify({"error": "Wait one minute before requesting another code."}), 429
    except Exception as error:
        current_app.logger.error("Profile verification email failed: %s", error)
        return jsonify({"error": "We could not send a verification code."}), 503
    return jsonify({"ok": True, "message": "Check your registered email for a verification code."})


@auth_bp.post("/api/auth/profile/verify")
@user_required
def profile_verify():
    user = g.current_user
    payload = _consume_otp(user["email"], "profile", (request.get_json() or {}).get("otp"))
    if not payload:
        return jsonify({"error": "The code is invalid or expired."}), 400
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            """UPDATE mindease_users SET full_name = %s, mobile = %s, date_of_birth = %s, updated_at = NOW()
               WHERE id = %s""",
            (payload["full_name"], payload["mobile"], payload["date_of_birth"], str(user["id"])),
        )
    record_activity(user["id"], "profile_updated", "Your account details were updated after email verification.")
    return jsonify({"ok": True})


@auth_bp.post("/api/auth/delete/request")
@user_required
def delete_request():
    try:
        if not _send_otp(g.current_user["email"], "delete"):
            return jsonify({"error": "Wait one minute before requesting another code."}), 429
    except Exception as error:
        current_app.logger.error("Deletion verification email failed: %s", error)
        return jsonify({"error": "We could not send a verification code."}), 503
    return jsonify({"ok": True, "message": "Check your registered email for a verification code."})


@auth_bp.post("/api/auth/delete/verify")
@user_required
def delete_verify():
    user = g.current_user
    payload = _consume_otp(user["email"], "delete", (request.get_json() or {}).get("otp"))
    if payload is None:
        return jsonify({"error": "The code is invalid or expired."}), 400
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("DELETE FROM mindease_users WHERE id = %s", (str(user["id"]),))
    session.clear()
    try:
        _send_email(user["email"], "MindEase account deleted", "Your account has been deleted",
                    [f"Hello {user['full_name']},", "Your MindEase account and associated account data have been permanently deleted."])
    except Exception as error:
        current_app.logger.error("Deletion confirmation email failed: %s", error)
    return jsonify({"ok": True})


@auth_bp.get("/api/activity")
@user_required
def activity():
    rows = fetch_all(
        """SELECT event_type, summary, created_at FROM mindease_activity
           WHERE user_id = %s ORDER BY created_at DESC LIMIT 100""",
        (str(g.current_user["id"]),),
    )
    return jsonify([{"event": row["event_type"], "summary": row["summary"],
                     "created_at": row["created_at"].isoformat()} for row in rows])


@auth_bp.post("/api/activity/page-view")
@user_required
def activity_page_view():
    data = request.get_json() or {}
    page_names = {
        "/": "Home",
        "/mood": "Mood check-in",
        "/journal": "Private journal",
        "/resources": "Self-help resources",
        "/peer-rooms": "Peer support rooms",
        "/peer-room": "Peer support rooms",
        "/peerrooms": "Peer support rooms",
        "/peerroom": "Peer support rooms",
        "/rooms": "Peer support rooms",
        "/counsellor": "Counsellor booking",
        "/counselor": "Counsellor booking",
        "/booking": "Counsellor booking",
        "/campus-insights": "Campus insights",
        "/insights": "Campus insights",
        "/exam-insights": "Campus insights",
        "/checkin": "Mood check-in",
        "/self-help": "Self-help resources",
        "/account": "Account and activity",
    }
    page_name = page_names.get(data.get("path"))
    if not page_name:
        return jsonify({"error": "Unknown page."}), 400
    record_activity(g.current_user["id"], "page_view", f"Viewed {page_name}.")
    return jsonify({"ok": True}), 201


@auth_bp.get("/api/admin/users")
@admin_required
def admin_users():
    rows = fetch_all(
        """SELECT id, full_name, email, mobile, date_of_birth, created_at
           FROM mindease_users ORDER BY created_at DESC"""
    )
    return jsonify([_public_user(row) for row in rows])


@auth_bp.put("/api/admin/users/<user_id>")
@admin_required
def admin_update_user(user_id):
    try:
        user_id = str(uuid.UUID(user_id))
    except (ValueError, AttributeError):
        return jsonify({"error": "Account not found."}), 404
    data = request.get_json() or {}
    profile = _profile_fields(data)
    if not profile:
        return jsonify({"error": "Enter a valid name, mobile number, and date of birth."}), 400
    user = fetch_one("SELECT id, email, full_name FROM mindease_users WHERE id = %s", (user_id,))
    if not user:
        return jsonify({"error": "Account not found."}), 404
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(
            """UPDATE mindease_users SET full_name = %s, mobile = %s, date_of_birth = %s, updated_at = NOW()
               WHERE id = %s""",
            (profile["full_name"], profile["mobile"], profile["date_of_birth"], user_id),
        )
    try:
        _send_email(user["email"], "MindEase account details updated", "Your account details were updated",
                    [f"Hello {profile['full_name']},", "An administrator updated your name, mobile number, or date of birth. Your email address was not changed."])
    except Exception as error:
        current_app.logger.error("Account update email failed: %s", error)
    record_activity(user_id, "admin_profile_updated", "An administrator updated your account details.", email_user=False)
    return jsonify({"ok": True})


@auth_bp.delete("/api/admin/users/<user_id>")
@admin_required
def admin_delete_user(user_id):
    try:
        user_id = str(uuid.UUID(user_id))
    except (ValueError, AttributeError):
        return jsonify({"error": "Account not found."}), 404
    user = fetch_one("SELECT id, email, full_name FROM mindease_users WHERE id = %s", (user_id,))
    if not user:
        return jsonify({"error": "Account not found."}), 404
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("DELETE FROM mindease_users WHERE id = %s", (user_id,))
    try:
        _send_email(user["email"], "MindEase account deleted", "Your account has been deleted",
                    [f"Hello {user['full_name']},", "An administrator permanently deleted your MindEase account and associated account data."])
    except Exception as error:
        current_app.logger.error("Admin deletion email failed: %s", error)
    return jsonify({"ok": True})