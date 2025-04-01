#!/bin/sh
# Wait for PostgreSQL to be ready before starting the app
until pg_isready -h db -p 5432; do
  echo "Waiting for Postgres..."
  sleep 1
done
python init_db.py   # Initialize the database
python app.py       # Start the Flask application
