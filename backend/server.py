import eventlet
eventlet.monkey_patch()
import eventlet.tpool

from flask import Flask, g, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import logging
import os
import secrets
import sys
import time

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.routes import api_routes
from app.config import engine
from app.access import WorkspaceAccessRegistry
from app.realtime import register_realtime_handlers
from sqlalchemy import text

# Keep operational logs useful without recording request bodies, access codes,
# report contents, or patient fields. Fly captures stdout/stderr as its log
# stream; LOG_LEVEL can quiet or expand this locally without changing code.
log_level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level_name, logging.INFO),
    format="%(asctime)s %(levelname)s %(message)s",
)

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
socketio = SocketIO(
    app,
    cors_allowed_origins=CORS_ORIGINS,
    async_mode="eventlet",
    max_http_buffer_size=2 * 1024 * 1024,
)

# Register blueprints
app.register_blueprint(api_routes)


def _public_access_is_required() -> bool:
    return (
        os.environ.get("HEALTHFLOW_REQUIRE_ACCESS_CODE", "").lower() in {"1", "true"}
        or bool(os.environ.get("FLY_APP_NAME"))
    )


access_registry = WorkspaceAccessRegistry.from_environment(
    require_access_code=_public_access_is_required()
)


def _authenticate_http_request():
    return access_registry.authenticate(
        request.headers.get("X-HealthFlow-Access-Code", ""),
        request.headers.get("X-HealthFlow-Clinic-Id"),
        request.headers.get("X-HealthFlow-User-Id"),
    )


@app.before_request
def begin_request_measurement():
    """Attach a safe correlation ID and monotonic timer to this request."""
    supplied = request.headers.get("X-Request-ID", "")[:64]
    if supplied and all(char.isalnum() or char in "-_." for char in supplied):
        g.request_id = supplied
    else:
        g.request_id = secrets.token_hex(8)
    g.request_started_at = time.perf_counter()


@app.before_request
def protect_patient_api():
    if request.method == "OPTIONS" or not request.path.startswith("/api/"):
        return None
    identity = _authenticate_http_request()
    if identity is not None:
        g.workspace_identity = identity
        return None
    if _public_access_is_required() and not access_registry.has_credentials:
        return jsonify({"error": "HealthFlow is not enabled for public access."}), 503
    return jsonify({"error": "Valid HealthFlow clinic and user credentials are required."}), 401


@app.after_request
def record_request_measurement(response):
    """Emit metadata only: method/path/status/duration, never clinical data."""
    elapsed_ms = (time.perf_counter() - g.request_started_at) * 1000
    response.headers["X-Request-ID"] = g.request_id
    response.headers["Server-Timing"] = f"app;dur={elapsed_ms:.1f}"
    log = logging.debug if request.path == "/health" else logging.info
    log(
        "http request_id=%s method=%s path=%s status=%s duration_ms=%.1f",
        g.request_id,
        request.method,
        request.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.get('/api/session')
def workspace_session():
    return jsonify({"authorized": True, **g.workspace_identity.public_dict()}), 200


@app.route('/health')
def health():
    database_ok = False

    def probe_database():
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True

    try:
        # Psycopg is a blocking C extension, so run it in eventlet's native
        # thread pool. The green HTTP handler can then enforce the release
        # check's deadline without freezing every Socket.IO client.
        with eventlet.Timeout(2, False):
            database_ok = eventlet.tpool.execute(probe_database)
    except Exception:
        # Keep connection details out of the response while retaining a useful
        # traceback in the private runtime log stream.
        logging.exception("health check could not reach PostgreSQL")
    if database_ok:
        return {
            "status": "ok",
            "database": "ok",
            "release": os.environ.get("HEALTHFLOW_REVISION", "unknown"),
        }, 200
    logging.error("health check timed out or could not reach PostgreSQL")
    return {
        "status": "degraded",
        "database": "unavailable",
        "release": os.environ.get("HEALTHFLOW_REVISION", "unknown"),
    }, 503


register_realtime_handlers(socketio, access_registry)

# Initialize database
def init_db():
    try:
        # The initializer is idempotent and includes additive schema upgrades.
        # Running it only when the table is absent would strand older databases
        # on stale columns and make a new release fail after startup.
        from init_db import init_db as ensure_schema
        ensure_schema()
    except Exception as e:
        logging.error("Database initialization failed error_type=%s", type(e).__name__)

# Run once at import time (not just under `if __name__ == '__main__'`) so this
# also fires when the app is started via gunicorn, which imports this module
# as "app:app" rather than executing it as a script.
init_db()

if __name__ == '__main__':
    # Local/dev entrypoint only. Production runs under gunicorn with the
    # eventlet worker class (see entrypoint.sh) instead of this dev server.
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
