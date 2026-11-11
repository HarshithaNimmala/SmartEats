import sys
import os
import json

# Add current directory to path if needed (e.g. if running from backend folder)
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from extractor import extract_parameters, regex_fallback

test_text = """
REPORT SUMMARY
Patient: John Doe
Fasting Glucose 126.0 mg/dL
Hdl 245.0
Bmi 127.5
Systolic Bp 140.0
Ldl 2140.0
Creatinine 21.1 mg/L
Cholesterol 210.0
Triglycerides 180.0
HbA1c 6.5 %
Hemoglobin 14.2 g/dL
"""

print("--- Testing Regex Fallback ---")
regex_results = regex_fallback(test_text)
print(json.dumps(regex_results, indent=4))

# We only test LLM if the API key is present
if os.getenv("GROQ_API_KEY"):
    print("\n--- Testing LLM Extraction ---")
    llm_results = extract_parameters(test_text)
    print(json.dumps(llm_results, indent=4))
else:
    print("\nSkipping LLM Extraction (no GROQ_API_KEY found)")
