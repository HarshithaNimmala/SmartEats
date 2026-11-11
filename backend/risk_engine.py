import joblib
import pandas as pd
from pathlib import Path
import re

MODEL_PATH = Path(__file__).parent / "models" / "health_risk_model.pkl"

def parse_num(val):
    if val is None: return None
    try:
        if isinstance(val, (int, float)): return float(val)
        match = re.search(r"([\d\.]+)", str(val))
        return float(match.group(1)) if match else None
    except: return None

class RiskEngine:
    _instance = None
    _model_data = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RiskEngine, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        if MODEL_PATH.exists():
            try:
                self._model_data = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"Failed to load risk model: {e}")
        else:
            print(f"Risk model not found at {MODEL_PATH}")

    def predict(self, profile_data):
        if not self._model_data:
            return "Pending"

        try:
            # Extract features in correct order
            features = []
            for col in self._model_data["feature_names"]:
                val = profile_data.get(col)
                # Fallbacks for common variations
                if col == "fasting_glucose" and val is None: val = profile_data.get("glucose")
                
                num_val = parse_num(val)
                # If a value is missing, use a safe default or return Pending
                if num_val is None:
                    # Specific defaults based on normal ranges if one or two metrics are missing
                    defaults = {
                        "hba1c": 5.4, "fasting_glucose": 90, "cholesterol": 180,
                        "ldl": 90, "hdl": 50, "triglycerides": 120, "bmi": 22
                    }
                    num_val = defaults.get(col, 0)
                
                features.append(num_val)

            # Prepare for prediction
            df_input = pd.DataFrame([features], columns=self._model_data["feature_names"])
            
            # Predict
            pred_idx = self._model_data["model"].predict(df_input)[0]
            risk_label = self._model_data["label_map"][pred_idx]
            
            return risk_label
        except Exception as e:
            print(f"Risk prediction error: {e}")
            return "Error"

# Singleton instance for easy import
engine = RiskEngine()

def predict_risk(data):
    return engine.predict(data)
