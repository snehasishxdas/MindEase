import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import superbase_client


class WellnessPersistenceTests(unittest.TestCase):
    def test_wellness_logs_write_to_postgres(self):
        cases = [
            (superbase_client.log_vent, ("user-id", "text", "response"), "vent_logs"),
            (superbase_client.log_resilience, ("user-id", "scenario", "answer", "feedback"), "resilience_logs"),
            (superbase_client.log_quiz_score, ("user-id", 3, 5), "quiz_scores"),
        ]

        for log_function, arguments, table in cases:
            with self.subTest(table=table), patch.object(superbase_client, "fetch_one") as fetch_one:
                log_function(*arguments)
                query = fetch_one.call_args.args[0]
                self.assertIn(f"INSERT INTO {table}", query)
                self.assertIn("RETURNING id", query)
                self.assertEqual(len(fetch_one.call_args.args[1]), len(arguments) + 1)

    def test_database_errors_are_not_silently_discarded(self):
        with patch.object(superbase_client, "fetch_one", side_effect=RuntimeError("database unavailable")):
            with self.assertRaisesRegex(RuntimeError, "database unavailable"):
                superbase_client.log_quiz_score("user-id", 3, 5)


if __name__ == "__main__":
    unittest.main()