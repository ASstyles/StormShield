import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db, is_db_connected
from app.models.schemas import (
    CycloneResponse,
    SimulateCycloneRequest,
    RiskZoneResponse,
    RiskSimulateRequest,
    InfrastructureResponse,
    InfrastructureAtRiskResponse,
    AlertResponse,
    EmergencyRouteRequest,
    EmergencyRouteResponse,
    AIAnalyzeZoneRequest,
    AIAnalyzeZoneResponse,
    AIAnalyzeImageResponse,
    SimulateImpactResponse,
    AnalyticsSummaryResponse,
    InfrastructureCascadeResult,
    WhatBreaksFirstItem,
    AskAIRequest,
    AskAIResponse,
    ResourceOptimizationRequest,
    ResourceOptimizationResponse,
    DistrictResilienceScore,
    FederatedSimulationResponse,
    TimeStepData
)
from app.models.db_models import CycloneModel, RiskZoneModel, InfrastructureModel
from app.services.cyclone_service import cyclone_service
from app.services.infrastructure_service import infra_service
from app.services.route_service import route_service
from app.services.alert_service import alert_service
from app.services.analytics_service import analytics_service
from app.services.cascade_service import cascade_service
from app.services.resource_service import resource_service
from app.services.resilience_service import resilience_service
from app.services.federated_service import federated_service
from app.services.action_clock_service import action_clock_service
from app.ai.gemini_service import gemini_service
from app.providers.gee_provider import gee_provider

router = APIRouter()

# ----------------- Health Check & Readiness -----------------
@router.get("/health")
def health_check():
    """Liveness probe: verifies service liveness and database connectivity."""
    db_ok = is_db_connected()
    return {
        "status": "ok",
        "database": "connected" if db_ok else "disconnected",
        "version": settings.APP_VERSION,
        "service": "StormShield Emergency Impact Engine",
        "gee_connected": gee_provider.is_connected,
        "ai_model": gemini_service.model
    }

@router.get("/health/ready")
def health_ready(db: Session = Depends(get_db)):
    """Readiness probe: verifies database, seeded scenario, and service readiness."""
    if not is_db_connected():
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    try:
        cyclones_count = db.query(CycloneModel).count()
        infra_count = db.query(InfrastructureModel).count()
        return {
            "status": "ok",
            "ready": True,
            "database": "connected",
            "version": settings.APP_VERSION,
            "seeded_scenario_ready": cyclones_count > 0 and infra_count > 0,
            "active_cyclones": cyclones_count,
            "monitored_infrastructure": infra_count,
            "gee_service": "connected" if gee_provider.is_connected else "synthetic_demo_mode",
            "ai_service": "gemini_ready" if gemini_service.api_key else "offline_rule_engine_ready"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Readiness check failed: {e}")


# ----------------- Cyclones -----------------
@router.get("/cyclones", response_model=List[CycloneResponse])
def get_cyclones(db: Session = Depends(get_db)):
    return cyclone_service.list_cyclones(db)

@router.get("/cyclone", response_model=CycloneResponse)
def get_active_cyclone(db: Session = Depends(get_db)):
    cyclones = cyclone_service.list_cyclones(db)
    if not cyclones:
        raise HTTPException(status_code=404, detail="No active cyclone scenario found")
    return cyclones[0]

@router.get("/cyclones/{id}", response_model=CycloneResponse)
def get_cyclone_by_id(id: str, db: Session = Depends(get_db)):
    c = cyclone_service.get_cyclone(db, id)
    if not c:
        raise HTTPException(status_code=404, detail="Cyclone scenario not found")
    return c

@router.post("/cyclones/simulate", response_model=SimulateImpactResponse)
@router.post("/cyclone/simulate", response_model=SimulateImpactResponse)
def simulate_cyclone_impact(payload: SimulateCycloneRequest, db: Session = Depends(get_db)):
    result = cyclone_service.simulate_cyclone_impact(db, payload)
    return result

# ----------------- Hazards -----------------
@router.get("/hazards")
def get_hazards(db: Session = Depends(get_db)):
    cyclone = db.query(CycloneModel).first()
    zones = db.query(RiskZoneModel).all()
    avg_flood = sum(z.flood_risk for z in zones) / max(1, len(zones))
    avg_surge = sum(z.surge_risk for z in zones) / max(1, len(zones))
    avg_wind = sum(z.wind_risk for z in zones) / max(1, len(zones))
    return {
        "cyclone_name": cyclone.name if cyclone else "Active Cyclone",
        "wind_speed_kmh": cyclone.wind_speed if cyclone else 145.0,
        "rainfall_mm": cyclone.rainfall if cyclone else 280.0,
        "storm_surge_m": cyclone.storm_surge if cyclone else 2.8,
        "eta_hours": cyclone.eta_hours if cyclone else 18.0,
        "average_flood_index": round(avg_flood, 1),
        "average_surge_index": round(avg_surge, 1),
        "average_wind_index": round(avg_wind, 1),
        "total_population_exposed": sum(z.population_exposed for z in zones if z.overall_risk >= 60.0),
        "provenance": "StormShield Multi-Hazard Hydrodynamic Engine"
    }

@router.post("/hazards/simulate")
def simulate_hazards(payload: RiskSimulateRequest, db: Session = Depends(get_db)):
    params = payload.cyclone_params or SimulateCycloneRequest()
    if payload.rainfall_multiplier and payload.rainfall_multiplier != 1.0:
        params.rainfall = (params.rainfall or 280.0) * payload.rainfall_multiplier
    if payload.surge_multiplier and payload.surge_multiplier != 1.0:
        params.storm_surge = (params.storm_surge or 2.8) * payload.surge_multiplier
    if payload.wind_multiplier and payload.wind_multiplier != 1.0:
        params.wind_speed = (params.wind_speed or 145.0) * payload.wind_multiplier
    return cyclone_service.simulate_cyclone_impact(db, params)

# ----------------- Risk Zones -----------------
@router.get("/risk/zones", response_model=List[RiskZoneResponse])
@router.get("/risk-zones", response_model=List[RiskZoneResponse])
def get_risk_zones(db: Session = Depends(get_db)):
    zones = db.query(RiskZoneModel).all()
    results = []
    for z in zones:
        results.append({
            "id": z.id,
            "zone_name": z.zone_name,
            "district": z.district,
            "cyclone_id": z.cyclone_id,
            "flood_risk": z.flood_risk,
            "surge_risk": z.surge_risk,
            "wind_risk": z.wind_risk,
            "infrastructure_risk": z.infrastructure_risk,
            "overall_risk": z.overall_risk,
            "risk_level": z.risk_level,
            "population_exposed": z.population_exposed,
            "geometry": z.geometry,
            "elevation_mean": z.elevation_mean,
            "rainfall_forecast": z.rainfall_forecast,
            "distance_to_coast_km": z.distance_to_coast_km,
            "explainability": z.explainability or {
                "rainfall_contribution": 35.0,
                "elevation_contribution": 30.0,
                "coastal_exposure_contribution": 20.0,
                "historical_susceptibility_contribution": 15.0,
                "narrative": "Multi-factor vulnerability score"
            }
        })
    return results

@router.get("/risk/zones/{id}")
def get_risk_zone_by_id(id: str, db: Session = Depends(get_db)):
    zone = db.query(RiskZoneModel).filter(RiskZoneModel.id == id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Risk zone not found")
    impact = infra_service.analyze_zone_impact(db, id)
    return {
        "zone": {
            "id": zone.id,
            "zone_name": zone.zone_name,
            "district": zone.district,
            "flood_risk": zone.flood_risk,
            "surge_risk": zone.surge_risk,
            "wind_risk": zone.wind_risk,
            "infrastructure_risk": zone.infrastructure_risk,
            "overall_risk": zone.overall_risk,
            "risk_level": zone.risk_level,
            "population_exposed": zone.population_exposed,
            "elevation_mean": zone.elevation_mean,
            "rainfall_forecast": zone.rainfall_forecast,
            "distance_to_coast_km": zone.distance_to_coast_km,
            "explainability": zone.explainability,
            "geometry": zone.geometry
        },
        "impact_analysis": impact
    }

@router.post("/risk/simulate", response_model=SimulateImpactResponse)
def simulate_risk(payload: RiskSimulateRequest, db: Session = Depends(get_db)):
    params = payload.cyclone_params or SimulateCycloneRequest()
    if payload.rainfall_multiplier and payload.rainfall_multiplier != 1.0:
        params.rainfall = (params.rainfall or 280.0) * payload.rainfall_multiplier
    if payload.surge_multiplier and payload.surge_multiplier != 1.0:
        params.storm_surge = (params.storm_surge or 2.8) * payload.surge_multiplier
    if payload.wind_multiplier and payload.wind_multiplier != 1.0:
        params.wind_speed = (params.wind_speed or 145.0) * payload.wind_multiplier
    return cyclone_service.simulate_cyclone_impact(db, params)

# ----------------- Infrastructure -----------------
@router.get("/infrastructure", response_model=List[InfrastructureResponse])
def get_all_infrastructure(db: Session = Depends(get_db)):
    return infra_service.get_all_infrastructure(db)

@router.get("/infrastructure/at-risk", response_model=List[InfrastructureAtRiskResponse])
def get_infrastructure_at_risk(db: Session = Depends(get_db)):
    return infra_service.get_infrastructure_at_risk(db)

@router.get("/infrastructure/what-breaks-first", response_model=List[WhatBreaksFirstItem])
def get_what_breaks_first(db: Session = Depends(get_db)):
    """
    Signature Feature: Infrastructure 'What Breaks First?'
    Ranks regional infrastructure by Risk = Hazard Exposure * Criticality * Population Dependency * Accessibility Risk.
    """
    return cascade_service.get_what_breaks_first(db)

@router.get("/infrastructure/cascade/{id}", response_model=InfrastructureCascadeResult)
def get_infrastructure_cascade(id: str, hazard_level: str = "CRITICAL"):
    """
    Simulates the cascading blast radius and downstream dependencies if a root asset fails.
    """
    return cascade_service.analyze_asset_cascade(root_asset_id=id, hazard_level=hazard_level)

@router.get("/infrastructure/{id}")
def get_infrastructure_by_id(id: str, db: Session = Depends(get_db)):
    asset = db.query(InfrastructureModel).filter(InfrastructureModel.id == id).first()
    if not asset:
        # Check in cascade nodes
        if id in cascade_service.nodes:
            meta = cascade_service.nodes[id]
            return {
                "id": id,
                "name": meta["name"],
                "type": meta["type"],
                "district": "Kakinada",
                "criticality": meta.get("criticality", 0.9),
                "pop_served": meta.get("pop_served", 50000)
            }
        raise HTTPException(status_code=404, detail="Infrastructure asset not found")
    return asset

# ----------------- Alerts -----------------
@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return alert_service.get_all_alerts(db)

@router.post("/alerts/generate", response_model=List[AlertResponse])
def generate_alerts(db: Session = Depends(get_db)):
    return alert_service.generate_alerts_for_zones(db)

# ----------------- Emergency Route Analysis -----------------
@router.post("/routes/analyze", response_model=EmergencyRouteResponse)
@router.post("/routes/optimize", response_model=EmergencyRouteResponse)
def analyze_route(req: EmergencyRouteRequest):
    return route_service.analyze_emergency_route(
        start_name=req.start_point or "Kakinada General Hospital",
        dest_name=req.destination_point or "Samalkot Cyclone Relief Shelter"
    )

# ----------------- AI Services -----------------
@router.post("/ai/analyze-zone", response_model=AIAnalyzeZoneResponse)
async def analyze_zone_with_ai(req: AIAnalyzeZoneRequest, db: Session = Depends(get_db)):
    cyclone = db.query(CycloneModel).first()
    cyclone_dict = {
        "name": cyclone.name if cyclone else "Cyclone Jal-26",
        "wind_speed": cyclone.wind_speed if cyclone else 145.0,
        "rainfall": cyclone.rainfall if cyclone else 280.0,
        "storm_surge": cyclone.storm_surge if cyclone else 2.8,
        "eta_hours": cyclone.eta_hours if cyclone else 18.0
    } if cyclone else {}
    impact = infra_service.analyze_zone_impact(db, req.zone_id)
    return await gemini_service.analyze_zone(
        zone_id=req.zone_id,
        cyclone_info=req.cyclone_info or cyclone_dict,
        risk_values=impact or req.risk_values,
        infrastructure_exposure=impact,
        population=req.population,
        road_risk=req.road_risk,
        hospital_risk=req.hospital_risk,
        shelter_risk=req.shelter_risk
    )

@router.post("/ai/ask", response_model=AskAIResponse)
async def ask_stormshield_ai(req: AskAIRequest, db: Session = Depends(get_db)):
    """
    Signature Feature: AI Emergency Commander ('Ask StormShield').
    Answers operational queries grounded in structured multi-hazard application data.
    """
    cyclone = db.query(CycloneModel).first()
    cyclone_dict = {
        "name": cyclone.name if cyclone else "Demo Cyclone",
        "wind_speed": cyclone.wind_speed if cyclone else 145.0,
        "rainfall": cyclone.rainfall if cyclone else 280.0,
        "storm_surge": cyclone.storm_surge if cyclone else 2.8,
        "eta_hours": cyclone.eta_hours if cyclone else 18.0
    } if cyclone else {}

    return await gemini_service.ask_commander(
        question=req.question,
        zone_id=req.zone_id,
        cyclone_state=req.cyclone_state or cyclone_dict,
        context={"cyclone": cyclone_dict}
    )

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("/ai/analyze-image", response_model=AIAnalyzeImageResponse)
async def analyze_satellite_image(
    file: Optional[UploadFile] = File(None),
    preset_image: Optional[str] = Form(None)
):
    image_bytes = None
    mime_type = "image/jpeg"
    file_name = "image.jpg"

    if file:
        file_name = file.filename or "uploaded.jpg"
        ext = os.path.splitext(file_name)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file extension '{ext}'. Only .jpg, .jpeg, .png, .webp are permitted."
            )

        content_type = (file.content_type or "").lower()
        if content_type not in ALLOWED_IMAGE_MIMES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported MIME type '{content_type}'. Must be image/jpeg, image/png, or image/webp."
            )

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (exceeds 10MB limit)")
        
        # Verify genuine image magic bytes (Reject executables / ELF / PE / Scripts)
        is_jpeg = contents[:2] == b'\xff\xd8'
        is_png = contents[:8] == b'\x89PNG\r\n\x1a\n'
        is_webp = len(contents) >= 12 and contents[:4] == b'RIFF' and contents[8:12] == b'WEBP'

        if not (is_jpeg or is_png or is_webp):
            raise HTTPException(
                status_code=400, 
                detail="Security rejection: Uploaded file signature does not match a valid image format."
            )

        image_bytes = contents
        mime_type = content_type
    
    return await gemini_service.analyze_satellite_image(
        image_bytes=image_bytes,
        image_mime=mime_type,
        image_name=file_name
    )


# ----------------- Analytics & Summaries -----------------
@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
@router.get("/analytics", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    return analytics_service.get_summary(db)

# ----------------- Resource Optimization -----------------
@router.post("/resources/optimize", response_model=ResourceOptimizationResponse)
def optimize_resources(req: ResourceOptimizationRequest, db: Session = Depends(get_db)):
    """
    Signature Feature: Resource Pre-Positioning Optimizer.
    Allocates ambulances, rescue boats, generators, and medical kits across zones.
    """
    return resource_service.optimize_resources(db, req)

# ----------------- Resilience Index -----------------
@router.get("/resilience/scores", response_model=List[DistrictResilienceScore])
def get_resilience_scores():
    """
    Signature Feature: Infrastructure Resilience Score.
    Composite resilience breakdown across coastal districts.
    """
    return resilience_service.get_district_resilience()

# ----------------- BRICS Federated Resilience -----------------
@router.post("/federated/simulate", response_model=FederatedSimulationResponse)
def simulate_federated_exchange():
    """
    Signature Feature: BRICS Resilience Network Federated Model Exchange.
    Demonstrates cross-border decentralized model parameter aggregation with privacy by design.
    """
    return federated_service.simulate_federated_exchange()

# ----------------- Anticipatory Action Clock -----------------
@router.get("/action-clock")
def get_action_clock(db: Session = Depends(get_db)):
    """
    Signature Feature: 6-Hour Anticipatory Action Clock.
    Timeline of operational directives from T-24h to Landfall.
    """
    cyclone = db.query(CycloneModel).first()
    eta = cyclone.eta_hours if cyclone else 18.0
    return action_clock_service.get_action_clock(db=db, current_eta=eta)

# ----------------- Before vs After Intervention -----------------
@router.get("/simulation/before-after")
def get_before_after_intervention(db: Session = Depends(get_db)):
    """
    Signature Feature: Before vs After Intervention Simulator.
    Compares baseline uncontrolled impact against anticipatory intervention impact.
    """
    return {
        "label": "Simulated Scenario Results — Prototype Decision Support",
        "notice": "Simulated scenario comparison demonstrating impact reduction through anticipatory actions.",
        "before_intervention": {
            "population_exposed": 112700,
            "hospitals_isolated": 8,
            "roads_blocked_km": 64.0,
            "emergency_response_time_mins": 42.0,
            "power_substations_failed": 4,
            "critical_shelters_inaccessible": 6,
            "unmitigated_risk_index": 86.5
        },
        "after_intervention": {
            "population_exposed": 112700,
            "hospitals_isolated": 3,
            "roads_blocked_km": 14.5,
            "emergency_response_time_mins": 27.0,
            "power_substations_failed": 1,
            "critical_shelters_inaccessible": 1,
            "mitigated_risk_index": 48.2
        },
        "improvements": {
            "hospitals_saved_from_isolation": 5,
            "response_time_saved_mins": 15.0,
            "road_access_restored_km": 49.5,
            "power_continuity_gain_pct": 75.0,
            "evacuation_efficiency_pct": 35.7
        },
        "key_interventions": [
            "Proactive traffic diversion to State Highway 73 inland elevated bypass (-15 min ambulance delay)",
            "Pre-staging 2x 500kVA auxiliary mobile generators at Kakinada General Hospital and Apollo",
            "Deploying sandbag flood berms and closing sluice gates at Kakinada 400kV Grid Substation",
            "Pre-positioning 12 SDRF motorized rescue boats at Samalkot canal staging point"
        ]
    }

# ----------------- Time Machine Steps -----------------
@router.get("/time-machine/steps")
def get_time_machine_steps():
    """
    Signature Feature: Time Machine Slider Steps (T-24h to Landfall to T+6h).
    """
    return [
        {
            "step_id": "T-24h",
            "label": "T - 24h",
            "eta_hours": 24.0,
            "wind_speed": 120.0,
            "storm_surge": 1.4,
            "rainfall": 120.0,
            "eye_lat": 16.50,
            "eye_lon": 83.10,
            "exposed_population": 38400,
            "isolated_hospitals": 1,
            "blocked_roads_km": 12.0,
            "active_hazards": ["Gale Wind Warning", "High Tidal Swell"],
            "action_directive": "Activate community cyclone shelters; verify diesel generator fuel."
        },
        {
            "step_id": "T-18h",
            "label": "T - 18h",
            "eta_hours": 18.0,
            "wind_speed": 145.0,
            "storm_surge": 2.8,
            "rainfall": 280.0,
            "eye_lat": 16.80,
            "eye_lon": 82.60,
            "exposed_population": 78200,
            "isolated_hospitals": 3,
            "blocked_roads_km": 28.5,
            "active_hazards": ["Storm Surge Advisory", "Flash Flood Threat"],
            "action_directive": "Pre-position medical supplies; sandbag 400kV substation busbars."
        },
        {
            "step_id": "T-12h",
            "label": "T - 12h",
            "eta_hours": 12.0,
            "wind_speed": 155.0,
            "storm_surge": 3.2,
            "rainfall": 340.0,
            "eye_lat": 16.90,
            "eye_lon": 82.40,
            "exposed_population": 98600,
            "isolated_hospitals": 5,
            "blocked_roads_km": 44.0,
            "active_hazards": ["Compound Inundation", "Coastal Seawall Overtopping"],
            "action_directive": "Execute mandatory evacuation of low-lying wards (<3m elevation)."
        },
        {
            "step_id": "T-6h",
            "label": "T - 6h",
            "eta_hours": 6.0,
            "wind_speed": 165.0,
            "storm_surge": 3.6,
            "rainfall": 390.0,
            "eye_lat": 16.98,
            "eye_lon": 82.30,
            "exposed_population": 112700,
            "isolated_hospitals": 8,
            "blocked_roads_km": 64.0,
            "active_hazards": ["Extreme Coastal Inundation", "Destructive Wind Field"],
            "action_directive": "Barricade NH-216 coastal spur; enforce SH-73 inland traffic diversion."
        },
        {
            "step_id": "LANDFALL",
            "label": "Landfall (T-0h)",
            "eta_hours": 0.0,
            "wind_speed": 175.0,
            "storm_surge": 4.1,
            "rainfall": 450.0,
            "eye_lat": 17.02,
            "eye_lon": 82.25,
            "exposed_population": 134500,
            "isolated_hospitals": 10,
            "blocked_roads_km": 82.0,
            "active_hazards": ["Eye Wall Passage", "Peak Surge Inundation", "Widespread Power Failure"],
            "action_directive": "Lockdown mode: responders stand by for post-eye search & rescue."
        },
        {
            "step_id": "T+6h",
            "label": "T + 6h",
            "eta_hours": -6.0,
            "wind_speed": 110.0,
            "storm_surge": 2.1,
            "rainfall": 180.0,
            "eye_lat": 17.25,
            "eye_lon": 82.10,
            "exposed_population": 65000,
            "isolated_hospitals": 4,
            "blocked_roads_km": 36.0,
            "active_hazards": ["Receding Floodwaters", "Structural Debris Hazard"],
            "action_directive": "Deploy dewatering pumps; clear hospital arterial lifeline routes."
        }
    ]
