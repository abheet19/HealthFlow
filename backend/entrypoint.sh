#!/bin/sh
# Check if we're running in Cloud Run
if [ "$CLOUD_RUN" = "true" ]; then
  echo "Running in Cloud Run environment"
  # No need to wait for PostgreSQL when using Cloud SQL Auth Proxy
  # Cloud Run will automatically handle the connection
elif [ -n "$DATABASE_URL" ]; then
  # Managed Postgres (e.g. Fly.io attach) already gave us a full connection
  # string via DATABASE_URL - no local container to wait for.
  echo "Running with externally provided DATABASE_URL"
else
  # Local development with docker-compose. Respect explicit Compose or shell
  # values; the old entrypoint silently replaced the configured password with
  # "postgres", so a freshly initialized database could never authenticate.
  : "${POSTGRES_USER:=postgres}"
  : "${POSTGRES_PASSWORD:=postgres}"
  : "${POSTGRES_DB:=doctor_reports}"
  : "${POSTGRES_HOST:=db}"
  : "${POSTGRES_PORT:=5432}"
  export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB POSTGRES_HOST POSTGRES_PORT

  echo "Running in local development environment"
  until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT"; do
    echo "Waiting for Postgres..."
    sleep 1
  done
fi

# Initialize the database (conditionally)
if [ "$INITIALIZE_DB" = "true" ]; then
  echo "Initializing database..."
  python init_db.py
fi

# Start the Flask-SocketIO app under gunicorn with the eventlet worker class.
# The Werkzeug dev server (`python server.py` / socketio.run) isn't meant for
# production traffic; gunicorn+eventlet is the standard production setup for
# Flask-SocketIO. Single worker is required: Socket.IO session/session-room
# state lives in-process, so multiple workers would each only see a fraction
# of connected clients without an external message queue (e.g. Redis) wired
# up, which this app doesn't have.
#
# The entry module is "server.py", not "app.py" - gunicorn's "module:attr"
# target does a plain `import module`, and this directory also has an
# `app/` package (routes/config/utils/services). A same-named app.py file
# and app/ package are ambiguous to Python's import machinery, and it
# resolved to the package, not the script, breaking `app:app`.
PORT="${PORT:-5000}"
exec gunicorn \
  --worker-class eventlet \
  --workers 1 \
  --bind "0.0.0.0:${PORT}" \
  --timeout 120 \
  server:app
