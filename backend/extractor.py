import re
import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# We need an explicit fallback if Groq fails or API key is missing.
def regex_fallback(raw_text: str) -> dict:
    parameters = {}
    
    # Define a broad mapping of common medical keywords to standardized keys
    patterns = {
        'blood_pressure': r'(?i)(bp|blood\s*pressure|b/p)[\s:-]*(\d{2,3}\s*/\s*\d{2,3})',
        'systolic_bp': r'(?i)(systolic|sys)[^\d]*([\d\.]+)',
        'diastolic_bp': r'(?i)(diastolic|dia)[^\d]*([\d\.]+)',
        'hemoglobin': r'(?i)(hemoglobin|hb|hgb|heamoglobin)[^\d]*([\d\.]+)',
        'fasting_glucose': r'(?i)(fasting\s*glucose|fasting\s*sugar|fbs)[^\d]*([\d\.]+)',
        'hba1c': r'(?i)(hba1c|glycated\s*hemoglobin)[^\d]*([\d\.]+)',
        'cholesterol': r'(?i)(cholesterol|chol)[^\d]*([\d\.]+)',
        'hdl': r'(?i)(hdl|high\s*density\s*lipoprotein)[^\d]*([\d\.]+)',
        'ldl': r'(?i)(ldl|low\s*density\s*lipoprotein)[^\d]*([\d\.]+)',
        'triglycerides': r'(?i)(triglycerides|tg)[^\d]*([\d\.]+)',
        'creatinine': r'(?i)(creatinine|creat)[^\d]*([\d\.]+)',
        'bmi': r'(?i)(bmi|body mass index)[^\d]*([\d\.]+)',
        'weight': r'(?i)(weight|wt)[^\d]*([\d\.]+)',
        'height': r'(?i)(height|ht)[^\d]*([\d\.]+)',
        'uric_acid': r'(?i)(uric\s*acid)[^\d]*([\d\.]+)',
        'tsh': r'(?i)(tsh|thyroid\s*stimulating\s*hormone)[^\d]*([\d\.]+)',
        'wbc_count': r'(?i)(wbc|white\s*blood\s*cells?|leukocytes)[^\d]*([\d\.]+)',
        'report_date': r'(?i)(date|dated)[\s:-]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})',
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, raw_text)
        if match:
            # For blood pressure, we take group 2; for others, it's also group 2
            parameters[key] = match.group(2).strip()
            
    return parameters
    

def extract_parameters(raw_text: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not raw_text.strip():
        # Fallback to regex immediately if no key or no text
        return regex_fallback(raw_text)

    client = Groq(api_key=api_key)
    
    prompt = f"""
    You are a meticulous medical data extractor. Your task is to process the following raw OCR text and extract EVERY SINGLE medical parameter, vital sign, biomarker, and lab result present.
    
    CRITICAL INSTRUCTIONS:
    1. EXTRACT ALL FINDINGS: Do not omit anything. If it's a numeric metric with a medical label (e.g., HbA1c, LDL, Glucose, Creatinine, Vitamin D, etc.), extract it.
    2. KEY NORMALIZATION: Use lowercase with underscores for keys (e.g., 'fasting_glucose', 'hba1c', 'systolic_bp'). 
    3. VALUES & UNITS: Include the numeric value and the units if available (e.g., '12.5 g/dL', '120/80 mmHg').
    4. STRUCTURE: Return ONLY a valid JSON dictionary where keys are the parameter names and values are the extracted results.
    5. NO CONTEXT: Do not include any explanations, markdown formatting, or preamble. Just raw JSON.

    Raw OCR Text:
    {raw_text[:5000]}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile", 
            temperature=0.1,
        )
        response = chat_completion.choices[0].message.content.strip()
        
        # Bulletproof JSON extraction from LLM response
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            response = match.group(0)
            
        data = json.loads(response.strip())
        if not isinstance(data, dict):
             return regex_fallback(raw_text)
        return data
    except Exception as e:
        print(f"Groq Extraction failed: {e}")
        return regex_fallback(raw_text)
