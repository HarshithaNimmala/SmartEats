import re
import json
from pathlib import Path

def parse_val(v):
    if isinstance(v, (int, float)):
        return v
    if not isinstance(v, str):
        return None
    
    # Check for Blood Pressure format (Systolic / Diastolic)
    if '/' in v:
        parts = v.split('/')
        try:
            return float(parts[0].strip()), float(parts[1].strip())
        except:
            return None
            
    match = re.search(r'([\d\.]+)', v)
    if match:
        try:
            return float(match.group(1))
        except:
            return None
    return None

def analyze_profile(profile_data: dict) -> list:
    """
    Rule-Based Condition Detection Engine.
    Uses medical_indicators.json as ground truth instead of hardcoded logic.
    """
    conditions_results = {}
    
    # Load clinical ground truth
    indicators_path = Path(__file__).parent / "data" / "medical_indicators.json"
    if not indicators_path.exists():
        return []
        
    with open(indicators_path, "r") as f:
        indicators_config = json.load(f)

    # Special handling for Blood Pressure
    bp_data = profile_data.get("blood_pressure") or profile_data.get("bp")
    sys_val, dia_val = None, None
    if bp_data:
        parsed_bp = parse_val(bp_data)
        if isinstance(parsed_bp, tuple):
            sys_val, dia_val = parsed_bp
            
    # Explicit sys/dia keys
    if profile_data.get("systolic_bp"): sys_val = parse_val(profile_data.get("systolic_bp"))
    if profile_data.get("diastolic_bp"): dia_val = parse_val(profile_data.get("diastolic_bp"))

    # Iterate through all indicators in the config
    for key, ranges in indicators_config.items():
        # Get user value for this indicator
        user_val = profile_data.get(key)
        
        # Override with special bp values if key matches
        if key == "systolic_bp" and sys_val is not None: user_val = sys_val
        if key == "diastolic_bp" and dia_val is not None: user_val = dia_val
        
        # Normalized glucose check
        if key == "fasting_glucose" and not user_val:
            user_val = profile_data.get("glucose") # legacy fallback
            
        val = parse_val(user_val)
        if val is None:
            continue
            
        # Check which range the value falls into
        for r in ranges:
            if r["min"] <= val <= r["max"]:
                label = r["label"].lower()
                # If label indicates a risk/condition, map it to the diseases
                if label not in ["normal", "optimal", "desirable", "sufficient", "low risk"]:
                    # --- RISK MAPPING ---
                    priority_map = {"critical": "High", "important": "Medium", "supportive": "Low"}
                    priority = priority_map.get(r["priority"].lower(), "Low")
                    
                    for disease in r["diseases"]:
                        if disease not in conditions_results:
                            conditions_results[disease] = {
                                "name": disease,
                                "status": priority,
                                "indicators": []
                            }
                        
                        # Add specific indicator info
                        conditions_results[disease]["indicators"].append(
                            f"{key.replace('_', ' ').title()} is {val} ({r['label']})"
                        )
                        # Upgrade status if we find a higher priority indicator
                        current_status = conditions_results[disease]["status"]
                        # Priority rank for consistent upgrading: High > Medium > Low
                        rank = {"High": 3, "Medium": 2, "Low": 1}
                        if rank[priority] > rank.get(current_status, 0):
                            conditions_results[disease]["status"] = priority

    # Final formatting: merging indicators into a single string for the UI
    final_conditions = []
    for d in conditions_results.values():
        d["indicator"] = "; ".join(d["indicators"])
        del d["indicators"]
        final_conditions.append(d)
        
    return final_conditions
