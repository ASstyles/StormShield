export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CycloneTrackPoint {
  time: string;
  latitude: float;
  longitude: float;
  wind_speed: float;
  pressure: float;
  intensity: string;
  status: 'OBSERVED' | 'FORECAST';
}

export type float = number;

export interface Cyclone {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  wind_speed: number;
  pressure: number;
  rainfall: number;
  storm_surge: number;
  movement_direction: number;
  movement_speed: number;
  radius: number;
  eta_hours: number;
  track: CycloneTrackPoint[];
  cone_of_uncertainty: any;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'road' | 'bridge' | 'power_station' | 'school' | 'emergency_center';
  district: string;
  latitude: number;
  longitude: number;
  criticality: number;
  capacity?: number;
  elevation: number;
  distance_to_coast_km: number;
  metadata_json?: Record<string, any>;
}

export interface InfrastructureAtRisk extends InfrastructureAsset {
  risk_score: number;
  hazard_level: RiskLevel;
  exposed_hazards: string[];
  recommended_action: string;
  explanation: Record<string, any>;
}

export interface Explainability {
  rainfall_contribution: number;
  elevation_contribution: number;
  coastal_exposure_contribution: number;
  historical_susceptibility_contribution: number;
  narrative: string;
}

export interface RiskZone {
  id: string;
  zone_name: string;
  district: string;
  cyclone_id?: string;
  flood_risk: number;
  surge_risk: number;
  wind_risk: number;
  infrastructure_risk: number;
  overall_risk: number;
  risk_level: RiskLevel;
  population_exposed: number;
  geometry: any;
  elevation_mean: number;
  rainfall_forecast: number;
  distance_to_coast_km: number;
  explainability: Explainability;
}

export interface Alert {
  id: string;
  severity: RiskLevel;
  zone_id?: string;
  district: string;
  title: string;
  message: string;
  affected_summary?: {
    population_exposed?: number;
    hospitals_at_risk?: number;
    power_stations_affected?: number;
    roads_disrupted_km?: number;
  };
  recommended_action: string;
  status: string;
  created_at: string;
}

export interface RouteStep {
  instruction: string;
  distance_km: number;
  hazard_status: 'SAFE' | 'FLOOD_WARNING' | 'BLOCKED';
}

export interface RouteDetail {
  path_coordinates: [number, number][];
  distance_km: number;
  estimated_time_mins: number;
  hazard_score: number;
  steps: RouteStep[];
  is_compromised: boolean;
}

export interface EmergencyRoute {
  id: string;
  name: string;
  start_point: { name: string; latitude: number; longitude: number };
  end_point: { name: string; latitude: number; longitude: number };
  normal_route: RouteDetail;
  risk_aware_route: RouteDetail;
  hazard_avoided?: string;
  recommendation: string;
}

export interface AIPriorityAction {
  priority: number;
  action: string;
  reason: string;
}

export interface AIAnalysisResult {
  summary: string;
  risk_reasoning: string[];
  priority_actions: AIPriorityAction[];
  critical_assets: string[];
  evacuation_considerations: string[];
  confidence_notes: string[];
}

export interface AIImageAnalysisResult {
  observations: string[];
  possible_risks: string[];
  recommended_verification_steps: string[];
  gis_ground_truth_comparison: string;
  confidence_level: string;
  notice: string;
}

export interface BeforeAfterMetric {
  metric_name: string;
  unit: string;
  before_value: number;
  after_value: number;
  delta: number;
  severity_change: string;
}

export interface SimulateImpactResult {
  scenario_id: string;
  cyclone: Cyclone;
  impact_summary: {
    eta_hours: number;
    landfall_wind_kmh: number;
    peak_surge_m: number;
    total_high_risk_zones: number;
    critical_zones: number;
  };
  metrics_comparison: BeforeAfterMetric[];
  alerts_triggered: Alert[];
  recommended_priority_actions: string[];
}

export interface DistrictRiskSummary {
  district: string;
  overall_risk: number;
  risk_level: RiskLevel;
  population_exposed: number;
  hospitals_at_risk: number;
  shelters_available: number;
  road_km_disrupted: number;
  power_stations_affected: number;
}

export interface AnalyticsSummary {
  total_population_exposed: number;
  total_hospitals_at_risk: number;
  total_shelters_active: number;
  total_roads_disrupted_km: number;
  total_power_stations_exposed: number;
  districts: DistrictRiskSummary[];
  risk_distribution: Record<string, number>;
  hazard_composition: Record<string, number>;
  timeline_forecast: Array<{
    hour: string;
    wind_kmh: number;
    rain_mm: number;
    surge_m: number;
    risk_index: number;
    phase: string;
  }>;
}

// ----------------- Infrastructure Cascade & What Breaks First -----------------
export interface CascadeNode {
  id: string;
  name: string;
  type: string;
  criticality: number;
  failure_probability: number;
  status: 'NORMAL' | 'COMPROMISED' | 'CRITICAL_SHUTDOWN';
}

export interface CascadeAlert {
  asset_id: string;
  asset_name: string;
  failure_trigger: string;
  affected_hospitals: number;
  affected_water_facilities: number;
  affected_emergency_centers: number;
  estimated_population_affected: number;
  severity: string;
  mitigation_action: string;
}

export interface InfrastructureCascadeResult {
  root_asset_id: string;
  root_asset_name: string;
  failure_trigger: string;
  cascade_chain: string[];
  cascade_alerts: CascadeAlert[];
  downstream_nodes: CascadeNode[];
  total_population_at_risk: number;
}

export interface WhatBreaksFirstItem {
  rank: number;
  id: string;
  name: string;
  type: string;
  district: string;
  risk_score: number;
  failure_impact: 'VERY HIGH' | 'HIGH' | 'MEDIUM';
  primary_driver: string;
  population_dependent: number;
  mitigation: string;
}

// ----------------- Ask AI Emergency Commander -----------------
export interface AskAIRequest {
  question: string;
  zone_id?: string;
  cyclone_state?: Record<string, any>;
}

export interface AskAIResponse {
  answer: string;
  grounded_facts: string[];
  recommended_actions: string[];
  data_provenance: string[];
  confidence_score: number;
}

// ----------------- Resource Pre-Positioning -----------------
export interface ResourceAllocation {
  zone_id: string;
  zone_name: string;
  risk_level: string;
  ambulances: number;
  rescue_boats: number;
  generators: number;
  medical_kits: number;
  rationale: string;
}

export interface ResourceOptimizationResponse {
  total_resources: Record<string, number>;
  allocations: ResourceAllocation[];
  optimization_score: number;
  deployment_summary: string;
}

// ----------------- Infrastructure Resilience Score -----------------
export interface DistrictResilienceScore {
  district: string;
  overall_resilience: number;
  exposure_score: number;
  infrastructure_score: number;
  accessibility_score: number;
  emergency_cover_score: number;
  redundancy_score: number;
  key_vulnerability: string;
  label: string;
}

// ----------------- BRICS Federated Resilience -----------------
export interface FederatedNode {
  country: string;
  flag: string;
  institution: string;
  region_profile: string;
  model_type: string;
  local_samples: number;
  training_status: string;
  accuracy_gain_pct: number;
}

export interface FederatedSimulationResponse {
  global_model_version: string;
  aggregation_algorithm: string;
  nodes: FederatedNode[];
  privacy_mechanism: string;
  convergence_rounds: number;
  global_f1_score: number;
  notice: string;
}

// ----------------- 6-Hour Anticipatory Action Clock -----------------
export interface ActionClockStage {
  time_id: string;
  label: string;
  phase: string;
  window_hours: number;
  title: string;
  urgency: 'HIGH' | 'CRITICAL' | 'MAXIMUM';
  directives: string[];
  responsible_agencies: string[];
  target_assets: string[];
  status: 'COMPLETED' | 'ACTIVE_NOW' | 'SCHEDULED';
  status_badge: string;
}

// ----------------- Before vs After Intervention -----------------
export interface BeforeAfterIntervention {
  label: string;
  notice: string;
  before_intervention: {
    population_exposed: number;
    hospitals_isolated: number;
    roads_blocked_km: number;
    emergency_response_time_mins: number;
    power_substations_failed: number;
    critical_shelters_inaccessible: number;
    unmitigated_risk_index: number;
  };
  after_intervention: {
    population_exposed: number;
    hospitals_isolated: number;
    roads_blocked_km: number;
    emergency_response_time_mins: number;
    power_substations_failed: number;
    critical_shelters_inaccessible: number;
    mitigated_risk_index: number;
  };
  improvements: {
    hospitals_saved_from_isolation: number;
    response_time_saved_mins: number;
    road_access_restored_km: number;
    power_continuity_gain_pct: number;
    evacuation_efficiency_pct: number;
  };
  key_interventions: string[];
}

// ----------------- Time Machine Step -----------------
export interface TimeMachineStep {
  step_id: string;
  label: string;
  eta_hours: number;
  wind_speed: number;
  storm_surge: number;
  rainfall: number;
  eye_lat: number;
  eye_lon: number;
  exposed_population: number;
  isolated_hospitals: number;
  blocked_roads_km: number;
  active_hazards: string[];
  action_directive: string;
}

