from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "HEALTHY"]
    assert data["database"] in ["connected", "ok"]
    assert "version" in data

def test_health_ready():
    response = client.get("/api/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["ready"] is True
    assert data["database"] == "connected"
    assert data["seeded_scenario_ready"] is True


def test_get_cyclones():
    response = client.get("/api/cyclones")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Cyclone Jal-26"
    assert len(data[0]["track"]) > 0

def test_get_risk_zones():
    response = client.get("/api/risk/zones")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 6
    first_zone = data[0]
    assert "overall_risk" in first_zone
    assert "explainability" in first_zone
    assert "rainfall_contribution" in first_zone["explainability"]

def test_get_infrastructure_at_risk():
    response = client.get("/api/infrastructure/at-risk")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 10
    assert "risk_score" in data[0]
    assert "recommended_action" in data[0]

def test_emergency_route_analysis():
    response = client.post("/api/routes/analyze", json={
        "start_point": "Kakinada General Hospital",
        "destination_point": "Samalkot Cyclone Relief Shelter"
    })
    assert response.status_code == 200
    data = response.json()
    assert "normal_route" in data
    assert "risk_aware_route" in data
    assert data["normal_route"]["is_compromised"] is True
    assert data["risk_aware_route"]["is_compromised"] is False
    assert len(data["risk_aware_route"]["path_coordinates"]) >= 2

def test_cyclone_simulation():
    response = client.post("/api/cyclones/simulate", json={
        "wind_speed": 165.0,
        "rainfall": 350.0,
        "storm_surge": 3.6,
        "eta_hours": 6.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "metrics_comparison" in data
    assert len(data["metrics_comparison"]) >= 4
    assert len(data["alerts_triggered"]) >= 1

def test_ai_analyze_zone():
    response = client.post("/api/ai/analyze-zone", json={
        "zone_id": "ZONE-AP-01",
        "population": 140000
    })
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["priority_actions"]) >= 2
    assert len(data["risk_reasoning"]) >= 1

def test_analytics_summary():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_population_exposed" in data
    assert len(data["districts"]) >= 1
    assert len(data["timeline_forecast"]) >= 5
