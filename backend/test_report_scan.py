import os
import sys
from vision_engine import scan_medical_report
from dotenv import load_dotenv
import json

load_dotenv()

def verify():
    print("Verifying Medical Report Vision Scanning...")
    report_path = "../dummy_report.jpg"
    if not os.path.exists(report_path):
        # try current dir
        report_path = "dummy_report.jpg"
        if not os.path.exists(report_path):
            print("Error: dummy_report.jpg not found.")
            return

    with open(report_path, "rb") as f:
        content = f.read()

    print(f"File loaded: {report_path} ({len(content)} bytes)")
    
    try:
        result = scan_medical_report(content, "image/jpeg")
        print("--- Extraction Result ---")
        print(json.dumps(result, indent=2))
        
        # Check for typical keys
        required_keys = ['hba1c', 'fasting_glucose', 'systolic_bp', 'diastolic_bp']
        found_keys = [k for k in required_keys if k in result]
        print(f"Found keys: {found_keys}")
        
    except Exception as e:
        print(f"Extraction failed: {e}")

if __name__ == "__main__":
    verify()
