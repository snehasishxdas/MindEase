import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from flask import Flask
from werkzeug.security import generate_password_hash

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import auth


USER_ID = "482dd933-bdde-41ee-ae8e-7858c20c0d30"
USER = {
    "id": USER_ID,
    "full_name": "Test User",
    "email": "user@example.com",
    "mobile": "+15551234567",
    "date_of_birth": "2000-01-01",
    "activity_emails_enabled": False,
}


class _FakeCursor:
    rowcount = 1

    def __init__(self, statements):
        self.statements = statements

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def execute(self, query, params=None):
        self.query = query
        self.params = params
        self.statements.append((query, params))


class _FakeConnection:
    def __init__(self):
        self.statements = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def cursor(self, *args, **kwargs):
        return _FakeCursor(self.statements)


class AuthRouteTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.secret_key = "test-session-secret"
        self.app.register_blueprint(auth.auth_bp)
        self.client = self.app.test_client()

    def sign_in_user(self):
        with self.client.session_transaction() as current_session:
            current_session["role"] = "user"
            current_session["user_id"] = USER_ID

    def test_feature_and_admin_apis_reject_anonymous_requests(self):
        self.assertEqual(self.client.get("/api/activity").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/users").status_code, 403)

    def test_activity_query_uses_session_user_id(self):
        self.sign_in_user()
        query_params = []
        with patch.object(auth, "fetch_one", return_value=USER), patch.object(
            auth, "fetch_all", side_effect=lambda query, params: query_params.append(params) or []
        ):
            response = self.client.get("/api/activity")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(query_params, [(USER_ID,)])

    def test_page_view_records_only_an_allowlisted_page_name(self):
        self.sign_in_user()
        with patch.object(auth, "fetch_one", return_value=USER), patch.object(auth, "record_activity") as record:
            response = self.client.post("/api/activity/page-view", json={"path": "/journal?private=text"})
            self.assertEqual(response.status_code, 400)
            response = self.client.post("/api/activity/page-view", json={"path": "/journal"})
        self.assertEqual(response.status_code, 201)
        record.assert_called_once_with(USER_ID, "page_view", "Viewed Private journal.")

    def test_login_does_not_disclose_unknown_email(self):
        with patch.object(auth, "fetch_one", return_value=None), patch.object(auth, "_send_otp") as send_otp:
            response = self.client.post("/api/auth/login", json={"email": "unknown@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("If an account exists", response.get_json()["message"])
        send_otp.assert_not_called()

    def test_registration_verification_creates_account_and_session(self):
        pending_profile = {
            "full_name": "Test User",
            "mobile": "+15551234567",
            "date_of_birth": "2000-01-01",
            "activity_emails_enabled": True,
        }
        fake_connection = _FakeConnection()
        with patch.object(auth, "_consume_otp", return_value=pending_profile), \
             patch.object(auth, "connection", return_value=fake_connection), \
             patch.object(auth, "record_activity"), patch.object(auth, "_send_email"):
            response = self.client.post("/api/auth/register/verify", json={
                "email": "USER@example.com", "otp": "012345",
            })
            with self.client.session_transaction() as current_session:
                role = current_session.get("role")
                user_id = current_session.get("user_id")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(role, "user")
        self.assertTrue(user_id)
        self.assertEqual(fake_connection.statements[0][1][5], True)

    def test_user_login_verification_sets_a_fresh_session(self):
        with patch.object(auth, "_consume_otp", return_value={}), \
             patch.object(auth, "fetch_one", return_value=USER), patch.object(auth, "record_activity"):
            response = self.client.post("/api/auth/login/verify", json={
                "email": USER["email"], "otp": "012345",
            })
            with self.client.session_transaction() as current_session:
                role = current_session.get("role")
                permanent = current_session.permanent
        self.assertEqual(response.status_code, 200)
        self.assertEqual(role, "user")
        self.assertTrue(permanent)

    def test_empty_payload_deletion_otp_is_valid(self):
        self.sign_in_user()
        with patch.object(auth, "fetch_one", return_value=USER), patch.object(auth, "_consume_otp", return_value={}), \
             patch.object(auth, "connection", return_value=_FakeConnection()), patch.object(auth, "_send_email"):
            response = self.client.post("/api/auth/delete/verify", json={"otp": "012345"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"ok": True})

    def test_admin_login_sets_admin_role_and_sends_alert(self):
        password_hash = generate_password_hash("not-a-production-password")
        with patch.dict(os.environ, {"ADMIN_EMAIL": "admin@example.com", "ADMIN_PASSWORD_HASH": password_hash}), \
             patch.object(auth, "_admin_is_rate_limited", return_value=False), \
             patch.object(auth, "connection", return_value=_FakeConnection()), \
             patch.object(auth, "_send_email") as send_email:
            response = self.client.post("/api/auth/admin/login", json={
                "email": "admin@example.com",
                "password": "not-a-production-password",
            })
            with self.client.session_transaction() as current_session:
                role = current_session.get("role")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(role, "admin")
        send_email.assert_called_once()

    def test_admin_login_reports_malformed_password_hash_as_configuration_error(self):
        with patch.dict(os.environ, {"ADMIN_EMAIL": "admin@example.com", "ADMIN_PASSWORD_HASH": "invalid"}), \
             patch.object(auth, "_admin_is_rate_limited", return_value=False):
            response = self.client.post("/api/auth/admin/login", json={
                "email": "admin@example.com",
                "password": "any-password",
            })
        self.assertEqual(response.status_code, 503)
        self.assertIn("misconfigured", response.get_json()["error"])

    def test_admin_login_fails_closed_when_alert_cannot_be_sent(self):
        password_hash = generate_password_hash("not-a-production-password")
        with patch.dict(os.environ, {"ADMIN_EMAIL": "admin@example.com", "ADMIN_PASSWORD_HASH": password_hash}), \
             patch.object(auth, "_admin_is_rate_limited", return_value=False), \
             patch.object(auth, "connection", return_value=_FakeConnection()), \
             patch.object(auth, "_send_email", side_effect=RuntimeError("mail unavailable")):
            response = self.client.post("/api/auth/admin/login", json={
                "email": "admin@example.com",
                "password": "not-a-production-password",
            })
            with self.client.session_transaction() as current_session:
                role = current_session.get("role")
        self.assertEqual(response.status_code, 503)
        self.assertIsNone(role)

    def test_admin_profile_update_preserves_email_skips_otp_and_notifies_user(self):
        with self.client.session_transaction() as current_session:
            current_session["role"] = "admin"
        fake_connection = _FakeConnection()
        with patch.object(auth, "fetch_one", return_value=USER), \
             patch.object(auth, "connection", return_value=fake_connection), \
             patch.object(auth, "_send_email") as send_email, \
             patch.object(auth, "_consume_otp") as consume_otp, \
             patch.object(auth, "record_activity"):
            response = self.client.put(f"/api/admin/users/{USER_ID}", json={
                "full_name": "Updated User",
                "email": "changed@example.com",
                "mobile": "+15557654321",
                "date_of_birth": "2001-02-03",
            })
        self.assertEqual(response.status_code, 200)
        query, params = fake_connection.statements[0]
        self.assertNotIn("email =", query)
        self.assertEqual(params, ("Updated User", "+15557654321", "2001-02-03", USER_ID))
        self.assertEqual(send_email.call_args.args[0], USER["email"])
        consume_otp.assert_not_called()

    def test_admin_profile_update_reports_notification_failure(self):
        with self.client.session_transaction() as current_session:
            current_session["role"] = "admin"
        with patch.object(auth, "fetch_one", return_value=USER), \
             patch.object(auth, "connection", return_value=_FakeConnection()), \
             patch.object(auth, "_send_email", side_effect=RuntimeError("mail unavailable")):
            response = self.client.put(f"/api/admin/users/{USER_ID}", json={
                "full_name": "Updated User",
                "mobile": USER["mobile"],
                "date_of_birth": "2000-01-01",
            })
        self.assertEqual(response.status_code, 503)
        self.assertIn("account was updated", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()