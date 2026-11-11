import json
import os
import re
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

DATA_DIR = Path(__file__).parent / "data"
FOODS_DB_PATH = DATA_DIR / "foods_db.json"
INDICATORS_PATH = DATA_DIR / "medical_indicators.json"
ING_MAP_PATH = DATA_DIR / "ingredient_map.json"

def load_json(path):
    if path.exists():
        with open(path, "r") as f:
            return json.load(f)
    return {}

def get_ai_nutrition(query: str, user_conditions=[]):
    """Tier 2: AI-powered nutrition estimation as a fallback for unknown foods"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
        
    client = Groq(api_key=api_key)
    conditions_str = ", ".join([c['name'] for c in user_conditions]) if user_conditions else "None"
    
    prompt = f"""
    You are a clinical nutritionist. 
    Analyze this food: "{query}". 
    
    If it's NOT a food/drink, return: {{"invalid_query": true}}.
    
    Return ONLY a JSON object:
    {{
      "name": "corrected name",
      "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "sat_fat": 0, "sugar": 0, "fiber": 0, "sodium": 0,
      "ingredients": ["list", "of", "raw", "ingredients"],
      "scientific_rationale": "contextual info",
      "portion_advice": "advice",
      "specific_warnings": [],
      "healthier_swaps": []
    }}
    """
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except:
        return None

def calculate_verdict(nutrition, conditions):
    """
    Rule-Based Verdict Engine using Ingredient Mapping and Medical Indicators.
    """
    ing_map = load_json(ING_MAP_PATH)
    
    # Defaults
    verdict = {"status": "Safe", "message": "This food is generally safe for your profile.", "color": "blue"}
    risks = []
    
    # 1. Map Condition Names to Risk Categories
    is_diabetic = any("Diabetes" in c["name"] or "Prediabetes" in c["name"] for c in conditions)
    is_hypertensive = any("Hypertension" in c["name"] or "Blood Pressure" in c["name"] for c in conditions)
    is_high_chol = any("Cholesterol" in c["name"] or "Hyperlipidemia" in c["name"] or "Coronary" in c["name"] for c in conditions)
    is_obese = any("Obesity" in c["name"] or "Overweight" in c["name"] for c in conditions)
    has_ckd = any("Kidney" in c["name"] for c in conditions)
    has_gout = any("Gout" in c["name"] for c in conditions)

    # 2. Analyze Ingredients
    ingredients = nutrition.get("ingredients", [])
    categories = [ing_map.get(str(ing).lower()) for ing in ingredients]
    
    # Rule Checking
    if is_diabetic:
        if "sugar" in categories: risks.append("Contains added sugar (high glycemic impact)")
        if "refined carbs" in categories: risks.append("High refined carbohydrate content (may spike glucose)")
    
    if is_hypertensive:
        if "high sodium" in categories: risks.append("High sodium content (increases vascular tension)")
        if nutrition.get("sodium", 0) > 400: risks.append("Sodium > 400mg per serving")

    if is_high_chol:
        if "saturated fat" in categories: risks.append("High saturated fat content")
        if "trans fat" in categories: risks.append("Contains unhealthy trans fats")
        if nutrition.get("fat", 0) > 15: risks.append("High overall fat content")

    if is_obese:
        if nutrition.get("calories", 0) > 500: risks.append("Calorie density is high (>500 kcal)")

    if has_gout:
        if any(ing in ["mutton", "beef", "pork", "beer", "seafood"] for ing in [i.lower() for i in ingredients]):
            risks.append("High purine levels (triggers gout flares)")

    # 3. Final Verdict Consolidation
    if len(risks) >= 2:
        verdict = {"status": "Avoid", "message": f"HIGH RISK: {'; '.join(risks[:3])}", "color": "red"}
    elif len(risks) == 1:
        verdict = {"status": "Moderate", "message": f"MODERATE: {risks[0]}. Control portion size.", "color": "amber"}

    return verdict

def get_clinical_insights(nutrition_data, user_conditions):
    """
    Tier 2.1: Hybrid Insight Engine - Uses AI to humanize the Rule-Engine results.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return nutrition_data
        
    client = Groq(api_key=api_key)
    conditions_str = ", ".join([c['name'] for c in user_conditions]) if user_conditions else "General Health"
    
    # Feed the AI the GROUND TRUTH from our Rule Engine
    verdict = nutrition_data.get("verdict", {})
    
    prompt = f"""
    You are a professional clinical nutritionist. 
    Analyze this food's data: {json.dumps(nutrition_data)}
    
    Rule Engine Calculation:
    - Status: {verdict.get('status')}
    - Findings: {verdict.get('message')}
    - User health profile: {conditions_str}
    
    YOUR TASK:
    Humanize and expand on these findings. Write professionally and clearly.
    Return ONLY a JSON object with these EXACT keys (maintain standard Indian dietary context):
    1. "scientific_rationale": 2-3 sentences explaining exactly how these nutrients affect the specific user conditions.
    2. "portion_advice": Specific quantity advice based on calories/sugar/sodium.
    3. "specific_warnings": Array of 2-3 warning strings.
    4. "healthier_swaps": Array of 2-3 alternative food names.
    
    DO NOT disagree with the Status or Findings provided above.
    """
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2, # Low temp for consistency
            response_format={"type": "json_object"}
        )
        insights = json.loads(completion.choices[0].message.content.strip())
        nutrition_data.update(insights)
    except Exception as e:
        print(f"Hybrid insight generation failed: {e}")
        # Default safety fallbacks
        nutrition_data["scientific_rationale"] = verdict.get("message")
        nutrition_data["portion_advice"] = "Monitor portions based on recommended daily intake."
    return nutrition_data

def search_nutrition(query, user_conditions=[]):
    # Tier 1: Local Database Lookup
    local_db = load_json(FOODS_DB_PATH)
    result = None
    
    for cat in local_db:
        # local_db[cat] is now a dictionary of items keyed by slug
        for item in local_db[cat].values():
            if item["name"].lower() == query.lower():
                nut = item.get("nutrition", {})
                result = {
                    "name": item["name"],
                    "ingredients": item.get("ingredients", []),
                    "calories": nut.get("calories", 0),
                    "protein": nut.get("protein", 0),
                    "carbs": nut.get("carbs", 0),
                    "fat": nut.get("fat", 0),
                    "sugar": nut.get("sugar", 0),
                    "sodium": nut.get("sodium", 0),
                    "fiber": nut.get("fiber", 0),
                    "sat_fat": nut.get("sat_fat", 0)
                }
                break
        if result: break
    
    # Tier 2: AI Fallback if not in DB
    if not result:
        result = get_ai_nutrition(query, user_conditions)
    
    if not result or result.get("invalid_query"):
        return None
        
    # Tier 3: Rule-Based Verdict
    result["verdict"] = calculate_verdict(result, user_conditions)
    
    # Tier 4: Hybrid Clinical Insights (Enriching with AI messages)
    result = get_clinical_insights(result, user_conditions)
    
    return result

def get_suggestions(query):
    local_db = load_json(FOODS_DB_PATH)
    all_names = []
    for cat in local_db:
        all_names.extend([item["name"] for item in local_db[cat].values()])
    return [name for name in all_names if query.lower() in name.lower()][:5]
