#!/bin/sh
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

# Initialize the database
python init_db.py

# Start the Flask application
python app.py
