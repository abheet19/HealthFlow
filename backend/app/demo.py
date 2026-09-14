"""Isolated, read-only sample workspace for public/recruiter walk-throughs.

This module is deliberately self-contained and touches neither the database nor
the real :class:`~app.access.WorkspaceAccessRegistry`. It exists so a reviewer
can reach the full multi-department clinic workflow in one click *without an
account*, seeing clearly-synthetic data only.

Security model (see ``server.py`` for enforcement):

* The demo identity uses a reserved clinic/user id that is **not** in the
  credential registry, so it can never resolve to a real workspace's records.
* The demo branch is only ever entered *after* real authentication has already
  failed, so it cannot weaken or bypass the real access model.
* Every write in demo context is refused server-side before it reaches any
  persistence code; demo reads are served from the in-memory fixtures below and
  never query the database.
"""

from __future__ import annotations

from app.access import WorkspaceIdentity
from app.utils import (
    transform_it,
    transform_ent,
    transform_vision,
    transform_general,
    transform_dental,
    translate_record,
)

# Reserved identity for the sample workspace. Not present in any credential
# registry, so authentication of a real workspace can never collide with it.
DEMO_CLINIC_ID = "sample-demo"
DEMO_USER_ID = "demo-viewer"

# Unique, greppable marker so a deployed build can be proven to carry this
# change (see the LIVE verification step).
DEMO_READONLY_MESSAGE = (
    "This is the HealthFlow read-only sample workspace · changes are not saved."
)

DEMO_IDENTITY = WorkspaceIdentity(DEMO_CLINIC_ID, DEMO_USER_ID)


def is_demo_requested(headers) -> bool:
    """True when the caller explicitly asked for the sample workspace."""
    return str(headers.get("X-HealthFlow-Demo", "")).strip() == "1"


def is_demo_identity(identity: WorkspaceIdentity | None) -> bool:
    return identity is not None and identity.clinic_id == DEMO_CLINIC_ID and identity.user_id == DEMO_USER_ID


# --- Synthetic sample records -------------------------------------------------
# Authored in the same camelCase shape the intake form submits, then pushed
# through the exact same transforms as a real submission so the sample records
# render identically in the list and the Word report. No real patient, school,
# employee, or health information is present.

_SAMPLE_SUBMISSIONS = [
    {
        "patientId": "PID-SAMPLE-0001",
        "it": {
            "name": "Aarav Sample",
            "div": "7-B",
            "rollNo": "14",
            "adminNo": "A-2043",
            "fatherName": "Rohan Sample",
            "motherName": "Meera Sample",
            "mobile": "90000-00001",
            "dob": "2013-04-12",
            "gender": "Male",
            "bloodGroup": "O+",
            "medicalOfficer": "Dr. Sample Kaur",
        },
        "ent": {
            "left_ear_normal_hearing": "Yes",
            "right_ear_normal_hearing": "Yes",
            "left_ear_wax": "Mild",
            "throat_pain": "No",
            "tonsils": "Normal",
        },
        "vision": {
            "re_vision": "6/6",
            "le_vision": "6/9",
            "re_color_blindness": "No",
            "le_color_blindness": "No",
        },
        "general": {
            "height": "138",
            "weight": "32",
            "bmi": "16.8",
            "nails": "Normal",
            "hair": "Normal",
            "skin": "Normal",
            "bp": "104/68",
            "pulse": "88",
        },
        "dental": {
            "dental_extra_oral": "Normal",
            "dental_remarks": "Advise routine cleaning",
            "tooth_cavity_permanent": "16,26",
            "plaque": "Mild",
            "gum_inflammation": "No",
        },
    },
    {
        "patientId": "PID-SAMPLE-0002",
        "it": {
            "name": "Diya Sample",
            "div": "5-A",
            "rollNo": "9",
            "adminNo": "A-1988",
            "fatherName": "Kabir Sample",
            "motherName": "Anita Sample",
            "mobile": "90000-00002",
            "dob": "2015-09-30",
            "gender": "Female",
            "bloodGroup": "B+",
            "medicalOfficer": "Dr. Sample Kaur",
        },
        "ent": {
            "left_ear_normal_hearing": "Yes",
            "right_ear_normal_hearing": "Yes",
            "right_nose_obstruction": "Mild",
            "tonsils": "Normal",
        },
        "vision": {
            "re_vision": "6/6",
            "le_vision": "6/6",
            "re_squint": "No",
            "le_squint": "No",
        },
        "general": {
            "height": "122",
            "weight": "24",
            "bmi": "16.1",
            "nails": "Pale",
            "hair": "Normal",
            "skin": "Normal",
            "bp": "98/62",
            "pulse": "92",
        },
        "dental": {
            "dental_extra_oral": "Normal",
            "dental_remarks": "No cavities detected",
            "tooth_cavity_primary": "55",
            "plaque": "None",
            "gum_inflammation": "No",
        },
    },
    {
        "patientId": "PID-SAMPLE-0003",
        "it": {
            "name": "Ishaan Sample",
            "div": "9-C",
            "rollNo": "22",
            "adminNo": "A-2210",
            "fatherName": "Arjun Sample",
            "motherName": "Sara Sample",
            "mobile": "90000-00003",
            "dob": "2011-01-05",
            "gender": "Male",
            "bloodGroup": "A+",
            "medicalOfficer": "Dr. Sample Rao",
        },
        "ent": {
            "left_ear_normal_hearing": "Yes",
            "right_ear_normal_hearing": "Reduced",
            "left_ear_wax": "Moderate",
            "throat_pain": "Occasional",
            "tonsils": "Enlarged",
        },
        "vision": {
            "re_vision": "6/9",
            "le_vision": "6/12",
            "re_color_blindness": "No",
            "le_color_blindness": "No",
        },
        "general": {
            "height": "150",
            "weight": "42",
            "bmi": "18.7",
            "nails": "Normal",
            "hair": "Normal",
            "skin": "Dry",
            "bp": "112/72",
            "pulse": "80",
        },
        "dental": {
            "dental_extra_oral": "Normal",
            "dental_remarks": "Refer for orthodontic review",
            "tooth_cavity_permanent": "36,46",
            "plaque": "Moderate",
            "gum_inflammation": "Mild",
        },
    },
]


def _flat_record(submission: dict) -> dict:
    """Compose a DB-column-shaped record from a sample submission.

    Uses the same transforms as a real submission so the sample renders exactly
    like a persisted record - but it is built in memory and never written.
    """
    return {
        "pid": submission["patientId"],
        "clinic_id": DEMO_CLINIC_ID,
        **transform_it(submission.get("it", {})),
        **transform_ent(submission.get("ent", {})),
        **transform_vision(submission.get("vision", {})),
        **transform_general(submission.get("general", {})),
        **transform_dental(submission.get("dental", {})),
    }


_DEMO_RECORDS = [_flat_record(submission) for submission in _SAMPLE_SUBMISSIONS]
_DEMO_RECORDS_BY_PID = {record["pid"]: record for record in _DEMO_RECORDS}


def demo_patient_list() -> list[dict]:
    """Frontend-shaped list of the synthetic sample patients."""
    return [translate_record(record) for record in _DEMO_RECORDS]


def demo_patient_record(patient_id: str) -> dict | None:
    """Flat record for report generation, or ``None`` if the id is unknown."""
    record = _DEMO_RECORDS_BY_PID.get(patient_id)
    return dict(record) if record is not None else None
