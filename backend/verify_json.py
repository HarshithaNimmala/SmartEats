import json
import os

def verify_indicators(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return False
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format: {e}")
        return False

    all_diseases = set()
    errors = []

    for indicator, ranges in data.items():
        if not isinstance(ranges, list):
            errors.append(f"Indicator {indicator} should be a list.")
            continue
        
        for i, entry in enumerate(ranges):
            # Check required keys
            required_keys = ["min", "max", "label", "diseases", "priority"]
            for key in required_keys:
                if key not in entry:
                    errors.append(f"Indicator {indicator}[{i}] missing key: {key}")
            
            # Check value types
            if not isinstance(entry.get("min"), (int, float)):
                errors.append(f"Indicator {indicator}[{i}] 'min' should be a number.")
            if not isinstance(entry.get("max"), (int, float)):
                errors.append(f"Indicator {indicator}[{i}] 'max' should be a number.")
            if not isinstance(entry.get("diseases"), list):
                errors.append(f"Indicator {indicator}[{i}] 'diseases' should be a list.")
            
            # Check range logic
            if entry.get("min") is not None and entry.get("max") is not None:
                if entry["min"] > entry["max"]:
                    errors.append(f"Indicator {indicator}[{i}] min ({entry['min']}) > max ({entry['max']})")
            
            # Collect diseases
            for d in entry.get("diseases", []):
                all_diseases.add(d)

    print(f"Total Indicators: {len(data)}")
    print(f"Total Diseases found: {len(all_diseases)}")
    print(f"Diseases: {sorted(list(all_diseases))}")

    if errors:
        print("\nErrors Found:")
        for err in errors:
            print(f"- {err}")
        return False
    else:
        print("\nVerification Successful! No structure or range errors found.")
        return True

def verify_foods(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return False
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format: {e}")
        return False

    required_categories = ["processed_foods", "natural_foods", "indian_foods"]
    errors = []

    for cat in required_categories:
        if cat not in data:
            errors.append(f"Missing category: {cat}")
            continue
        
        items = data[cat]
        if not isinstance(items, list):
            errors.append(f"Category {cat} should be a list.")
            continue
        
        print(f"Category {cat}: {len(items)} items")
        if len(items) < 30:
            errors.append(f"Category {cat} has only {len(items)} items, expected at least 30.")
        
        for i, item in enumerate(items):
            required_keys = ["name", "ingredients", "nutrition"]
            for key in required_keys:
                if key not in item:
                    errors.append(f"Item {cat}[{i}] missing key: {key}")
            
            if "nutrition" in item:
                nut_keys = ["calories", "sugar", "fat", "protein", "sodium"]
                for nkey in nut_keys:
                    if nkey not in item["nutrition"]:
                        errors.append(f"Item {cat}[{i}] nutrition missing key: {nkey}")
                    elif not isinstance(item["nutrition"][nkey], (int, float)):
                        errors.append(f"Item {cat}[{i}] nutrition {nkey} should be a number.")

    if errors:
        print("\nErrors Found in Foods DB:")
        for err in errors:
            print(f"- {err}")
        return False
    else:
        print("\nFoods DB Verification Successful!")
        return True

def verify_mapping(foods_path, map_path):
    if not os.path.exists(foods_path) or not os.path.exists(map_path):
        print("Error: Files not found for mapping verification.")
        return False
    
    with open(foods_path, 'r') as f:
        foods = json.load(f)
    with open(map_path, 'r') as f:
        ing_map = json.load(f)
    
    errors = []
    used_ingredients = set()
    for cat in foods:
        for item in foods[cat]:
            for ing in item['ingredients']:
                used_ingredients.add(ing)
                if ing not in ing_map:
                    errors.append(f"Ingredient '{ing}' used in foods_db.json but missing from ingredient_map.json")
    
    valid_categories = {"sugar", "refined carbs", "complex carbs", "fiber", "protein", "saturated fat", "trans fat", "healthy fat", "high sodium", "processed additive"}
    for ing, cat in ing_map.items():
        if cat not in valid_categories:
            errors.append(f"Invalid category '{cat}' for ingredient '{ing}'")

    print(f"Total Unique Ingredients in DB: {len(used_ingredients)}")
    print(f"Total Ingredients in Map: {len(ing_map)}")

    if errors:
        print("\nMapping Inconsistencies Found:")
        for err in errors:
            print(f"- {err}")
        return False
    else:
        print("\nMapping Consistency Verified!")
        return True

if __name__ == "__main__":
    indicator_file = r"c:\Users\ADMIN\OneDrive\Desktop\se2\backend\data\medical_indicators.json"
    foods_file = r"c:\Users\ADMIN\OneDrive\Desktop\se2\backend\data\foods_db.json"
    map_file = r"c:\Users\ADMIN\OneDrive\Desktop\se2\backend\data\ingredient_map.json"
    
    v1 = verify_indicators(indicator_file)
    v2 = verify_foods(foods_file)
    v3 = verify_mapping(foods_file, map_file)
    
    if v1 and v2 and v3:
        print("\nAll datasets and mappings verified successfully!")
    else:
        exit(1)
