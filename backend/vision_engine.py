import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
import time
import cv2
import numpy as np
import easyocr

load_dotenv()

try:
    print("Loading EasyOCR model...")
    reader = easyocr.Reader(['en'])
    print("EasyOCR model loaded globally.")
except Exception as e:
    print(f"Failed to load EasyOCR: {e}")
    reader = None

def scan_label_nutrition(image_bytes: bytes) -> dict:
    """
    Uses Gemini Vision API to extract nutrition information from a food label image.
    Uses the EXACT logic and Model from the working 'se' folder.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY is not set.")
        return {}

    genai.configure(api_key=api_key)
    
    # Use the latest model from models_list.txt for best performance
    model_name = 'models/gemini-2.5-flash'
    model = genai.GenerativeModel(model_name)

    # Detect mime type from the working project
    mime_type = "image/jpeg"
    if image_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        mime_type = "image/png"

    prompt = """
    Extract nutrition information from this food label image.
    
    CRITICAL INSTRUCTIONS FOR UNCLEAR IMAGES:
    - The image may be blurry, poorly lit, obscured, or hard to read. You MUST attempt extraction.
    - If a number is slightly blurry but you can reasonably guess it (e.g. looks like an '8' or '0'), make your best educated guess based on context. 
    - Exert maximum effort to find Calories, Carbs, Fat, and Protein.
    - If a specific field is completely invisible/unreadable, return null for that specific field. DO NOT fail the entire response.
    
    Return ONLY a raw JSON object with these fields exactly:
    {
      "product_name": string or null,
      "serving_size": string or null,
      "calories": float or null,
      "carbs": float or null,
      "sugar": float or null,
      "sodium": float or null,
      "fat": float or null,
      "saturated_fat": float or null,
      "protein": float or null,
      "fiber": float or null
    }

    Rules:
    - Extract values as raw numbers where possible (e.g. 250 instead of "250kcal").
    - Do NOT wrap in markdown, just output valid JSON.
    """

    for attempt in range(4):
        try:
            # Pass image and prompt to the model (Proven Logic)
            response = model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ])
            
            response_text = response.text.strip()
            
            # Robust JSON extraction
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
                
            data = json.loads(response_text)
            
            # The exact 'safe_float' from the working project
            def safe_float(val):
                if val is None: return 0.0
                if isinstance(val, (int, float)): return float(val)
                try:
                    match = re.search(r'\d+(\.\d+)?', str(val))
                    if match: return float(match.group(0))
                    return 0.0
                except: return 0.0

            # Normalize to current backend schema
            return {
                "name": str(data.get("product_name") or "Scanned Product"),
                "serving_size": str(data.get("serving_size") or "N/A"),
                "calories": safe_float(data.get("calories")),
                "carbs": safe_float(data.get("carbs")),
                "sugar": safe_float(data.get("sugar")),
                "sodium": safe_float(data.get("sodium")),
                "fat": safe_float(data.get("fat")),
                "sat_fat": safe_float(data.get("saturated_fat")),
                "protein": safe_float(data.get("protein")),
                "fiber": safe_float(data.get("fiber")),
                "scientific_rationale": "Extracted from product packaging via AI Vision.",
                "portion_advice": f"Recommended serving: {data.get('serving_size', 'as per label')}",
                "specific_warnings": [],
                "healthier_swaps": []
            }

        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"Vision API Rate Limited (Attempt {attempt+1}/4). Waiting {2 * (attempt + 1)}s...")
                time.sleep(2 * (attempt + 1))
                continue
            
            # If 2.5-flash fails because it's too new/unstable, try 1.5-flash as final fallback
            if attempt < 2 and model_name == 'models/gemini-2.5-flash':
                print(f"Model {model_name} failed. Falling back to gemini-1.5-flash...")
                model = genai.GenerativeModel('models/gemini-1.5-flash')
                model_name = 'models/gemini-1.5-flash'
                continue

            print(f"Gemini Scanner Exception: {e}")
            break
            
    return {}

def scan_medical_report(file_bytes: bytes, content_type: str = "image/jpeg") -> dict:
    """
    Uses EasyOCR locally for image reports. If it's a PDF, or if OCR fails, 
    falls back to Gemini Vision API.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY is not set.")
        return {}

    genai.configure(api_key=api_key)
    
    model_name = 'models/gemini-2.5-flash'
    model = genai.GenerativeModel(model_name)

    mime_type = content_type
    if not mime_type or "octet-stream" in mime_type:
        # Fallback detection
        if file_bytes.startswith(b'%PDF'):
            mime_type = "application/pdf"
        elif file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
            mime_type = "image/png"
        else:
            mime_type = "image/jpeg"

    # --- Step 1: Attempt local OCR if it's an image ---
    ocr_text = ""
    use_vision_fallback = False

    if "image" in mime_type and reader is not None:
        try:
            print("Beginning local OCR extraction via EasyOCR...")
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is not None:
                results = reader.readtext(img)
                ocr_text = " ".join([text for _, text, _ in results])
                if len(ocr_text.strip()) < 50:
                    print("OCR returned too little text. Falling back to Gemini Vision.")
                    use_vision_fallback = True
                else:
                    print(f"OCR Successful. Extracted {len(ocr_text)} characters.")
            else:
                print("Failed to decode image with cv2. Falling back to Gemini Vision.")
                use_vision_fallback = True
        except Exception as e:
            print(f"OCR Error: {e}. Falling back to Gemini Vision.")
            use_vision_fallback = True
    else:
        print(f"Skipping OCR (Mime type: {mime_type}). Using Gemini Vision directly.")
        use_vision_fallback = True

    # --- Step 2: Use LLM to structure data ---
    prompt = """
    You are a meticulous medical data extractor. Your task is to process the provided medical report and extract EVERY SINGLE clinical parameter, laboratory result, and biomarker.
    
    CRITICAL INSTRUCTIONS:
    1. EXRACT ALL FINDINGS: Scan for numeric metrics like Glucose, HbA1c, Cholesterol (Total, HDL, LDL), Triglycerides, Blood Pressure (Systolic/Diastolic), Hemoglobin, WBC count, BMI, Weight, Height, Creatinine, Liver Function Tests (Total Protein, Albumin, Globulin, Bilirubin, SGOT, SGPT, Alkaline Phosphatase, GGTP), etc.
    2. KEY NORMALIZATION: Use lowercase with underscores for keys (e.g., 'fasting_glucose', 'hba1c', 'systolic_bp', 'total_cholesterol', 'sgot', 'sgpt', 'albumin', 'bilirubin_total').
    3. VALUES: Extract the numeric value.
    4. DATE: Look for the report date and return it in 'YYYY-MM-DD' format if found, under the key 'report_date'.
    5. IMAGE QUALITY: If the image is blurry or hard to read, make your best educated guess for the numbers based on context. 
    
    Return ONLY a raw JSON object. Do NOT include markdown formatting or explanations.
    Example Structure:
    {
      "report_date": "2024-03-25",
      "hba1c": 5.7,
      "fasting_glucose": 110,
      "systolic_bp": 120,
      "diastolic_bp": 80,
      "total_cholesterol": 190,
      "sgpt": 12,
      "albumin": 3.0,
      "bilirubin_total": 1.1
    }
    """

    for attempt in range(3):
        try:
            if not use_vision_fallback and ocr_text:
                text_prompt = prompt + f"\n\nHere is the raw OCR text extracted from the report:\n{ocr_text[:8000]}"
                response = model.generate_content(text_prompt)
            else:
                response = model.generate_content([
                    prompt,
                    {"mime_type": mime_type, "data": file_bytes}
                ])
            
            response_text = response.text.strip()
            
            # Extract JSON from potential chatter
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
                
            data = json.loads(response_text)
            return data

        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                time.sleep(2 * (attempt + 1))
                continue
            
            if attempt < 1 and model_name == 'models/gemini-2.5-flash':
                model = genai.GenerativeModel('models/gemini-1.5-flash')
                model_name = 'models/gemini-1.5-flash'
                continue

            print(f"Gemini Report Scanner Exception: {e}")
            break
            
    return {}
