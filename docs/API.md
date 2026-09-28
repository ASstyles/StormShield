# StormShield X — REST API Specification

**Base URL:** `http://localhost:8000/api` (or `/` via Nginx frontend proxy)  
**OpenAPI Specification:** `http://localhost:8000/openapi.json`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**Version:** 1.0.0  

---

## 1. System Health & Probes

### `GET /health` / `GET /api/health`
Liveness probe. Verifies application execution, database connectivity status, and active AI model.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0",
  "service": "StormShield Emergency Impact Engine",
  "gee_connected": false,
  "ai_model": "gemini-3.8-flash"
}
```

### `GET /health/ready` / `GET /api/health/ready`
Readiness probe. Confirms database tables are initialized and seeded scenarios exist.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "ready": true,
  "database": "connected",
  "version": "1.0.0",
  "seeded_scenario_ready": true,
  "active_cyclones": 1,
  "monitored_infrastructure": 18,
  "gee_service": "synthetic_demo_mode",
  "ai_service": "gemini_ready"
}
```

---

## 2. Cyclone Telemetry & Simulation

### `GET /api/cyclones`
Retrieves list of all active or archived cyclone scenarios.
- **Response `200 OK`**: Array of `CycloneResponse`.

### `GET /api/cyclone`
Retrieves the currently active scenario cyclone (default: `Cyclone Jal-26`).
- **Response `200 OK`**:
```json
{
  "id": "CYCLONE-2026-AP01",
  "name": "Cyclone Jal-26",
  "category": "Very Severe Cyclonic Storm (VSCS)",
  "latitude": 16.45,
  "longitude": 83.10,
  "wind_speed": 145.0,
  "pressure": 962.0,
  "rainfall": 280.0,
  "storm_surge": 2.8,
  "movement_direction": 305.0,
  "movement_speed": 16.0,
  "radius": 180.0,
  "eta_hours": 18.0,
  "track": [...],
  "cone_of_uncertainty": {...}
}
```

### `POST /api/cyclones/simulate`
Advances or parameterizes the active cyclone scenario.
- **Request Body**:
```json
{
  "name": "Cyclone Jal-26 (Simulated Landfall)",
  "wind_speed": 165.0,
  "rainfall": 390.0,
  "storm_surge": 3.8,
  "latitude": 16.95,
  "longitude": 82.50,
  "eta_hours": 6.0
}
```
- **Response `200 OK`**: Returns updated `SimulateImpactResponse` with recalculated risk zones, infrastructure at risk, and newly generated alerts.

---

## 3. Geospatial Hazard & Risk Zones

### `GET /api/risk/zones` (Alias: `GET /api/risk-zones`)
Returns all polygon hazard inundation zones formatted in standard WGS84 GeoJSON geometry (`[longitude, latitude]`).
- **Response `200 OK`**: Array of `RiskZoneResponse`:
```json
[
  {
    "id": "ZONE-AP-01",
    "zone_name": "Kakinada Coastal Lowlands & Harbor",
    "district": "Kakinada",
    "cyclone_id": "CYCLONE-2026-AP01",
    "flood_risk": 88.5,
    "surge_risk": 91.0,
    "wind_risk": 82.0,
    "infrastructure_risk": 85.0,
    "overall_risk": 87.2,
    "risk_level": "CRITICAL",
    "population_exposed": 142500,
    "elevation_mean": 2.4,
    "rainfall_forecast": 310.0,
    "distance_to_coast_km": 1.2,
    "explainability": {
      "rainfall_contribution": 35.5,
      "elevation_contribution": 31.0,
      "coastal_exposure_contribution": 19.5,
      "historical_susceptibility_contribution": 14.0,
      "narrative": "Critical compound hazard..."
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[82.205, 16.920], [82.270, 16.920], ...]]
    }
  }
]
```

### `GET /api/hazards`
Aggregates regional multi-hazard summary across all monitored districts.

---

## 4. Critical Infrastructure & Cascade Analysis

### `GET /api/infrastructure/at-risk`
Lists all monitored hospitals, shelters, power stations, bridges, and emergency centers with calculated vulnerability scores.

### `GET /api/infrastructure/cascade/{asset_id}`
Simulates systemic dependency collapse triggered by failure of the root asset.
- **Parameters:** `asset_id=INFRA-PWR-01`, `hazard_level=CRITICAL`
- **Response `200 OK`**:
```json
{
  "root_asset_id": "INFRA-PWR-01",
  "root_asset_name": "Kakinada 400kV Grid Substation",
  "total_affected_facilities": 5,
  "affected_population": 450000,
  "cascade_depth": 2,
  "cascading_failures": [
    {
      "asset_id": "INFRA-HOSP-01",
      "name": "Kakinada Government General Hospital",
      "type": "hospital",
      "status": "POWER_LOST_GENERATOR_ACTIVE",
      "failure_probability": 0.85
    }
  ]
}
```

### `GET /api/infrastructure/what-breaks-first`
Returns rank-ordered list of infrastructure assets sorted by earliest failure threshold.

---

## 5. Evacuation Routing Engine

### `POST /api/routes/analyze`
Computes optimal evacuation corridor comparing normal shortest path vs flood-safe risk-aware path using Dijkstra / A* graph traversal.
- **Request Body**:
```json
{
  "start_point": "Kakinada Government General Hospital",
  "destination_point": "Samalkot Cyclone Relief Shelter"
}
```
- **Response `200 OK`**:
```json
{
  "normal_route": {
    "name": "Direct Coastal Route (via Port Road)",
    "distance_km": 14.2,
    "travel_time_minutes": 24.5,
    "safety_status": "HIGH_RISK_BLOCKED",
    "blocked_segments": ["1.8km sector overtopped by 2.8m marine surge"],
    "path_coordinates": [[16.9535, 82.2352], ...]
  },
  "risk_aware_route": {
    "name": "Risk-Aware Inland Safe Corridor (via SH-73)",
    "distance_km": 18.5,
    "travel_time_minutes": 28.7,
    "safety_status": "RECOMMENDED_SAFE",
    "minimum_elevation_m": 8.4,
    "path_coordinates": [[16.9535, 82.2352], ...]
  }
}
```

---

## 6. Artificial Intelligence (Google Gemini 3.8 Flash)

### `POST /api/ai/ask`
Interactive natural language commander grounded in active scenario state.
- **Request Body**:
```json
{
  "question": "Which hospitals are most vulnerable and what should we do in the next 6 hours?",
  "zone_id": "ZONE-AP-01"
}
```
- **Response `200 OK`**:
```json
{
  "answer": "At 2.8m storm surge and 280mm rainfall, Kakinada Government General Hospital...",
  "grounded_facts": [...],
  "recommended_actions": [...],
  "confidence_notes": ["Grounded in real-time multi-hazard telemetry"],
  "model_used": "gemini-3.8-flash"
}
```

### `POST /api/ai/analyze-zone`
Generates comprehensive operational action advisory for a designated hazard zone.

### `POST /api/ai/analyze-image`
Multimodal satellite and aerial flood imagery triage.
- **Payload:** `multipart/form-data` with image file (`.jpg`, `.png`, `.webp` up to 10MB).
