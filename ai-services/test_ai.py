import requests
import json

BASE_URL = "http://localhost:8000"

def test_root():
    print("Testing Root...")
    response = requests.get(f"{BASE_URL}/")
    print(response.json())
    print("-" * 20)

def test_risk_prediction():
    print("Testing Risk Prediction (Bangalore Coordinates)...")
    payload = {"latitude": 12.9716, "longitude": 77.5946}
    response = requests.post(f"{BASE_URL}/predict-risk", json=payload)
    print(json.dumps(response.json(), indent=2))
    print("-" * 20)

def test_incident_classification():
    print("Testing Incident Classification...")
    payload = {
        "type": "General",
        "description": "Someone snatched my phone while I was walking near the park and ran away."
    }
    response = requests.post(f"{BASE_URL}/classify-incident", json=payload)
    print(json.dumps(response.json(), indent=2))
    print("-" * 20)

if __name__ == "__main__":
    try:
        test_root()
        test_risk_prediction()
        test_incident_classification()
    except Exception as e:
        print(f"Error connecting to AI Service: {e}")
        print("Make sure the server is running on http://localhost:8000")
