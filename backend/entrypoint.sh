#!/bin/sh
# Check if we're running in Cloud Run
if [ "$CLOUD_RUN" = "true" ]; then
  echo "Running in Cloud Run environment"
  # No need to wait for PostgreSQL when using Cloud SQL Auth Proxy
  # Cloud Run will automatically handle the connection
else
  # Local development with docker-compose
  echo "Running in local development environment"
  # Set explicit database credentials
  export POSTGRES_USER=postgres
  export POSTGRES_PASSWORD=postgres 
  export POSTGRES_DB=doctor_reports
  export POSTGRES_HOST=db
  export POSTGRES_PORT=5432

  # Wait for PostgreSQL to be ready before starting the app
  until pg_isready -h db -p 5432; do
    echo "Waiting for Postgres..."
    sleep 1
  done
fi

# Initialize the database (conditionally)
if [ "$INITIALIZE_DB" = "true" ]; then
  echo "Initializing database..."
  python init_db.py
fi

# Start the Flask application
python app.py
