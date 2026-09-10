"""Authentication and room naming for HealthFlow's scoped demo sessions."""

from __future__ import annotations

from dataclasses import dataclass
import hmac
import json
import os
import re
from collections.abc import Mapping


_IDENTIFIER = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
_DUMMY_SECRET = "healthflow-invalid-credential"


class AccessConfigurationError(ValueError):
    """Raised when configured workspace credentials are unsafe or ambiguous."""


@dataclass(frozen=True)
class WorkspaceIdentity:
    clinic_id: str
    user_id: str

    @property
    def clinic_room(self) -> str:
        return f"clinic:{self.clinic_id}"

    @property
    def user_room(self) -> str:
        return f"user:{self.clinic_id}:{self.user_id}"

    def public_dict(self) -> dict[str, str]:
        return {"clinicId": self.clinic_id, "userId": self.user_id}


class WorkspaceAccessRegistry:
    """Fail-closed registry for clinic/user credentials.

    Multi-clinic deployments provide ``HEALTHFLOW_IDENTITIES_JSON`` as:

        {"clinic-a": {"it-station": "secret"}}

    The legacy single-code variables remain available for the local synthetic
    demo, but they map to one explicit clinic/user pair instead of granting a
    caller permission to choose an arbitrary room.
    """

    def __init__(
        self,
        credentials: Mapping[tuple[str, str], str],
        *,
        implicit_identity: WorkspaceIdentity | None = None,
        allow_empty_secret: bool = False,
    ) -> None:
        self._credentials = dict(credentials)
        self._implicit_identity = implicit_identity
        self._allow_empty_secret = allow_empty_secret

    @classmethod
    def from_environment(
        cls,
        env: Mapping[str, str] | None = None,
        *,
        require_access_code: bool = True,
    ) -> "WorkspaceAccessRegistry":
        values = os.environ if env is None else env
        raw = values.get("HEALTHFLOW_IDENTITIES_JSON", "").strip()
        if raw:
            try:
                configured = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise AccessConfigurationError("HEALTHFLOW_IDENTITIES_JSON must be valid JSON.") from exc
            if not isinstance(configured, dict) or not configured:
                raise AccessConfigurationError("HEALTHFLOW_IDENTITIES_JSON must contain at least one clinic.")

            credentials: dict[tuple[str, str], str] = {}
            for clinic_id, users in configured.items():
                cls._require_identifier(clinic_id, "clinic")
                if not isinstance(users, dict) or not users:
                    raise AccessConfigurationError(f"Clinic {clinic_id!r} must contain at least one user.")
                for user_id, secret in users.items():
                    cls._require_identifier(user_id, "user")
                    if not isinstance(secret, str) or not secret:
                        raise AccessConfigurationError(
                            f"Credential for {clinic_id!r}/{user_id!r} must be a non-empty string."
                        )
                    credentials[(clinic_id, user_id)] = secret
            return cls(credentials)

        clinic_id = values.get("HEALTHFLOW_DEFAULT_CLINIC_ID", "demo")
        user_id = values.get("HEALTHFLOW_DEFAULT_USER_ID", "demo-user")
        cls._require_identifier(clinic_id, "clinic")
        cls._require_identifier(user_id, "user")
        secret = values.get("HEALTHFLOW_ACCESS_CODE", "")
        if require_access_code and not secret:
            return cls({})
        identity = WorkspaceIdentity(clinic_id, user_id)
        return cls(
            {(clinic_id, user_id): secret},
            implicit_identity=identity,
            allow_empty_secret=not require_access_code,
        )

    @staticmethod
    def _require_identifier(value: object, kind: str) -> str:
        if not isinstance(value, str) or not _IDENTIFIER.fullmatch(value):
            raise AccessConfigurationError(
                f"HealthFlow {kind} IDs must be 1-64 URL-safe letters, numbers, dots, underscores, or hyphens."
            )
        return value

    def authenticate(
        self,
        access_code: object,
        clinic_id: object = None,
        user_id: object = None,
    ) -> WorkspaceIdentity | None:
        if clinic_id in (None, "") and self._implicit_identity:
            clinic_id = self._implicit_identity.clinic_id
        if user_id in (None, "") and self._implicit_identity:
            user_id = self._implicit_identity.user_id
        if not isinstance(clinic_id, str) or not _IDENTIFIER.fullmatch(clinic_id):
            return None
        if not isinstance(user_id, str) or not _IDENTIFIER.fullmatch(user_id):
            return None
        if not isinstance(access_code, str):
            return None

        expected = self._credentials.get((clinic_id, user_id))
        candidate_secret = expected if expected is not None else _DUMMY_SECRET
        matches = hmac.compare_digest(access_code.encode("utf-8"), candidate_secret.encode("utf-8"))
        if expected is None or not matches or (not access_code and not self._allow_empty_secret):
            return None
        return WorkspaceIdentity(clinic_id, user_id)

    @property
    def has_credentials(self) -> bool:
        return bool(self._credentials)
