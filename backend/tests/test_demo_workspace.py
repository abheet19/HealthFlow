"""Guards for the isolated, read-only sample workspace."""

import unittest

from app import demo
from app.access import WorkspaceIdentity


class DemoWorkspaceTests(unittest.TestCase):
    def test_demo_identity_is_reserved_and_not_a_real_clinic(self):
        self.assertEqual(demo.DEMO_IDENTITY, WorkspaceIdentity("sample-demo", "demo-viewer"))
        self.assertTrue(demo.is_demo_identity(demo.DEMO_IDENTITY))
        self.assertFalse(demo.is_demo_identity(WorkspaceIdentity("clinic-a", "alice")))
        self.assertFalse(demo.is_demo_identity(None))

    def test_demo_is_only_entered_on_explicit_opt_in(self):
        self.assertTrue(demo.is_demo_requested({"X-HealthFlow-Demo": "1"}))
        self.assertFalse(demo.is_demo_requested({"X-HealthFlow-Demo": "0"}))
        self.assertFalse(demo.is_demo_requested({}))

    def test_sample_list_is_synthetic_and_labelled(self):
        patients = demo.demo_patient_list()
        self.assertTrue(patients)
        for patient in patients:
            self.assertTrue(patient["patientId"].startswith("PID-SAMPLE-"))
            self.assertIn("Sample", patient["name"])

    def test_sample_report_lookup_is_bounded_to_fixtures(self):
        first = demo.demo_patient_list()[0]["patientId"]
        record = demo.demo_patient_record(first)
        self.assertIsNotNone(record)
        self.assertEqual(record["pid"], first)
        self.assertEqual(record["clinic_id"], "sample-demo")
        self.assertIsNone(demo.demo_patient_record("PID-DOES-NOT-EXIST"))


if __name__ == "__main__":
    unittest.main()
