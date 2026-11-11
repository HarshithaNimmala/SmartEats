from analysis_engine import analyze_profile
from nutrition_engine import search_nutrition
from risk_engine import predict_risk
import json

def test():
    print("--- Testing Analysis Engine ---")
    high_glucose_profile = {
        "fasting_glucose": "135",
        "hba1c": "7.2",
        "systolic_bp": "145",
        "diastolic_bp": "95"
    }
    conditions = analyze_profile(high_glucose_profile)
    print(f"Detected Conditions: {[c['name'] for c in conditions]}")
    
    print("\n--- Testing ML Risk Engine ---")
    risk = predict_risk(high_glucose_profile)
    print(f"Predicted Risk Level: {risk}")
    
    print("\n--- Testing Nutrition Engine ---")
    # Test with a known food in DB (Apple)
    food = search_nutrition("Apple", conditions)
    if food:
        print(f"\nFood: {food['name']}")
        print(f"Carbs: {food.get('carbs')}g, Fiber: {food.get('fiber')}g")
        print(f"Verdict: {food['verdict']['status']}")
        print(f"Rationale: {food.get('scientific_rationale')[:100]}...")
        print(f"Advice: {food.get('portion_advice')}")
    else:
        print("Food 'Apple' not found.")

if __name__ == "__main__":
    test()
