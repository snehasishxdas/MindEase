import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("SESSION_SECRET", "test-only-session-secret")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app


class FeatureAccessTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_all_personal_feature_routes_reject_anonymous_requests(self):
        requests = [
            ("POST", "/api/vent"),
            ("POST", "/api/resilience"),
            ("POST", "/api/quiz-score"),
            ("POST", "/api/sentiment"),
            ("GET", "/api/moods"),
            ("POST", "/api/moods"),
            ("GET", "/api/journals"),
            ("POST", "/api/journals"),
            ("DELETE", "/api/journals?id=entry-id"),
            ("GET", "/api/bookings"),
            ("POST", "/api/bookings"),
            ("DELETE", "/api/bookings?id=booking-id"),
            ("GET", "/api/peer-messages?room_id=room-id"),
            ("POST", "/api/peer-messages"),
        ]
        for method, path in requests:
            with self.subTest(method=method, path=path):
                response = self.client.open(path, method=method, json={})
                self.assertEqual(response.status_code, 401)

    def test_admin_cannot_call_user_features_and_user_cannot_list_accounts(self):
        with self.client.session_transaction() as current_session:
            current_session["role"] = "admin"
        self.assertEqual(self.client.get("/api/moods").status_code, 401)

        with self.client.session_transaction() as current_session:
            current_session.clear()
            current_session["role"] = "user"
            current_session["user_id"] = "untrusted-session-id"
        self.assertEqual(self.client.get("/api/admin/users").status_code, 403)


if __name__ == "__main__":
    unittest.main()