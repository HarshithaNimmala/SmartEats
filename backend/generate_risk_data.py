import json
import random

def generate_risk_data(num_records=200):
    data = []
    
    # Target distribution: ~66 Low, ~67 Medium, ~67 High
    for i in range(num_records):
        # We'll determine the category first and then generate values that fall into it
        target_group = i % 3 # 0: Low, 1: Medium, 2: High
        
        if target_group == 0: # Low Risk
            hba1c = round(random.uniform(4.5, 5.6), 1)
            fasting_glucose = random.randint(70, 99)
            cholesterol = random.randint(120, 199)
            ldl = random.randint(50, 99)
            hdl = random.randint(60, 80)
            triglycerides = random.randint(50, 149)
            bmi = round(random.uniform(18.5, 24.9), 1)
            risk = "Low"
            
        elif target_group == 1: # Medium Risk
            # Mixed values, some borderline
            hba1c = round(random.uniform(5.7, 6.4), 1)
            fasting_glucose = random.randint(100, 125)
            cholesterol = random.randint(200, 239)
            ldl = random.randint(100, 159)
            hdl = random.randint(40, 59)
            triglycerides = random.randint(150, 199)
            bmi = round(random.uniform(25.0, 29.9), 1)
            risk = "Medium"
            
        else: # High Risk
            hba1c = round(random.uniform(6.5, 10.0), 1)
            fasting_glucose = random.randint(126, 250)
            cholesterol = random.randint(240, 300)
            ldl = random.randint(160, 200)
            hdl = random.randint(20, 39)
            triglycerides = random.randint(200, 400)
            bmi = round(random.uniform(30.0, 40.0), 1)
            risk = "High"

        # Add some random variations to make it more realistic (noise)
        # Occasionally swap a few metrics to the 'wrong' category to simulate complex cases,
        # but keep the labels largely logical.
        if random.random() < 0.1: # 10% chance of noise
            if target_group == 0: # Low might have one high triglyceride
                triglycerides = random.randint(201, 300)
            elif target_group == 2: # High might have one normal BMI
                bmi = round(random.uniform(20, 24), 1)

        record = {
            "hba1c": hba1c,
            "fasting_glucose": fasting_glucose,
            "cholesterol": cholesterol,
            "ldl": ldl,
            "hdl": hdl,
            "triglycerides": triglycerides,
            "bmi": bmi,
            "risk": risk
        }
        data.append(record)
    
    # Shuffle the data
    random.shuffle(data)
    return data

if __name__ == "__main__":
    risk_data = generate_risk_data(200)
    with open("c:/Users/ADMIN/OneDrive/Desktop/se2/backend/data/risk_training_data.json", "w") as f:
        json.dump(risk_data, f, indent=2)
    print("Generated 200 records in risk_training_data.json")
