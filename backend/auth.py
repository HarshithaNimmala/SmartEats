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
