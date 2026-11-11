from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth import init_db, create_user, verify_user, update_password, get_user_dir
# from parser import extract_raw_text
# from extractor import extract_parameters
from analysis_engine import analyze_profile
from nutrition_engine import search_nutrition, get_suggestions, calculate_verdict, get_clinical_insights
from vision_engine import scan_label_nutrition, scan_medical_report
from risk_engine import predict_risk
import json
from pathlib import Path
app = FastAPI(title="SmartEats Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a local prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str
    new_password: str

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    result = create_user(req.email, req.password, req.username)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/auth/login")
def login(req: LoginRequest):
    result = verify_user(req.email, req.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    # In a real app we'd verify via email. For this prototype, we'll allow direct updates.
    result = update_password(req.email, req.new_password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/upload-report")
async def upload_report(email: str = Form(...), file: UploadFile = File(...)):
    user_dir = get_user_dir(email)
    if not user_dir.exists():
        raise HTTPException(status_code=400, detail="User not found")
        
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read file")
        
    # --- UNLINKED OCR: Using direct Vision LLM (Previous Approach) ---
    extracted_data = scan_medical_report(contents, file.content_type)
    
    # We still need raw_text for the response message if possible, 
    # but since we are unlinking OCR, we'll just indicate it was processed via Vision.
    raw_text = "Processed via Gemini Vision (Direct LLM)"
    
    profile_path = user_dir / "profile.json"
    if profile_path.exists():
        with open(profile_path, "r") as f:
            existing_profile = json.load(f)
        
        # --- RESET ON UPLOAD ---
        # The user requested that we NO LONGER preserve old clinical values when a new report is uploaded.
        # We clear the known clinical keys before updating.
        CLINICAL_KEYS = {
            'hba1c', 'glucose', 'fasting_glucose', 'postprandial_glucose',
            'cholesterol', 'total_cholesterol', 'hdl', 'ldl', 'triglycerides',
            'bmi', 'systolic_bp', 'diastolic_bp', 'systolic', 'diastolic',
            'hemoglobin', 'wbc_count', 'creatinine', 'uric_acid', 'tsh',
            'weight', 'height', 'blood_pressure', 'bp',
            'total_protein', 'albumin', 'globulin', 'bilirubin_total',
            'bilirubin_direct', 'bilirubin_indirect', 'alkaline_phosphatase',
            'sgot', 'sgpt', 'ggtp', 'ast', 'alt'
        }
        for k in CLINICAL_KEYS:
            existing_profile.pop(k, None)
            
        existing_profile.update(extracted_data)
        final_data = existing_profile
    else:
        final_data = extracted_data
        
    with open(profile_path, "w") as f:
        json.dump(final_data, f, indent=4)
        
    # --- AUTO PROGRESS LOGGING ---
    try:
        progress_path = user_dir / "progress_log.json"
        progress_data = []
        if progress_path.exists():
            with open(progress_path, "r") as f:
                progress_data = json.load(f)
        
        # --- DATE HANDLING ---
        # Prioritize the date extracted from the report over the current date
        import datetime
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        log_date = extracted_data.get("report_date") or today
        
        # Normalize date if extracted (e.g. 12-03-2026 -> 2026-03-12)
        if log_date != today:
            try:
                # Try common formats
                for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y", "%Y-%m-%d"):
                    try:
                        log_date = datetime.datetime.strptime(log_date, fmt).strftime("%Y-%m-%d")
                        break
                    except: continue
            except: pass

        # Helper to extract numeric value from strings
        def clean_num(val):
            if val is None: return None
            try:
                if isinstance(val, (int, float)): return float(val)
                import re
                match = re.search(r"([\d\.]+)", str(val))
                return float(match.group(1)) if match else None
            except: return None

        new_entry = {
            "date": log_date,
            "hba1c": clean_num(extracted_data.get("hba1c")),
            "glucose": clean_num(extracted_data.get("fasting_glucose") or extracted_data.get("glucose")),
            "cholesterol": clean_num(extracted_data.get("total_cholesterol") or extracted_data.get("cholesterol")),
            "bmi": clean_num(extracted_data.get("bmi")),
            "systolic": clean_num(extracted_data.get("systolic_bp") or extracted_data.get("systolic")),
            "diastolic": clean_num(extracted_data.get("diastolic_bp") or extracted_data.get("diastolic")),
            "bp": extracted_data.get("blood_pressure") or extracted_data.get("bp"),
            "hemoglobin": clean_num(extracted_data.get("hemoglobin")),
            "wbc_count": clean_num(extracted_data.get("wbc_count"))
        }

        # Only add if we found at least one metric
        if any(v is not None for k, v in new_entry.items() if k != "date"):
            # Avoid duplicate entries for same date - update existing if found
            existing_entry = next((e for e in progress_data if e["date"] == log_date), None)
            if existing_entry:
                existing_entry.update({k: v for k, v in new_entry.items() if v is not None})
            else:
                progress_data.append(new_entry)
            
            # Sort by date
            progress_data.sort(key=lambda x: x["date"])
            
            with open(progress_path, "w") as f:
                json.dump(progress_data, f, indent=4)
    except Exception as pe:
        print(f"Progress Logging Error: {pe}")

    # --- ML RISK PREDICTION ---
    try:
        current_risk = predict_risk(final_data)
        final_data["current_risk_level"] = current_risk
        with open(profile_path, "w") as f:
            json.dump(final_data, f, indent=4)
    except Exception as re:
        print(f"Risk Prediction Error: {re}")

    return {
        "message": "Report processed successfully",
        "raw_text": raw_text,
        "extracted_data": final_data
    }

@app.get("/api/progress/{email}")
def get_progress(email: str):
    user_dir = get_user_dir(email)
    if not user_dir.exists():
        return []
    
    progress_path = user_dir / "progress_log.json"
    
    # --- AUTO-INITIALIZATION FROM PROFILE IF LOG MISSING ---
    if not progress_path.exists():
        profile_path = user_dir / "profile.json"
        if profile_path.exists():
            try:
                import datetime
                with open(profile_path, "r") as f:
                    profile = json.load(f)
                
                # Helper to extract numeric value
                def clean_num(val):
                    if val is None: return None
                    try:
                        if isinstance(val, (int, float)): return float(val)
                        import re
                        match = re.search(r"([\d\.]+)", str(val))
                        return float(match.group(1)) if match else None
                    except: return None

                # Create seed entry from profile
                seed = {
                    "date": datetime.datetime.now().strftime("%Y-%m-%d"),
                    "hba1c": clean_num(profile.get("hba1c")),
                    "glucose": clean_num(profile.get("fasting_glucose") or profile.get("glucose")),
                    "cholesterol": clean_num(profile.get("total_cholesterol") or profile.get("cholesterol")),
                    "bmi": clean_num(profile.get("bmi")),
                    "systolic": clean_num(profile.get("systolic_bp")),
                    "diastolic": clean_num(profile.get("diastolic_bp")),
                    "bp": profile.get("blood_pressure")
                }
                
                # If we have any data, initialize the log
                if any(v is not None for k, v in seed.items() if k != "date"):
                    with open(progress_path, "w") as f:
                        json.dump([seed], f, indent=4)
            except Exception as e:
                print(f"Failed to auto-initialize progress: {e}")

    if not progress_path.exists():
        return []
        
    with open(progress_path, "r") as f:
        return json.load(f)

@app.get("/api/detect-conditions")
def detect_conditions(email: str):
    user_dir = get_user_dir(email)
    if not user_dir.exists():
        raise HTTPException(status_code=400, detail="User not found")
        
    profile_path = user_dir / "profile.json"
    if not profile_path.exists():
        return []
        
    with open(profile_path, "r") as f:
        profile_data = json.load(f)
        
    conditions = analyze_profile(profile_data)
    return conditions

@app.get("/api/nutrition/suggest")
def suggest_food(q: str):
    return get_suggestions(q)

@app.post("/api/nutrition/search")
def search_food(query: str, email: str):
    user_dir = get_user_dir(email)
    conditions = []
    if user_dir.exists():
        profile_path = user_dir / "profile.json"
        if profile_path.exists():
            with open(profile_path, "r") as f:
                profile_data = json.load(f)
            conditions = analyze_profile(profile_data)
            
    result = search_nutrition(query, conditions)
    if not result:
        raise HTTPException(status_code=404, detail="Food not found")
    return result

@app.post("/api/nutrition/scan")
async def scan_food_label(email: str = Form(...), file: UploadFile = File(...)):
    user_dir = get_user_dir(email)
    conditions = []
    if user_dir.exists():
        profile_path = user_dir / "profile.json"
        if profile_path.exists():
            with open(profile_path, "r") as f:
                profile_data = json.load(f)
            conditions = analyze_profile(profile_data)
            
    try:
        contents = await file.read()
        # Step 1: Vision Extraction
        result = scan_label_nutrition(contents)
        
        if not result or result.get('name') is None:
             print(f"Scan failed for file: {file.filename}")
             raise HTTPException(status_code=400, detail="Failed to parse nutrition label. Use a clearer photo.")
            
        # Step 2: Personalized Clinical Analytics & Verdict
        result = get_clinical_insights(result, conditions)
        
        verdict = calculate_verdict(result, conditions)
        result["verdict"] = verdict
        
        # Ensure fallback keys are present for UI safety
        result["scientific_rationale"] = result.get("scientific_rationale") or verdict.get("message")
        result["portion_advice"] = result.get("portion_advice") or "Monitor portion sizes based on your profile."
        result["specific_warnings"] = result.get("specific_warnings") or []
        result["healthier_swaps"] = result.get("healthier_swaps") or []
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scanning Server Error: {str(e)}")

class LogFoodRequest(BaseModel):
    email: str
    food_data: dict

@app.post("/api/food-log")
def log_food(req: LogFoodRequest):
    user_dir = get_user_dir(req.email)
    if not user_dir.exists():
        raise HTTPException(status_code=400, detail="User not found")
        
    # Unified Parity: Saving directly to profile.json (Matches 'se' folder excellence)
    profile_path = user_dir / "profile.json"
    profile_data = {}
    
    if profile_path.exists():
        with open(profile_path, "r") as f:
            profile_data = json.load(f)
    
    if "food_logs" not in profile_data:
        profile_data["food_logs"] = []
            
    import datetime
    food_data = req.food_data
    
    # Extract name with fallbacks
    name = food_data.get("food_name") or food_data.get("name") or food_data.get("product_name") or "Legacy Meal"
    
    # Flexible verdict extraction
    v_info = food_data.get("verdict", "SAFE")
    if isinstance(v_info, dict):
        verdict_status = v_info.get("status", "SAFE").upper()
    else:
        verdict_status = str(v_info).upper()
        
    # V13.1: EXACT Keys from 'se' folder for perfect parity
    entry = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f"), # ISO format with micros
        "food_name": name,
        "calories": float(food_data.get("calories", 0)),
        "protein": float(food_data.get("protein", 0)),
        "carbs": float(food_data.get("carbs", 0)),
        "fat": float(food_data.get("fat", 0)),
        "fiber": float(food_data.get("fiber", 0)),
        "verdict": verdict_status
    }
    
    profile_data["food_logs"].append(entry)
    
    with open(profile_path, "w") as f:
        json.dump(profile_data, f, indent=4)
        
    return {"message": "Food logged successfully to profile"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats(email: str):
    import traceback
    try:
        user_dir = get_user_dir(email)
        if not user_dir.exists():
            raise HTTPException(status_code=400, detail="User not found")
            
        profile_path = user_dir / "profile.json"
        
        if not profile_path.exists():
            legacy_profile_path = Path(f"c:/Users/ADMIN/OneDrive/Desktop/se/SmartEats/data/users/{email}/profile.json")
            if legacy_profile_path.exists():
                with open(legacy_profile_path, "r") as f:
                    with open(profile_path, "w") as f2:
                        json.dump(json.load(f), f2, indent=4)
            else:
                with open(profile_path, "w") as f:
                    json.dump({"email": email, "food_logs": []}, f, indent=4)
                    
        with open(profile_path, "r") as f:
            profile_data = json.load(f)
            
        logs = profile_data.get("food_logs", [])
        logs.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
        
        health_history = []
        legacy_progress_path = Path(f"c:/Users/ADMIN/OneDrive/Desktop/se/SmartEats/data/users/{email}/progress_log.json")
        if legacy_progress_path.exists():
            try:
                with open(legacy_progress_path, "r") as f:
                    health_history = json.load(f)
            except Exception as e:
                pass
        
        import datetime
        today_str = datetime.datetime.now().strftime("%Y-%m-%d")
        today_logs = [l for l in logs if str(l.get("timestamp", ""))[:10] == today_str]
        
        today_calories = sum(float(l.get("calories", 0)) for l in today_logs)
        today_safe = len([l for l in today_logs if str(l.get("verdict", "")).upper() == "SAFE"])
        today_moderate = len([l for l in today_logs if str(l.get("verdict", "")).upper() == "MODERATE"])
        today_avoid = len([l for l in today_logs if str(l.get("verdict", "")).upper() == "AVOID"])
        
        target_cal = profile_data.get("target_calories", 1800)
        
        today_summary = {
            "calories": today_calories,
            "safe": today_safe,
            "moderate": today_moderate,
            "avoid": today_avoid,
            "target": target_cal
        }
        
        # Refined Health Score Calculation
        recent_10 = logs[:10]
        score = 100
        for l in recent_10:
            v = str(l.get("verdict", "")).upper()
            if v == "AVOID": score -= 12
            elif v == "MODERATE": score -= 6
            
        if today_calories > (target_cal * 1.2):
            score -= 10
            
        health_score = max(0, min(100, score))
        
        # Smart Insights Generation
        insights = []
        conditions = analyze_profile(profile_data)
        
        if today_avoid > 0:
            insights.append("⚠️ You've had some 'Avoid' items today. Try to stick to Safe options for the next meal.")
        if today_calories > target_cal:
            insights.append("📉 Daily calorie target exceeded. Consider lighter choices for the rest of the day.")
        elif today_calories > 0 and today_calories < target_cal * 0.8:
            insights.append("✅ You are well within your calorie budget for today.")
            
        if today_safe >= 3 and today_avoid == 0:
            insights.append("🌟 Excellent! You're making very healthy choices today.")
            
        if not conditions and not profile_data.get("hba1c"):
            insights.append("ℹ️ Upload a medical report to get personalized health insights.")
        elif any("Diabetes" in c["name"] for c in conditions) and today_moderate > 0:
            insights.append("⚠️ Watch your sugar intake. Some logged items might affect your glucose levels.")
            
        if not today_logs and logs:
             insights.append("🍳 Don't forget to log your meals today to track your progress!")
        
        if not insights:
            insights.append("🥗 Keep up the balanced diet for optimal health.")
            
        macro_history = [{ "date": str(entry.get("timestamp", ""))[:10], "calories": float(entry.get("calories", 0)) } for entry in logs[-30:]]

        # --- ML RISK INTEGRATION ---
        current_risk = profile_data.get("current_risk_level")
        if not current_risk:
            current_risk = predict_risk(profile_data)
            profile_data["current_risk_level"] = current_risk
            with open(profile_path, "w") as f:
                json.dump(profile_data, f, indent=4)

        return {
            "health_score": health_score,
            "total_meals": len(logs),
            "today_summary": today_summary,
            "smart_insights": insights[:3],
            "recent_activity": logs[:3],
            "macro_history": macro_history,
            "profile": profile_data,
            "current_risk_level": current_risk
        }
    except Exception as e:
        print("CRASH:", traceback.format_exc())
        return {"error": str(e), "traceback": traceback.format_exc()}



class MealPlanRequest(BaseModel):
    email: str
    cuisine: str = "North Indian"
    diet: str = "Vegetarian"
    meals: int = 3
    calories: int = 1800
    goal: str = "General Wellness"
    height: float = 170.0
    weight: float = 65.0

@app.post("/api/generate-meal-plan")
def generate_meal_plan(req: MealPlanRequest):
    import os, re, traceback
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    try:
        user_dir = get_user_dir(req.email)
        profile_data = {}
        conditions = []

        if user_dir.exists():
            profile_path = user_dir / "profile.json"
            if profile_path.exists():
                with open(profile_path, "r") as f:
                    profile_data = json.load(f)
                conditions = analyze_profile(profile_data)

        # Build a readable profile summary (exclude food_logs for brevity)
        profile_summary = {k: v for k, v in profile_data.items() if k != "food_logs"}
        conditions_summary = [c["name"] for c in conditions] if conditions else ["No conditions detected"]

        # Break combined goal string into individual goals for richer guidance
        goal_list = [g.strip() for g in req.goal.split(',') if g.strip()]

        goal_guidance_map = {
            'Weight Loss':      'Use low-calorie, high-fiber meals. Reduce refined carbs and saturated fats. Prefer grilled, steamed, boiled options.',
            'Muscle Gain':      'Include high-protein foods (paneer, legumes, eggs if non-veg). Balanced complex carbs. Support frequent meals.',
            'Sugar Control':    'Use low glycemic index foods. Avoid sugar, white rice, maida. Prefer millets, oats, vegetables, dal.',
            'Heart Healthy':    'Low sodium, low saturated fat. Include omega-3 rich foods. Avoid fried and processed foods.',
            'Maintain Weight':  'Well-balanced nutrition across macros. Moderate portions.',
            'General Wellness': 'Balanced, diverse, nutritious meals across all food groups.',
        }

        goal_rules_lines = []
        for g in goal_list:
            if g in goal_guidance_map:
                goal_rules_lines.append(f"- {g}: {goal_guidance_map[g]}")
            else:
                # Custom / user-defined goal — let the AI reason about it
                goal_rules_lines.append(
                    f"- {g}: This is a custom health goal entered by the user. Interpret it intelligently "
                    f"and choose meals that best support '{g}' based on nutritional science and clinical guidelines."
                )
        goal_rules_block = '\n'.join(goal_rules_lines) if goal_rules_lines else '- General Wellness: Balanced, diverse, nutritious meals.'

        prompt = f"""You are a clinical nutrition expert.

Generate a 7-day meal plan.

User height: {req.height} cm
User weight: {req.weight} kg
User conditions: {', '.join(conditions_summary)}
Lab values: {json.dumps(profile_summary)}
Goals: {req.goal}
Preferences:
- Cuisine: {req.cuisine}
- Diet: {req.diet}
- Meals per day: {req.meals}
- Target Calories: {req.calories} kcal/day

GOAL RULES (apply ALL goals simultaneously):
{goal_rules_block}

General Rules:
- Consider the user's BMI derived from their height and weight to adjust portion sizes and nutritional density.
- Avoid foods that conflict with the user's health conditions
- Ensure nutritional variety across 7 days
- Use realistic Indian dishes
- Keep meals balanced and practical
- If meals per day is 2, omit dinner. If 3, include breakfast/lunch/dinner. If 4+, include snacks too.
- When multiple goals conflict (e.g. Weight Loss + Muscle Gain), find the most balanced approach.

Return STRICT JSON only — no explanation, no markdown, no extra text:

{{
  "day1": {{
    "breakfast": "...",
    "lunch": "...",
    "dinner": "...",
    "snacks": "..."
  }},
  "day2": {{...}},
  "day3": {{...}},
  "day4": {{...}},
  "day5": {{...}},
  "day6": {{...}},
  "day7": {{...}}
}}"""

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment.")

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=3000,
        )

        raw = response.choices[0].message.content.strip()

        # Extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No valid JSON found in Groq response")

        plan = json.loads(json_match.group())

        # Validate and fill missing days/fields
        days = [f"day{i}" for i in range(1, 8)]
        fields = ["breakfast", "lunch", "dinner", "snacks"]
        validated_plan = {}
        for day in days:
            day_data = plan.get(day, {})
            validated_plan[day] = {field: day_data.get(field, "N/A") for field in fields}

        # Save the plan to user directory for chatbot and persistence
        if user_dir.exists():
            with open(user_dir / "meal_plan.json", "w") as f:
                json.dump(validated_plan, f, indent=4)
            
            # Persist target calories to profile for Dashboard analytics
            profile_path = user_dir / "profile.json"
            if profile_path.exists():
                with open(profile_path, "r") as f:
                    p_data = json.load(f)
                p_data["target_calories"] = int(req.calories)
                with open(profile_path, "w") as f:
                    json.dump(p_data, f, indent=4)

        return {"plan": validated_plan, "conditions": conditions_summary}

    except Exception as e:
        print("Meal plan error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")

class CalorieUpdateRequest(BaseModel):
    email: str
    calories: int

@app.post("/api/user/save-calories")
def save_calories(req: CalorieUpdateRequest):
    user_dir = get_user_dir(req.email)
    if not user_dir.exists():
        raise HTTPException(status_code=400, detail="User not found")
        
    profile_path = user_dir / "profile.json"
    p_data = {}
    if profile_path.exists():
        with open(profile_path, "r") as f:
            p_data = json.load(f)
            
    p_data["target_calories"] = int(req.calories)
    with open(profile_path, "w") as f:
        json.dump(p_data, f, indent=4)
        
    return {"message": "Success"}

@app.get("/")
def root():
    return {"message": "SmartEats API Running"}


# ─────────────────────────────────────────────────────────────────
# AI HEALTH CHATBOT
# ─────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    email: str
    message: str
    history: list[dict] = []


@app.post("/api/chat")
def health_chat(req: ChatRequest):
    import os, re, traceback
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    try:
        # ── STEP 1: Load user context ────────────────────────────────
        user_dir = get_user_dir(req.email)
        profile_data: dict = {}
        conditions_summary: list = []
        food_logs_summary: list = []
        meal_plan_summary: str = "No current active meal plan."

        if user_dir.exists():
            # Load Profile & Conditions
            profile_path = user_dir / "profile.json"
            if profile_path.exists():
                with open(profile_path, "r") as f:
                    profile_data = json.load(f)
                raw_conditions = analyze_profile(profile_data)
                conditions_summary = [c["name"] for c in raw_conditions] if raw_conditions else ["None"]

            # Load Food Logs
            logs = profile_data.get("food_logs", [])
            recent = logs[-20:] if len(logs) >= 20 else logs
            for entry in reversed(recent):
                food = entry.get("food_name", "Unknown")
                verdict = entry.get("verdict", "N/A")
                food_logs_summary.append(f"- {food} (Verdict: {verdict})")

            # Load Meal Plan (New Logic)
            plan_path = user_dir / "meal_plan.json"
            if plan_path.exists():
                with open(plan_path, "r") as f:
                    meal_plan_summary = json.dumps(json.load(f), indent=2)

        # Build clean profile summary
        profile_summary = {k: v for k, v in profile_data.items() if k != "food_logs"}

        # ── STEP 2: Build system prompt ──────────────────────────────
        system_prompt = f"""You are SmartEats AI Health Assistant, a professional nutritional and dietary expert.

[USER CONTEXT]
- Profile: {json.dumps(profile_summary)}
- Conditions: {', '.join(conditions_summary)}
- Recent Meals: {chr(10).join(food_logs_summary) if food_logs_summary else 'No recent logs.'}
- Current Meal Plan:
{meal_plan_summary}

[GUIDELINES]
1. ACCURACY: Use the meal plan and user profile to give PRECISE advice. If the user asks about a meal in their plan, refer to it specifically.
2. FOOD SAFETY: Always provide SAFE/MODERATE/AVOID verdicts based on their detected conditions.
3. TONE: Be professional, empathetic, and encouraging.
4. CONVERSATIONAL: You are in a chat session. Use the provided history to understand follow-ups.
5. CONCISION: Keep responses helpful but avoiding unnecessary fluff.

[RESTRICTIONS]
- Use ONLY the provided data. Do not assume health metrics not listed.
- For medical emergencies or severe symptoms, ALWAYS recommend professional clinical consultation.

Return JSON only: {{"reply": "...", "type": "food|meal|health|general"}}"""

        # ── STEP 3: Setup messages with history ──────────────────────
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (limited to last 10 turns to save tokens)
        for turn in req.history[-10:]:
            messages.append(turn)
            
        # Add current message
        messages.append({"role": "user", "content": req.message})

        # ── STEP 4: Call Groq ────────────────────────────────────────
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.4, # Lower temp for more stable medical/nutritional logic
            max_tokens=800,
            response_format={"type": "json_object"} # Force JSON-style output if possible
        )

        raw = response.choices[0].message.content.strip()

        # ── STEP 5: Parse and return ────────────────────────────────
        try:
            parsed = json.loads(raw)
            return {"reply": parsed.get("reply", "I couldn't process that."), "type": parsed.get("type", "general")}
        except:
            # Fallback regex if for some reason response_format doesn't work as expected
            json_match = re.search(r'\{[\s\S]*\}', raw)
            if json_match:
                try: 
                    p = json.loads(json_match.group())
                    return {"reply": p.get("reply", raw), "type": p.get("type", "general")}
                except: pass
            return {"reply": raw, "type": "general"}

    except Exception as e:
        print(f"Chat error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
