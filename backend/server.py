import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging
import hmac
import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.routes import api_routes
from app.config import engine
from sqlalchemy import text

# Configure logging for production use
logging.basicConfig(level=logging.WARNING)

# Initialize Flask app
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

# Allowed frontend origins for CORS / Socket.IO. Configurable via env (comma-separated)
# so this doesn't have to be hardcoded per deployment target; keeps the old Cloud Run
# origins as a fallback and adds the current Fly.io frontend by default.
_default_origins = (
    "https://doctor-report-frontend-685296458444.asia-south2.run.app,"
    "https://doctor-report-frontend-720901500415.asia-south1.run.app,"
    "https://healthflow-abheet19.fly.dev"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})
# async_mode="eventlet" pairs with the gunicorn eventlet worker used in
# production (see entrypoint.sh) - "threading" was fine under the Werkzeug
# dev server but doesn't scale past a handful of concurrent socket
# connections, which is what we're moving off of.
socketio = SocketIO(app, cors_allowed_origins=CORS_ORIGINS, async_mode="eventlet")

# Register blueprints
app.register_blueprint(api_routes)


def _configured_access_code() -> str:
    return os.environ.get("HEALTHFLOW_ACCESS_CODE", "")


def _public_access_is_required() -> bool:
    return (
        os.environ.get("HEALTHFLOW_REQUIRE_ACCESS_CODE", "").lower() in {"1", "true"}
        or bool(os.environ.get("FLY_APP_NAME"))
    )


def _valid_access_code(value: object) -> bool:
    expected = _configured_access_code()
    if not expected:
        return not _public_access_is_required()
    return isinstance(value, str) and hmac.compare_digest(value.encode("utf-8"), expected.encode("utf-8"))


@app.before_request
def protect_patient_api():
    if request.method == "OPTIONS" or not request.path.startswith("/api/"):
        return None
    if _valid_access_code(request.headers.get("X-HealthFlow-Access-Code", "")):
        return None
    if _public_access_is_required() and not _configured_access_code():
        return jsonify({"error": "HealthFlow is not enabled for public access."}), 503
    return jsonify({"error": "A valid HealthFlow access code is required."}), 401
@app.get('/api/session')
def workspace_session():
    return jsonify({"authorized": True}), 200


@app.route('/health')
def health():
    return {"status": "ok"}, 200


@socketio.on('connect')
def protect_realtime_channel(auth):
    auth = auth if isinstance(auth, dict) else {}
    if not _valid_access_code(auth.get("accessCode")):
        return False
# WebSocket event handlers
@socketio.on('newPatientId')
def handle_new_patient_id(patient_id):
    emit('newPatientId', patient_id, broadcast=True)

@socketio.on('resetPatientData')
def handle_reset():
    emit('resetPatientData', broadcast=True)

@socketio.on('photoDelete')
def handle_photo_delete():
    emit('photoDelete', broadcast=True)

@socketio.on('photoUpdate')
def handle_photo_update(data):
    emit('photoUpdate', data, broadcast=True, include_self=False)

@socketio.on('departmentUpdate')
def handle_department_update(data):
    allowed = {"it", "ent", "vision", "general", "dental"}
    if not isinstance(data, dict) or not set(data).issubset(allowed):
        return {"error": "Invalid department update."}
    if any(value is not None and not isinstance(value, dict) for value in data.values()):
        return {"error": "Department values must be objects or null."}
    emit('departmentUpdate', data, broadcast=True, include_self=False)

# Initialize database
def init_db():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patient_records')"))
            table_exists = result.scalar()
            
            if not table_exists:
                from init_db import init_db as create_tables
                create_tables()
    except Exception as e:
        logging.error(f"Database initialization error: {str(e)}")

# Run once at import time (not just under `if __name__ == '__main__'`) so this
# also fires when the app is started via gunicorn, which imports this module
# as "app:app" rather than executing it as a script.
init_db()

if __name__ == '__main__':
    # Local/dev entrypoint only. Production runs under gunicorn with the
    # eventlet worker class (see entrypoint.sh) instead of this dev server.
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
