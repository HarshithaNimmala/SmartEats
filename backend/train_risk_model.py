import json
import pandas as pd
import joblib
import os
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

# Configuration
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "risk_training_data.json"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "health_risk_model.pkl"

os.makedirs(MODEL_DIR, exist_ok=True)

def train():
    if not DATA_PATH.exists():
        print(f"Error: Dataset {DATA_PATH} not found.")
        return

    # Load data
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Preprocessing
    X = df.drop("risk", axis=1)
    y = df["risk"]
    
    # Encode target labels (Low=0, Medium=1, High=2)
    # We'll use a manual map to ensure consistency
    label_map = {"Low": 0, "Medium": 1, "High": 2}
    y_encoded = y.map(label_map)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    
    # Train Random Forest
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    
    # Save Model and Label Map
    joblib.dump({
        "model": model,
        "label_map": {v: k for k, v in label_map.items()}, # Reverse map for prediction
        "feature_names": list(X.columns)
    }, MODEL_PATH)
    
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train()
