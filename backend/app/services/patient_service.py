from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import logging
from app.utils import generate_unique_pid

def get_patients(db: Session):
    try:
        query = text("SELECT * FROM patient_records ORDER BY pid DESC")
        result = db.execute(query)
        return list(result)
    except Exception as e:
        logging.error(f"Error retrieving patients: {str(e)}")
        raise e

def get_patient_by_id(db: Session, patient_id: str):
    try:
        query = text("SELECT * FROM patient_records WHERE pid = :pid")
        result = db.execute(query, {"pid": patient_id})
        return result.fetchone()
    except Exception as e:
        logging.error(f"Error retrieving patient {patient_id}: {str(e)}")
        raise e

def create_new_patient_id(db: Session):
    try:
        max_attempts = 5
        
        for _ in range(max_attempts):
            new_pid = generate_unique_pid()
            
            query = text("SELECT COUNT(*) FROM patient_records WHERE pid = :pid")
            result = db.execute(query, {"pid": new_pid}).scalar()
            
            if result == 0:
                return new_pid
        
        raise Exception("Failed to generate a unique patient ID")
    except Exception as e:
        logging.error(f"Error generating patient ID: {str(e)}")
        raise e

def submit_patient_data(db: Session, flat_data: dict):
    try:
        columns = ", ".join(flat_data.keys())
        values = ", ".join([":"+k for k in flat_data.keys()])
        query = text(f"INSERT INTO patient_records ({columns}) VALUES ({values})")
        
        db.execute(query, flat_data)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logging.error(f"Error saving patient data: {str(e)}")
        raise e