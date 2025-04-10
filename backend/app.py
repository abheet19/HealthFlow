from flask import Flask, request, jsonify, send_file
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging
from datetime import datetime
from io import BytesIO
from docx import Document   # new import for report generation
import uuid
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from sqlalchemy import text
import base64
from docx.shared import Inches
from docxtpl import DocxTemplate, InlineImage
from PIL import Image, ImageDraw, ImageOps, ExifTags  # added ExifTags for rotation handling

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

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

# Add database configuration using environment variables
# Determine if we're running in Cloud Run
CLOUD_RUN = os.getenv('CLOUD_RUN', 'false').lower() == 'true'
import platform
if platform.system() == 'Windows':
    CLOUD_RUN = False  # Force standard TCP connection on Windows

if CLOUD_RUN:
    # Use Cloud SQL Auth Proxy connection method for Cloud Run
    instance_connection_name = os.getenv('INSTANCE_CONNECTION_NAME')
    db_user = os.getenv('POSTGRES_USER')
    db_pass = os.getenv('POSTGRES_PASSWORD')
    db_name = os.getenv('POSTGRES_DB')
    
    # Unix socket connection string for Cloud SQL
    # Format: postgresql+psycopg2://<db_user>:<db_pass>@/<db_name>?host=/cloudsql/<instance_connection_name>
    DATABASE_URL = f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}?host=/cloudsql/{instance_connection_name}"
    logging.info(f"Using Cloud SQL Auth Proxy connection method")
else:
    # Standard TCP connection for local development
    DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
    logging.info(f"Using standard TCP connection method")

# Log connection type but not credentials
logging.info(f"DB Connection type: {'Cloud SQL Auth Proxy' if CLOUD_RUN else 'TCP'}")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)  # Added pool_pre_ping for better connection reliability
SessionLocal = sessionmaker(bind=engine)

# Log every API call
@app.before_request
def log_request_info():
    logging.info(f"{datetime.now()} - {request.method} {request.path} - IP: {request.remote_addr}")

@app.after_request
def log_response_info(response):
    logging.info(f"{datetime.now()} - Response Status: {response.status}")
    return response

def validate_fields(data, required_fields):
    missing = [field for field in required_fields if field not in data or data[field] in [None, ""]]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"
    return True, ""

# Add this helper function below your imports:
def crop_image_circle(image: Image.Image, size: int) -> BytesIO:
    """
    Process an image by applying EXIF orientation correction, resizing, and creating a circular crop.
    
    Args:
        image: The PIL Image object to process
        size: The desired size (width/height) of the output image
        
    Returns:
        A BytesIO object containing the processed image
    """
    # Handle EXIF orientation
    try:
        # Find the orientation tag
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
                
        # Check if image has EXIF data
        if hasattr(image, '_getexif') and image._getexif() is not None:
            exif = dict(image._getexif().items())
            if orientation in exif:
                # Rotate the image according to EXIF orientation
                if exif[orientation] == 2:
                    image = image.transpose(Image.FLIP_LEFT_RIGHT)
                elif exif[orientation] == 3:
                    image = image.rotate(180, expand=True)
                elif exif[orientation] == 4:
                    image = image.transpose(Image.FLIP_TOP_BOTTOM)
                elif exif[orientation] == 5:
                    image = image.transpose(Image.FLIP_LEFT_RIGHT).rotate(90, expand=True)
                elif exif[orientation] == 6:
                    image = image.rotate(270, expand=True)
                elif exif[orientation] == 7:
                    image = image.transpose(Image.FLIP_LEFT_RIGHT).rotate(270, expand=True)
                elif exif[orientation] == 8:
                    image = image.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        # No orientation data or not in expected format, continue with unmodified image
        pass
        
    # Resize the image to desired square size
    image = image.resize((size, size))
    
    # Create a circular mask
    bigsize = (size * 3, size * 3)
    mask = Image.new('L', bigsize, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0) + bigsize, fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    
    # Apply mask to image and use white background for transparency removal if needed
    output = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    output.paste(image, (0, 0), mask)
    
    # Save to BytesIO in PNG format (preserves circular crop)
    output_stream = BytesIO()
    output.save(output_stream, format="PNG")
    output_stream.seek(0)
    return output_stream

# Add mapping helper functions:
def transform_it(data_it: dict) -> dict:
    return {
        "name": data_it.get("name", ""),
        "div": data_it.get("div", ""),
        "roll": data_it.get("rollNo", ""),
        "admin": data_it.get("adminNo", ""),
        "father": data_it.get("fatherName", ""),
        "mother": data_it.get("motherName", ""),
        "mob": data_it.get("mobile", ""),
        "dob": data_it.get("dob", ""),
        "gen": data_it.get("gender", ""),
        "blood": data_it.get("bloodGroup", ""),
        "medical_officer": data_it.get("medicalOfficer", ""),
        "photo": data_it.get("photo", None)
    }

def transform_ent(data_ent: dict) -> dict:
    return {
        "le_def": data_ent.get("left_ear_deformity", ""),
        "le_wax": data_ent.get("left_ear_wax", ""),
        "le_tm": data_ent.get("left_ear_tympanic_membrane", ""),
        "le_dis": data_ent.get("left_ear_discharge", ""),
        "le_nh": data_ent.get("left_ear_normal_hearing", ""),
        "re_def": data_ent.get("right_ear_deformity", ""),
        "re_wax": data_ent.get("right_ear_wax", ""),
        "re_tm": data_ent.get("right_ear_tympanic_membrane", ""),
        "re_dis": data_ent.get("right_ear_discharge", ""),
        "re_nh": data_ent.get("right_ear_normal_hearing", ""),
        "ln_obs": data_ent.get("left_nose_obstruction", ""),
        "ln_dis": data_ent.get("left_nose_discharge", ""),
        "rn_obs": data_ent.get("right_nose_obstruction", ""),
        "rn_dis": data_ent.get("right_nose_discharge", ""),
        "th_pain": data_ent.get("throat_pain", ""),
        "neck": data_ent.get("neck_nodes", ""),
        "tons": data_ent.get("tonsils", "")
    }

def transform_vision(data_vision: dict) -> dict:
    return {
        "rev": data_vision.get("re_vision", ""),
        "lev": data_vision.get("le_vision", ""),
        "rcb": data_vision.get("re_color_blindness", ""),
        "lcb": data_vision.get("le_color_blindness", ""),
        "rsq": data_vision.get("re_squint", ""),
        "lsq": data_vision.get("le_squint", "")
    }

def transform_dental(data_dental: dict) -> dict:
    return {
        "dental_ext": data_dental.get("dental_extra_oral", ""),
        "dental_rmk": data_dental.get("dental_remarks", ""),
        "tooth_perm": data_dental.get("tooth_cavity_permanent", ""),
        "tooth_prim": data_dental.get("tooth_cavity_primary", ""),
        "plaque": data_dental.get("plaque", ""),
        "gum_inf": data_dental.get("gum_inflammation", ""),
        "stains": data_dental.get("stains", ""),
        "tooth_disc": data_dental.get("tooth_discoloration", ""),
        "tarter": data_dental.get("tarter", ""),
        "bad_brth": data_dental.get("bad_breath", ""),
        "gum_bleed": data_dental.get("gum_bleeding", ""),
        "soft_tiss": data_dental.get("soft_tissue", ""),
        "fluor": data_dental.get("fluorosis", ""),
        "maloccl": data_dental.get("malocclusion", ""),
        "root_stmp": data_dental.get("root_stump", ""),
        "miss_teeth": data_dental.get("missing_teeth", "")
    }

# Add a new helper to transform general data:
def transform_general(data_general: dict) -> dict:
    return {
        "ht": data_general.get("height", ""),
        "wt": data_general.get("weight", ""),
        "bmi": data_general.get("bmi", ""),
        "nails": data_general.get("nails", ""),
        "nails_desc": data_general.get("nails_desc", ""),
        "hair": data_general.get("hair", ""),
        "hair_desc": data_general.get("hair_desc", ""),
        "skin": data_general.get("skin", ""),
        "skin_desc": data_general.get("skin_desc", ""),
        "anem": data_general.get("anemia_figure", ""),
        "allergy": data_general.get("allergy", ""),
        "allergy_desc": data_general.get("allergy_desc", ""),
        "ab_soft": data_general.get("abdomen_soft", ""),
        "ab_hard": data_general.get("abdomen_hard", ""),
        "ab_dist": data_general.get("abdomen_distended", ""),
        "ab_bowel": data_general.get("abdomen_bowel_sound", ""),
        "cns_con": data_general.get("cns_conscious", ""),
        "cns_ori": data_general.get("cns_oriented", ""),
        "cns_pl": data_general.get("cns_playful", ""),
        "cns_act": data_general.get("cns_active", ""),
        "cns_alrt": data_general.get("cns_alert", ""),
        "cns_spch": data_general.get("cns_speech", ""),
        "cns_spch_desc": data_general.get("cns_speech_desc", ""),
        "past_med": data_general.get("past_medical", ""),
        "past_surg": data_general.get("past_surgical", ""),
        "bp": data_general.get("bp", ""),
        "pulse": data_general.get("pulse", ""),
        "hip": data_general.get("hip", ""),
        "waist": data_general.get("waist", ""),
    }

# New endpoint to generate a Word report using the submitted data
@app.route('/api/generate_report', methods=['GET'])
def generate_report():
    patient_id = request.args.get("patientId")
    if not patient_id:
        return jsonify({"error": "patientId query parameter is required."}), 400
    db = SessionLocal()
    try:
        query = text("SELECT * FROM patient_records WHERE pid = :pid")
        result = db.execute(query, {"pid": patient_id})
        record = result.fetchone()
        if not record:
            return jsonify({"error": "Patient record not found."}), 404

        patient_record = {k: v for k, v in record._mapping.items()}
        patient = translate_record(record)
        template_path = "template.docx"
        doc = DocxTemplate(template_path)
        context = {}

        # Standard processing for general data
        for key, value in patient_record.items():
            if key == "photo" and value:
                if isinstance(value, bytes):
                    img_bytes = value
                else:
                    img_str = value.split(",")[1] if value.startswith("data:image") else value
                    img_bytes = base64.b64decode(img_str)
                
                image = Image.open(BytesIO(img_bytes)).convert("RGB")
                
                # Process image to properly handle orientation and create a circular crop
                cropped_stream = crop_image_circle(image, 144)
                context[key] = InlineImage(doc, cropped_stream, width=Inches(1.5))
            else:
                context[key] = str(value) if value is not None else ""

        # Compute remaining and selected teeth for each subgroup
        perm_group1 = ["18", "17", "16", "15", "14", "13", "12", "11"]
        perm_group2 = ["21", "22", "23", "24", "25", "26", "27", "28"]
        perm_group3 = ["48", "47", "46", "45", "44", "43", "42", "41"]
        perm_group4 = ["31", "32", "33", "34", "35", "36", "37", "38"]

        prim_group1 = ["55", "54", "53", "52", "51"]
        prim_group2 = ["61", "62", "63", "64", "65"]
        prim_group3 = ["85", "84", "83", "82", "81"]
        prim_group4 = ["71", "72", "73", "74", "75"]

        # Get dental data from the patient record
        selected_perm = patient_record.get("tooth_perm", "")
        selected_prim = patient_record.get("tooth_prim", "")

        # Process the comma-separated lists
        selected_perm_list = selected_perm.split(",") if selected_perm else []
        selected_prim_list = selected_prim.split(",") if selected_prim else []
        
        # Clean up any extra spaces in teeth numbers
        selected_perm_list = [tooth.strip() for tooth in selected_perm_list]
        selected_prim_list = [tooth.strip() for tooth in selected_prim_list]

        # Keep the original variables for remaining teeth
        context["remaining_perm_group1"] = ", ".join([t for t in perm_group1 if t not in selected_perm_list])
        context["remaining_perm_group2"] = ", ".join([t for t in perm_group2 if t not in selected_perm_list])
        context["remaining_perm_group3"] = ", ".join([t for t in perm_group3 if t not in selected_perm_list])
        context["remaining_perm_group4"] = ", ".join([t for t in perm_group4 if t not in selected_perm_list])
        context["remaining_prim_group1"] = ", ".join([t for t in prim_group1 if t not in selected_prim_list])
        context["remaining_prim_group2"] = ", ".join([t for t in prim_group2 if t not in selected_prim_list])
        context["remaining_prim_group3"] = ", ".join([t for t in prim_group3 if t not in selected_prim_list])
        context["remaining_prim_group4"] = ", ".join([t for t in prim_group4 if t not in selected_prim_list])

        # Add selected teeth variables without red color formatting
        context["selected_perm_group1"] = ", ".join([t for t in perm_group1 if t in selected_perm_list])
        context["selected_perm_group2"] = ", ".join([t for t in perm_group2 if t in selected_perm_list])
        context["selected_perm_group3"] = ", ".join([t for t in perm_group3 if t in selected_perm_list])
        context["selected_perm_group4"] = ", ".join([t for t in perm_group4 if t in selected_perm_list])
        context["selected_prim_group1"] = ", ".join([t for t in prim_group1 if t in selected_prim_list])
        context["selected_prim_group2"] = ", ".join([t for t in prim_group2 if t in selected_prim_list])
        context["selected_prim_group3"] = ", ".join([t for t in prim_group3 if t in selected_prim_list])
        context["selected_prim_group4"] = ", ".join([t for t in prim_group4 if t in selected_prim_list])

        # DETAILED DEBUG INFORMATION
        logging.info(f"REPORT DATA FOR PATIENT {patient_id}:")
        logging.info(f"Original tooth_perm value: '{selected_perm}'")
        logging.info(f"Original tooth_prim value: '{selected_prim}'")
        logging.info(f"Selected perm list (parsed): {selected_perm_list}")
        logging.info(f"Selected prim list (parsed): {selected_prim_list}")
        
        # Log all context keys related to teeth
        for key, value in context.items():
            if "perm_group" in key or "prim_group" in key:
                logging.info(f"CONTEXT: {key} = '{value}'")

        doc.render(context)
        doc_io = BytesIO()
        doc.save(doc_io)
        doc_io.seek(0)
        logging.info(f"Report generated for patient {patient_id} using docxtpl.")
        return send_file(
            doc_io,
            as_attachment=True,
            download_name=f"{patient_record.get('name', 'Patient')}.docx",  # use patient's name
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        logging.error(f"Error generating report: {str(e)}")
        return jsonify({"error": "Failed to generate report."}), 500
    finally:
        db.close()

@app.route('/api/submit_patient', methods=['POST'])
def submit_patient():
    db = None  # Initialize db to avoid UnboundLocalError in except block
    try:
        data = request.json
        required_depts = ["it", "ent", "vision", "general", "dental"]
        missing = [dept for dept in required_depts if dept not in data or not data[dept]]
        if missing:
            return jsonify({"error": f"Missing data for departments: {', '.join(missing)}"}), 400

        # Process IT data and photo transformation
        it_data_raw = data["it"]
        it_photo = it_data_raw.get("photo")
        if it_photo and "," in it_photo:
            it_photo = it_photo.split(",")[1]
        it_data_raw["photo"] = it_photo if it_photo else None
        
        # Use transformation helper functions to convert old keys to new DB column names
        it_data = transform_it(data["it"])
        ent_data = transform_ent(data["ent"])
        vision_data = transform_vision(data["vision"])
        # Transform general data using our new helper:
        general_data = transform_general(data["general"])
        dental_data = transform_dental(data["dental"])

        try:
            capture_date = datetime.fromisoformat(data["captured_date"])
        except Exception:
            capture_date = datetime.now()

        # Build flat_data using only the transformed data
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

        db = SessionLocal()
        from sqlalchemy import text
        columns = ", ".join(flat_data.keys())
        values = ", ".join([":"+k for k in flat_data.keys()])
        query = text(f"INSERT INTO patient_records ({columns}) VALUES ({values})")
        
        db.execute(query, flat_data)
        db.commit()
        db.close()

        return jsonify({"message": "Patient data submitted successfully."}), 200
        
    except Exception as e:
        logging.error(f"Error saving patient data: {str(e)}")
        if db is not None:
            db.rollback()  # Rollback on error
            db.close()
        return jsonify({"error": "Failed to save patient data"}), 500

def get_last_patient_id():
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT MAX(CAST(pid AS INTEGER)) FROM patient_records"))
        last_id = result.scalar()
        db.close()
        return int(last_id) if last_id else 0
    except Exception as e:
        logging.error(f"Error getting last patient ID: {str(e)}")
        return 0

import uuid

def generate_unique_pid():
    """Generate a unique patient identifier combining timestamp and UUID"""
    timestamp = datetime.now().strftime("%Y%m%d")
    unique_part = str(uuid.uuid4())[:8]  # First 8 chars of UUID
    return f"PID-{timestamp}-{unique_part}"

@app.route('/api/generate_patient_id', methods=['POST'])
def generate_patient_id():
    try:
        # Create a new PID and verify it doesn't exist in the database
        db = SessionLocal()
        max_attempts = 5  # Safety limit to prevent infinite loop
        
        for _ in range(max_attempts):
            # Generate a unique PID
            new_pid = generate_unique_pid()
            
            # Check if this PID already exists in the database
            query = text("SELECT COUNT(*) FROM patient_records WHERE pid = :pid")
            result = db.execute(query, {"pid": new_pid}).scalar()
            
            if result == 0:  # PID doesn't exist in database
                db.close()
                logging.info(f"Generated new unique patient ID: {new_pid}")
                socketio.emit('newPatientId', new_pid)
                return jsonify({"patientId": new_pid, "success": True}), 200
        
        # If we reached here, we couldn't generate a unique ID after multiple attempts
        db.close()
        logging.error("Failed to generate a unique patient ID after multiple attempts")
        return jsonify({"error": "Failed to generate a unique patient ID", "success": False}), 500
        
    except Exception as e:
        if 'db' in locals():
            db.close()
        logging.error(f"Error generating patient ID: {str(e)}")
        return jsonify({"error": "Failed to generate patient ID", "success": False}), 500

def convert_value(value):
    # If value is a memoryview or binary data, convert its bytes to a Base64 string.
    if isinstance(value, (memoryview, bytes)):
        return base64.b64encode(value).decode('utf-8')
    return value

# Add a helper function to translate record keys:
def translate_record(record):
    mapping = record._mapping
    return {
        "patientId": mapping.get("pid", ""),
        "name": mapping.get("name", ""),
        "div": mapping.get("div", ""),
        "rollNo": mapping.get("roll", ""),
        "adminNo": mapping.get("admin", ""),
        "fatherName": mapping.get("father", ""),
        "motherName": mapping.get("mother", ""),
        "address": mapping.get("addr", ""),
        "mobile": mapping.get("mob", ""),
        "dob": mapping.get("dob", ""),
        "captured_date": mapping.get("cap_dt", ""),
        "gender": mapping.get("gen", ""),
        "bloodGroup": mapping.get("blood", ""),
        "medicalOfficer": mapping.get("medical_officer", ""),
        "photo": mapping.get("photo", ""),
        # (Optional) add subgroup objects if needed for detail pages:
        "ent": {
            "leftEar": mapping.get("le_def", ""),
            "rightEar": mapping.get("re_def", "")
            # add additional ENT fields as desired
        },
        "vision": {
            "rightVision": mapping.get("rev", ""),
            "leftVision": mapping.get("lev", "")
        },
        "general": {
            "height": mapping.get("ht", ""),
            "weight": mapping.get("wt", ""),
            "bmi": mapping.get("bmi", ""),
            "nails": mapping.get("nails", ""),
            "hair": mapping.get("hair", ""),
            "skin": mapping.get("skin", "")
        },
        "dental": {
            "extraOral": mapping.get("dental_ext", ""),
            "toothCavityPermanent": mapping.get("tooth_perm", ""),
            "toothCavityPrimary": mapping.get("tooth_prim", "")
        }
    }

@app.route('/api/patients', methods=['GET'])
def get_patients():
    db = SessionLocal()
    try:
        query = text("SELECT * FROM patient_records ORDER BY pid DESC")
        result = db.execute(query)
        patients = [translate_record(row) for row in result]
        for patient in patients:
            if patient.get("photo"):
                patient["photo"] = f"data:image/jpeg;base64,{patient['photo']}"
        return jsonify(patients=patients), 200
    except Exception as e:
        logging.error(f"Error retrieving patients: {str(e)}")
        return jsonify({"error": "Error retrieving patients"}), 500
    finally:
        db.close()

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

@socketio.on('photoDelete')
def handle_photo_delete():
    print(f"Broadcasting photo deletion")
    emit('photoDelete', broadcast=True)

@socketio.on('photoUpdate')
def handle_photo_update(data):
    print(f"Broadcasting photo update")
    emit('photoUpdate', data, broadcast=True)

@socketio.on('departmentUpdate')
def handle_department_update(data):
    print(f"Broadcasting department update")
    emit('departmentUpdate', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
