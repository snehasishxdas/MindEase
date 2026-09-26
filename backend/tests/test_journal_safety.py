import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ.setdefault("SESSION_SECRET", "test-only-session-secret")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as server_app
import auth
from burnout import assess_journal


USER = {
    "id": "482dd933-bdde-41ee-ae8e-7858c20c0d30",
    "full_name": "Test User",
    "email": "user@example.com",
    "mobile": "+15551234567",
    "date_of_birth": "2000-01-01",
    "activity_emails_enabled": False,
}


class JournalSafetyTests(unittest.TestCase):
    def setUp(self):
        self.client = server_app.app.test_client()
        with self.client.session_transaction() as current_session:
            current_session["role"] = "user"
            current_session["user_id"] = USER["id"]

    def test_burnout_screen_reports_multiple_signals_as_high(self):
        result = assess_journal("I'm exhausted, emotionally numb, and can't focus.")
        self.assertEqual(result["burnout_level"], "high")
        self.assertEqual(len(result["burnout_signals"]), 3)

    def test_self_harm_screen_distinguishes_negation_and_concern(self):
        self.assertFalse(assess_journal("I am not suicidal and don't want to hurt myself.")["self_harm_concern"])
        self.assertTrue(assess_journal("I want to hurt myself tonight.")["self_harm_concern"])
        self.assertTrue(assess_journal("I'm not suicidal, but I want to die.")["self_harm_concern"])

    def test_journal_screen_sends_admin_alert_without_journal_text(self):
        journal_text = "I want to hurt myself tonight."
        saved_row = {"id": "entry-id", "content": journal_text, "created_at": "2026-09-26T00:00:00+00:00"}
        with patch.object(auth, "fetch_one", return_value=USER), \
             patch.object(server_app, "create_journal", return_value=saved_row), \
             patch.object(server_app, "record_activity"), \
             patch.object(server_app, "send_safety_alert") as send_alert:
            response = self.client.post("/api/journals", json={"content": journal_text})

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.get_json()["screening"]["self_harm_concern"])
        self.assertTrue(response.get_json()["screening"]["admin_notified"])
        send_alert.assert_called_once_with(USER)
        self.assertNotIn(journal_text, str(send_alert.call_args))

    def test_alert_failure_does_not_prevent_journal_save(self):
        with patch.object(auth, "fetch_one", return_value=USER), \
             patch.object(server_app, "create_journal", return_value={"id": "entry-id"}), \
             patch.object(server_app, "record_activity"), \
             patch.object(server_app, "send_safety_alert", side_effect=RuntimeError("mail unavailable")):
            response = self.client.post("/api/journals", json={"content": "I want to die."})

        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.get_json()["screening"]["admin_notified"])

    def test_safety_email_contains_account_contact_but_no_journal_content(self):
        with patch.dict(os.environ, {"ADMIN_EMAIL": "admin@example.com"}), \
             patch.object(auth, "_send_email") as send_email:
            auth.send_safety_alert(USER)

        self.assertEqual(send_email.call_args.args[0], "admin@example.com")
        email_body = str(send_email.call_args.args)
        self.assertIn(USER["email"], email_body)
        self.assertIn("journal text is intentionally not included", email_body)
        self.assertNotIn("I want to hurt myself", email_body)


if __name__ == "__main__":
    unittest.main()