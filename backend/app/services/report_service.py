import os
import logging
import base64
from io import BytesIO
from PIL import Image
from docxtpl import DocxTemplate, InlineImage
from docx.shared import Inches
from sqlalchemy.orm import Session
from app.utils import crop_image_circle, process_teeth_data

class ReportService:
    @staticmethod
    def generate_word_report(db: Session, patient_record: dict, template_path: str = "template.docx"):
        try:
            doc = DocxTemplate(template_path)
            context = {}

            for key, value in patient_record.items():
                if key == "photo" and value:
                    if isinstance(value, bytes):
                        img_bytes = value
                    else:
                        img_str = value.split(",")[1] if value.startswith("data:image") else value
                        img_bytes = base64.b64decode(img_str)
                    
                    image = Image.open(BytesIO(img_bytes)).convert("RGB")
                    cropped_stream = crop_image_circle(image, 144)
                    context[key] = InlineImage(doc, cropped_stream, width=Inches(1.5))
                else:
                    context[key] = str(value) if value is not None else ""

            context["nails_description"] = patient_record.get("nails_desc", "")
            context["hair_description"] = patient_record.get("hair_desc", "")
            context["skin_description"] = patient_record.get("skin_desc", "")
            context["allergy_description"] = patient_record.get("allergy_desc", "")
            context["speech_description"] = patient_record.get("cns_spch_desc", "")

            teeth_context = process_teeth_data(patient_record)
            context.update(teeth_context)

            doc.render(context)
            doc_io = BytesIO()
            doc.save(doc_io)
            doc_io.seek(0)
            
            return doc_io, patient_record.get('name', 'Patient')
        except Exception as e:
            logging.error(f"Error generating report: {str(e)}")
            raise e

    @staticmethod
    def generate_pdf_report(db: Session, patient_record: dict, template_path: str = "template.docx"):
        try:
            doc_io, patient_name = ReportService.generate_word_report(db, patient_record, template_path)
            
            from tempfile import mkdtemp
            import shutil
            import subprocess
            
            try:
                temp_dir = mkdtemp()
                docx_path = os.path.join(temp_dir, f"{patient_name}.docx")
                pdf_path = os.path.join(temp_dir, f"{patient_name}.pdf")
                
                with open(docx_path, 'wb') as f:
                    f.write(doc_io.getvalue())
                
                # Use unoconv for cross-platform conversion
                try:
                    subprocess.run(['unoconv', '-f', 'pdf', '-o', pdf_path, docx_path], check=True)
                except subprocess.CalledProcessError as e:
                    logging.error(f"PDF conversion failed: {str(e)}")
                    doc_io.seek(0)
                    return doc_io, patient_name
                
                if os.path.exists(pdf_path):
                    with open(pdf_path, 'rb') as pdf_file:
                        pdf_data = pdf_file.read()
                    
                    # Clean up temp files immediately
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    
                    # Return the PDF data directly, no caching
                    return BytesIO(pdf_data), patient_name
                else:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    doc_io.seek(0)
                    return doc_io, patient_name
                    
            except Exception as pdf_error:
                logging.error(f"PDF conversion error: {str(pdf_error)}")
                
                if 'temp_dir' in locals():
                    shutil.rmtree(temp_dir, ignore_errors=True)
                
                doc_io.seek(0)
                return doc_io, patient_name
                
        except Exception as e:
            logging.error(f"Error generating PDF report: {str(e)}")
            raise e