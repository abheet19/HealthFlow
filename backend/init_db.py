from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create database URL from environment variables
DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

def init_db():
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Create table
    create_table_query = """
    CREATE TABLE IF NOT EXISTS patient_records (
        id SERIAL PRIMARY KEY,
        patient_id VARCHAR(10) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(100),
        div VARCHAR(50),
        rollno VARCHAR(50),          /* Changed from roll_no */
        adminno VARCHAR(50),         /* Changed from admin_no */
        fathername VARCHAR(100),     /* Changed from father_name */
        mothername VARCHAR(100),     /* Changed from mother_name */
        address TEXT,
        mobile VARCHAR(20),
        dob DATE,
        gender VARCHAR(10),
        bloodgroup VARCHAR(5),       /* Changed from blood_group */
        photo BYTEA,                 /* Column to store the binary image data */
        
        -- ENT Department fields
        left_ear_deformity VARCHAR(10),
        left_ear_wax VARCHAR(10),
        left_ear_tympanic_membrane VARCHAR(10),
        left_ear_discharge VARCHAR(10),
        left_ear_normal_hearing VARCHAR(10),
        right_ear_deformity VARCHAR(10),
        right_ear_wax VARCHAR(10),
        right_ear_tympanic_membrane VARCHAR(10),
        right_ear_discharge VARCHAR(10),
        right_ear_normal_hearing VARCHAR(10),
        left_nose_obstruction VARCHAR(10),
        left_nose_discharge VARCHAR(10),
        right_nose_obstruction VARCHAR(10),
        right_nose_discharge VARCHAR(10),
        throat VARCHAR(10),
        throat_pain VARCHAR(10),
        neck_nodes VARCHAR(10),
        tonsils VARCHAR(20),
        
        -- Vision Department fields
        re_vision VARCHAR(10),
        le_vision VARCHAR(10),
        re_color_blindness VARCHAR(10),
        le_color_blindness VARCHAR(10),
        re_squint VARCHAR(10),
        le_squint VARCHAR(10),
        
        -- General Department fields
        height VARCHAR(10),
        weight VARCHAR(10),
        bmi VARCHAR(10),
        nails VARCHAR(20),
        hair VARCHAR(20),
        skin VARCHAR(20),
        anemia_figure VARCHAR(20),
        allergy VARCHAR(10),
        abdomen_soft VARCHAR(10),
        abdomen_hard VARCHAR(10),
        abdomen_distended VARCHAR(10),
        abdomen_bowel_sound VARCHAR(10),
        cns_conscious VARCHAR(10),
        cns_oriented VARCHAR(10),
        cns_playful VARCHAR(10),
        cns_active VARCHAR(10),
        cns_alert VARCHAR(10),
        cns_speech VARCHAR(10),
        past_medical VARCHAR(10),
        past_surgical VARCHAR(10),
        bp VARCHAR(20),
        pulse VARCHAR(20),
        hip VARCHAR(20),
        waist VARCHAR(20),
        
        -- Dental Department fields
        dental_extra_oral VARCHAR(20),
        tooth_cavity_permanent TEXT,
        tooth_cavity_primary TEXT,
        plaque VARCHAR(10),
        gum_inflammation VARCHAR(10),
        stains VARCHAR(10),
        tooth_discoloration VARCHAR(10),
        tarter VARCHAR(10),
        bad_breath VARCHAR(10),
        gum_bleeding VARCHAR(10),
        soft_tissue VARCHAR(20),
        fluorosis VARCHAR(10),
        malocclusion VARCHAR(10),
        root_stump VARCHAR(10),
        missing_teeth VARCHAR(10)
    );
    """
    
    with engine.connect() as conn:
        conn.execute(text(create_table_query))
        conn.commit()
        print("Database table created successfully!")

if __name__ == "__main__":
    init_db()
