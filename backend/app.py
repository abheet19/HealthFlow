from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging
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
socketio = SocketIO(app, cors_allowed_origins=CORS_ORIGINS, async_mode="threading")

# Register blueprints
app.register_blueprint(api_routes)

@app.route('/health')
def health():
    return {"status": "ok"}, 200

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
    emit('photoUpdate', data, broadcast=True)

@socketio.on('departmentUpdate')
def handle_department_update(data):
    emit('departmentUpdate', data, broadcast=True)

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

if __name__ == '__main__':
    # Initialize database before starting the app
    init_db()
    
    # Get port from environment variable or use 5000 as default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the application
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
