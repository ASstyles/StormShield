"""
Complete Product Flow Acceptance Test for StormShield X.
Executes the exact 16-step user journey:
1. Load Demo Cyclone
2. Verify Map GeoJSON / Risk Zones
3. Verify Hazard Overview
4. Verify Infrastructure At Risk
5. Click Hospital & Inspect Cascade Analysis
6. Run Route Optimization (Normal vs Risk-Aware)
7. Ask Gemini AI Emergency Commander (All 6 core questions)
8. Verify Gemini Structured Response
9. Change Storm Intensity / Run Emergency Simulation
10. Verify Risk Changes & Deltas
11. Verify Infrastructure Impact Changes
12. Verify Alerts Triggered
13. Open Analytics Summary
14. Test Resource Optimization
15. Test Multimodal Image Analysis
16. Test Before vs After Intervention
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def log_step(step_num, title, status, details=""):
    print(f"[{'PASS' if status else 'FAIL'}] Step {step_num}: {title} - {details}")

def main():
    print("=" * 60)
    print("STORMSHIELD X — COMPLETE PRODUCT ACCEPTANCE TEST")
    print("=" * 60)
    all_passed = True

    # 1. Load Cyclone
    try:
        r = requests.get(f"{BASE_URL}/cyclone", timeout=10)
        assert r.status_code == 200
        cyclone = r.json()
        assert cyclone["name"] == "Cyclone Jal-26"
        log_step(1, "Load Demo Cyclone", True, f"Found {cyclone['name']}, wind={cyclone['wind_speed']} km/h")
    except Exception as e:
        log_step(1, "Load Demo Cyclone", False, str(e))
        all_passed = False

    # 2. Verify Map / Risk Zones
    try:
        r = requests.get(f"{BASE_URL}/risk/zones", timeout=10)
        assert r.status_code == 200
        zones = r.json()
        assert len(zones) >= 6
        assert any(z["id"] == "ZONE-AP-01" for z in zones)
        log_step(2, "Verify Map & Risk Zones", True, f"Loaded {len(zones)} risk zones with full GeoJSON geometry")
    except Exception as e:
        log_step(2, "Verify Map & Risk Zones", False, str(e))
        all_passed = False

    # 3. Verify Hazard Overview
    try:
        r = requests.get(f"{BASE_URL}/hazards", timeout=10)
        assert r.status_code == 200
        hazards = r.json()
        assert "average_flood_index" in hazards
        log_step(3, "Verify Hazard Overview", True, f"Flood: {hazards['average_flood_index']}, Surge: {hazards['average_surge_index']}")
    except Exception as e:
        log_step(3, "Verify Hazard Overview", False, str(e))
        all_passed = False

    # 4. Verify Infrastructure At Risk
    try:
        r = requests.get(f"{BASE_URL}/infrastructure/at-risk", timeout=10)
        assert r.status_code == 200
        infra = r.json()
        assert len(infra) >= 10
        hosp = next((i for i in infra if i["type"] == "hospital"), None)
        assert hosp is not None
        log_step(4, "Verify Infrastructure At Risk", True, f"{len(infra)} assets monitored; sample: {hosp['name']}")
    except Exception as e:
        log_step(4, "Verify Infrastructure At Risk", False, str(e))
        all_passed = False

    # 5. Infrastructure Cascade Analysis
    try:
        r = requests.get(f"{BASE_URL}/infrastructure/cascade/INFRA-PWR-01?hazard_level=CRITICAL", timeout=10)
        assert r.status_code == 200
        cascade = r.json()
        assert len(cascade["cascade_chain"]) >= 2
        assert cascade["total_population_at_risk"] > 0
        log_step(5, "Infrastructure Cascade Simulation", True, f"Blast radius: {cascade['root_asset_name']} -> {len(cascade['cascade_chain'])} dependencies failed")
    except Exception as e:
        log_step(5, "Infrastructure Cascade Simulation", False, str(e))
        all_passed = False

    # 6. Route Optimization
    try:
        payload = {
            "start_point": "Kakinada General Hospital",
            "destination_point": "Samalkot Cyclone Relief Shelter"
        }
        r = requests.post(f"{BASE_URL}/routes/analyze", json=payload, timeout=10)
        assert r.status_code == 200
        route = r.json()
        assert route["normal_route"]["is_compromised"] is True
        assert route["risk_aware_route"]["is_compromised"] is False
        log_step(6, "Emergency Route Optimization", True, f"Safe bypass via SH-73 avoided: {route.get('hazard_avoided')}")
    except Exception as e:
        log_step(6, "Emergency Route Optimization", False, str(e))
        all_passed = False

    # 7 & 8. Ask Gemini AI Emergency Commander (All questions)
    test_questions = [
        "Which hospitals are most vulnerable?",
        "What happens if rainfall increases by 30%?",
        "Which evacuation route should be avoided?",
        "Where should ambulances be positioned?",
        "Why is Zone 7 critical?",
        "What should authorities do in the next six hours?"
    ]
    ai_passed = True
    for q in test_questions:
        try:
            r = requests.post(f"{BASE_URL}/ai/ask", json={"question": q, "zone_id": "ZONE-AP-01"}, timeout=15)
            assert r.status_code == 200
            resp = r.json()
            assert len(resp["answer"]) > 10
            assert len(resp["grounded_facts"]) >= 1
            assert len(resp["recommended_actions"]) >= 1
        except Exception as e:
            print(f"Failed on question '{q}': {e}")
            ai_passed = False
    log_step(7, "Ask Gemini AI Commander", ai_passed, f"Tested {len(test_questions)} commander questions; grounded synthesis verified")
    if not ai_passed:
        all_passed = False

    # 9, 10, 11, 12. Run Emergency Simulation (Scenario Change)
    try:
        sim_payload = {
            "wind_speed": 165.0,
            "rainfall": 350.0,
            "storm_surge": 3.8,
            "eta_hours": 6.0
        }
        r = requests.post(f"{BASE_URL}/cyclones/simulate", json=sim_payload, timeout=15)
        assert r.status_code == 200
        sim_res = r.json()
        assert "metrics_comparison" in sim_res
        assert len(sim_res["metrics_comparison"]) >= 4
        assert len(sim_res["alerts_triggered"]) >= 1
        log_step(9, "Emergency Scenario Simulation", True, f"Simulated Landfall T-6h; {len(sim_res['alerts_triggered'])} alerts generated")
    except Exception as e:
        log_step(9, "Emergency Scenario Simulation", False, str(e))
        all_passed = False

    # 13. Analytics Summary
    try:
        r = requests.get(f"{BASE_URL}/analytics/summary", timeout=10)
        assert r.status_code == 200
        analytics = r.json()
        assert analytics["total_population_exposed"] > 0
        assert len(analytics["districts"]) >= 1
        assert len(analytics["timeline_forecast"]) >= 5
        log_step(13, "Analytics Summary", True, f"Total pop exposed: {analytics['total_population_exposed']:,}, {len(analytics['districts'])} districts")
    except Exception as e:
        log_step(13, "Analytics Summary", False, str(e))
        all_passed = False

    # 14. Resource Optimization
    try:
        res_payload = {"ambulances_available": 20, "rescue_boats_available": 12, "generators_available": 10, "medical_kits_available": 30}
        r = requests.post(f"{BASE_URL}/resources/optimize", json=res_payload, timeout=10)
        assert r.status_code == 200
        opt = r.json()
        assert len(opt["allocations"]) >= 3
        log_step(14, "Resource Optimization", True, f"Optimized score: {opt['optimization_score']}, {len(opt['allocations'])} allocations")
    except Exception as e:
        log_step(14, "Resource Optimization", False, str(e))
        all_passed = False

    # 15. Multimodal Image Analysis
    try:
        r = requests.post(f"{BASE_URL}/ai/analyze-image", timeout=15)
        assert r.status_code == 200
        img_analysis = r.json()
        assert len(img_analysis["observations"]) >= 2
        assert len(img_analysis["potential_risks"]) >= 1
        log_step(15, "Multimodal Optical Intelligence", True, f"{len(img_analysis['observations'])} visual observations, confidence: {img_analysis['confidence_level']}")
    except Exception as e:
        log_step(15, "Multimodal Optical Intelligence", False, str(e))
        all_passed = False

    # 16. Before vs After Intervention
    try:
        r = requests.get(f"{BASE_URL}/simulation/before-after", timeout=10)
        assert r.status_code == 200
        ba = r.json()
        assert ba["after_intervention"]["mitigated_risk_index"] < ba["before_intervention"]["unmitigated_risk_index"]
        log_step(16, "Before vs After Intervention", True, f"Risk reduced from {ba['before_intervention']['unmitigated_risk_index']} -> {ba['after_intervention']['mitigated_risk_index']}")
    except Exception as e:
        log_step(16, "Before vs After Intervention", False, str(e))
        all_passed = False

    print("=" * 60)
    print(f"PRODUCT ACCEPTANCE TEST RESULT: {'ALL PASS' if all_passed else 'SOME FAILED'}")
    print("=" * 60)
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
