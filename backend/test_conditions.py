import json
from analysis_engine import analyze_profile

def test_analysis():
    # Mock profile with multiple conditions
    mock_profile = {
        "fasting_glucose": "126.0 mg/dL",
        "hba1c": "6.8 %",
        "blood_pressure": "145/95",
        "bmi": "32.5",
        "hemoglobin": "10.5",
        "ldl": "165.0"
    }

    print("--- Running Analysis Test ---")
    conditions = analyze_profile(mock_profile)
    
    print(f"Detected {len(conditions)} conditions:")
    for c in conditions:
        print(f"[{c['status']}] {c['name']}: {c['indicator']}")
        print(f"  Summary: {c['summary']}")
        print("-" * 20)

if __name__ == "__main__":
    test_analysis()
