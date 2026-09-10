"""Regression checks for the persisted clinic boundary."""

import unittest

from app.services import patient_service


class FakeResult:
    def __iter__(self):
        return iter(())

    def fetchone(self):
        return None


class RecordingDatabase:
    def __init__(self):
        self.calls = []

    def execute(self, query, params=None):
        self.calls.append((str(query), params))
        return FakeResult()


class PatientScopeTests(unittest.TestCase):
    def test_patient_list_is_filtered_by_authenticated_clinic(self):
        database = RecordingDatabase()

        patient_service.get_patients(database, "clinic-a")

        query, params = database.calls[0]
        self.assertIn("WHERE clinic_id = :clinic_id", query)
        self.assertEqual(params, {"clinic_id": "clinic-a"})

    def test_report_lookup_requires_both_patient_and_clinic(self):
        database = RecordingDatabase()

        patient_service.get_patient_by_id(database, "PID-1", "clinic-b")

        query, params = database.calls[0]
        self.assertIn("pid = :pid AND clinic_id = :clinic_id", query)
        self.assertEqual(params, {"pid": "PID-1", "clinic_id": "clinic-b"})


if __name__ == "__main__":
    unittest.main()
