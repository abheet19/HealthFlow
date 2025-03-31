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
        pid VARCHAR(10) NOT NULL UNIQUE,         # patient_id -> pid
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(100),
        div VARCHAR(50),
        roll VARCHAR(50),                          # roll_no -> roll
        admin VARCHAR(50),                         # admin_no -> admin
        father VARCHAR(100),                       # father_name -> father
        mother VARCHAR(100),                       # mother_name -> mother
        addr TEXT,                                 # address -> addr
        mob VARCHAR(20),                           # mobile -> mob
        dob DATE,
        cap_dt DATE,                               # capture_date -> cap_dt
        gen VARCHAR(10),                           # gender -> gen
        blood VARCHAR(5),                          # blood_group -> blood
        photo TEXT,
        
        -- ENT Department fields (shortened)
        le_def VARCHAR(10),                        # left_ear_deformity -> le_def
        le_wax VARCHAR(10),                        # left_ear_wax -> le_wax
        le_tm VARCHAR(10),                         # left_ear_tympanic_membrane -> le_tm
        le_dis VARCHAR(10),                        # left_ear_discharge -> le_dis
        le_nh VARCHAR(10),                         # left_ear_normal_hearing -> le_nh
        re_def VARCHAR(10),                        # right_ear_deformity -> re_def
        re_wax VARCHAR(10),                        # right_ear_wax -> re_wax
        re_tm VARCHAR(10),                         # right_ear_tympanic_membrane -> re_tm
        re_dis VARCHAR(10),                        # right_ear_discharge -> re_dis
        re_nh VARCHAR(10),                         # right_ear_normal_hearing -> re_nh
        ln_obs VARCHAR(10),                        # left_nose_obstruction -> ln_obs
        ln_dis VARCHAR(10),                        # left_nose_discharge -> ln_dis
        rn_obs VARCHAR(10),                        # right_nose_obstruction -> rn_obs
        rn_dis VARCHAR(10),                        # right_nose_discharge -> rn_dis
        throat VARCHAR(10),
        th_pain VARCHAR(10),                       # throat_pain -> th_pain
        neck VARCHAR(10),                          # neck_nodes -> neck
        tons VARCHAR(20),                          # tonsils -> tons
        
        -- Vision Department fields (shortened)
        rev VARCHAR(10),                           # re_vision -> rev
        lev VARCHAR(10),                           # le_vision -> lev
        rcb VARCHAR(10),                           # re_color_blindness -> rcb
        lcb VARCHAR(10),                           # le_color_blindness -> lcb
        rsq VARCHAR(10),                           # re_squint -> rsq
        lsq VARCHAR(10),                           # le_squint -> lsq
        
        -- General Department fields (shortened)
        ht VARCHAR(10),                            # height -> ht
        wt VARCHAR(10),                            # weight -> wt
        bmi VARCHAR(10),
        nails VARCHAR(20),
        hair VARCHAR(20),
        skin VARCHAR(20),
        anem VARCHAR(20),                          # anemia_figure -> anem
        allergy VARCHAR(10),
        ab_soft VARCHAR(10),                       # abdomen_soft -> ab_soft
        ab_hard VARCHAR(10),                       # abdomen_hard -> ab_hard
        ab_dist VARCHAR(10),                       # abdomen_distended -> ab_dist
        ab_bowel VARCHAR(10),                      # abdomen_bowel_sound -> ab_bowel
        cns_con VARCHAR(10),                       # cns_conscious -> cns_con
        cns_ori VARCHAR(10),                       # cns_oriented -> cns_ori
        cns_pl VARCHAR(10),                        # cns_playful -> cns_pl
        cns_act VARCHAR(10),                       # cns_active -> cns_act
        cns_alrt VARCHAR(10),                      # cns_alert -> cns_alrt
        cns_spch VARCHAR(10),                      # cns_speech -> cns_spch
        past_med VARCHAR(10),                      # past_medical -> past_med
        past_surg VARCHAR(10),                     # past_surgical -> past_surg
        bp VARCHAR(20),
        pulse VARCHAR(20),
        hip VARCHAR(20),
        waist VARCHAR(20),
        
        -- Dental Department fields (shortened)
        dental_ext VARCHAR(20),                    # dental_extra_oral -> dental_ext
        tooth_perm TEXT,                           # tooth_cavity_permanent -> tooth_perm
        tooth_prim TEXT,                           # tooth_cavity_primary -> tooth_prim
        plaque VARCHAR(10),
        gum_inf VARCHAR(10),                       # gum_inflammation -> gum_inf
        stains VARCHAR(10),
        tooth_disc VARCHAR(10),                    # tooth_discoloration -> tooth_disc
        tarter VARCHAR(10),
        bad_brth VARCHAR(10),                      # bad_breath -> bad_brth
        gum_bleed VARCHAR(10),                     # gum_bleeding -> gum_bleed
        soft_tiss VARCHAR(20),                     # soft_tissue -> soft_tiss
        fluor VARCHAR(10),                         # fluorosis -> fluor
        maloccl VARCHAR(10),                       # malocclusion -> maloccl
        root_stmp VARCHAR(10),                     # root_stump -> root_stmp
        miss_teeth VARCHAR(10)                     # missing_teeth -> miss_teeth
    );
    """
    
    with engine.connect() as conn:
        conn.execute(text(create_table_query))
        conn.commit()
        print("Database table created successfully!")

if __name__ == "__main__":
    init_db()
