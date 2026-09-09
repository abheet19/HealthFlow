import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import platform

# Load environment variables
load_dotenv()

# Create database URL from environment variables
def get_database_url():
    # Fly Postgres attach (and similar managed setups) inject a single DATABASE_URL.
    # Prefer it when present rather than requiring the individual POSTGRES_* vars.
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # SQLAlchemy's psycopg2 dialect wants the postgresql:// scheme.
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url

    postgres_user = os.environ.get("POSTGRES_USER")
    postgres_password = os.environ.get("POSTGRES_PASSWORD")
    postgres_db = os.environ.get("POSTGRES_DB")
    postgres_host = os.environ.get("POSTGRES_HOST", "localhost")
    postgres_port = os.environ.get("POSTGRES_PORT", "5432")
    
    if not (postgres_user and postgres_password and postgres_db):
        raise EnvironmentError("Missing required PostgreSQL environment variables.")
    
    # Determine if we're running in Cloud Run
    CLOUD_RUN = os.getenv('CLOUD_RUN', 'false').lower() == 'true'
    
    # Only use this Windows check in local development
    if not CLOUD_RUN and platform.system() == 'Windows':
        # Standard TCP connection for local Windows development
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
    
    if CLOUD_RUN:
        # Use Cloud SQL Auth Proxy connection method for Cloud Run
        instance_connection_name = os.getenv('INSTANCE_CONNECTION_NAME')
        if not instance_connection_name:
            raise EnvironmentError("Missing INSTANCE_CONNECTION_NAME for Cloud SQL connection")
            
        # Unix socket connection string for Cloud SQL
        # Format: postgresql+psycopg2://<db_user>:<db_pass>@/<db_name>?host=/cloudsql/<instance_connection_name>
        return f"postgresql+psycopg2://{postgres_user}:{postgres_password}@/{postgres_db}?host=/cloudsql/{instance_connection_name}"
    else:
        # Standard TCP connection for non-Windows local development or other environments
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

# Create a database engine and session factory
DATABASE_URL = get_database_url()
# Fail quickly when PostgreSQL is unavailable so an HTTP request or Fly health
# check cannot sit on the driver's much longer default connection timeout.
# pool_pre_ping keeps stale pooled connections from reaching application code.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_timeout=1,
    connect_args={"connect_timeout": 1},
)
SessionLocal = sessionmaker(bind=engine)

# Database session dependency - fixed to return a session instead of yielding it
def get_db():
    return SessionLocal()
