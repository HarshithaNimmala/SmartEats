import json
import os
import re

def normalize():
    foods_path = r"c:\Users\ADMIN\OneDrive\Desktop\se2\backend\data\foods_db.json"
    map_path = r"c:\Users\ADMIN\OneDrive\Desktop\se2\backend\data\ingredient_map.json"
    
    with open(foods_path, 'r') as f:
        foods = json.load(f)
    with open(map_path, 'r') as f:
        ing_map = json.load(f)
    
    def clean_name(name):
        # Remove (500ml), (1 pc), (raw), (cooked) etc
        name = re.sub(r'\(.*?\)', '', name)
        name = name.strip().lower()
        return name

    changed = False
    missing = set()
    
    for cat in foods:
        for item in foods[cat]:
            new_ingredients = []
            for ing in item['ingredients']:
                cleaned = clean_name(ing)
                # Some manual overrides for common mismatches
                if cleaned == "potatoes": cleaned = "potato"
                if cleaned == "carrot": cleaned = "carrots"
                if cleaned == "egg": cleaned = "eggs"
                if cleaned == "tomato": cleaned = "tomatoes"
                if cleaned == "mustard seeds": 
                    cleaned = "mustard seeds"
                    if cleaned not in ing_map: ing_map[cleaned] = "processed additive"
                if cleaned == "turmeric":
                    cleaned = "turmeric"
                    if cleaned not in ing_map: ing_map[cleaned] = "processed additive"
                if cleaned == "ginger-garlic paste":
                    cleaned = "ginger-garlic paste"
                    if cleaned not in ing_map: ing_map[cleaned] = "processed additive"
                if cleaned == "ginger root": cleaned = "ginger"
                
                # Check if in map
                if cleaned not in ing_map:
                    # Try to find substrings or common variations
                    found = False
                    for key in ing_map:
                        if key in cleaned:
                            cleaned = key
                            found = True
                            break
                    if not found:
                        missing.add(cleaned)
                
                new_ingredients.append(cleaned)
            
            if item['ingredients'] != new_ingredients:
                item['ingredients'] = new_ingredients
                changed = True

    if changed:
        with open(foods_path, 'w') as f:
            json.dump(foods, f, indent=2)
        print("foods_db.json normalized successfully.")
    
    if missing:
        print("\nMissing ingredients in map:")
        for m in sorted(list(missing)):
            print(f"- {m}")
        
        # Automatically add missing as 'processed additive' or 'fiber' if likely
        for m in missing:
            category = "processed additive"
            if any(x in m for x in ["spices", "oil", "fat"]): category = "saturated fat"
            if any(x in m for x in ["onion", "tomato", "chili", "coriander", "curry"]): category = "fiber"
            ing_map[m] = category
            print(f"Added {m} to map as {category}")
        
        with open(map_path, 'w') as f:
            json.dump(ing_map, f, indent=2)

if __name__ == "__main__":
    normalize()
