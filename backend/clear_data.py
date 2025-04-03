#!/usr/bin/env python
"""
Simple script to clear the patient_records table
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

def clear_database():
    # Get database connection info from environment variables
    db_user = os.getenv('POSTGRES_USER')
    db_pass = os.getenv('POSTGRES_PASSWORD')
    db_host = os.getenv('POSTGRES_HOST')
    db_port = os.getenv('POSTGRES_PORT')
    db_name = os.getenv('POSTGRES_DB')
    
    # Create connection URL for direct connection
    DATABASE_URL = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    
    # Create the database engine
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Count records before deletion
        result = db.execute(text("SELECT COUNT(*) FROM patient_records"))
        count = result.scalar()
        print(f"Found {count} records in patient_records table")
        
        # Ask for confirmation
        confirm = input(f"Are you sure you want to delete all {count} records? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Operation cancelled")
            return
        
        # Delete all records
        db.execute(text("DELETE FROM patient_records"))
        db.commit()
        print(f"Successfully deleted {count} records from patient_records table")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_database()