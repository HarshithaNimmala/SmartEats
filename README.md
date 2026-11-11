# SmartEats – AI-Powered Health & Nutrition Assistant

SmartEats is an AI-powered health and nutrition assistant designed to help users make informed food choices based on their health conditions and nutritional requirements.

The platform combines AI, machine learning, medical report analysis, and food nutrition information to provide personalized health insights and support healthier eating habits.

## Features

- **Medical Report Analysis:** Upload medical reports and extract relevant health indicators.
- **AI Health Assistant:** Interact with an AI-powered assistant for health and nutrition-related guidance.
- **Food Nutrition Analysis:** Explore nutritional information and understand how different foods relate to health conditions.
- **Health Risk Assessment:** Use machine learning models to support health risk classification.
- **Food Tracker:** Track food consumption and maintain food history.
- **Meal Planner:** Plan meals based on nutritional and health-related requirements.
- **Progress Tracking:** Monitor health and nutrition-related progress.

## Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Tailwind CSS
- Vite

### Backend
- Python
- FastAPI
- REST APIs

### AI & Machine Learning
- Google Gemini API
- Machine Learning models
- Scikit-learn
- Image and text extraction

### Data Storage
- JSON-based data storage

## Project Structure

```text
SmartEats/
│
├── backend/
│   ├── data/
│   ├── models/
│   ├── main.py
│   ├── analysis_engine.py
│   ├── auth.py
│   ├── extractor.py
│   ├── ml_engine.py
│   ├── nutrition_engine.py
│   ├── risk_engine.py
│   ├── vision_engine.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── generate_dummy.py
├── sample_code_documentation.md
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/HarshithaNimmala/SmartEats.git
cd SmartEats
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory and configure the required environment variables.

Example:

```env
GEMINI_API_KEY=your_api_key_here
```

Never upload your actual API keys or `.env` file to GitHub.

Start the backend using the appropriate FastAPI application entry point.

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## Machine Learning Models

SmartEats includes trained machine learning models for health risk assessment and glucose-related prediction tasks.

The model files and supporting datasets are maintained in the backend directory.

## Future Enhancements

- Improved personalization of meal recommendations.
- Enhanced medical report extraction.
- More comprehensive nutrition analysis.
- Improved model accuracy and evaluation.
- Integration with additional health and fitness data sources.

## Disclaimer

SmartEats is an educational and informational project. Its AI-generated outputs and machine learning predictions are not a substitute for professional medical advice, diagnosis, or treatment.

## Author

**Harshitha Nimmala**

GitHub: [HarshithaNimmala](https://github.com/HarshithaNimmala)

---

If you find this project interesting, feel free to explore the repository and its implementation.
