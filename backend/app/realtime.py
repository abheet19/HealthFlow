"""Clinic-scoped Socket.IO handlers.

Room membership is derived from a server-validated handshake. Event payloads
never select their own destination room, which prevents a connected client
from publishing into another clinic by changing message data.
"""

from __future__ import annotations

from flask import request
from flask_socketio import SocketIO, emit, join_room

from app.access import WorkspaceAccessRegistry, WorkspaceIdentity


_DEPARTMENTS = {"it", "ent", "vision", "general", "dental"}


def register_realtime_handlers(
    socketio: SocketIO,
    access_registry: WorkspaceAccessRegistry,
) -> None:
    identities: dict[str, WorkspaceIdentity] = {}

    def current_identity() -> WorkspaceIdentity | None:
        return identities.get(request.sid)

    def emit_to_clinic(event: str, payload: object = None, *, include_self: bool = True):
        identity = current_identity()
        if identity is None:
            return {"error": "Authenticated realtime session required."}
        emit(event, payload, to=identity.clinic_room, include_self=include_self)
        return {"ok": True}

    @socketio.on("connect")
    def connect(auth):
        auth = auth if isinstance(auth, dict) else {}
        identity = access_registry.authenticate(
            auth.get("accessCode"),
            auth.get("clinicId"),
            auth.get("userId"),
        )
        if identity is None:
            return False

        identities[request.sid] = identity
        join_room(identity.clinic_room)
        join_room(identity.user_room)
        emit("workspaceSession", identity.public_dict(), to=request.sid)

    @socketio.on("disconnect")
    def disconnect():
        identities.pop(request.sid, None)

    @socketio.on("newPatientId")
    def new_patient_id(patient_id):
        if not isinstance(patient_id, str) or not 1 <= len(patient_id) <= 30:
            return {"error": "Invalid patient ID."}
        return emit_to_clinic("newPatientId", patient_id)

    @socketio.on("resetPatientData")
    def reset_patient_data():
        return emit_to_clinic("resetPatientData")

    @socketio.on("photoDelete")
    def photo_delete():
        return emit_to_clinic("photoDelete")

    @socketio.on("photoUpdate")
    def photo_update(data):
        if (
            not isinstance(data, dict)
            or not isinstance(data.get("photo"), str)
            or not isinstance(data.get("photoFileName", ""), str)
            or len(data.get("photoFileName", "")) > 255
        ):
            return {"error": "Invalid photo update."}
        return emit_to_clinic("photoUpdate", data, include_self=False)

    @socketio.on("departmentUpdate")
    def department_update(data):
        if not isinstance(data, dict) or not data or not set(data).issubset(_DEPARTMENTS):
            return {"error": "Invalid department update."}
        if any(value is not None and not isinstance(value, dict) for value in data.values()):
            return {"error": "Department values must be objects or null."}
        return emit_to_clinic("departmentUpdate", data, include_self=False)
