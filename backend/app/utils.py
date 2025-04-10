from io import BytesIO
import base64
import uuid
from datetime import datetime
from PIL import Image, ImageDraw, ImageOps, ExifTags
from docxtpl import InlineImage

# Data transformation helpers
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

def translate_record(record):
    """Translates a database record to the frontend format"""
    if hasattr(record, '_mapping'):
        mapping = record._mapping
    else:
        mapping = record
        
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

def generate_unique_pid():
    """Generate a unique patient identifier combining timestamp and UUID"""
    timestamp = datetime.now().strftime("%Y%m%d")
    unique_part = str(uuid.uuid4())[:8]  # First 8 chars of UUID
    return f"PID-{timestamp}-{unique_part}"

def process_teeth_data(patient_record):
    """Process teeth data for report generation"""
    # Permanent teeth groups
    perm_group1 = ["18", "17", "16", "15", "14", "13", "12", "11"]
    perm_group2 = ["21", "22", "23", "24", "25", "26", "27", "28"]
    perm_group3 = ["48", "47", "46", "45", "44", "43", "42", "41"]
    perm_group4 = ["31", "32", "33", "34", "35", "36", "37", "38"]

    # Primary teeth groups
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

    # Build context for teeth groups
    teeth_context = {
        "remaining_perm_group1": ", ".join([t for t in perm_group1 if t not in selected_perm_list]),
        "remaining_perm_group2": ", ".join([t for t in perm_group2 if t not in selected_perm_list]),
        "remaining_perm_group3": ", ".join([t for t in perm_group3 if t not in selected_perm_list]),
        "remaining_perm_group4": ", ".join([t for t in perm_group4 if t not in selected_perm_list]),
        "remaining_prim_group1": ", ".join([t for t in prim_group1 if t not in selected_prim_list]),
        "remaining_prim_group2": ", ".join([t for t in prim_group2 if t not in selected_prim_list]),
        "remaining_prim_group3": ", ".join([t for t in prim_group3 if t not in selected_prim_list]),
        "remaining_prim_group4": ", ".join([t for t in prim_group4 if t not in selected_prim_list]),
        "selected_perm_group1": ", ".join([t for t in perm_group1 if t in selected_perm_list]),
        "selected_perm_group2": ", ".join([t for t in perm_group2 if t in selected_perm_list]),
        "selected_perm_group3": ", ".join([t for t in perm_group3 if t in selected_perm_list]),
        "selected_perm_group4": ", ".join([t for t in perm_group4 if t in selected_perm_list]),
        "selected_prim_group1": ", ".join([t for t in prim_group1 if t in selected_prim_list]),
        "selected_prim_group2": ", ".join([t for t in prim_group2 if t in selected_prim_list]),
        "selected_prim_group3": ", ".join([t for t in prim_group3 if t in selected_prim_list]),
        "selected_prim_group4": ", ".join([t for t in prim_group4 if t in selected_prim_list])
    }
    
    return teeth_context

def validate_fields(data, required_fields):
    """Validate required fields in a data dictionary"""
    missing = [field for field in required_fields if field not in data or data[field] in [None, ""]]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"
    return True, ""