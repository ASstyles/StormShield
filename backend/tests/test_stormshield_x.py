from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_active_cyclone_singular():
    resp = client.get("/api/cyclone")
    assert resp.status_code == 200
    data = resp.json()
    assert "name" in data
    assert "wind_speed" in data

def test_hazards_overview():
    resp = client.get("/api/hazards")
    assert resp.status_code == 200
    data = resp.json()
    assert "wind_speed_kmh" in data
    assert "average_flood_index" in data

def test_infrastructure_cascade():
    resp = client.get("/api/infrastructure/cascade/INFRA-PWR-01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["root_asset_id"] == "INFRA-PWR-01"
    assert len(data["cascade_chain"]) > 0
    assert len(data["cascade_alerts"]) > 0
    assert data["total_population_at_risk"] > 0

def test_what_breaks_first():
    resp = client.get("/api/infrastructure/what-breaks-first")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 4
    assert items[0]["rank"] == 1
    assert "risk_score" in items[0]
    assert items[0]["failure_impact"] in ["VERY HIGH", "HIGH"]

def test_ask_ai_commander():
    payload = {
        "question": "Which hospitals are most vulnerable?",
        "zone_id": "ZONE-AP-01"
    }
    resp = client.post("/api/ai/ask", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert len(data["grounded_facts"]) > 0
    assert len(data["recommended_actions"]) > 0
    assert len(data["data_provenance"]) > 0

def test_resource_optimization():
    payload = {
        "ambulances_available": 20,
        "rescue_boats_available": 12,
        "generators_available": 10,
        "medical_kits_available": 30
    }
    resp = client.post("/api/resources/optimize", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["allocations"]) > 0
    assert data["total_resources"]["ambulances"] == 20

def test_federated_resilience():
    resp = client.post("/api/federated/simulate")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["nodes"]) == 5
    assert any(n["country"] == "India" for n in data["nodes"])
    assert any(n["country"] == "Brazil" for n in data["nodes"])

def test_resilience_scores():
    resp = client.get("/api/resilience/scores")
    assert resp.status_code == 200
    scores = resp.json()
    assert len(scores) >= 3
    assert any(s["district"] == "Kakinada" for s in scores)

def test_action_clock():
    resp = client.get("/api/action-clock")
    assert resp.status_code == 200
    stages = resp.json()
    assert len(stages) >= 6
    assert any(s["time_id"] == "T-24h" for s in stages)
    assert any(s["time_id"] == "LANDFALL" for s in stages)

def test_before_after_intervention():
    resp = client.get("/api/simulation/before-after")
    assert resp.status_code == 200
    data = resp.json()
    assert "before_intervention" in data
    assert "after_intervention" in data
    assert data["before_intervention"]["hospitals_isolated"] > data["after_intervention"]["hospitals_isolated"]

def test_time_machine_steps():
    resp = client.get("/api/time-machine/steps")
    assert resp.status_code == 200
    steps = resp.json()
    assert len(steps) == 6
    assert steps[0]["step_id"] == "T-24h"
    assert steps[4]["step_id"] == "LANDFALL"
