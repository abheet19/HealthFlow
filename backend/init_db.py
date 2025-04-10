from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create database URL from environment variables
postgres_user = os.environ.get("POSTGRES_USER")
postgres_password = os.environ.get("POSTGRES_PASSWORD")
postgres_db = os.environ.get("POSTGRES_DB")
postgres_host = os.environ.get("POSTGRES_HOST", "localhost")
postgres_port = os.environ.get("POSTGRES_PORT", "5432")
if not (postgres_user and postgres_password and postgres_db):
    raise EnvironmentError("Missing required PostgreSQL environment variables.")
DATABASE_URL = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

def init_db():
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Create table
    create_table_query = """
    CREATE TABLE IF NOT EXISTS patient_records (
        id SERIAL PRIMARY KEY,
        pid VARCHAR(30) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(100),
        div VARCHAR(50),
        roll VARCHAR(50),
        admin VARCHAR(50),
        father VARCHAR(100),
        mother VARCHAR(100),
        mob VARCHAR(20),
        dob DATE,
        cap_dt DATE,
        gen VARCHAR(10),
        blood VARCHAR(5),
        medical_officer VARCHAR(100),
        photo TEXT,
        
        -- ENT Department fields (shortened)
        le_def VARCHAR(10),
        le_wax VARCHAR(10),
        le_tm VARCHAR(10),
        le_dis VARCHAR(10),
        le_nh VARCHAR(10),
        re_def VARCHAR(10),
        re_wax VARCHAR(10),
        re_tm VARCHAR(10),
        re_dis VARCHAR(10),
        re_nh VARCHAR(10),
        ln_obs VARCHAR(10),
        ln_dis VARCHAR(10),
        rn_obs VARCHAR(10),
        rn_dis VARCHAR(10),
        th_pain VARCHAR(10),
        neck VARCHAR(10),
        tons VARCHAR(20),
        
        -- Vision Department fields (shortened)
        rev VARCHAR(10),
        lev VARCHAR(10),
        rcb VARCHAR(10),
        lcb VARCHAR(10),
        rsq VARCHAR(10),
        lsq VARCHAR(10),
        
        -- General Department fields (shortened)
        ht VARCHAR(10),
        wt VARCHAR(10),
        bmi VARCHAR(10),
        nails VARCHAR(20),
        nails_desc TEXT, -- Added field for nails abnormality description
        hair VARCHAR(20),
        hair_desc TEXT, -- Added field for hair abnormality description
        skin VARCHAR(20),
        skin_desc TEXT, -- Added field for skin abnormality description
        anem VARCHAR(20),
        allergy VARCHAR(10),
        allergy_desc TEXT, -- Added field for allergy description
        ab_soft VARCHAR(10),
        ab_hard VARCHAR(10),
        ab_dist VARCHAR(10),
        ab_bowel VARCHAR(10),
        cns_con VARCHAR(10),
        cns_ori VARCHAR(10),
        cns_pl VARCHAR(10),
        cns_act VARCHAR(10),
        cns_alrt VARCHAR(10),
        cns_spch VARCHAR(10),
        cns_spch_desc TEXT, -- Added field for speech abnormality description
        past_med VARCHAR(10),
        past_surg VARCHAR(10),
        bp VARCHAR(20),
        pulse VARCHAR(20),
        hip VARCHAR(20),
        waist VARCHAR(20),
        
        -- Dental Department fields (shortened)
        dental_ext VARCHAR(20),
        dental_rmk TEXT, -- Dental remarks field
        tooth_perm TEXT,
        tooth_prim TEXT,
        plaque VARCHAR(10),
        gum_inf VARCHAR(10),
        stains VARCHAR(10),
        tooth_disc VARCHAR(10),
        tarter VARCHAR(10),
        bad_brth VARCHAR(10),
        gum_bleed VARCHAR(10),
        soft_tiss VARCHAR(20),
        fluor VARCHAR(10),
        maloccl VARCHAR(10),
        root_stmp VARCHAR(10),
        miss_teeth VARCHAR(10)
    );
    """
    
    with engine.connect() as conn:
        conn.execute(text(create_table_query))
        conn.commit()
        print("Database table created successfully!")

if __name__ == "__main__":
    init_db()
