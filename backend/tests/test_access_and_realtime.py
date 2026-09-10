"""Authentication and cross-clinic Socket.IO isolation regressions."""

import unittest

from flask import Flask
from flask_socketio import SocketIO

from app.access import AccessConfigurationError, WorkspaceAccessRegistry, WorkspaceIdentity
from app.realtime import register_realtime_handlers


class WorkspaceAccessTests(unittest.TestCase):
    def test_multi_clinic_credentials_are_exact_and_fail_closed(self):
        registry = WorkspaceAccessRegistry.from_environment(
            {
                "HEALTHFLOW_IDENTITIES_JSON": (
                    '{"clinic-a":{"alice":"secret-a","bob":"secret-b"},'
                    '"clinic-b":{"alice":"secret-c"}}'
                )
            }
        )

        self.assertEqual(
            registry.authenticate("secret-a", "clinic-a", "alice"),
            WorkspaceIdentity("clinic-a", "alice"),
        )
        self.assertIsNone(registry.authenticate("secret-a", "clinic-b", "alice"))
        self.assertIsNone(registry.authenticate("secret-a", "clinic-a", "bob"))
        self.assertIsNone(registry.authenticate("secret-a", "clinic-a", "unknown"))

    def test_legacy_demo_code_maps_only_to_its_configured_identity(self):
        registry = WorkspaceAccessRegistry.from_environment(
            {
                "HEALTHFLOW_ACCESS_CODE": "demo-secret",
                "HEALTHFLOW_DEFAULT_CLINIC_ID": "demo",
                "HEALTHFLOW_DEFAULT_USER_ID": "demo-user",
            }
        )

        self.assertEqual(
            registry.authenticate("demo-secret"),
            WorkspaceIdentity("demo", "demo-user"),
        )
        self.assertIsNone(registry.authenticate("demo-secret", "another-clinic", "demo-user"))

    def test_invalid_identity_configuration_is_rejected_at_startup(self):
        with self.assertRaises(AccessConfigurationError):
            WorkspaceAccessRegistry.from_environment(
                {"HEALTHFLOW_IDENTITIES_JSON": '{"clinic/a":{"user":"secret"}}'}
            )


class RealtimeIsolationTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["TESTING"] = True
        self.socketio = SocketIO(self.app, async_mode="threading")
        self.registry = WorkspaceAccessRegistry.from_environment(
            {
                "HEALTHFLOW_IDENTITIES_JSON": (
                    '{"clinic-a":{"alice":"secret-a","bob":"secret-b"},'
                    '"clinic-b":{"alice":"secret-c"}}'
                )
            }
        )
        register_realtime_handlers(self.socketio, self.registry)

    def connect(self, clinic_id: str, user_id: str, access_code: str):
        return self.socketio.test_client(
            self.app,
            auth={"clinicId": clinic_id, "userId": user_id, "accessCode": access_code},
        )

    @staticmethod
    def event_names(client) -> list[str]:
        return [packet["name"] for packet in client.get_received()]

    def test_all_realtime_mutations_stay_in_authenticated_clinic(self):
        clinic_a_sender = self.connect("clinic-a", "alice", "secret-a")
        clinic_a_peer = self.connect("clinic-a", "bob", "secret-b")
        clinic_b_peer = self.connect("clinic-b", "alice", "secret-c")
        self.event_names(clinic_a_sender)
        self.event_names(clinic_a_peer)
        self.event_names(clinic_b_peer)

        cases = (
            ("newPatientId", "PID-TEST", True),
            ("resetPatientData", None, True),
            ("photoDelete", None, True),
            ("photoUpdate", {"photo": "data:image/jpeg;base64,AA==", "photoFileName": "test.jpg"}, False),
            ("departmentUpdate", {"ent": {"isSubmitted": True}}, False),
        )
        for event, payload, includes_sender in cases:
            with self.subTest(event=event):
                acknowledgement = (
                    clinic_a_sender.emit(event, callback=True)
                    if payload is None
                    else clinic_a_sender.emit(event, payload, callback=True)
                )
                sender_events = self.event_names(clinic_a_sender)
                same_clinic_events = self.event_names(clinic_a_peer)
                other_clinic_events = self.event_names(clinic_b_peer)

                self.assertEqual(acknowledgement, {"ok": True})
                self.assertEqual(event in sender_events, includes_sender)
                self.assertIn(event, same_clinic_events)
                self.assertNotIn(event, other_clinic_events)

    def test_user_rooms_support_private_delivery(self):
        alice = self.connect("clinic-a", "alice", "secret-a")
        bob = self.connect("clinic-a", "bob", "secret-b")
        self.event_names(alice)
        self.event_names(bob)

        self.socketio.emit("privateNotice", {"message": "alice only"}, to="user:clinic-a:alice")

        self.assertIn("privateNotice", self.event_names(alice))
        self.assertNotIn("privateNotice", self.event_names(bob))

    def test_wrong_clinic_credential_cannot_connect(self):
        client = self.connect("clinic-b", "alice", "secret-a")
        self.assertFalse(client.is_connected())

    def test_invalid_mutation_is_rejected_without_broadcast(self):
        sender = self.connect("clinic-a", "alice", "secret-a")
        peer = self.connect("clinic-a", "bob", "secret-b")
        self.event_names(sender)
        self.event_names(peer)

        acknowledgement = sender.emit(
            "departmentUpdate",
            {"clinicId": "clinic-b", "ent": {}},
            callback=True,
        )

        self.assertEqual(acknowledgement, {"error": "Invalid department update."})
        self.assertNotIn("departmentUpdate", self.event_names(peer))


if __name__ == "__main__":
    unittest.main()
