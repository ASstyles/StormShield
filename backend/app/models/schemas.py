from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator

# ----------------- Cyclone Schemas -----------------
class CycloneTrackPoint(BaseModel):
    time: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    wind_speed: float = Field(..., ge=0.0)
    pressure: float = Field(..., ge=800.0, le=1100.0)
    intensity: str
    status: str # "OBSERVED" or "FORECAST"

class CycloneBase(BaseModel):
    id: str
    name: str
    category: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    wind_speed: float = Field(..., ge=0.0)
    pressure: float = Field(..., ge=800.0, le=1100.0)
    rainfall: float = Field(..., ge=0.0)
    storm_surge: float = Field(..., ge=0.0)
    movement_direction: float = Field(..., ge=0.0, le=360.0)
    movement_speed: float = Field(..., ge=0.0)
    radius: float = Field(..., ge=0.0)
    eta_hours: float = Field(..., ge=0.0)

class CycloneResponse(CycloneBase):
    track: List[CycloneTrackPoint] = []
    cone_of_uncertainty: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)

class SimulateCycloneRequest(BaseModel):
    latitude: Optional[float] = Field(default=16.95, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=82.50, ge=-180.0, le=180.0)
    wind_speed: Optional[float] = Field(default=145.0, ge=0.0)
    pressure: Optional[float] = Field(default=962.0, ge=800.0, le=1100.0)
    rainfall: Optional[float] = Field(default=280.0, ge=0.0)
    storm_surge: Optional[float] = Field(default=2.8, ge=0.0)
    movement_direction: Optional[float] = Field(default=305.0, ge=0.0, le=360.0)
    movement_speed: Optional[float] = Field(default=16.0, ge=0.0)
    eta_hours: Optional[float] = Field(default=18.0, ge=0.0)


# ----------------- Infrastructure Schemas -----------------
class InfrastructureBase(BaseModel):
    id: str
    name: str
    type: str # hospital, shelter, road, bridge, power_station, school, emergency_center
    district: str
    latitude: float
    longitude: float
    criticality: float
    capacity: int = 0
    elevation: float = 5.0
    distance_to_coast_km: float = 10.0
    metadata_json: Dict[str, Any] = {}

class InfrastructureResponse(InfrastructureBase):
    model_config = ConfigDict(from_attributes=True)

class InfrastructureAtRiskResponse(InfrastructureBase):
    risk_score: float
    hazard_level: str # LOW, MEDIUM, HIGH, CRITICAL
    exposed_hazards: List[str] = []
    recommended_action: str
    explanation: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)

# ----------------- Risk Zone Schemas -----------------
class ExplainabilityFactors(BaseModel):
    rainfall_contribution: float
    elevation_contribution: float
    coastal_exposure_contribution: float
    historical_susceptibility_contribution: float
    narrative: str

class RiskZoneResponse(BaseModel):
    id: str
    zone_name: str
    district: str
    cyclone_id: Optional[str] = None
    flood_risk: float
    surge_risk: float
    wind_risk: float
    infrastructure_risk: float
    overall_risk: float
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    population_exposed: int
    geometry: Dict[str, Any]
    elevation_mean: float
    rainfall_forecast: float
    distance_to_coast_km: float
    explainability: ExplainabilityFactors
    model_config = ConfigDict(from_attributes=True)

class RiskSimulateRequest(BaseModel):
    rainfall_multiplier: Optional[float] = 1.0
    surge_multiplier: Optional[float] = 1.0
    wind_multiplier: Optional[float] = 1.0
    cyclone_params: Optional[SimulateCycloneRequest] = None

# ----------------- Alert Schemas -----------------
class AlertResponse(BaseModel):
    id: str
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    zone_id: Optional[str] = None
    district: str
    title: str
    message: str
    affected_summary: Dict[str, Any] = {}
    recommended_action: str
    status: str = "ACTIVE"
    created_at: str
    model_config = ConfigDict(from_attributes=True)


# ----------------- Emergency Route Schemas -----------------
class RoutePoint(BaseModel):
    name: str
    latitude: float
    longitude: float

class RouteStep(BaseModel):
    instruction: str
    distance_km: float
    hazard_status: str # "SAFE", "FLOOD_WARNING", "BLOCKED"

class RouteDetail(BaseModel):
    path_coordinates: List[List[float]] # [[lat, lon], ...]
    distance_km: float
    estimated_time_mins: float
    hazard_score: float
    steps: List[RouteStep]
    is_compromised: bool

class EmergencyRouteRequest(BaseModel):
    start_point: Optional[str] = "Kakinada General Hospital"
    destination_point: Optional[str] = "Samalkot Cyclone Relief Shelter"

class EmergencyRouteResponse(BaseModel):
    id: str
    name: str
    start_point: RoutePoint
    end_point: RoutePoint
    normal_route: RouteDetail
    risk_aware_route: RouteDetail
    hazard_avoided: Optional[str] = None
    recommendation: str

# ----------------- Gemini AI Schemas (app.ai.schemas) -----------------
from app.ai.schemas import (
    AIPriorityAction,
    AIAnalyzeZoneResponse,
    AIAnalyzeImageResponse,
    AskAIResponse
)

class AIAnalyzeZoneRequest(BaseModel):
    zone_id: str
    cyclone_info: Optional[Dict[str, Any]] = None
    risk_values: Optional[Dict[str, Any]] = None
    infrastructure_exposure: Optional[Dict[str, Any]] = None
    population: Optional[int] = None
    road_risk: Optional[Dict[str, Any]] = None
    hospital_risk: Optional[Dict[str, Any]] = None
    shelter_risk: Optional[Dict[str, Any]] = None

# ----------------- Scenario Simulator Schemas -----------------
class BeforeAfterMetric(BaseModel):
    metric_name: str
    unit: str
    before_value: float
    after_value: float
    delta: float
    severity_change: str # e.g., "INCREASED", "CRITICAL"

class SimulateImpactResponse(BaseModel):
    scenario_id: str
    cyclone: CycloneResponse
    impact_summary: Dict[str, Any]
    metrics_comparison: List[BeforeAfterMetric]
    alerts_triggered: List[AlertResponse]
    recommended_priority_actions: List[str]

# ----------------- Analytics Schemas -----------------
class DistrictRiskSummary(BaseModel):
    district: str
    overall_risk: float
    risk_level: str
    population_exposed: int
    hospitals_at_risk: int
    shelters_available: int
    road_km_disrupted: float
    power_stations_affected: int

class AnalyticsSummaryResponse(BaseModel):
    total_population_exposed: int
    total_hospitals_at_risk: int
    total_shelters_active: int
    total_roads_disrupted_km: float
    total_power_stations_exposed: int
    districts: List[DistrictRiskSummary]
    risk_distribution: Dict[str, int] # LOW: 2, MEDIUM: 3, HIGH: 4, CRITICAL: 2
    hazard_composition: Dict[str, float] # flood: 35%, surge: 25%, wind: 20%, infra: 20%
    timeline_forecast: List[Dict[str, Any]]

# ----------------- StormShield X: Cascade & Dependency Schemas -----------------
class CascadeNode(BaseModel):
    id: str
    name: str
    type: str
    criticality: float
    failure_probability: float
    status: str # NORMAL, COMPROMISED, CRITICAL_SHUTDOWN

class CascadeAlert(BaseModel):
    asset_id: str
    asset_name: str
    failure_trigger: str
    affected_hospitals: int
    affected_water_facilities: int
    affected_emergency_centers: int
    estimated_population_affected: int
    severity: str
    mitigation_action: str

class InfrastructureCascadeResult(BaseModel):
    root_asset_id: str
    root_asset_name: str
    failure_trigger: str
    cascade_chain: List[str]
    cascade_alerts: List[CascadeAlert]
    downstream_nodes: List[CascadeNode]
    total_population_at_risk: int

class WhatBreaksFirstItem(BaseModel):
    rank: int
    id: str
    name: str
    type: str
    district: str
    risk_score: float
    failure_impact: str # VERY HIGH, HIGH, MEDIUM
    primary_driver: str
    population_dependent: int
    mitigation: str

# ----------------- StormShield X: AI Commander Schemas -----------------
class AskAIRequest(BaseModel):
    question: Optional[str] = None
    query: Optional[str] = None
    zone_id: Optional[str] = None
    cyclone_state: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def check_question_or_query(cls, data: Any):
        if isinstance(data, dict):
            q = data.get("question") or data.get("query") or "Status overview"
            data["question"] = q
            data["query"] = q
        return data


# AskAIResponse imported from app.ai.schemas above

# ----------------- StormShield X: Resource Optimization Schemas -----------------
class ResourceOptimizationRequest(BaseModel):
    ambulances_available: Optional[int] = 20
    rescue_boats_available: Optional[int] = 12
    generators_available: Optional[int] = 10
    medical_kits_available: Optional[int] = 30

class ResourceAllocation(BaseModel):
    zone_id: str
    zone_name: str
    risk_level: str
    ambulances: int
    rescue_boats: int
    generators: int
    medical_kits: int
    rationale: str

class ResourceOptimizationResponse(BaseModel):
    total_resources: Dict[str, int]
    allocations: List[ResourceAllocation]
    optimization_score: float
    deployment_summary: str

# ----------------- StormShield X: Resilience Index Schemas -----------------
class DistrictResilienceScore(BaseModel):
    district: str
    overall_resilience: float
    exposure_score: float
    infrastructure_score: float
    accessibility_score: float
    emergency_cover_score: float
    redundancy_score: float
    key_vulnerability: str
    label: str = "StormShield Resilience Index — Prototype"

# ----------------- StormShield X: BRICS Federated Resilience Schemas -----------------
class FederatedNode(BaseModel):
    country: str
    flag: str
    institution: str
    region_profile: str
    model_type: str
    local_samples: int
    training_status: str
    accuracy_gain_pct: float

class FederatedSimulationResponse(BaseModel):
    global_model_version: str
    aggregation_algorithm: str
    nodes: List[FederatedNode]
    privacy_mechanism: str
    convergence_rounds: int
    global_f1_score: float
    notice: str = "Simulated federated parameter exchange without raw cross-border citizen data transfer."

# ----------------- StormShield X: Time Machine Step -----------------
class TimeStepData(BaseModel):
    step_id: str
    label: str
    eta_hours: float
    wind_speed: float
    storm_surge: float
    rainfall: float
    eye_lat: float
    eye_lon: float
    exposed_population: int
    isolated_hospitals: int
    blocked_roads_km: float
    active_hazards: List[str]
    action_items: List[str]

