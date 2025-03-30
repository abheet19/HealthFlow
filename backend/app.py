from flask import Flask, request, jsonify, send_file
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging
from datetime import datetime
from io import BytesIO
from docx import Document   # new import for report generation
import uuid
import random

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
logging.basicConfig(level=logging.INFO)

# Global in-memory storage for submissions (prototype only)
global_data = {
    "it": None,
    "ent": None,
    "vision": None,
    "general": None,
    "dental": None
}

# Add this near the top with other global variables
patient_counter = 0

# Add a new variable to store the last used patient number
LAST_PATIENT_NUMBER = 0

# Log every API call
@app.before_request
def log_request_info():
    logging.info(f"{datetime.utcnow()} - {request.method} {request.path} - IP: {request.remote_addr}")
    # ...existing code...

@app.after_request
def log_response_info(response):
    logging.info(f"{datetime.utcnow()} - Response Status: {response.status}")
    return response

def validate_fields(data, required_fields):
    missing = [field for field in required_fields if field not in data or data[field] in [None, ""]]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"
    return True, ""

# IT Department: main page receives photo and general details
@app.route('/api/it', methods=['POST'])
def submit_it():
    data = request.form.to_dict()
    if 'photo' not in request.files:
        return jsonify({"error": "Missing photo file."}), 400
    required = [
        "name", "div", "roll_no", "admin_no", "father_name",
        "mother_name", "address", "mobile", "dob", "gender", "blood_group"
    ]
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"error": msg}), 400
    file = request.files['photo']
    # ...image processing code...
    global_data["it"] = data  # store submission data
    logging.info("IT record received and processed.")
    return jsonify({"message": "IT info submitted successfully."}), 200

# ENT Department endpoint update
@app.route('/api/ent', methods=['POST'])
def submit_ent():
    data = request.json
    required = [
        "left_ear_deformity", "left_ear_wax", "left_ear_tympanic_membrane", 
        "left_ear_discharge", "left_ear_normal_hearing",
        "right_ear_deformity", "right_ear_wax", "right_ear_tympanic_membrane", 
        "right_ear_discharge", "right_ear_normal_hearing",
        "left_nose_obstruction", "left_nose_discharge", "right_nose_obstruction", 
        "right_nose_discharge",
        "throat", "throat_pain", "neck_nodes", "tonsils"
    ]
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"error": msg}), 400
    global_data["ent"] = data  # store ENT data
    logging.info("ENT record received and processed.")
    return jsonify({"message": "ENT info submitted successfully."}), 200

# VISION Department endpoint update
@app.route('/api/vision', methods=['POST'])
def submit_vision():
    data = request.json
    required = [
        "re_vision", "le_vision",
        "re_color_blindness", "le_color_blindness",
        "re_squint", "le_squint"
    ]
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"error": msg}), 400
    global_data["vision"] = data  # store Vision data
    logging.info("Vision record received and processed.")
    return jsonify({"message": "Vision info submitted successfully."}), 200

# GENERAL Department endpoint update
@app.route('/api/general', methods=['POST'])
def submit_general():
    data = request.json
    required = [
        "height", "weight", "bmi",
        "nails", "hair", "skin",
        "anemia_figure",
        "allergy",
        "abdomen_soft", "abdomen_hard", "abdomen_distended", "abdomen_bowel_sound",
        "cns_conscious", "cns_oriented", "cns_playful", "cns_active", "cns_alert", "cns_speech",
        "past_medical", "past_surgical", "bp", "pulse",
        "hip", "waist"
    ]
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"error": msg}), 400
    global_data["general"] = data  # store General data
    logging.info("General record received and processed.")
    return jsonify({"message": "General info submitted successfully."}), 200

# DENTAL Department endpoint update
@app.route('/api/dental', methods=['POST'])
def submit_dental():
    data = request.json
    required = [
        "dental_extra_oral",
        "tooth_cavity_permanent", "tooth_cavity_primary",
        "plaque", "gum_inflammation", "stains", "tooth_discoloration",
        "tarter", "bad_breath", "gum_bleeding", "soft_tissue",
        "fluorosis", "malocclusion", "root_stump", "missing_teeth"
    ]
    valid, msg = validate_fields(data, required)
    if not valid:
        return jsonify({"error": msg}), 400
    global_data["dental"] = data  # store Dental data
    logging.info("Dental record received and processed.")
    return jsonify({"message": "Dental info submitted successfully."}), 200

# New endpoint to generate a Word report using the submitted data
@app.route('/api/generate_report', methods=['GET'])
def generate_report():
    # Ensure all submissions are present
    for dept, submission in global_data.items():
        if submission is None:
            return jsonify({"error": f"{dept.upper()} submission is missing."}), 400

    # Load the empty medical report card template
    template_path = "template.docx"  # ensure this file exists in the backend folder
    document = Document(template_path)

    # Create a flat dictionary for replacements, e.g., { "it_name": "John Doe", ... }
    replacements = {}
    for dept, data in global_data.items():
        for key, value in data.items():
            replacements[f"{{{dept}_{key}}}"] = value

    # Function to replace placeholders in paragraphs
    def replace_placeholders_in_paragraphs(paragraphs):
        for para in paragraphs:
            for placeholder, replacement in replacements.items():
                if placeholder in para.text:
                    for run in para.runs:
                        if placeholder in run.text:
                            run.text = run.text.replace(placeholder, str(replacement))

    # Replace placeholders in paragraphs
    replace_placeholders_in_paragraphs(document.paragraphs)

    # Also replace placeholders in tables if your template has them
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                replace_placeholders_in_paragraphs(cell.paragraphs)

    # Save updated document to a BytesIO stream
    doc_io = BytesIO()
    document.save(doc_io)
    doc_io.seek(0)
    logging.info("Medical report card generated successfully from template.")
    return send_file(
        doc_io,
        as_attachment=True,
        download_name="medical_report_card.docx",
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@app.route('/api/submit_patient', methods=['POST'])
def submit_patient():
    data = request.json
    required_depts = ["it", "ent", "vision", "general", "dental"]
    missing = [dept for dept in required_depts if dept not in data or not data[dept]]
    if missing:
        return jsonify({"error": f"Missing data for departments: {', '.join(missing)}"}), 400
    # Simulate saving to the patients_db (actual DB logic goes here)
    logging.info("Combined patient data received: %s", data)
    return jsonify({"message": "Patient data submitted successfully."}), 200

# Add new endpoint for generating patient IDs
@app.route('/api/generate_patient_id', methods=['POST'])
def generate_patient_id():
    try:
        global LAST_PATIENT_NUMBER
        LAST_PATIENT_NUMBER += 1
        
        # Simply use the incremented number as the patient ID
        patient_id = str(LAST_PATIENT_NUMBER)
        
        logging.info(f"Generated new patient ID: {patient_id}")
        socketio.emit('newPatientId', patient_id)
        
        return jsonify({"patientId": patient_id, "success": True}), 200
        
    except Exception as e:
        logging.error(f"Error generating patient ID: {str(e)}")
        return jsonify({"error": "Failed to generate patient ID", "success": False}), 500

@socketio.on('newPatientId')
def handle_new_patient_id(patient_id):
    try:
        print(f"Broadcasting new patient ID: {patient_id}")
        # Send just the string value
        emit('newPatientId', patient_id, broadcast=True)
    except Exception as e:
        print(f"Error in WebSocket broadcast: {str(e)}")

@socketio.on('resetPatientData')
def handle_reset():
    print("Broadcasting reset signal")
    emit('resetPatientData', broadcast=True)

@socketio.on('departmentUpdate')
def handle_department_update(data):
    print(f"Broadcasting department update")
    emit('departmentUpdate', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
