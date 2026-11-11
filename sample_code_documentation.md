# SmartEats Sample Code Documentation

This document contains a selection of 5 key files from the SmartEats project, spanning both backend (FastAPI/Python) and frontend (React/Vite) codebases. These are suitable for technical documentation and cover routing, authentication, condition analysis, machine learning risk classification, and UI components.

---

## 1. Backend Authentication Logic (`backend/auth.py`)

This file handles user registration, password hashing (SHA-256), and verification, interacting with JSON files dedicated to each user.

```python
import hashlib
import json
import os
from pathlib import Path
from typing import Optional

DB_DIR = Path(__file__).parent / "database"

def init_db():
    if not DB_DIR.exists():
        DB_DIR.mkdir(parents=True)

def get_user_dir(email: str) -> Path:
    safe_email = "".join([c if c.isalnum() else "_" for c in email])
    return DB_DIR / safe_email

def hash_password(password: str, salt: str = "smarteats_salt") -> str:
    # simple SHA-256 implementation with fixed or unique salt
    hasher = hashlib.sha256()
    hasher.update((password + salt).encode('utf-8'))
    return hasher.hexdigest()

def create_user(email: str, password: str, username: str) -> dict:
    user_dir = get_user_dir(email)
    if user_dir.exists():
        return {"error": "User already exists"}
    
    user_dir.mkdir(parents=True)
    
    # Generate unique salt for real prod, using fixed for simplicity or random and storing it
    salt = "smarteats_salt" 
    hashed_password = hash_password(password, salt)
    
    user_data = {
        "email": email,
        "username": username,
        "password": hashed_password,
        "salt": salt
    }
    
    with open(user_dir / "user_data.json", "w") as f:
        json.dump(user_data, f, indent=4)
        
    return {"message": "User registered successfully", "email": email}

def verify_user(email: str, password: str) -> dict:
    user_dir = get_user_dir(email)
    if not user_dir.exists():
        return {"error": "User not found"}
        
    user_info_path = user_dir / "user_data.json"
    if not user_info_path.exists():
        return {"error": "User data missing"}
        
    with open(user_info_path, "r") as f:
        user_data = json.load(f)
        
    salt = user_data.get("salt", "smarteats_salt")
    hashed_password = hash_password(password, salt)
    
    if hashed_password == user_data.get("password"):
        return {"message": "Login successful", "email": email, "username": user_data.get("username")}
    else:
        return {"error": "Invalid password"}

def update_password(email: str, new_password: str) -> dict:
    user_dir = get_user_dir(email)
    if not user_dir.exists():
        return {"error": "User not found"}
    user_info_path = user_dir / "user_data.json"
    if not user_info_path.exists():
        return {"error": "User data missing"}
        
    with open(user_info_path, "r") as f:
        user_data = json.load(f)
    
    salt = user_data.get("salt", "smarteats_salt")
    user_data["password"] = hash_password(new_password, salt)
    
    with open(user_info_path, "w") as f:
        json.dump(user_data, f, indent=4)
    return {"message": "Password updated successfully"}
```

---

## 2. Condition Analysis Engine (`backend/analysis_engine.py`)

This engine implements the rule-based clinical analysis. It evaluates numeric biological indicators against defined optimal/risk ranges to flag medical conditions.

```python
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
```

---

## 3. ML Risk Classification Engine (`backend/risk_engine.py`)

This file loads a serialized pre-trained predictive machine learning model and processes user biomarker features to predict overarching health risks.

```python
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
```

---

## 4. Frontend Application Entry Context (`frontend/src/App.jsx`)

The React application's core element managing the React Router DOM logic, protected route logic, and the global rendering layout.

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import FoodTracker from './pages/FoodTracker';
import MealPlanner from './pages/MealPlanner';
import NutritionLookup from './pages/NutritionLookup';
import ProgressTracker from './pages/ProgressTracker';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';

const Layout = ({ children }) => {
  return (
    <>
      <div className="flex bg-[#f8fafc] min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 transition-all duration-300">
          {children}
        </div>
      </div>
      {/* Floating AI chat widget — available on every page */}
      <ChatWidget />
    </>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const email = localStorage.getItem('userEmail');
  if (!email) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/food-tracker" 
          element={
            <ProtectedRoute>
              <FoodTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meal-planner" 
          element={
            <ProtectedRoute>
              <MealPlanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nutrition" 
          element={
            <ProtectedRoute>
              <NutritionLookup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/progress" 
          element={
            <ProtectedRoute>
              <ProgressTracker />
            </ProtectedRoute>
          } 
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 5. Main Navigation Sidebar Component (`frontend/src/components/Sidebar.jsx`)

The interactive sidebar navigation component serving protected pages, integrating Tailwind CSS stylistic cues and Lucide React icons.

```jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Search, LogOut, HeartPulse, 
    User, Utensils, Calendar, TrendingUp 
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || "User";

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Health Progress', path: '/progress', icon: <TrendingUp size={20} /> },
        { name: 'Nutrition Lookup', path: '/nutrition', icon: <Search size={20} /> },
        { name: 'Food Tracker', path: '/food-tracker', icon: <Utensils size={20} /> },
        { name: 'Diet Planner', path: '/meal-planner', icon: <Calendar size={20} /> },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-8 flex items-center gap-3">
                <div className="bg-lavender-600 p-2 rounded-xl text-white shadow-lg shadow-lavender-200">
                    <HeartPulse size={24} />
                </div>
                <h1 className="text-xl font-black text-slate-800 tracking-tighter">SmartEats</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                                isActive 
                                ? 'bg-lavender-50 text-lavender-700 shadow-sm border border-lavender-100/50' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`
                        }
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 bg-lavender-200 rounded-xl flex items-center justify-center text-lavender-700">
                        <User size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 tracking-tighter leading-none">{username}</span>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold"
                >
                    <LogOut size={20} />
                    Log Out
                </button>
            </div>
        </aside>
    );
}
```
