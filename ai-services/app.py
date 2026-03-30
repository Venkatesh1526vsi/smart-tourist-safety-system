from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
import uvicorn
import os
import re
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Smart Tourist Safety AI Services",
    description="Intelligent risk assessment and incident classification for tourists",
    version="1.1.0"
)

# --- Models ---
class IncidentData(BaseModel):
    type: str
    description: str

class LocationData(BaseModel):
    latitude: float
    longitude: float

class RiskResponse(BaseModel):
    risk_score: float
    level: str
    factors: List[str]
    recommendation: str
    last_updated: str

# --- Mock Data for Analysis ---
# In a real system, this would be fetched from the main database or a data warehouse
HISTORICAL_INCIDENTS = [
    {"lat": 12.9716, "lng": 77.5946, "type": "Theft", "weight": 0.8},
    {"lat": 12.9710, "lng": 77.5940, "type": "Harassment", "weight": 0.6},
    {"lat": 19.0760, "lng": 72.8777, "type": "Medical", "weight": 0.4},
]

# --- AI Logic Functions ---

def calculate_distance(lat1, lon1, lat2, lon2):
    # Simplified distance calculation for demonstration
    return ((lat1 - lat2)**2 + (lon1 - lon2)**2)**0.5

def get_risk_factors(location: LocationData) -> List[str]:
    factors = []
    # Check proximity to known high-incident zones
    for incident in HISTORICAL_INCIDENTS:
        dist = calculate_distance(location.latitude, location.longitude, incident['lat'], incident['lng'])
        if dist < 0.05: # Roughly 5km
            factors.append(f"High frequency of {incident['type']} reports in this vicinity")
    
    # Check time of day
    hour = datetime.now().hour
    if 22 <= hour or hour <= 4:
        factors.append("Late night hours increase vulnerability in unfamiliar areas")
    
    if not factors:
        factors.append("General safety parameters within normal range")
    
    return factors

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Smart Tourist Safety AI",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict-risk", response_model=RiskResponse)
async def predict_risk(location: LocationData):
    """
    Advanced risk prediction based on proximity to historical incidents,
    current time, and simulated environmental factors.
    """
    factors = get_risk_factors(location)
    
    # Base risk calculation
    risk_score = 0.1
    if "Late night" in str(factors): risk_score += 0.2
    
    # Proximity risk
    for incident in HISTORICAL_INCIDENTS:
        dist = calculate_distance(location.latitude, location.longitude, incident['lat'], incident['lng'])
        if dist < 0.02: risk_score += 0.4
        elif dist < 0.05: risk_score += 0.2

    risk_score = min(risk_score, 1.0) # Cap at 1.0
    
    level = "Low"
    recommendation = "Safe to travel. Enjoy your visit!"
    
    if risk_score > 0.7:
        level = "High"
        recommendation = "Avoid unlit areas and stay with a group. High alert recommended."
    elif risk_score > 0.4:
        level = "Medium"
        recommendation = "Stay aware of your surroundings and keep your belongings secure."
        
    return RiskResponse(
        risk_score=round(risk_score, 2),
        level=level,
        factors=factors,
        recommendation=recommendation,
        last_updated=datetime.now().isoformat()
    )

@app.post("/classify-incident")
async def classify_incident(incident: IncidentData):
    """
    NLP-based incident classification using pattern matching and keyword weighting.
    """
    text = incident.description.lower()
    
    # Category patterns
    categories = {
        "Crime": [r"theft", r"stolen", r"robbery", r"snatched", r"pickpocket", r"threat", r"attack"],
        "Medical": [r"hurt", r"injury", r"pain", r"accident", r"fainted", r"sick", r"hospital", r"ambulance"],
        "Fire": [r"fire", r"smoke", r"burning", r"explosion", r"flame"],
        "Missing Person": [r"lost", r"missing", r"can't find", r"disappeared", r"separated"],
        "Harassment": [r"followed", r"staring", r"uncomfortable", r"abusive", r"shouting"]
    }
    
    scores = {cat: 0 for cat in categories}
    for cat, patterns in categories.items():
        for pattern in patterns:
            if re.search(pattern, text):
                scores[cat] += 1
                
    # Get highest scoring category
    detected_category = max(scores, key=scores.get) if any(scores.values()) else "General"
    
    # Confidence calculation based on match count
    confidence = 0.5 + (min(scores.get(detected_category, 0), 5) * 0.1) if detected_category != "General" else 0.4
    
    return {
        "input_type": incident.type,
        "detected_category": detected_category,
        "confidence": round(confidence, 2),
        "analysis": f"Incident appears to be related to {detected_category.lower()}"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Run with reload=True for development if needed
    uvicorn.run(app, host="0.0.0.0", port=port)
