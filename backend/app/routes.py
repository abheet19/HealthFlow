from flask import Blueprint, request, jsonify, send_file, current_app
from app.config import get_db
from app.services import patient_service, report_service
from app.utils import (
    transform_it, transform_ent, transform_vision, 
    transform_general, transform_dental, translate_record
)
from datetime import datetime
import logging

# Blueprint for patient-related routes
api_routes = Blueprint('api', __name__, url_prefix='/api')

@api_routes.route('/patients', methods=['GET'])
def get_patients():
    db = get_db()
    try:
        patients = patient_service.get_patients(db)
        transformed_patients = [translate_record(row) for row in patients]
        
        for patient in transformed_patients:
            if patient.get("photo"):
                patient["photo"] = f"data:image/jpeg;base64,{patient['photo']}"
                
        return jsonify(patients=transformed_patients), 200
    except Exception as e:
        logging.error(f"Error retrieving patients: {str(e)}")
        return jsonify({"error": "Error retrieving patients"}), 500
    finally:
        db.close()

@api_routes.route('/generate_patient_id', methods=['POST'])
def generate_patient_id():
    db = get_db()
    try:
        new_pid = patient_service.create_new_patient_id(db)
        
        socketio = current_app.extensions['socketio']
        socketio.emit('newPatientId', new_pid)
        
        return jsonify({"patientId": new_pid, "success": True}), 200
    except Exception as e:
        logging.error(f"Error generating patient ID: {str(e)}")
        return jsonify({"error": "Failed to generate patient ID", "success": False}), 500
    finally:
        db.close()

@api_routes.route('/submit_patient', methods=['POST'])
def submit_patient():
    db = get_db()
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request data"}), 400
            
        required_depts = ["it", "ent", "vision", "general", "dental"]
        missing = [dept for dept in required_depts if dept not in data or not data[dept]]
        
        if missing:
            return jsonify({"error": f"Missing data for departments: {', '.join(missing)}"}), 400

        it_data_raw = data["it"]
        it_photo = it_data_raw.get("photo")
        if it_photo and "," in it_photo:
            it_photo = it_photo.split(",")[1]
        it_data_raw["photo"] = it_photo if it_photo else None
        
        it_data = transform_it(data["it"])
        ent_data = transform_ent(data["ent"])
        vision_data = transform_vision(data["vision"])
        general_data = transform_general(data["general"])
        dental_data = transform_dental(data["dental"])

        try:
            capture_date = datetime.fromisoformat(data["captured_date"])
        except Exception:
            capture_date = datetime.now()

        flat_data = {
            "pid": data["patientId"],
            **it_data,
            **ent_data,
            **vision_data,
            **general_data,
            **dental_data,
            "cap_dt": capture_date,
            "created_at": datetime.now()
        }

        patient_service.submit_patient_data(db, flat_data)
        return jsonify({"message": "Patient data submitted successfully."}), 200
        
    except Exception as e:
        logging.error(f"Error saving patient data: {str(e)}")
        return jsonify({"error": "Failed to save patient data"}), 500
    finally:
        db.close()

@api_routes.route('/generate_report', methods=['GET'])
def generate_report():
    patient_id = request.args.get("patientId")
    if not patient_id:
        return jsonify({"error": "patientId query parameter is required."}), 400
    
    db = get_db()
    try:
        record = patient_service.get_patient_by_id(db, patient_id)
        if not record:
            return jsonify({"error": "Patient record not found."}), 404

        patient_record = {k: v for k, v in record._mapping.items()}
        
        doc_io, patient_name = report_service.ReportService.generate_word_report(db, patient_record)
        
        return send_file(
            doc_io,
            as_attachment=True,
            download_name=f"{patient_name}.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        logging.error(f"Error generating report: {str(e)}")
        return jsonify({"error": "Failed to generate report."}), 500
    finally:
        db.close()

@api_routes.route('/generate_pdf_report', methods=['GET'])
def generate_pdf_report():
    patient_id = request.args.get("patientId")
    if not patient_id:
        return jsonify({"error": "patientId query parameter is required."}), 400
    
    db = get_db()
    try:
        record = patient_service.get_patient_by_id(db, patient_id)
        if not record:
            return jsonify({"error": "Patient record not found."}), 404

        patient_record = {k: v for k, v in record._mapping.items()}
        
        pdf_io, patient_name = report_service.ReportService.generate_pdf_report(db, patient_record)
        
        if hasattr(pdf_io, 'name') and pdf_io.name.endswith('.docx'):
            mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            extension = "docx"
        else:
            mimetype = "application/pdf"
            extension = "pdf"
            
        response = send_file(
            pdf_io,
            mimetype=mimetype,
            as_attachment=True,
            download_name=f"{patient_name}.{extension}"
        )
        
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
        
    except Exception as e:
        logging.error(f"Error generating PDF report: {str(e)}")
        return jsonify({"error": "Failed to generate report."}), 500
    finally:
        db.close()